//! `join_match`: a player pays the entry fee into the vault and takes the next seat in the lobby.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::VAULT_SEED;
use crate::errors::ErrorCode;
use crate::state::{Match, MatchStatus};

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    /// The joining player. Signs and pays the entry fee.
    #[account(mut)]
    pub player: Signer<'info>,

    /// The lobby to join.
    #[account(mut)]
    pub match_account: AccountLoader<'info, Match>,

    /// This match's vault. The seeds tie it to `match_account`, so a fee can't go anywhere else.
    #[account(mut, seeds = [VAULT_SEED, match_account.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Join an open match: pay the entry fee into the vault and take the next seat.
///
/// Checks: match is Open, join deadline not passed, match not full, player not already joined.
/// Effects: transfers the entry fee to the vault, records the player, increments player count.
pub fn handle_join_match(context: Context<JoinMatch>) -> Result<()> {
    let player_key = context.accounts.player.key();

    // Step 1: checks (in their own block so the account is released before the transfer).
    let entry_fee = {
        let lobby = context.accounts.match_account.load()?;
        require!(
            lobby.current_status() == Some(MatchStatus::Open),
            ErrorCode::MatchNotOpen
        );
        require!(
            Clock::get()?.unix_timestamp <= lobby.join_deadline,
            ErrorCode::JoinDeadlinePassed
        );
        require!(!lobby.is_full(), ErrorCode::MatchFull);
        require!(!lobby.has_joined(&player_key), ErrorCode::AlreadyJoined);
        lobby.entry_fee_lamports
    };

    // Step 2: move the entry fee into the vault.
    if entry_fee > 0 {
        let payment = Transfer {
            from: context.accounts.player.to_account_info(),
            to: context.accounts.vault.to_account_info(),
        };
        transfer(
            CpiContext::new(context.accounts.system_program.key(), payment),
            entry_fee,
        )?;
    }

    // Step 3: take the next seat.
    let mut lobby = context.accounts.match_account.load_mut()?;
    let seat = usize::from(lobby.player_count);
    let slot = lobby.players.get_mut(seat).ok_or(ErrorCode::MatchFull)?;
    *slot = player_key;
    lobby.player_count = lobby
        .player_count
        .checked_add(1)
        .ok_or(ErrorCode::MatchFull)?;
    Ok(())
}
