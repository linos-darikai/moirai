//! The Phase 1 gate (PLAN.md section 9): a 60-turn match between the four sample bots in
//! `policies/` runs locally and is identical every time.
//!
//! An integration test: it uses civ-core only through its public API, like civ-cli and civ-wasm.
//! Needs the `compiler` feature (`cargo test -p civ-core --features compiler`, or
//! `cargo test --workspace`, where civ-cli turns the feature on).

#![cfg(feature = "compiler")]

use civ_core::aggregates::aggregate_map;
use civ_core::match_state::MatchState;
use civ_core::orders::ActionEffect;
use civ_core::policy::compiler::compile_policy;
use civ_core::policy::interpreter::{play_turn, play_until_finished};
use civ_core::randomness::{MatchSeed, MATCH_SEED_LENGTH};
use civ_core::rules::TOTAL_TURNS;

/// The four sample bots, in join order.
const SAMPLE_BOTS: [&str; 4] = [
    include_str!("../../../policies/turtle.yaml"),
    include_str!("../../../policies/raider.yaml"),
    include_str!("../../../policies/trader.yaml"),
    include_str!("../../../policies/expander.yaml"),
];

/// The final fingerprint of the sample match with every seed byte 42. Locks the whole game: if a
/// rule, a bot or the turn order changes, this changes. Update it on purpose only, and the WASM
/// check in app/src/lib/engine expects the same number.
const KNOWN_FINGERPRINT_FOR_SEED_42: u64 = 8_239_992_931_703_824_454;

fn compiled_bots() -> Vec<Vec<u8>> {
    SAMPLE_BOTS
        .iter()
        .map(|yaml| compile_policy(yaml).expect("sample bots compile").bytes)
        .collect()
}

fn new_match(seed_byte: u8) -> MatchState {
    MatchState::new(&MatchSeed([seed_byte; MATCH_SEED_LENGTH]), 4).expect("4 civs")
}

/// Plays the sample match to the end and returns the final state.
fn play_sample_match(seed_byte: u8) -> MatchState {
    let bots = compiled_bots();
    let policies: Vec<&[u8]> = bots.iter().map(Vec::as_slice).collect();
    let mut state = new_match(seed_byte);
    play_until_finished(&mut state, &policies);
    state
}

#[test]
fn the_sample_match_lasts_sixty_turns_and_is_identical_every_time() {
    let first = play_sample_match(42);
    let second = play_sample_match(42);

    assert_eq!(first.turn, TOTAL_TURNS);
    assert_eq!(first, second);
    assert_eq!(first.fingerprint(), second.fingerprint());
}

#[test]
fn the_sample_match_for_seed_42_never_changes() {
    let state = play_sample_match(42);

    assert_eq!(state.fingerprint(), KNOWN_FINGERPRINT_FOR_SEED_42);
}

#[test]
fn different_seeds_play_out_differently() {
    assert_ne!(
        play_sample_match(1).fingerprint(),
        play_sample_match(2).fingerprint()
    );
}

#[test]
fn the_bots_really_play_attacks_happen_and_cities_are_founded() {
    let bots = compiled_bots();
    let policies: Vec<&[u8]> = bots.iter().map(Vec::as_slice).collect();
    let mut state = new_match(42);
    let mut attacks = 0;

    while let Ok(report) = play_turn(&mut state, &policies) {
        for result in report.action_results.iter().flatten().flatten() {
            if let Ok(ActionEffect::Attacked(_)) = result {
                attacks += 1;
            }
        }
    }

    let aggregates = aggregate_map(&state.map);
    let total_cities: usize = state.active_civs().iter().map(|civ| civ.city_count()).sum();
    let land_owned: u32 = state
        .active_civs()
        .iter()
        .map(|civ| u32::from(aggregates.for_civ(civ.id()).tiles_owned))
        .sum();
    assert!(attacks > 0, "the raider never attacked");
    assert!(total_cities > 4, "no city was founded beyond the capitals");
    assert!(
        land_owned > 4 * 13,
        "nobody grew beyond the starting borders"
    );
}
