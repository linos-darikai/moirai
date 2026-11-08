//! `bench_create`: Phase 2 measuring spike. Creates the caller's TurnBench and starts a match in
//! it (turn 0: map, civs, market). See state/turn_bench.rs.

use anchor_lang::prelude::*;
use civ_core::match_state::MatchState;
use civ_core::randomness::MatchSeed;

use crate::constants::{ANCHOR_DISCRIMINATOR_SIZE, TURN_BENCH_SEED};
use crate::errors::ErrorCode;
use crate::state::{match_state_mut, TurnBench};

#[derive(Accounts)]
pub struct BenchCreate<'info> {
    /// Creates and pays for the bench.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The new bench, at `["turn_bench", authority]`. `AccountLoader` is how Anchor hands out a
    /// zero-copy account: nothing is copied until we call `load_init` / `load_mut`.
    #[account(
        init,
        payer = authority,
        space = ANCHOR_DISCRIMINATOR_SIZE + core::mem::size_of::<TurnBench>(),
        seeds = [TURN_BENCH_SEED, authority.key().as_ref()],
        bump,
    )]
    pub bench: AccountLoader<'info, TurnBench>,

    pub system_program: Program<'info, System>,
}

/// Create the bench and write turn 0 of a match for `civ_count` civs from `seed`.
///
/// Checks: the bench doesn't exist yet (`init`), 1 to 4 civs.
/// Effects: creates the account, records the authority, starts the match in place.
pub fn handle_bench_create(
    context: Context<BenchCreate>,
    seed: [u8; 32],
    civ_count: u8,
) -> Result<()> {
    // Step 1: open the new account's bytes for writing.
    let mut bench = context.accounts.bench.load_init()?;
    bench.authority = context.accounts.authority.key();

    // Step 2: start the match straight in the account (no 1.2 KB copy on the stack).
    let state: &mut MatchState =
        match_state_mut(&mut bench.match_state).ok_or(ErrorCode::BenchMisalignedState)?;
    state
        .start_into(&MatchSeed(seed), civ_count)
        .map_err(|_| ErrorCode::BenchInvalidCivCount)?;
    Ok(())
}
