//! Map generation: builds the starting map from the match seed.
//!
//! Fairness (PLAN.md section 2, "Spawn points spread evenly"): we generate only the top-left
//! quarter from the seed, then mirror it into the other three quarters. Every civ therefore starts
//! with exactly the same surroundings, just reflected. Cities sit at the same spot in each quarter.

use crate::civ::{CivId, MAX_CIVS};
use crate::map::{Map, TileCoordinate, MAP_HEIGHT, MAP_WIDTH};
use crate::randomness::{MatchRandom, MatchSeed, RandomPurpose};
use crate::resources::Resource;
use crate::rules::{CITY_SITES_PER_QUADRANT, MIN_CITY_SITE_DISTANCE};

/// Chance (in percent) that a tile gets a resource deposit.
pub const DEPOSIT_CHANCE_PERCENT: u64 = 30;

/// Width and height of one quarter of the map (8 x 8).
pub const QUADRANT_SIZE: u8 = MAP_WIDTH / 2;

/// City sites are picked within columns and rows 0..=6 of a quarter, so a site and its mirror in
/// the next quarter (column 15 - x) stay at least MIN_CITY_SITE_DISTANCE apart across the middle.
const CITY_SITE_AREA_MAX: u8 = 6;

/// Candidate tiles tried per quarter before giving up on finding all the city sites.
const CITY_SITE_ATTEMPTS: u64 = 64;

/// How far a city sits from its corner of the map, in tiles. Spawns are (3,3), (12,3), (3,12)
/// and (12,12).
pub const SPAWN_INSET: u8 = 3;

/// Why a map couldn't be generated.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum MapGenerationError {
    /// The civ count was 0 or more than `MAX_CIVS`.
    InvalidCivCount,
}

/// Builds the starting map for `civ_count` civs (1 to 4) from `seed`, writing into `map`.
///
/// Writes in place instead of returning a new map so that on chain it can fill the Map account's
/// data directly, without building a 1 KB copy on the 4 KB SBF stack.
///
/// Returns `Result`: either `Ok(())` or `Err(reason)`, like a function that returns
/// `{ ok: true } | { ok: false, error }` in TypeScript.
pub fn generate_map_into(
    seed: &MatchSeed,
    civ_count: u8,
    map: &mut Map,
) -> Result<(), MapGenerationError> {
    if civ_count == 0 || usize::from(civ_count) > MAX_CIVS {
        return Err(MapGenerationError::InvalidCivCount);
    }

    map.clear();
    let random = MatchRandom::new(seed);

    // Step 1: decide the top-left quarter from the seed and copy it into all four quarters.
    place_mirrored_deposits(&random, map);

    // Step 2: pick the city sites in the top-left quarter and mirror them too.
    place_mirrored_city_sites(&random, map);

    // Step 3: put each civ's city (its capital, on a site) on its spawn tile.
    for join_order in 0..civ_count {
        let civ = CivId(join_order);
        let tile = map.tile_mut(spawn_point(civ));
        tile.set_owner(Some(civ));
        tile.set_city(true);
        tile.set_deposit(None);
    }

    Ok(())
}

/// Convenience version of `generate_map_into` that returns a new map. Fine natively, in WASM and
/// in tests; on chain prefer `generate_map_into` with the account's map.
pub fn generate_map(seed: &MatchSeed, civ_count: u8) -> Result<Map, MapGenerationError> {
    let mut map = Map::empty();
    generate_map_into(seed, civ_count, &mut map)?;
    Ok(map)
}

/// The tile where `civ`'s city starts.
pub fn spawn_point(civ: CivId) -> TileCoordinate {
    let quadrant = spawn_quadrant(civ);
    let top_left_spawn = TileCoordinate {
        x: SPAWN_INSET,
        y: SPAWN_INSET,
    };
    mirror_into_quadrant(top_left_spawn, quadrant)
}

/// Which corner each civ starts in, by join order. Quarters: 0 = top-left, 1 = top-right,
/// 2 = bottom-left, 3 = bottom-right. A two-civ match uses opposite corners (0 and 3).
/// (Three civs is less balanced: civ 0 borders both others. v1 matches are meant for 2 or 4.)
fn spawn_quadrant(civ: CivId) -> u8 {
    match civ.0 {
        0 => 0,
        1 => 3,
        2 => 1,
        _ => 2,
    }
}

/// Fills the top-left quarter with deposits decided by the seed, and mirrors each one into the
/// other three quarters. The spawn tile is always left empty (a city goes there).
fn place_mirrored_deposits(random: &MatchRandom, map: &mut Map) {
    for y in 0..QUADRANT_SIZE {
        for x in 0..QUADRANT_SIZE {
            let is_spawn_tile = x == SPAWN_INSET && y == SPAWN_INSET;
            if is_spawn_tile {
                continue;
            }

            let source = TileCoordinate { x, y };
            let deposit = deposit_for_tile(random, source);
            for quadrant in 0..4 {
                map.tile_mut(mirror_into_quadrant(source, quadrant))
                    .set_deposit(deposit);
            }
        }
    }
}

/// Marks the capital tile and up to CITY_SITES_PER_QUADRANT random tiles of the top-left quarter as
/// city sites, mirrored into all four quarters. Sites hold no deposit.
fn place_mirrored_city_sites(random: &MatchRandom, map: &mut Map) {
    let spawn = TileCoordinate {
        x: SPAWN_INSET,
        y: SPAWN_INSET,
    };
    let mut sites: [Option<TileCoordinate>; CITY_SITES_PER_QUADRANT + 1] =
        [None; CITY_SITES_PER_QUADRANT + 1];
    sites[0] = Some(spawn);
    let chosen = choose_city_sites(random, spawn);
    for (slot, site) in sites.iter_mut().skip(1).zip(chosen) {
        *slot = site;
    }

    for site in sites.into_iter().flatten() {
        for quadrant in 0..4 {
            let tile = map.tile_mut(mirror_into_quadrant(site, quadrant));
            tile.set_city_site(true);
            tile.set_deposit(None);
        }
    }
}

/// Picks the city sites of the top-left quarter from the seed: random tiles in the site area that
/// are far enough from the capital and from each other. Tries a fixed number of candidates, so
/// the result is always the same for a seed (and the loop always ends).
fn choose_city_sites(
    random: &MatchRandom,
    spawn: TileCoordinate,
) -> [Option<TileCoordinate>; CITY_SITES_PER_QUADRANT] {
    let mut chosen: [Option<TileCoordinate>; CITY_SITES_PER_QUADRANT] =
        [None; CITY_SITES_PER_QUADRANT];
    let mut found: usize = 0;
    let area_width = u64::from(CITY_SITE_AREA_MAX) + 1;

    for attempt in 0..CITY_SITE_ATTEMPTS {
        if found == CITY_SITES_PER_QUADRANT {
            break;
        }
        let (Ok(x), Ok(y)) = (
            u8::try_from(random.below(RandomPurpose::CitySite, attempt, 0, area_width)),
            u8::try_from(random.below(RandomPurpose::CitySite, attempt, 1, area_width)),
        ) else {
            continue;
        };
        let candidate = TileCoordinate { x, y };
        let is_far_from_capital = candidate.manhattan_distance(spawn) >= MIN_CITY_SITE_DISTANCE;
        let is_far_from_sites = chosen
            .iter()
            .flatten()
            .all(|site| candidate.manhattan_distance(*site) >= MIN_CITY_SITE_DISTANCE);
        if !is_far_from_capital || !is_far_from_sites {
            continue;
        }
        if let Some(slot) = chosen.get_mut(found) {
            *slot = Some(candidate);
            found += 1;
        }
    }
    chosen
}

/// Decides whether a top-left-quarter tile has a deposit, and which resource.
fn deposit_for_tile(random: &MatchRandom, tile: TileCoordinate) -> Option<Resource> {
    // usize -> u64 only ever widens (usize is 32 bits in WASM, 64 on SBF), so `as` is safe here
    // and gives the same number on every platform.
    let tile_number = tile.index() as u64;

    let roll = random.below(RandomPurpose::DepositPresence, tile_number, 0, 100);
    if roll >= DEPOSIT_CHANCE_PERCENT {
        return None;
    }

    let resource_count = Resource::ALL.len() as u64;
    let resource_roll = random.below(
        RandomPurpose::DepositResource,
        tile_number,
        0,
        resource_count,
    );
    Some(Resource::from_roll(resource_roll))
}

/// Reflects a top-left-quarter tile into `quadrant` (0 = top-left, 1 = top-right,
/// 2 = bottom-left, 3 = bottom-right). Reflection, not shifting, keeps every city the same
/// distance from the map's centre and edges.
fn mirror_into_quadrant(tile: TileCoordinate, quadrant: u8) -> TileCoordinate {
    // `saturating_sub` can't underflow; `tile` is on the map, so these stay in 0..=15 anyway.
    let mirrored_x = (MAP_WIDTH - 1).saturating_sub(tile.x);
    let mirrored_y = (MAP_HEIGHT - 1).saturating_sub(tile.y);
    match quadrant {
        1 => TileCoordinate {
            x: mirrored_x,
            y: tile.y,
        },
        2 => TileCoordinate {
            x: tile.x,
            y: mirrored_y,
        },
        3 => TileCoordinate {
            x: mirrored_x,
            y: mirrored_y,
        },
        _ => tile,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::map::TILE_COUNT;
    use crate::randomness::MATCH_SEED_LENGTH;

    fn seed_filled_with(byte: u8) -> MatchSeed {
        MatchSeed([byte; MATCH_SEED_LENGTH])
    }

    #[test]
    fn the_same_seed_always_generates_the_same_map() {
        let seed = seed_filled_with(42);

        let first_map = generate_map(&seed, 4);
        let second_map = generate_map(&seed, 4);

        assert_eq!(first_map, second_map);
    }

    #[test]
    fn generating_into_a_used_map_gives_the_same_result_as_a_fresh_one() {
        let seed = seed_filled_with(42);
        let mut reused = generate_map(&seed_filled_with(7), 2).expect("valid count");

        let into_result = generate_map_into(&seed, 4, &mut reused);
        let fresh = generate_map(&seed, 4).expect("valid count");

        assert_eq!(into_result, Ok(()));
        assert_eq!(reused, fresh);
    }

    #[test]
    fn different_seeds_generate_different_maps() {
        let map_a = generate_map(&seed_filled_with(1), 4).map(|map| map.fingerprint());

        let map_b = generate_map(&seed_filled_with(2), 4).map(|map| map.fingerprint());

        assert_ne!(map_a, map_b);
    }

    #[test]
    fn every_quarter_of_the_map_has_the_same_deposits_mirrored() {
        let map = generate_map(&seed_filled_with(9), 4).expect("4 civs is a valid count");

        for y in 0..QUADRANT_SIZE {
            for x in 0..QUADRANT_SIZE {
                let source = map.tile(TileCoordinate { x, y }).deposit();
                for quadrant in 1..4 {
                    let mirrored = mirror_into_quadrant(TileCoordinate { x, y }, quadrant);
                    assert_eq!(map.tile(mirrored).deposit(), source);
                }
            }
        }
    }

    #[test]
    fn each_civ_starts_with_a_city_on_its_spawn_tile_and_no_deposit_there() {
        let map = generate_map(&seed_filled_with(3), 4).expect("4 civs is a valid count");

        for join_order in 0..4 {
            let civ = CivId(join_order);
            let city = map.tile(spawn_point(civ));

            assert!(city.is_city());
            assert_eq!(city.owner(), Some(civ));
            assert_eq!(city.deposit(), None);
        }
    }

    #[test]
    fn spawns_are_spread_into_the_four_corners() {
        let spawns: [TileCoordinate; 4] = [
            spawn_point(CivId(0)),
            spawn_point(CivId(1)),
            spawn_point(CivId(2)),
            spawn_point(CivId(3)),
        ];

        assert_eq!(spawns[0], TileCoordinate { x: 3, y: 3 });
        assert_eq!(spawns[1], TileCoordinate { x: 12, y: 12 });
        assert_eq!(spawns[2], TileCoordinate { x: 12, y: 3 });
        assert_eq!(spawns[3], TileCoordinate { x: 3, y: 12 });
    }

    #[test]
    fn a_two_civ_match_has_exactly_two_cities() {
        let map = generate_map(&seed_filled_with(5), 2).expect("2 civs is a valid count");

        let city_count = map.tiles().iter().filter(|tile| tile.is_city()).count();

        assert_eq!(city_count, 2);
    }

    #[test]
    fn zero_or_more_than_four_civs_is_rejected() {
        let seed = seed_filled_with(1);

        assert_eq!(
            generate_map(&seed, 0),
            Err(MapGenerationError::InvalidCivCount)
        );
        assert_eq!(
            generate_map(&seed, 5),
            Err(MapGenerationError::InvalidCivCount)
        );
    }

    #[test]
    fn roughly_thirty_percent_of_tiles_get_a_deposit() {
        for seed_byte in 0..20 {
            let map = generate_map(&seed_filled_with(seed_byte), 4).expect("valid count");

            let deposit_count = map
                .tiles()
                .iter()
                .filter(|tile| tile.deposit().is_some())
                .count();

            // 30% of 256 tiles is about 77. Allow a wide band; this only catches a broken roll.
            assert!(deposit_count > TILE_COUNT / 8, "too few: {deposit_count}");
            assert!(deposit_count < TILE_COUNT / 2, "too many: {deposit_count}");
        }
    }

    /// Every city-site tile on a map.
    fn city_sites(map: &Map) -> Vec<TileCoordinate> {
        (0..TILE_COUNT)
            .filter_map(TileCoordinate::from_index)
            .filter(|coordinate| map.tile(*coordinate).is_city_site())
            .collect()
    }

    #[test]
    fn every_capital_starts_on_a_city_site() {
        let map = generate_map(&seed_filled_with(11), 4).expect("valid count");

        for civ in 0..4 {
            assert!(map.tile(spawn_point(CivId(civ))).is_city_site());
        }
    }

    #[test]
    fn city_sites_are_mirrored_into_every_quarter() {
        for seed_byte in 0..20 {
            let map = generate_map(&seed_filled_with(seed_byte), 4).expect("valid count");

            for site in city_sites(&map)
                .into_iter()
                .filter(|site| site.x < QUADRANT_SIZE && site.y < QUADRANT_SIZE)
            {
                for quadrant in 1..4 {
                    assert!(map
                        .tile(mirror_into_quadrant(site, quadrant))
                        .is_city_site());
                }
            }
        }
    }

    #[test]
    fn city_sites_are_far_apart_and_hold_no_deposit() {
        for seed_byte in 0..20 {
            let map = generate_map(&seed_filled_with(seed_byte), 4).expect("valid count");
            let sites = city_sites(&map);

            // The capital plus up to 3 sites in each of the 4 quarters.
            assert!(sites.len() >= 4 && sites.len() <= 4 * (CITY_SITES_PER_QUADRANT + 1));
            for (index, site) in sites.iter().enumerate() {
                assert_eq!(map.tile(*site).deposit(), None);
                for other in sites.iter().skip(index + 1) {
                    assert!(
                        site.manhattan_distance(*other) >= MIN_CITY_SITE_DISTANCE,
                        "{site:?} vs {other:?}"
                    );
                }
            }
        }
    }

    #[test]
    fn most_seeds_find_every_city_site() {
        let full_maps = (0..50u8)
            .filter(|seed_byte| {
                let map = generate_map(&seed_filled_with(*seed_byte), 4).expect("valid count");
                city_sites(&map).len() == 4 * (CITY_SITES_PER_QUADRANT + 1)
            })
            .count();

        assert!(
            full_maps >= 45,
            "only {full_maps} of 50 seeds placed every site"
        );
    }

    #[test]
    fn the_map_for_a_known_seed_never_changes() {
        // Locks map generation: if this fingerprint changes, every past match would replay on a
        // different map. Only update it on purpose, with a decision note in docs/decisions/.
        let map = generate_map(&seed_filled_with(42), 4).expect("valid count");

        assert_eq!(map.fingerprint(), KNOWN_FINGERPRINT_FOR_SEED_42);
    }

    const KNOWN_FINGERPRINT_FOR_SEED_42: u64 = 14_264_378_160_424_497_879;
}
