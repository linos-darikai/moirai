//! Tests for builds.rs: paying up front, one build per city, build time, rushing, the Elite limit.

use super::*;
use crate::city::City;
use crate::civ::CivId;
use crate::map::TileCoordinate;
use crate::resources::ResourceStock;

fn coordinate(x: u8, y: u8) -> TileCoordinate {
    TileCoordinate::new(x, y).expect("test coordinates are on the map")
}

/// A civ with one city (its capital) and plenty of everything.
fn rich_civ() -> Civ {
    let mut civ = Civ::new(CivId(0), coordinate(3, 3));
    civ.resources = ResourceStock {
        food: 1_000,
        ore: 1_000,
        gold: 1_000,
    };
    civ.coins = 1_000;
    civ
}

#[test]
fn starting_a_build_pays_resources_and_coins_up_front() {
    let mut civ = rich_civ();

    let slot = start_build(&mut civ, UnitKind::Siege);

    assert_eq!(slot, Ok(0));
    assert_eq!(civ.resources.ore, 1_000 - 10);
    assert_eq!(civ.resources.gold, 1_000 - 10);
    assert_eq!(civ.coins, 1_000 - 15);
    assert_eq!(civ.units.count(UnitKind::Siege), 0);
    assert_eq!(civ.cities()[0].building(), Some(UnitKind::Siege));
}

#[test]
fn a_unit_joins_the_army_after_its_build_turns() {
    let mut civ = rich_civ();
    start_build(&mut civ, UnitKind::Siege).expect("affordable");
    let mut civs = [civ];

    finish_builds(&mut civs);
    finish_builds(&mut civs);
    let before_last_turn = civs[0].units.count(UnitKind::Siege);
    finish_builds(&mut civs);

    assert_eq!(before_last_turn, 0);
    assert_eq!(civs[0].units.count(UnitKind::Siege), 1);
    assert_eq!(civs[0].cities()[0].building(), None);
}

#[test]
fn each_city_builds_one_unit_at_a_time() {
    let mut civ = rich_civ();
    if let Some(slot) = civ.free_city_slot() {
        *slot = City::founded(coordinate(8, 3), 5, false);
    }

    let first = start_build(&mut civ, UnitKind::Infantry);
    let second = start_build(&mut civ, UnitKind::Infantry);
    let third = start_build(&mut civ, UnitKind::Infantry);

    assert_eq!(first, Ok(0));
    assert_eq!(second, Ok(1));
    assert_eq!(third, Err(ActionError::NoIdleCity));
}

#[test]
fn a_civ_without_the_coins_cannot_start_a_build() {
    let mut civ = rich_civ();
    civ.coins = 4;

    let result = start_build(&mut civ, UnitKind::Infantry);

    assert_eq!(result, Err(ActionError::CannotAfford));
    assert_eq!(civ.resources.food, 1_000);
}

#[test]
fn an_elite_being_built_counts_towards_the_elite_limit() {
    let mut civ = rich_civ();
    if let Some(slot) = civ.free_city_slot() {
        *slot = City::founded(coordinate(8, 3), 5, false);
    }
    // Two size 1 cities allow two Elites: one built, one in progress fills the limit.
    civ.units.add(UnitKind::Elite, 1);
    start_build(&mut civ, UnitKind::Elite).expect("second elite is allowed");

    let third = start_build(&mut civ, UnitKind::Elite);

    assert_eq!(third, Err(ActionError::EliteLimitReached));
}

#[test]
fn rushing_costs_twice_the_coin_cost_per_turn_left_and_finishes_now() {
    let mut civ = rich_civ();
    start_build(&mut civ, UnitKind::Elite).expect("affordable");
    let coins_before = civ.coins;

    let paid = rush_build(&mut civ, 0);

    assert_eq!(paid, Ok(2 * 40 * 4));
    assert_eq!(civ.coins, coins_before - 320);
    assert_eq!(civ.units.count(UnitKind::Elite), 1);
    assert_eq!(civ.cities()[0].building(), None);
}

#[test]
fn rushing_a_half_done_build_is_cheaper() {
    let mut civ = rich_civ();
    start_build(&mut civ, UnitKind::Siege).expect("affordable");
    let mut civs = [civ];
    finish_builds(&mut civs);

    let cost = rush_cost(&civs[0], 0);

    // Siege: 15 coins × 2 × 2 turns left.
    assert_eq!(cost, Some(60));
}

#[test]
fn rushing_an_idle_city_or_without_the_coins_is_refused() {
    let mut idle = rich_civ();
    let mut poor = rich_civ();
    start_build(&mut poor, UnitKind::Elite).expect("affordable");
    poor.coins = 10;

    let idle_result = rush_build(&mut idle, 0);
    let poor_result = rush_build(&mut poor, 0);

    assert_eq!(idle_result, Err(ActionError::NothingToRush));
    assert_eq!(poor_result, Err(ActionError::CannotAfford));
    assert_eq!(poor.coins, 10);
}
