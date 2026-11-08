//! `commit_policy`: a player locks in their policy by storing only its hash (the commitment).
//! The policy itself stays secret until `reveal_policy`.

use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::state::{Match, MatchStatus};

#[derive(Accounts)]
pub struct CommitPolicy<'info> {
    pub player: Signer<'info>,

    #[account(mut)]
    pub match_account: AccountLoader<'info, Match>,
}

/// Store the player's commitment: sha256(compiled policy bytes || 32-byte salt).
///
/// Checks: match is Open, the signer has joined, the commit deadline hasn't passed, they haven't
/// committed yet, the commitment isn't all zeros (that means "no commitment").
/// Effects: stores the commitment and marks the player as committed.
pub fn handle_commit_policy(context: Context<CommitPolicy>, commitment: [u8; 32]) -> Result<()> {
    let mut lobby = context.accounts.match_account.load_mut()?;

    // Step 1: checks
    require!(
        lobby.current_status() == Some(MatchStatus::Open),
        ErrorCode::MatchNotOpen
    );
    let seat = lobby
        .seat_of(&context.accounts.player.key())
        .ok_or(ErrorCode::NotAPlayer)?;
    require!(
        Clock::get()?.unix_timestamp <= lobby.commit_deadline,
        ErrorCode::CommitDeadlinePassed
    );
    require!(!lobby.has_committed(seat), ErrorCode::AlreadyCommitted);
    require!(commitment != [0; 32], ErrorCode::EmptyCommitment);

    // Step 2: store it
    if let Some(slot) = lobby.commitments.get_mut(seat) {
        *slot = commitment;
    }
    lobby.committed_flags |= seat_bit(seat);
    Ok(())
}

/// The flag bit for a seat (seat 0 = bit 0). Seats are 0..4, so the shift never overflows.
pub fn seat_bit(seat: usize) -> u8 {
    1u8.checked_shl(u32::try_from(seat).unwrap_or(0))
        .unwrap_or(0)
}
