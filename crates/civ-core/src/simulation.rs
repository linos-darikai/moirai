//! Simulation: plays a whole match and records what happened after every turn, for the browser's
//! simulator (through civ-wasm). It plays exactly like `play_until_finished` (the same decisions
//! from the same start-of-turn state, then `run_turn`), and a test checks both end in the same
//! state. Not used on chain.

use crate::aggregates::aggregate_map;
use crate::civ::MAX_CIVS;
use crate::map::Map;
use crate::map_generation::MapGenerationError;
use crate::match_state::MatchState;
use crate::orders::CivOrders;
use crate::policy::interpreter::{army_size, decide_with_rules};
use crate::randomness::MatchSeed;
use crate::resources::ResourceStock;
use crate::rules::MAX_RULES_PER_POLICY;
use crate::scoring::wealth;
use crate::turn::run_turn;

/// One civ's numbers at one moment.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct CivSnapshot {
    pub is_alive: bool,
    pub tiles: u16,
    pub cities: u8,
    /// Fighting units.
    pub army: u32,
    pub resources: ResourceStock,
    pub coins: u32,
    /// Coins plus resources at that moment's market prices (the Wealth metric).
    pub wealth: u64,
}

/// The match at one moment: the map and every civ.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct TurnSnapshot {
    pub map: Map,
    pub civs: [CivSnapshot; MAX_CIVS],
}

/// A whole simulated match.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Simulation {
    /// `snapshots[0]` is the start; `snapshots[t]` is after `t` turns.
    pub snapshots: Vec<TurnSnapshot>,
    /// `rule_counts[civ][rule]`: how many turns that rule acted.
    pub rule_counts: [[u32; MAX_RULES_PER_POLICY]; MAX_CIVS],
    /// The final state (for its fingerprint and scoring).
    pub final_state: MatchState,
}

/// Plays a match for `policies.len()` civs (1 to 4) from `seed`, recording every turn.
pub fn simulate_match(
    seed: &MatchSeed,
    policies: &[&[u8]],
) -> Result<Simulation, MapGenerationError> {
    let civ_count =
        u8::try_from(policies.len()).map_err(|_| MapGenerationError::InvalidCivCount)?;
    let mut state = MatchState::new(seed, civ_count)?;
    let mut simulation = Simulation {
        snapshots: vec![snapshot(&state)],
        rule_counts: [[0; MAX_RULES_PER_POLICY]; MAX_CIVS],
        final_state: state,
    };

    while !state.is_finished() {
        // Step 1: every civ decides from the same start-of-turn state (as decide_all does).
        let aggregates = aggregate_map(&state.map);
        let mut orders = [CivOrders::NONE; MAX_CIVS];
        for (civ_index, slot) in orders.iter_mut().enumerate().take(state.civ_count()) {
            let Some(policy) = policies.get(civ_index) else {
                continue;
            };
            let decision = decide_with_rules(&state, &aggregates, civ_index, policy);
            *slot = decision.orders;
            count_rules(&mut simulation.rule_counts, civ_index, &decision.rules);
        }

        // Step 2: play the turn and record it.
        if run_turn(&mut state, &orders).is_err() {
            break;
        }
        simulation.snapshots.push(snapshot(&state));
    }
    simulation.final_state = state;
    Ok(simulation)
}

fn count_rules(
    counts: &mut [[u32; MAX_RULES_PER_POLICY]; MAX_CIVS],
    civ: usize,
    rules: &[Option<u8>],
) {
    let Some(civ_counts) = counts.get_mut(civ) else {
        return;
    };
    for rule in rules.iter().flatten() {
        if let Some(count) = civ_counts.get_mut(usize::from(*rule)) {
            *count = count.saturating_add(1);
        }
    }
}

/// The map and every civ's numbers right now.
fn snapshot(state: &MatchState) -> TurnSnapshot {
    let aggregates = aggregate_map(&state.map);
    let mut civs = [CivSnapshot::default(); MAX_CIVS];
    for (slot, civ) in civs.iter_mut().zip(state.active_civs()) {
        *slot = CivSnapshot {
            is_alive: civ.is_alive(),
            tiles: aggregates.for_civ(civ.id()).tiles_owned,
            cities: u8::try_from(civ.city_count()).unwrap_or(u8::MAX),
            army: u32::try_from(army_size(civ)).unwrap_or(u32::MAX),
            resources: civ.resources,
            coins: civ.coins,
            wealth: wealth(civ, &state.market),
        };
    }
    TurnSnapshot {
        map: state.map,
        civs,
    }
}
