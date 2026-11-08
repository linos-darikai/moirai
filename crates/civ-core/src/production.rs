//! Production: turn step 2, "Produce" (docs/decisions/0007, "Turn order").
//!
//! - **Deposits need workers:** each Worker works one owned deposit, which then produces
//!   `WORKED_DEPOSIT_YIELD` (2) of its resource. Unworked deposits produce nothing.
//! - **Cities:** each city adds `CITY_INCOME_PER_SIZE` (2 Food, 1 Ore, 1 Gold) and
//!   `COIN_INCOME_PER_CITY_SIZE` (1 coin) once per size.
//!
//! Owned deposits come from the per-civ aggregates (one map scan per turn); city sizes come from
//! the civ's own city list. Which deposit a worker stands on doesn't matter (they all yield the
//! same), so workers are assigned per resource, not per tile.

use crate::aggregates::MapAggregates;
use crate::civ::Civ;
use crate::resources::{Resource, ResourceStock};
use crate::rules::{CITY_INCOME_PER_SIZE, COIN_INCOME_PER_CITY_SIZE, WORKED_DEPOSIT_YIELD};
use crate::units::UnitKind;

/// What a civ gains in one turn.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct TurnIncome {
    /// Food, Ore and Gold from worked deposits and cities.
    pub resources: ResourceStock,
    /// Coins from cities.
    pub coins: u32,
}

/// What `civ` gains this turn from its worked deposits (given this turn's aggregates) and cities.
pub fn turn_income(aggregates: &MapAggregates, civ: &Civ) -> TurnIncome {
    let owned = aggregates.for_civ(civ.id()).deposits_owned;
    let worked = worked_deposits(&owned, civ);
    let total_city_size = civ.total_city_size();

    let mut resources = ResourceStock::EMPTY;
    for resource in Resource::ALL {
        let from_deposits = worked.amount(resource).saturating_mul(WORKED_DEPOSIT_YIELD);
        let from_cities = CITY_INCOME_PER_SIZE
            .amount(resource)
            .saturating_mul(total_city_size);
        resources.add(resource, from_deposits.saturating_add(from_cities));
    }
    TurnIncome {
        resources,
        coins: COIN_INCOME_PER_CITY_SIZE.saturating_mul(total_city_size),
    }
}

/// How many deposits of each resource the civ's Workers work this turn.
///
/// Workers go to the civ's worker focus resource first, then spread evenly over Food, Ore and
/// Gold (one each in turn), never more than the civ owns of a resource.
pub fn worked_deposits(owned: &ResourceStock, civ: &Civ) -> ResourceStock {
    let mut workers_left = u32::from(civ.units.count(UnitKind::Worker));
    let mut worked = ResourceStock::EMPTY;

    // Step 1: the focus resource takes as many workers as it has deposits.
    if let Some(focus) = civ.worker_focus() {
        let assigned = workers_left.min(owned.amount(focus));
        worked.add(focus, assigned);
        workers_left = workers_left.saturating_sub(assigned);
    }

    // Step 2: hand out the rest one at a time, Food, Ore, Gold, Food, ... until the workers or
    // the free deposits run out. Ends after at most one round per owned deposit.
    while workers_left > 0 {
        let mut assigned_this_round = false;
        for resource in Resource::ALL {
            let has_free_deposit = worked.amount(resource) < owned.amount(resource);
            if workers_left > 0 && has_free_deposit {
                worked.add(resource, 1);
                workers_left = workers_left.saturating_sub(1);
                assigned_this_round = true;
            }
        }
        if !assigned_this_round {
            break; // more workers than deposits: the extra ones have nothing to work
        }
    }
    worked
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
            civ.resources
                .add(resource, income.resources.amount(resource));
        }
        civ.coins = civ.coins.saturating_add(income.coins);
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

    fn civ_with_workers(workers: u16) -> Civ {
        let mut civ = Civ::new(CivId(0), coordinate(3, 3));
        civ.units.add(UnitKind::Worker, workers);
        civ
    }

    #[test]
    fn without_workers_deposits_produce_nothing_and_the_city_pays_its_base_income() {
        let aggregates = aggregate_map(&map_with_civ_zero_mines());
        let mut civs = [civ_with_workers(0)];

        produce_resources(&aggregates, &mut civs);

        assert_eq!(civs[0].resources, CITY_INCOME_PER_SIZE);
        assert_eq!(civs[0].coins, 1);
    }

    #[test]
    fn each_worked_deposit_produces_two() {
        let aggregates = aggregate_map(&map_with_civ_zero_mines());
        let mut civs = [civ_with_workers(3)];

        produce_resources(&aggregates, &mut civs);

        assert_eq!(
            civs[0].resources,
            ResourceStock {
                food: 2 + 2,
                ore: 2 * 2 + 1,
                gold: 1
            }
        );
    }

    #[test]
    fn workers_spread_evenly_over_the_resources_the_civ_owns() {
        let owned = ResourceStock {
            food: 1,
            ore: 3,
            gold: 2,
        };

        let worked = worked_deposits(&owned, &civ_with_workers(4));

        assert_eq!(
            worked,
            ResourceStock {
                food: 1,
                ore: 2,
                gold: 1
            }
        );
    }

    #[test]
    fn the_worker_focus_fills_first() {
        let owned = ResourceStock {
            food: 1,
            ore: 3,
            gold: 2,
        };
        let mut civ = civ_with_workers(4);
        civ.set_worker_focus(Some(Resource::Ore));

        let worked = worked_deposits(&owned, &civ);

        assert_eq!(
            worked,
            ResourceStock {
                food: 1,
                ore: 3,
                gold: 0
            }
        );
    }

    #[test]
    fn extra_workers_have_nothing_to_work() {
        let owned = ResourceStock {
            food: 1,
            ore: 0,
            gold: 0,
        };

        let worked = worked_deposits(&owned, &civ_with_workers(5));

        assert_eq!(worked.food, 1);
        assert_eq!(worked.ore + worked.gold, 0);
    }

    #[test]
    fn a_bigger_city_earns_its_base_income_and_coins_once_per_size() {
        let aggregates = aggregate_map(&Map::empty());
        let mut civs = [civ_with_workers(0)];
        civs[0].cities_mut()[0].grow();
        civs[0].cities_mut()[0].grow();

        produce_resources(&aggregates, &mut civs);

        assert_eq!(
            civs[0].resources,
            ResourceStock {
                food: 3 * 2,
                ore: 3,
                gold: 3
            }
        );
        assert_eq!(civs[0].coins, 3);
    }

    #[test]
    fn a_knocked_out_civ_produces_nothing() {
        let aggregates = aggregate_map(&map_with_civ_zero_mines());
        let mut civs = [civ_with_workers(3)];
        civs[0].set_alive(false);

        produce_resources(&aggregates, &mut civs);

        assert_eq!(civs[0].resources, ResourceStock::EMPTY);
        assert_eq!(civs[0].coins, 0);
    }

    #[test]
    fn on_a_fresh_map_every_civ_earns_exactly_the_same_income() {
        // Fairness: the map is mirrored and every capital claims the same border, so with the
        // same workers, turn 1 income is identical for every civ.
        for seed_byte in 0..20 {
            let seed = MatchSeed([seed_byte; MATCH_SEED_LENGTH]);
            let mut map = Map::empty();
            let mut civs = [0, 1, 2, 3].map(|id| Civ::new(CivId(id), coordinate(0, 0)));
            start_match(&seed, &mut map, &mut civs).expect("valid count");
            for civ in civs.iter_mut() {
                civ.units.add(UnitKind::Worker, 2);
            }
            let aggregates = aggregate_map(&map);

            produce_resources(&aggregates, &mut civs);

            for civ in &civs {
                assert_eq!(civ.resources, civs[0].resources);
                assert!(civ.resources.food >= CITY_INCOME_PER_SIZE.food);
            }
        }
    }
}
