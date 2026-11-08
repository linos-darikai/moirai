//! Tests for turn.rs: the turn steps, phase and rotation order, the end of a match, and
//! determinism over a full match.

use super::*;
use crate::civ::CivId;
use crate::map::{Map, TileCoordinate};
use crate::orders::Action;
use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};
use crate::resources::{Resource, ResourceStock};
use crate::rules::TOTAL_TURNS;
use crate::units::{UnitCounts, UnitKind};

fn coordinate(x: u8, y: u8) -> TileCoordinate {
    TileCoordinate::new(x, y).expect("test coordinates are on the map")
}

fn new_match(seed_byte: u8, civ_count: u8) -> MatchState {
    MatchState::new(&MatchSeed([seed_byte; MATCH_SEED_LENGTH]), civ_count).expect("valid count")
}

/// A match whose civs start with nothing (no starting stock, no Workers), to keep the maths in a
/// test easy to follow.
fn bare_match(seed_byte: u8, civ_count: u8) -> MatchState {
    let mut state = new_match(seed_byte, civ_count);
    for civ in state.active_civs_mut() {
        civ.resources = ResourceStock::EMPTY;
        civ.coins = 0;
        civ.units = UnitCounts::NONE;
    }
    state
}

fn give_plenty(state: &mut MatchState) {
    for civ in state.active_civs_mut() {
        civ.resources = ResourceStock {
            food: 500,
            ore: 500,
            gold: 500,
        };
        civ.coins = 500;
    }
}

#[test]
fn a_turn_with_no_orders_pays_income_and_moves_to_the_next_turn() {
    let mut state = bare_match(1, 2);

    let report = run_turn(&mut state, &[]);

    assert_eq!(report.map(|report| report.turn), Ok(0));
    assert_eq!(state.turn, 1);
    for civ in state.active_civs() {
        assert_eq!(civ.resources.food, 2);
        assert_eq!(civ.coins, 1);
    }
}

#[test]
fn ordered_actions_resolve_and_are_reported() {
    let mut state = new_match(1, 2);
    give_plenty(&mut state);
    let orders = [CivOrders::from_actions(&[
        Action::StartBuild(UnitKind::Infantry),
        Action::Sell(Resource::Food, 10),
        Action::Buy(Resource::Gold, 1_000),
    ])];

    let report = run_turn(&mut state, &orders).expect("the match is running");

    let results = report.action_results[0];
    assert_eq!(
        results[0],
        Some(Ok(ActionEffect::BuildStarted { city_slot: 0 }))
    );
    assert!(matches!(results[1], Some(Ok(ActionEffect::Coins(_)))));
    assert_eq!(results[2], Some(Err(ActionError::NotEnoughSupply)));
    assert_eq!(report.action_results[1], [None; MAX_ACTIVE_RULES_PER_TURN]);
}

#[test]
fn a_unit_ordered_this_turn_is_ready_next_turn() {
    let mut state = new_match(1, 2);
    give_plenty(&mut state);
    let build = [CivOrders::from_actions(&[Action::StartBuild(
        UnitKind::Infantry,
    )])];

    run_turn(&mut state, &build).expect("running");
    let after_ordering = state.civs[0].units.count(UnitKind::Infantry);
    run_turn(&mut state, &[]).expect("running");

    assert_eq!(after_ordering, 0);
    assert_eq!(state.civs[0].units.count(UnitKind::Infantry), 1);
}

/// Two civs whose land touches the free tile (6,5) from both sides.
fn two_civs_wanting_the_same_tile() -> MatchState {
    let mut state = new_match(1, 2);
    give_plenty(&mut state);
    state.map = Map::empty();
    state
        .map
        .tile_mut(coordinate(5, 5))
        .set_owner(Some(CivId(0)));
    state
        .map
        .tile_mut(coordinate(7, 5))
        .set_owner(Some(CivId(1)));
    state
}

#[test]
fn when_two_civs_claim_the_same_tile_the_first_civ_this_turn_gets_it() {
    let contested = coordinate(6, 5);
    let both_claim = [
        CivOrders::from_actions(&[Action::ClaimTile(contested)]),
        CivOrders::from_actions(&[Action::ClaimTile(contested)]),
    ];
    let mut on_turn_0 = two_civs_wanting_the_same_tile();
    let mut on_turn_1 = two_civs_wanting_the_same_tile();
    on_turn_1.turn = 1;

    let report_0 = run_turn(&mut on_turn_0, &both_claim).expect("running");
    run_turn(&mut on_turn_1, &both_claim).expect("running");

    assert_eq!(on_turn_0.owner_of(contested), Some(CivId(0)));
    assert_eq!(on_turn_1.owner_of(contested), Some(CivId(1)));
    assert_eq!(
        report_0.action_results[1][0],
        Some(Err(ActionError::OwnedByAnotherCiv))
    );
}

#[test]
fn builds_resolve_before_trades_whatever_order_the_policy_lists_them() {
    // The civ sells all its food first in its list, but the build phase comes first, so the
    // Infantry (10 food) is paid for before the sale.
    let mut state = bare_match(1, 2);
    state.civs[0].resources.food = 10;
    state.civs[0].coins = 5;
    let orders = [CivOrders::from_actions(&[
        Action::Sell(Resource::Food, 12),
        Action::StartBuild(UnitKind::Infantry),
    ])];

    let report = run_turn(&mut state, &orders).expect("running");

    // Income added 2 food (12 in all): the build took 10, leaving 2 — too few to sell 12.
    assert_eq!(
        report.action_results[0][1],
        Some(Ok(ActionEffect::BuildStarted { city_slot: 0 }))
    );
    assert_eq!(
        report.action_results[0][0],
        Some(Err(ActionError::CannotAfford))
    );
}

#[test]
fn no_turn_runs_after_the_last_one() {
    let mut state = new_match(1, 2);
    state.turn = TOTAL_TURNS;

    let result = run_turn(&mut state, &[]);

    assert_eq!(result, Err(TurnError::MatchOver));
}

#[test]
fn a_civ_that_cannot_feed_its_army_disbands_and_the_report_says_so() {
    let mut state = bare_match(1, 2);
    state.civs[0].units.add(UnitKind::Elite, 3);

    let report = run_turn(&mut state, &[]).expect("running");

    // Income is 2 food, upkeep 6: two elites go (2 left × 2 food = 4 > 2, 1 left = 2 food).
    assert_eq!(report.disbanded[0].count(UnitKind::Elite), 2);
    assert_eq!(state.civs[0].units.count(UnitKind::Elite), 1);
}

/// The same orders every turn for every civ: grow the economy and trade a little.
fn scripted_orders(state: &MatchState) -> [CivOrders; MAX_CIVS] {
    let mut orders = [CivOrders::NONE; MAX_CIVS];
    for (index, civ) in state.active_civs().iter().enumerate() {
        let build = if civ.units.count(UnitKind::Worker) < 4 {
            UnitKind::Worker
        } else {
            UnitKind::Guard
        };
        orders[index] = CivOrders::from_actions(&[
            Action::StartBuild(build),
            Action::AssignWorkers(Some(Resource::Ore)),
            Action::Sell(Resource::Gold, 2),
        ]);
    }
    orders
}

/// Plays a full match with the scripted orders and returns the final fingerprint.
fn play_full_match(seed_byte: u8) -> u64 {
    let mut state = new_match(seed_byte, 4);
    give_plenty(&mut state);
    while !state.is_finished() {
        let orders = scripted_orders(&state);
        run_turn(&mut state, &orders).expect("the match is still running");
    }
    state.fingerprint()
}

#[test]
fn a_full_match_played_twice_ends_in_exactly_the_same_state() {
    let first = play_full_match(42);
    let second = play_full_match(42);

    assert_eq!(first, second);
}

#[test]
fn different_seeds_end_in_different_states() {
    assert_ne!(play_full_match(1), play_full_match(2));
}
