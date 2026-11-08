//! Turn resolution: runs one whole turn of a match (docs/decisions/0007, "Turn order"). Called by
//! `advance_turn` on chain, by the simulator in the browser (through civ-wasm) and by civ-cli.
//!
//! 1. Count per-civ aggregates (one map scan).
//! 2. Produce: worked deposits, city resources and coins.
//! 3. Grow cities; finish builds.
//! 4. Decide: every civ's orders, chosen from the same start-of-turn state (passed in).
//! 5. Resolve the orders phase by phase (builds, found_city, claim_tile, workers, trades,
//!    attacks); inside each phase civs act in rotating order.
//! 6. Pay upkeep (disband if starving).
//! 7. Remove civs with no cities.

use crate::actions::ActionError;
use crate::aggregates::aggregate_map;
use crate::builds::finish_builds;
use crate::civ::{rotating_civ_order, MAX_CIVS};
use crate::conquest::eliminate_civs_without_cities;
use crate::growth::grow_cities;
use crate::match_state::MatchState;
use crate::orders::{apply_action, ActionEffect, ActionPhase, CivOrders};
use crate::production::produce_resources;
use crate::randomness::MatchRandom;
use crate::rules::MAX_ACTIVE_RULES_PER_TURN;
use crate::units::UnitCounts;
use crate::upkeep::pay_civ_upkeep;

/// Why a turn couldn't run.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum TurnError {
    /// The last turn has been played, or at most one civ is left.
    MatchOver,
}

/// What happened in one turn, for the turn feed, replays and tests.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct TurnReport {
    /// The turn that was played.
    pub turn: u16,
    /// `action_results[civ][slot]`: what each ordered action did, or why it was refused. `None`
    /// where the civ had no action in that slot.
    pub action_results:
        [[Option<Result<ActionEffect, ActionError>>; MAX_ACTIVE_RULES_PER_TURN]; MAX_CIVS],
    /// Units each civ had to disband because it couldn't feed them.
    pub disbanded: [UnitCounts; MAX_CIVS],
}

/// Plays one turn. `orders[i]` are civ i's actions; missing entries mean "no actions".
pub fn run_turn(state: &mut MatchState, orders: &[CivOrders]) -> Result<TurnReport, TurnError> {
    if state.is_finished() {
        return Err(TurnError::MatchOver);
    }
    let turn = state.turn;
    let random = MatchRandom::new(&state.seed());
    let mut report = TurnReport {
        turn,
        action_results: [[None; MAX_ACTIVE_RULES_PER_TURN]; MAX_CIVS],
        disbanded: [UnitCounts::NONE; MAX_CIVS],
    };

    // Step 1: count what each civ owns, once.
    let aggregates = aggregate_map(&state.map);

    // Step 2: produce.
    produce_resources(&aggregates, state.active_civs_mut());

    // Step 3: grow cities, then finish builds.
    let (map, civs) = state.map_and_civs_mut();
    grow_cities(map, civs, turn);
    finish_builds(civs);

    // Step 4: the orders were decided before this call, from the start-of-turn state.

    // Step 5: resolve the orders.
    resolve_orders(state, &random, orders, &mut report);

    // Step 6: upkeep.
    for (civ_index, civ) in state.active_civs_mut().iter_mut().enumerate() {
        if !civ.is_alive() {
            continue;
        }
        if let Some(disbanded) = report.disbanded.get_mut(civ_index) {
            *disbanded = pay_civ_upkeep(civ);
        }
    }

    // Step 7: civs with no cities are out.
    let (map, civs) = state.map_and_civs_mut();
    eliminate_civs_without_cities(map, civs);

    state.turn = turn.saturating_add(1);
    Ok(report)
}

/// Step 5: every phase in order; inside a phase, civs in this turn's rotating order.
fn resolve_orders(
    state: &mut MatchState,
    random: &MatchRandom,
    orders: &[CivOrders],
    report: &mut TurnReport,
) {
    let civ_count = state.civ_count();
    let civ_order = rotating_civ_order(state.turn, civ_count);
    for phase in ActionPhase::ALL {
        for civ_index in civ_order.into_iter().take(civ_count) {
            let Some(civ_orders) = orders.get(civ_index) else {
                continue;
            };
            resolve_civ_phase(state, random, civ_index, civ_orders, phase, report);
        }
    }
}

/// Applies the civ's actions that belong to `phase`, in the order its policy listed them.
fn resolve_civ_phase(
    state: &mut MatchState,
    random: &MatchRandom,
    civ_index: usize,
    civ_orders: &CivOrders,
    phase: ActionPhase,
    report: &mut TurnReport,
) {
    for (slot, action) in civ_orders.actions.iter().enumerate() {
        let Some(action) = action else {
            continue;
        };
        if action.phase() != phase {
            continue;
        }
        let result = apply_action(state, random, civ_index, *action);
        let cell = report
            .action_results
            .get_mut(civ_index)
            .and_then(|row| row.get_mut(slot));
        if let Some(cell) = cell {
            *cell = Some(result);
        }
    }
}

// Tests live in turn_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "turn_tests.rs"]
mod tests;
