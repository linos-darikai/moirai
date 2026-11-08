//! Production: step 1 of every turn (PLAN.md section 2, "Turn order": produce resources first).
//!
//! Each owned deposit tile produces 1 unit of its resource per turn, and each city tile a civ owns
//! adds its base income (rules.rs). City sizes arrive with the cities module; until then every
//! city counts as size 1. Production reads the per-civ aggregates (one map scan per turn)
//! rather than scanning the map again.

use crate::aggregates::{deposits_of, MapAggregates};
use crate::civ::Civ;
use crate::resources::{Resource, ResourceStock};
use crate::rules::{CITY_INCOME_PER_SIZE, DEPOSIT_YIELD_PER_TURN};

/// What `civ` gains this turn from the land it owns, given this turn's aggregates.
pub fn turn_income(aggregates: &MapAggregates, civ: &Civ) -> ResourceStock {
    let owned = aggregates.for_civ(civ.id());
    let cities = u32::from(owned.cities_owned);

    let mut income = ResourceStock::EMPTY;
    for resource in Resource::ALL {
        let from_deposits = deposits_of(&owned, resource).saturating_mul(DEPOSIT_YIELD_PER_TURN);
        let from_cities = CITY_INCOME_PER_SIZE.amount(resource).saturating_mul(cities);
        income.add(resource, from_deposits.saturating_add(from_cities));
    }
    income
}

/// Adds this turn's income to every civ that is still alive. Knocked-out civs produce nothing.
///
/// `&mut [Civ]` is a borrowed slice: the function changes the civs in place (on chain: inside the
/// Civ accounts) instead of returning copies.
pub fn produce_resources(aggregates: &MapAggregates, civs: &mut [Civ]) {
    for civ in civs.iter_mut() {
        if !civ.is_alive() {
            continue;
        }
        let income = turn_income(aggregates, civ);
        for resource in Resource::ALL {
            civ.resources.add(resource, income.amount(resource));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::aggregates::aggregate_map;
    use crate::civ::CivId;
    use crate::map::{Map, TileCoordinate};
    use crate::match_start::start_match;
    use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};

    fn coordinate(x: u8, y: u8) -> TileCoordinate {
        TileCoordinate::new(x, y).expect("test coordinates are on the map")
    }

    /// A map where civ 0 owns its city at (3,3), two ore deposits and one food deposit.
    fn map_with_civ_zero_mines() -> Map {
        let mut map = Map::empty();
        let city = map.tile_mut(coordinate(3, 3));
        city.set_owner(Some(CivId(0)));
        city.set_city(true);
        for (x, resource) in [(4, Resource::Ore), (5, Resource::Ore), (6, Resource::Food)] {
            let tile = map.tile_mut(coordinate(x, 3));
            tile.set_owner(Some(CivId(0)));
            tile.set_deposit(Some(resource));
        }
        map
    }

    #[test]
    fn each_owned_deposit_produces_one_unit_and_the_city_adds_base_income() {
        let aggregates = aggregate_map(&map_with_civ_zero_mines());
        let mut civs = [Civ::new(CivId(0), coordinate(3, 3))];

        produce_resources(&aggregates, &mut civs);

        assert_eq!(
            civs[0].resources,
            ResourceStock {
                food: 1 + 2,
                ore: 2 + 1,
                gold: 1
            }
        );
    }

    #[test]
    fn deposits_nobody_owns_produce_nothing() {
        let mut map = Map::empty();
        map.tile_mut(coordinate(8, 8))
            .set_deposit(Some(Resource::Gold));
        let aggregates = aggregate_map(&map);
        let mut civs = [Civ::new(CivId(0), coordinate(3, 3))];

        produce_resources(&aggregates, &mut civs);

        assert_eq!(civs[0].resources, ResourceStock::EMPTY);
    }

    #[test]
    fn a_knocked_out_civ_produces_nothing() {
        let aggregates = aggregate_map(&map_with_civ_zero_mines());
        let mut civs = [Civ::new(CivId(0), coordinate(3, 3))];
        civs[0].set_alive(false);

        produce_resources(&aggregates, &mut civs);

        assert_eq!(civs[0].resources, ResourceStock::EMPTY);
    }

    #[test]
    fn production_adds_up_over_turns() {
        let aggregates = aggregate_map(&map_with_civ_zero_mines());
        let mut civs = [Civ::new(CivId(0), coordinate(3, 3))];

        for _turn in 0..10 {
            produce_resources(&aggregates, &mut civs);
        }

        assert_eq!(
            civs[0].resources,
            ResourceStock {
                food: 30,
                ore: 30,
                gold: 10
            }
        );
    }

    #[test]
    fn on_a_fresh_map_every_civ_earns_exactly_the_same_city_income() {
        // Fairness: a generated map gives each civ only its city, so turn 1 income is identical.
        let seed = MatchSeed([42; MATCH_SEED_LENGTH]);
        let mut map = Map::empty();
        let mut civs = [0, 1, 2, 3].map(|id| Civ::new(CivId(id), coordinate(0, 0)));
        start_match(&seed, &mut map, &mut civs).expect("valid count");
        let aggregates = aggregate_map(&map);

        produce_resources(&aggregates, &mut civs);

        for civ in &civs {
            assert_eq!(civ.resources, CITY_INCOME_PER_SIZE);
        }
    }
}
