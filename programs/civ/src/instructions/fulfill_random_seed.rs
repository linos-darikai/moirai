//! `fulfill_random_seed`: the VRF oracle's callback that delivers the random bytes (Phase 0 VRF
//! spike). Only the MagicBlock VRF program can call it successfully; players never send it.

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::vrf_callback;

use crate::errors::ErrorCode;
use crate::state::{RandomSeed, SeedStatus};

/// The accounts the oracle passes to the callback.
///
/// `#[vrf_callback]` (from the MagicBlock SDK) adds a required signer: this program's VRF identity,
/// which only the VRF program can sign for. Without it anyone could call this with fake
/// "randomness", so never remove the macro.
#[vrf_callback]
#[derive(Accounts)]
pub struct FulfillRandomSeed<'info> {
    /// The RandomSeed named in the request (`accounts_metas` in `request_random_seed`).
    #[account(mut)]
    pub random_seed: Account<'info, RandomSeed>,
}

/// Store the oracle's randomness in the RandomSeed.
///
/// Checks: called by the VRF program (macro); the seed is `Requested`, so a duplicate or late
/// callback can't overwrite a seed that was already filled.
/// Effects: writes `seed`, marks it `Fulfilled` and records the slot.
pub fn handle_fulfill_random_seed(
    context: Context<FulfillRandomSeed>,
    randomness: [u8; 32],
) -> Result<()> {
    let random_seed: &mut Account<RandomSeed> = &mut context.accounts.random_seed;

    require!(
        random_seed.status == SeedStatus::Requested,
        ErrorCode::SeedNotRequested
    );

    random_seed.seed = randomness;
    random_seed.status = SeedStatus::Fulfilled;
    random_seed.fulfilled_slot = Clock::get()?.slot;

    Ok(())
}
