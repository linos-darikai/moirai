//! Tests for interpreter.rs and targets.rs: which rules act, how targets are picked, and that bad
//! bytes or knocked-out civs give no orders.

use super::*;
use crate::civ::CivId;
use crate::conquest::CityFallChoice;
use crate::map::{Map, TileCoordinate};
use crate::policy::format::encode_policy;
use crate::policy::{Comparison, TileTarget, MAX_CONDITIONS_PER_RULE};
use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};

fn coordinate(x: u8, y: u8) -> TileCoordinate {
    TileCoordinate::new(x, y).expect("test coordinates are on the map")
}

fn new_match() -> MatchState {
    MatchState::new(&MatchSeed([7; MATCH_SEED_LENGTH]), 2).expect("valid count")
}

fn when(value: Value, comparison: Comparison, number: u32) -> Condition {
    Condition {
        value,
        comparison,
        right: Operand::Number(number),
    }
}

fn rule(conditions: &[Condition], action: PolicyAction) -> Rule {
    let mut slots = [None; MAX_CONDITIONS_PER_RULE];
    for (slot, condition) in slots.iter_mut().zip(conditions) {
        *slot = Some(*condition);
    }
    Rule {
        conditions: slots,
        action,
    }
}

fn orders_for_civ_zero(state: &MatchState, rules: &[Rule]) -> CivOrders {
    let bytes = encode_policy(rules).expect("valid policy");
    decide(state, &aggregate_map(&state.map), 0, &bytes)
}

#[test]
fn only_the_first_three_matching_rules_act() {
    let state = new_match();
    let rules = [
        rule(
            &[when(Value::Food, Comparison::Greater, 1_000)],
            PolicyAction::Rush,
        ),
        rule(&[], PolicyAction::Build(UnitKind::Worker)),
        rule(&[], PolicyAction::Sell(Resource::Gold, 1)),
        rule(&[], PolicyAction::Buy(Resource::Ore, 1)),
        rule(&[], PolicyAction::Build(UnitKind::Guard)),
    ];

    let orders = orders_for_civ_zero(&state, &rules);

    assert_eq!(
        orders.actions,
        [
            Some(Action::StartBuild(UnitKind::Worker)),
            Some(Action::Sell(Resource::Gold, 1)),
            Some(Action::Buy(Resource::Ore, 1)),
        ]
    );
}

#[test]
fn every_condition_of_a_rule_must_hold() {
    let state = new_match(); // starts with 30 food and 20 coins
    let rules = [
        rule(
            &[
                when(Value::Food, Comparison::GreaterOrEqual, 30),
                when(Value::Coins, Comparison::Greater, 50),
            ],
            PolicyAction::Rush,
        ),
        rule(
            &[
                when(Value::Food, Comparison::Equal, 30),
                when(Value::Turn, Comparison::Less, 1),
            ],
            PolicyAction::Build(UnitKind::Infantry),
        ),
    ];

    let orders = orders_for_civ_zero(&state, &rules);

    assert_eq!(
        orders.actions[0],
        Some(Action::StartBuild(UnitKind::Infantry))
    );
    assert_eq!(orders.actions[1], None);
}

#[test]
fn a_percentage_compares_against_another_value() {
    let mut state = new_match();
    state.market.supply.gold = 100; // gold now costs 300 hundredths, twice its base of 150
    let price_doubled = Condition {
        value: Value::GoldPrice,
        comparison: Comparison::GreaterOrEqual,
        right: Operand::PercentOf {
            percent: 200,
            value: Value::BaseGoldPrice,
        },
    };

    let orders = orders_for_civ_zero(
        &state,
        &[rule(
            &[price_doubled],
            PolicyAction::Sell(Resource::Gold, 5),
        )],
    );

    assert_eq!(orders.actions[0], Some(Action::Sell(Resource::Gold, 5)));
}

#[test]
fn a_rule_with_no_possible_target_leaves_its_slot_to_the_next_rule() {
    let state = new_match(); // no Settlers, nothing being built
    let rules = [
        rule(&[], PolicyAction::FoundCity),
        rule(&[], PolicyAction::Rush),
        rule(&[], PolicyAction::Build(UnitKind::Guard)),
    ];

    let orders = orders_for_civ_zero(&state, &rules);

    assert_eq!(orders.actions[0], Some(Action::StartBuild(UnitKind::Guard)));
}

#[test]
fn claim_tile_picks_the_free_deposit_next_to_the_land_nearest_the_capital() {
    let mut state = new_match();
    state.map = Map::empty();
    state
        .map
        .tile_mut(coordinate(3, 3))
        .set_owner(Some(CivId(0)));
    state
        .map
        .tile_mut(coordinate(4, 3))
        .set_owner(Some(CivId(0)));
    state
        .map
        .tile_mut(coordinate(3, 4))
        .set_deposit(Some(Resource::Ore));
    state
        .map
        .tile_mut(coordinate(5, 3))
        .set_deposit(Some(Resource::Food));

    let orders = orders_for_civ_zero(
        &state,
        &[rule(
            &[],
            PolicyAction::ClaimTile(TileTarget::NearestDeposit),
        )],
    );

    // (3,4) is 1 step from the capital at (3,3); (5,3) is 2.
    assert_eq!(orders.actions[0], Some(Action::ClaimTile(coordinate(3, 4))));
}

#[test]
fn attack_goes_for_the_weakest_neighbors_city_next_to_the_land() {
    let mut state = new_match();
    state.map = Map::empty();
    state
        .map
        .tile_mut(coordinate(3, 3))
        .set_owner(Some(CivId(0)));
    for (x, is_city) in [(4, false), (5, true)] {
        let tile = state.map.tile_mut(coordinate(x, 3));
        tile.set_owner(Some(CivId(1)));
        tile.set_city(is_city);
    }
    state
        .map
        .tile_mut(coordinate(4, 4))
        .set_owner(Some(CivId(0)));
    state
        .map
        .tile_mut(coordinate(5, 4))
        .set_owner(Some(CivId(0)));
    state.civs[0].units.add(UnitKind::Infantry, 5);
    let attack = PolicyAction::Attack {
        target: CivTarget::WeakestNeighbor,
        choice: CityFallChoice::Capture,
    };

    let orders = orders_for_civ_zero(&state, &[rule(&[], attack)]);

    // Both (4,3) and the city (5,3) touch civ 0's land; the city wins.
    assert_eq!(
        orders.actions[0],
        Some(Action::Attack {
            target: coordinate(5, 3),
            choice: CityFallChoice::Capture,
        })
    );
}

#[test]
fn bad_bytes_or_a_knocked_out_civ_give_no_orders() {
    let mut state = new_match();
    let good = encode_policy(&[rule(&[], PolicyAction::Rush)]).expect("valid");
    let aggregates = aggregate_map(&state.map);

    let from_junk = decide(&state, &aggregates, 0, &[1, 2, 3]);
    state.civs[0].set_alive(false);
    let from_knocked_out = decide(&state, &aggregates, 0, &good);

    assert_eq!(from_junk, CivOrders::NONE);
    assert_eq!(from_knocked_out, CivOrders::NONE);
}
