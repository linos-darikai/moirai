//! Match start: builds turn 0 of a match, the map and every civ, from the match seed.
//!
//! The map marks each capital's tile as a city, and each civ records the same tile as its capital.
//! Each capital then claims its size 1 border (radius 2). Doing all of it in one function keeps the
//! map and the civs from ever disagreeing. Called once when a match
//! starts: on chain by the start instruction, and by the simulator and civ-cli.

use crate::borders::claim_unowned_tiles_within;
use crate::city::STARTING_CITY_SIZE;
use crate::civ::{Civ, CivId};
use crate::map::Map;
use crate::map_generation::{generate_map_into, spawn_point, MapGenerationError};
use crate::randomness::MatchSeed;
use crate::rules::border_radius;

/// Fills `map` and `civs` with the starting state of a match for `civs.len()` civs (1 to 4).
///
/// Writes in place (like `generate_map_into`) so on chain it can fill account data directly.
/// Civ `i` in the slice gets `CivId(i)`, which is its join order.
pub fn start_match(
    seed: &MatchSeed,
    map: &mut Map,
    civs: &mut [Civ],
) -> Result<(), MapGenerationError> {
    // A slice longer than 255 can't be a valid civ count either.
    let Ok(civ_count) = u8::try_from(civs.len()) else {
        return Err(MapGenerationError::InvalidCivCount);
    };

    // Step 1: the map, with each capital's tile owned and marked as a city.
    // "?" means: if this returned an error, stop here and pass the error up.
    generate_map_into(seed, civ_count, map)?;

    // Step 2: each civ, with its capital on the same spawn tile and its first border claimed.
    // Spawns are far apart, so these borders never overlap.
    for (join_order, civ) in (0..civ_count).zip(civs.iter_mut()) {
        let id = CivId(join_order);
        let capital = spawn_point(id);
        *civ = Civ::new(id, capital);
        claim_unowned_tiles_within(map, id, capital, border_radius(STARTING_CITY_SIZE));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::civ::MAX_CIVS;
    use crate::map::TileCoordinate;
    use crate::randomness::MATCH_SEED_LENGTH;

    fn seed_filled_with(byte: u8) -> MatchSeed {
        MatchSeed([byte; MATCH_SEED_LENGTH])
    }

    /// Four placeholder civs for `start_match` to overwrite.
    fn blank_civs() -> [Civ; MAX_CIVS] {
        let anywhere = TileCoordinate::new(0, 0).expect("on the map");
        [0, 1, 2, 3].map(|id| Civ::new(CivId(id), anywhere))
    }

    #[test]
    fn every_capital_sits_on_a_city_tile_its_civ_owns() {
        let mut map = Map::empty();
        let mut civs = blank_civs();

        let result = start_match(&seed_filled_with(42), &mut map, &mut civs);

        assert_eq!(result, Ok(()));
        for civ in &civs {
            let capital = civ.capital().and_then(|city| city.tile());
            let tile = map.tile(capital.expect("each civ has a capital on the map"));
            assert!(tile.is_city());
            assert_eq!(tile.owner(), Some(civ.id()));
        }
    }

    #[test]
    fn every_capital_starts_with_the_same_thirteen_tile_border() {
        // Radius 2 around a capital that is 3 tiles from the edges: 2 x 2 x 3 + 1 = 13 tiles.
        let mut map = Map::empty();
        let mut civs = blank_civs();

        start_match(&seed_filled_with(42), &mut map, &mut civs).expect("valid count");

        for civ in &civs {
            let owned = map
                .tiles()
                .iter()
                .filter(|tile| tile.owner() == Some(civ.id()))
                .count();
            assert_eq!(owned, 13);
        }
    }

    #[test]
    fn civs_get_their_join_order_as_their_id() {
        let mut map = Map::empty();
        let mut civs = blank_civs();

        start_match(&seed_filled_with(1), &mut map, &mut civs).expect("valid count");

        let ids: Vec<CivId> = civs.iter().map(|civ| civ.id()).collect();
        assert_eq!(ids, vec![CivId(0), CivId(1), CivId(2), CivId(3)]);
    }

    #[test]
    fn a_two_civ_match_starts_only_two_civs() {
        let mut map = Map::empty();
        let mut civs = blank_civs();

        start_match(&seed_filled_with(5), &mut map, &mut civs[..2]).expect("valid count");

        let city_tiles = map.tiles().iter().filter(|tile| tile.is_city()).count();
        assert_eq!(city_tiles, 2);
        assert_eq!(
            civs[1].capital().and_then(|city| city.tile()),
            Some(spawn_point(CivId(1)))
        );
    }

    #[test]
    fn no_civs_is_rejected() {
        let mut map = Map::empty();

        let result = start_match(&seed_filled_with(1), &mut map, &mut []);

        assert_eq!(result, Err(MapGenerationError::InvalidCivCount));
    }
}
