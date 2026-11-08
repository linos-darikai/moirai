//! `start_match`: once a lobby is full and revealed, asks the MagicBlock VRF oracle for the map
//! seed (PLAN.md section 4, "Randomness"). Sent to the BASE LAYER; anyone may call it. The seed
//! arrives later in `fulfill_match_seed`, which builds turn 0.
//!
//! The seed is requested only after every policy is locked in, so knowing it gives nobody an edge.

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::vrf;
use ephemeral_rollups_sdk::vrf::{
    self,
    instructions::{create_request_scoped_randomness_ix, RequestRandomnessParams},
    types::SerializableAccountMeta,
};

use crate::game_start::check_ready_to_start;
use crate::state::{Match, MatchStatus};

/// `#[vrf]` (MagicBlock SDK) adds the VRF program, this program's VRF identity, the slot-hashes
/// sysvar and the system program, plus an `invoke_signed_vrf()` helper.
#[vrf]
#[derive(Accounts)]
pub struct StartMatch<'info> {
    /// Whoever starts the match. Pays the oracle request fee.
    #[account(mut)]
    pub caller: Signer<'info>,

    /// The lobby to start.
    #[account(mut)]
    pub match_account: AccountLoader<'info, Match>,

    /// CHECK: The VRF oracle queue. Only MagicBlock's official queues are allowed (devnet/mainnet,
    /// or the localnet test queue), so nobody can point us at a fake one.
    #[account(
        mut,
        constraint = oracle_queue.key() == vrf::consts::DEFAULT_QUEUE
            || oracle_queue.key() == vrf::consts::DEFAULT_TEST_QUEUE,
    )]
    pub oracle_queue: UncheckedAccount<'info>,
}

/// Ask the oracle for this match's map seed.
///
/// Checks: the lobby is Open and full; everyone revealed or the reveal deadline passed.
/// Effects: marks the match SeedRequested (so it can only be requested once) and sends the request;
/// the oracle's callback is `fulfill_match_seed` with this Match account.
pub fn handle_start_match(context: Context<StartMatch>) -> Result<()> {
    // Step 1: checks, then mark it so a second request is refused.
    {
        let mut lobby = context.accounts.match_account.load_mut()?;
        check_ready_to_start(&lobby, Clock::get()?.unix_timestamp)?;
        lobby.status = MatchStatus::SeedRequested.to_byte();
    }

    // Step 2: the request. The callback gets exactly one account: this Match. `caller_seed` mixes
    // in the match address and the slot, so two matches never share a request.
    let match_key = context.accounts.match_account.key();
    let mut caller_seed: [u8; 32] = match_key.to_bytes();
    for (byte, slot_byte) in caller_seed.iter_mut().zip(Clock::get()?.slot.to_le_bytes()) {
        *byte ^= slot_byte;
    }
    let request = create_request_scoped_randomness_ix(RequestRandomnessParams {
        payer: context.accounts.caller.key(),
        oracle_queue: context.accounts.oracle_queue.key(),
        callback_program_id: crate::ID,
        callback_discriminator: crate::instruction::FulfillMatchSeed::DISCRIMINATOR.to_vec(),
        caller_seed,
        accounts_metas: Some(vec![SerializableAccountMeta {
            pubkey: match_key,
            is_signer: false,
            is_writable: true,
        }]),
        ..Default::default()
    });

    // Step 3: send it.
    context
        .accounts
        .invoke_signed_vrf(&context.accounts.caller.to_account_info(), &request)?;
    Ok(())
}
