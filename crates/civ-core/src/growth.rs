//! City growth: turn step 3, "Grow cities and extend borders" (docs/decisions/0006, section 6).
//!
//! Each turn a city gains `BASE_GROWTH_PER_TURN + owned deposits within its border` growth points.
//! At `growth_threshold(size)` points it grows one size and claims the unowned tiles of its bigger
//! border. If the bigger border would gain no tile at all (everything around is owned or off the
//! map), the border is locked: the city stops growing for good and from then on land only changes
//! hands by war or the paid `claim_tile`.

use crate::borders::{
    claim_unowned_tiles_within, count_owned_deposits_within, count_unowned_tiles_within,
};
use crate::city::City;
use crate::civ::{rotating_civ_order, Civ, CivId};
use crate::map::Map;
use crate::rules::{border_radius, growth_threshold, BASE_GROWTH_PER_TURN};

/// Grows every city of every living civ by one turn, changing `map` and `civs` in place.
///
/// Fairness: when two civs' growing borders reach the same free tile on the same turn, the civ
/// that grows first gets it. Who goes first rotates every turn (`rotating_civ_order`), so no civ
/// always wins those ties.
pub fn grow_cities(map: &mut Map, civs: &mut [Civ], turn: u16) {
    let civ_count = civs.len();
    for index in rotating_civ_order(turn, civ_count)
        .into_iter()
        .take(civ_count)
    {
        // `get_mut` returns None instead of crashing if the index were out of range.
        let Some(civ) = civs.get_mut(index) else {
            continue;
        };
        if !civ.is_alive() {
            continue;
        }
        let civ_id = civ.id();
        for city in civ.cities_mut().iter_mut() {
            grow_city(map, civ_id, city);
        }
    }
}

/// One city's growth for one turn. Empty slots, locked cities and max-size cities do nothing.
fn grow_city(map: &mut Map, civ: CivId, city: &mut City) {
    if !city.can_grow() {
        return;
    }
    let Some(center) = city.tile() else {
        return;
    };

    // Step 1: gain growth points from the land inside the current border.
    let current_radius = border_radius(city.size());
    let deposits = count_owned_deposits_within(map, civ, center, current_radius);
    city.add_growth_points(BASE_GROWTH_PER_TURN.saturating_add(deposits));

    // Step 2: not enough points yet, so wait for a later turn.
    if u32::from(city.growth_points()) < growth_threshold(city.size()) {
        return;
    }

    // Step 3: borders lock if the bigger border would gain nothing.
    let next_radius = border_radius(city.size().saturating_add(1));
    if count_unowned_tiles_within(map, center, next_radius) == 0 {
        city.stop_growing();
        return;
    }

    // Step 4: grow and claim the new tiles.
    city.grow();
    claim_unowned_tiles_within(map, civ, center, next_radius);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::map::TileCoordinate;
    use crate::resources::Resource;

    fn coordinate(x: u8, y: u8) -> TileCoordinate {
        TileCoordinate::new(x, y).expect("test coordinates are on the map")
    }

    /// One civ with its capital on `capital`, its size 1 border already claimed on `map`.
    fn civ_with_claimed_capital(map: &mut Map, id: u8, capital: TileCoordinate) -> Civ {
        map.tile_mut(capital).set_city(true);
        claim_unowned_tiles_within(map, CivId(id), capital, border_radius(1));
        Civ::new(CivId(id), capital)
    }

    fn capital_of(civ: &Civ) -> City {
        *civ.capital().expect("the test civ has a capital")
    }

    #[test]
    fn a_city_with_no_deposits_grows_after_twenty_turns_and_claims_a_bigger_border() {
        let mut map = Map::empty();
        let mut civs = [civ_with_claimed_capital(&mut map, 0, coordinate(8, 8))];

        for turn in 0..19 {
            grow_cities(&mut map, &mut civs, turn);
        }
        let size_before = capital_of(&civs[0]).size();
        grow_cities(&mut map, &mut civs, 19);

        assert_eq!(size_before, 1);
        assert_eq!(capital_of(&civs[0]).size(), 2);
        assert_eq!(map.tile(coordinate(11, 8)).owner(), Some(CivId(0)));
        assert_eq!(map.tile(coordinate(12, 8)).owner(), None);
    }

    #[test]
    fn owned_deposits_make_a_city_grow_faster() {
        let mut map = Map::empty();
        for x in [9, 10, 7] {
            map.tile_mut(coordinate(x, 8))
                .set_deposit(Some(Resource::Food));
        }
        let mut civs = [civ_with_claimed_capital(&mut map, 0, coordinate(8, 8))];

        // 1 + 3 deposits = 4 points a turn, so 20 points after 5 turns.
        for turn in 0..5 {
            grow_cities(&mut map, &mut civs, turn);
        }

        assert_eq!(capital_of(&civs[0]).size(), 2);
    }

    #[test]
    fn a_city_boxed_in_by_another_civ_locks_its_border_and_never_grows() {
        let mut map = Map::empty();
        for tile in map_tiles() {
            map.tile_mut(tile).set_owner(Some(CivId(1)));
        }
        map.tile_mut(coordinate(8, 8)).set_owner(None);
        let mut civs = [civ_with_claimed_capital(&mut map, 0, coordinate(8, 8))];

        for turn in 0..60 {
            grow_cities(&mut map, &mut civs, turn);
        }

        let capital = capital_of(&civs[0]);
        assert_eq!(capital.size(), 1);
        assert!(capital.has_stopped_growing());
        assert_eq!(map.tile(coordinate(9, 8)).owner(), Some(CivId(1)));
    }

    #[test]
    fn a_knocked_out_civ_does_not_grow() {
        let mut map = Map::empty();
        let mut civs = [civ_with_claimed_capital(&mut map, 0, coordinate(8, 8))];
        civs[0].set_alive(false);

        for turn in 0..30 {
            grow_cities(&mut map, &mut civs, turn);
        }

        assert_eq!(capital_of(&civs[0]).size(), 1);
    }

    #[test]
    fn a_tile_both_civs_reach_on_the_same_turn_goes_to_whoever_grows_first_that_turn() {
        // Cities 6 apart: their size 2 borders (radius 3) meet only at (7, 8).
        let contested = coordinate(7, 8);

        let on_turn_0 = owner_of_contested_tile_after_growing_on(0, contested);
        let on_turn_1 = owner_of_contested_tile_after_growing_on(1, contested);

        assert_eq!(on_turn_0, Some(CivId(0)));
        assert_eq!(on_turn_1, Some(CivId(1)));
    }

    /// Two civs one point short of growing; grows them once on `turn` and reports who got `tile`.
    fn owner_of_contested_tile_after_growing_on(turn: u16, tile: TileCoordinate) -> Option<CivId> {
        let mut map = Map::empty();
        let mut civs = [
            civ_with_claimed_capital(&mut map, 0, coordinate(4, 8)),
            civ_with_claimed_capital(&mut map, 1, coordinate(10, 8)),
        ];
        for civ in civs.iter_mut() {
            civ.cities_mut()[0].add_growth_points(19);
        }

        grow_cities(&mut map, &mut civs, turn);

        map.tile(tile).owner()
    }

    /// Every tile on the map.
    fn map_tiles() -> impl Iterator<Item = TileCoordinate> {
        (0..crate::map::TILE_COUNT).filter_map(TileCoordinate::from_index)
    }
}
