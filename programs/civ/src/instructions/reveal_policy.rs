//! `reveal_policy`: a player publishes their compiled policy and salt. The program checks they
//! hash to the commitment, and that the bytes are a valid policy (civ-core `validate_policy`), so
//! a bad client can never put a broken policy into a match.

use anchor_lang::prelude::*;
use civ_core::policy::format::validate_policy;

use crate::commitment::{policy_commitment, SALT_BYTES};
use crate::errors::ErrorCode;
use crate::instructions::commit_policy::seat_bit;
use crate::state::{Match, MatchStatus};

#[derive(Accounts)]
pub struct RevealPolicy<'info> {
    pub player: Signer<'info>,

    #[account(mut)]
    pub match_account: AccountLoader<'info, Match>,
}

/// Store the player's revealed policy.
///
/// Checks: match is Open and full; every player has committed or the commit deadline has passed
/// (so nobody reveals while others can still choose); the reveal deadline hasn't passed; the signer
/// committed and hasn't revealed; sha256(policy || salt) equals their commitment; the bytes are a
/// valid compiled policy.
/// Effects: copies the policy into the player's slot and marks them as revealed.
pub fn handle_reveal_policy(
    context: Context<RevealPolicy>,
    policy: Vec<u8>,
    salt: [u8; SALT_BYTES],
) -> Result<()> {
    let mut lobby = context.accounts.match_account.load_mut()?;
    let now = Clock::get()?.unix_timestamp;

    // Step 1: checks, in order
    require!(
        lobby.current_status() == Some(MatchStatus::Open),
        ErrorCode::MatchNotOpen
    );
    require!(lobby.is_full(), ErrorCode::LobbyNotFull);
    require!(
        lobby.has_everyone_committed() || now > lobby.commit_deadline,
        ErrorCode::CommitsStillOpen
    );
    require!(
        now <= lobby.reveal_deadline,
        ErrorCode::RevealDeadlinePassed
    );
    let seat = lobby
        .seat_of(&context.accounts.player.key())
        .ok_or(ErrorCode::NotAPlayer)?;
    require!(lobby.has_committed(seat), ErrorCode::NotCommitted);
    require!(!lobby.has_revealed(seat), ErrorCode::AlreadyRevealed);
    let commitment = lobby.commitments.get(seat).copied().unwrap_or_default();
    require!(
        policy_commitment(&policy, &salt) == commitment,
        ErrorCode::WrongPolicyHash
    );
    validate_policy(&policy).map_err(|_| ErrorCode::InvalidPolicy)?;
    let length = u16::try_from(policy.len()).map_err(|_| ErrorCode::InvalidPolicy)?;

    // Step 2: store the policy in the player's slot.
    let slot = lobby
        .policies
        .get_mut(seat)
        .and_then(|slot| slot.get_mut(..policy.len()))
        .ok_or(ErrorCode::InvalidPolicy)?;
    slot.copy_from_slice(&policy);
    if let Some(stored_length) = lobby.policy_lengths.get_mut(seat) {
        *stored_length = length;
    }
    lobby.revealed_flags |= seat_bit(seat);
    Ok(())
}
