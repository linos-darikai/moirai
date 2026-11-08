//! `bench_turn`: Phase 2 measuring spike. Plays one turn of the bench's match on chain with
//! civ-core's `play_turn` (decide every policy, then run the turn), so a test can read the compute
//! units it used. This is exactly the work `advance_turn` will do.

use anchor_lang::prelude::*;
use civ_core::match_state::MatchState;
use civ_core::policy::interpreter::play_turn;

use crate::errors::ErrorCode;
use crate::state::{match_state_mut, TurnBench, BENCH_CIVS};

#[derive(Accounts)]
pub struct BenchTurn<'info> {
    /// Any bench; anyone may advance it (like the real crank).
    #[account(mut)]
    pub bench: AccountLoader<'info, TurnBench>,
}

/// Play the next turn.
///
/// Checks: the match isn't over.
/// Effects: decides every civ's orders from its policy and runs the turn, in the account's bytes.
pub fn handle_bench_turn(context: Context<BenchTurn>) -> Result<()> {
    let mut bench = context.accounts.bench.load_mut()?;
    // Take the struct apart so the match bytes (changed) and the policies (read) can be borrowed
    // at the same time.
    let TurnBench {
        match_state,
        policies,
        policy_lengths,
        ..
    } = &mut *bench;

    // Step 1: each civ's policy bytes (only the used part of its slot).
    let mut policy_slices: [&[u8]; BENCH_CIVS] = [&[]; BENCH_CIVS];
    for (index, slice) in policy_slices.iter_mut().enumerate() {
        let length = usize::from(policy_lengths.get(index).copied().unwrap_or(0));
        *slice = policies
            .get(index)
            .and_then(|slot| slot.get(..length))
            .unwrap_or(&[]);
    }

    // Step 2: decide and play the turn in place.
    let state: &mut MatchState =
        match_state_mut(match_state).ok_or(ErrorCode::BenchMisalignedState)?;
    play_turn(state, &policy_slices).map_err(|_| ErrorCode::BenchMatchOver)?;
    Ok(())
}
