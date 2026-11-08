//! `request_random_seed`: asks the MagicBlock VRF oracle for 32 random bytes (Phase 0 VRF spike).
//! Sent to the BASE LAYER. The answer arrives later, in a separate transaction from the oracle that
//! calls `fulfill_random_seed`. Until then the seed's status is `Requested`.

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::vrf;
use ephemeral_rollups_sdk::vrf::{
    self,
    instructions::{create_request_scoped_randomness_ix, RequestRandomnessParams},
    types::SerializableAccountMeta,
};

use crate::constants::RANDOM_SEED_SEED;
use crate::errors::ErrorCode;
use crate::state::{RandomSeed, SeedStatus};

/// The accounts `request_random_seed` needs.
///
/// `#[vrf]` (from the MagicBlock SDK) adds the VRF program, this program's VRF identity, the
/// slot-hashes sysvar and the system program, plus an `invoke_signed_vrf()` helper.
#[vrf]
#[derive(Accounts)]
pub struct RequestRandomSeed<'info> {
    /// The seed's owner. Pays the oracle request fee.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The caller's RandomSeed.
    #[account(
        mut,
        seeds = [RANDOM_SEED_SEED, authority.key().as_ref()],
        bump = random_seed.bump,
        has_one = authority,
    )]
    pub random_seed: Account<'info, RandomSeed>,

    /// CHECK: The VRF oracle queue. The constraint only allows MagicBlock's official base-layer
    /// queues (devnet/mainnet, or the localnet test queue), so nobody can point us at a fake one.
    #[account(
        mut,
        constraint = oracle_queue.key() == vrf::consts::DEFAULT_QUEUE
            || oracle_queue.key() == vrf::consts::DEFAULT_TEST_QUEUE,
    )]
    pub oracle_queue: UncheckedAccount<'info>,
}

/// Ask the oracle for randomness for the caller's RandomSeed.
///
/// Checks: authority signed and owns the seed (constraints); the seed is `Idle`, so there is only
/// ever one live request per seed.
/// Effects: marks the seed `Requested` and sends the request to the oracle queue. The oracle later
/// calls `fulfill_random_seed` with the RandomSeed account.
pub fn handle_request_random_seed(context: Context<RequestRandomSeed>) -> Result<()> {
    // Step 1: checks
    require!(
        context.accounts.random_seed.status == SeedStatus::Idle,
        ErrorCode::SeedAlreadyRequested
    );

    // Step 2: build the oracle request. The callback gets exactly one account: this RandomSeed.
    // `caller_seed` mixes in some of our own entropy; the slot makes it differ between requests.
    let slot_bytes: [u8; 8] = Clock::get()?.slot.to_le_bytes();
    let mut caller_seed: [u8; 32] = [0; 32];
    caller_seed[..8].copy_from_slice(&slot_bytes);

    let request = create_request_scoped_randomness_ix(RequestRandomnessParams {
        payer: context.accounts.authority.key(),
        oracle_queue: context.accounts.oracle_queue.key(),
        callback_program_id: crate::ID,
        callback_discriminator: crate::instruction::FulfillRandomSeed::DISCRIMINATOR.to_vec(),
        caller_seed,
        accounts_metas: Some(vec![SerializableAccountMeta {
            pubkey: context.accounts.random_seed.key(),
            is_signer: false,
            is_writable: true,
        }]),
        ..Default::default()
    });

    // Step 3: record the request, then send it.
    context.accounts.random_seed.status = SeedStatus::Requested;
    context
        .accounts
        .invoke_signed_vrf(&context.accounts.authority.to_account_info(), &request)?;

    Ok(())
}
