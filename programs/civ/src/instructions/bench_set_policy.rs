//! `bench_set_policy`: Phase 2 measuring spike. Stores one civ's compiled policy in the caller's
//! TurnBench. The bytes are checked with civ-core's `validate_policy`, as `reveal_policy` will.

use anchor_lang::prelude::*;
use civ_core::policy::format::validate_policy;

use crate::constants::TURN_BENCH_SEED;
use crate::errors::ErrorCode;
use crate::state::TurnBench;

#[derive(Accounts)]
pub struct BenchSetPolicy<'info> {
    pub authority: Signer<'info>,

    /// The caller's bench. `has_one = authority` checks the stored authority is the signer.
    #[account(
        mut,
        seeds = [TURN_BENCH_SEED, authority.key().as_ref()],
        bump,
        has_one = authority,
    )]
    pub bench: AccountLoader<'info, TurnBench>,
}

/// Store `policy` (compiled bytes) for civ `civ_index`.
///
/// Checks: signer owns the bench, civ_index < 4, the bytes are a valid compiled policy.
/// Effects: copies the bytes into that civ's slot and records their length.
pub fn handle_bench_set_policy(
    context: Context<BenchSetPolicy>,
    civ_index: u8,
    policy: Vec<u8>,
) -> Result<()> {
    // Step 1: checks
    validate_policy(&policy).map_err(|_| ErrorCode::BenchBadPolicy)?;
    let length = u16::try_from(policy.len()).map_err(|_| ErrorCode::BenchBadPolicy)?;

    // Step 2: copy into the slot (zeros after the policy stay zero).
    let mut bench = context.accounts.bench.load_mut()?;
    let index = usize::from(civ_index);
    let slot = bench
        .policies
        .get_mut(index)
        .ok_or(ErrorCode::BenchBadCivIndex)?;
    let target = slot
        .get_mut(..policy.len())
        .ok_or(ErrorCode::BenchBadPolicy)?;
    target.copy_from_slice(&policy);
    if let Some(stored_length) = bench.policy_lengths.get_mut(index) {
        *stored_length = length;
    }
    Ok(())
}
