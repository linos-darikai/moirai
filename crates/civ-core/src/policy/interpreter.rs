//! Policy interpreter: reads compiled policy bytes and the start-of-turn match state, and decides
//! each civ's orders for the turn (docs/decisions/0008). Runs on chain in `advance_turn`, and in
//! the browser and civ-cli through `play_turn`.
//!
//! Fairness: every civ decides from the same state, before anything in the turn happens
//! (`decide_all` takes `&MatchState`, so it can't change it). Per-civ counts come from one map
//! scan (`aggregate_map`), not one per rule.

use super::format::{read_rule, validate_policy};
use super::targets::{
    attack_target, choose_neighbor, nearest_claimable_tile, nearest_free_city_site,
};
use super::{CivTarget, Condition, Operand, PolicyAction, Rule, Value};
use crate::aggregates::{aggregate_map, MapAggregates};
use crate::attack::fighting_units;
use crate::civ::{Civ, MAX_CIVS};
use crate::match_state::MatchState;
use crate::orders::{Action, CivOrders};
use crate::resources::Resource;
use crate::rules::{MARKET_BASE_PRICE, MAX_ACTIVE_RULES_PER_TURN};
use crate::turn::{run_turn, TurnError, TurnReport};
use crate::units::UnitKind;

/// Price bps per policy price unit: policies see prices in hundredths of a coin (100 = 1 coin).
const PRICE_BPS_PER_POLICY_UNIT: u64 = 100;

/// Decides every playing civ's orders. `policies[i]` are civ i's compiled bytes; a missing or
/// invalid policy means no orders for that civ.
pub fn decide_all(state: &MatchState, policies: &[&[u8]]) -> [CivOrders; MAX_CIVS] {
    let aggregates = aggregate_map(&state.map);
    let mut orders = [CivOrders::NONE; MAX_CIVS];
    for (civ_index, slot) in orders.iter_mut().enumerate().take(state.civ_count()) {
        if let Some(policy) = policies.get(civ_index) {
            *slot = decide(state, &aggregates, civ_index, policy);
        }
    }
    orders
}

/// Decides, then plays one turn: what `advance_turn` does on chain.
pub fn play_turn(state: &mut MatchState, policies: &[&[u8]]) -> Result<TurnReport, TurnError> {
    let orders = decide_all(state, policies);
    run_turn(state, &orders)
}

/// Plays turns until the match is finished. Returns how many turns were played.
pub fn play_until_finished(state: &mut MatchState, policies: &[&[u8]]) -> u16 {
    let mut turns_played: u16 = 0;
    while play_turn(state, policies).is_ok() {
        turns_played = turns_played.saturating_add(1);
    }
    turns_played
}

/// One civ's orders: its first MAX_ACTIVE_RULES_PER_TURN rules whose conditions hold and whose
/// action finds a target this turn.
pub fn decide(
    state: &MatchState,
    aggregates: &MapAggregates,
    civ_index: usize,
    policy: &[u8],
) -> CivOrders {
    let mut orders = CivOrders::NONE;
    let Some(civ) = state.active_civs().get(civ_index) else {
        return orders;
    };
    let Ok(rule_count) = validate_policy(policy) else {
        return orders;
    };
    if !civ.is_alive() {
        return orders;
    }

    let mut filled = 0;
    for index in 0..rule_count {
        if filled == MAX_ACTIVE_RULES_PER_TURN {
            break;
        }
        let Some(rule) = read_rule(policy, index) else {
            continue;
        };
        if !rule_matches(state, aggregates, civ_index, &rule) {
            continue;
        }
        if let Some(action) = resolve_action(state, civ_index, &rule.action) {
            orders.actions[filled] = Some(action);
            filled += 1;
        }
    }
    orders
}

/// True if every condition of the rule holds (an `always` rule has none).
fn rule_matches(
    state: &MatchState,
    aggregates: &MapAggregates,
    civ_index: usize,
    rule: &Rule,
) -> bool {
    for condition in rule.conditions.iter().flatten() {
        if !condition_holds(state, aggregates, civ_index, condition) {
            return false;
        }
    }
    true
}

/// `value op right`. A percentage compares `value × 100` with `percent × other`, so no division
/// (and no rounding) is needed.
fn condition_holds(
    state: &MatchState,
    aggregates: &MapAggregates,
    civ_index: usize,
    condition: &Condition,
) -> bool {
    let left = value_of(state, aggregates, civ_index, condition.value);
    match condition.right {
        Operand::Number(number) => condition.comparison.holds(left, u64::from(number)),
        Operand::PercentOf { percent, value } => {
            let right = value_of(state, aggregates, civ_index, value);
            let scaled_left = left.saturating_mul(100);
            let scaled_right = u64::from(percent).saturating_mul(right);
            condition.comparison.holds(scaled_left, scaled_right)
        }
    }
}

/// The current number for a condition value, from the civ's point of view.
fn value_of(state: &MatchState, aggregates: &MapAggregates, civ_index: usize, value: Value) -> u64 {
    let Some(civ) = state.active_civs().get(civ_index) else {
        return 0;
    };
    let units = |kind: UnitKind| u64::from(civ.units.count(kind));
    match value {
        Value::Food => u64::from(civ.resources.food),
        Value::Ore => u64::from(civ.resources.ore),
        Value::Gold => u64::from(civ.resources.gold),
        Value::Coins => u64::from(civ.coins),
        Value::FoodPrice => market_price(state, Resource::Food),
        Value::OrePrice => market_price(state, Resource::Ore),
        Value::GoldPrice => market_price(state, Resource::Gold),
        Value::BaseFoodPrice => base_price(Resource::Food),
        Value::BaseOrePrice => base_price(Resource::Ore),
        Value::BaseGoldPrice => base_price(Resource::Gold),
        Value::MyArmy => army_size(civ),
        Value::MyTiles => u64::from(aggregates.for_civ(civ.id()).tiles_owned),
        // usize -> u64 only ever widens, so `as` is safe (and a civ has at most 8 cities).
        Value::MyCities => civ.city_count() as u64,
        Value::MyInfantry => units(UnitKind::Infantry),
        Value::MyGuards => units(UnitKind::Guard),
        Value::MySiege => units(UnitKind::Siege),
        Value::MyElites => units(UnitKind::Elite),
        Value::MySettlers => units(UnitKind::Settler),
        Value::MyWorkers => units(UnitKind::Worker),
        Value::WeakestNeighborArmy => neighbor_army(state, civ_index, CivTarget::WeakestNeighbor),
        Value::StrongestNeighborArmy => {
            neighbor_army(state, civ_index, CivTarget::StrongestNeighbor)
        }
        Value::Turn => u64::from(state.turn),
    }
}

/// A market price in hundredths of a coin.
fn market_price(state: &MatchState, resource: Resource) -> u64 {
    state.market.price_bps(resource) / PRICE_BPS_PER_POLICY_UNIT
}

/// A base price in hundredths of a coin (100, 125, 150).
fn base_price(resource: Resource) -> u64 {
    u64::from(MARKET_BASE_PRICE.amount(resource)) / PRICE_BPS_PER_POLICY_UNIT
}

/// How many fighting units a civ has (everything except Settlers and Workers).
pub fn army_size(civ: &Civ) -> u64 {
    u64::from(fighting_units(&civ.units).total())
}

/// The army size of the weakest or strongest other living civ, or 0 if there is none.
fn neighbor_army(state: &MatchState, civ_index: usize, target: CivTarget) -> u64 {
    choose_neighbor(state, civ_index, target)
        .and_then(|index| state.active_civs().get(index))
        .map_or(0, army_size)
}

/// Turns a rule's action into a concrete `Action` with its target picked from the state, or
/// `None` if it has no possible target this turn (then the rule counts as not matching).
fn resolve_action(state: &MatchState, civ_index: usize, action: &PolicyAction) -> Option<Action> {
    let civ = state.active_civs().get(civ_index)?;
    match *action {
        PolicyAction::Build(kind) => Some(Action::StartBuild(kind)),
        PolicyAction::Rush => {
            let slot = civ
                .cities()
                .iter()
                .position(|city| city.building().is_some())?;
            Some(Action::RushBuild {
                city_slot: u8::try_from(slot).ok()?,
            })
        }
        PolicyAction::FoundCity => {
            if civ.units.count(UnitKind::Settler) == 0 {
                return None;
            }
            nearest_free_city_site(state, civ).map(Action::FoundCity)
        }
        PolicyAction::ClaimTile(target) => {
            nearest_claimable_tile(state, civ, target).map(Action::ClaimTile)
        }
        PolicyAction::AssignWorkers(focus) => Some(Action::AssignWorkers(focus)),
        PolicyAction::Sell(resource, amount) => Some(Action::Sell(resource, amount)),
        PolicyAction::Buy(resource, amount) => Some(Action::Buy(resource, amount)),
        PolicyAction::Attack { target, choice } => {
            if army_size(civ) == 0 {
                return None;
            }
            let enemy = choose_neighbor(state, civ_index, target)?;
            let tile = attack_target(state, civ, enemy)?;
            Some(Action::Attack {
                target: tile,
                choice,
            })
        }
    }
}

// Tests live in interpreter_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "interpreter_tests.rs"]
mod tests;
