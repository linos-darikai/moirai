//! `cancel_match`: a lobby that didn't fill by its join deadline is cancelled. Every player gets
//! their entry fee back, and the Match and Vault accounts are closed (rent back to the creator).
//! Anyone can call it, so a lobby can never trap money.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::VAULT_SEED;
use crate::errors::ErrorCode;
use crate::state::{Match, MatchStatus};

#[derive(Accounts)]
pub struct CancelMatch<'info> {
    /// Whoever cancels. Pays the transaction fee only.
    pub caller: Signer<'info>,

    /// The lobby to cancel. `close = creator` sends its rent to the creator when the instruction
    /// succeeds; `has_one = creator` checks the creator account passed is the real one.
    #[account(mut, has_one = creator, close = creator)]
    pub match_account: AccountLoader<'info, Match>,

    /// This match's vault.
    #[account(mut, seeds = [VAULT_SEED, match_account.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// The match's creator: receives the rent of both accounts.
    /// CHECK: only receives lamports; `has_one = creator` above proves it is the stored creator.
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    // The players to refund come after these, as "remaining accounts", in join order.
}

/// Cancel an unfilled lobby and refund everyone.
///
/// Checks: match is Open, join deadline passed, match not full, the remaining accounts are exactly
/// the joined players in join order.
/// Effects: refunds each player's entry fee from the vault, returns the vault's rent to the
/// creator, marks the match Cancelled and closes it.
///
/// The `<'info>` written out here (most handlers leave it implicit) ties the remaining accounts'
/// lifetime to the other accounts', which Anchor needs before we can pass them to a transfer.
pub fn handle_cancel_match<'info>(context: Context<'info, CancelMatch<'info>>) -> Result<()> {
    // Step 1: checks
    let (players, entry_fee, vault_bump) = {
        let lobby = context.accounts.match_account.load()?;
        require!(
            lobby.current_status() == Some(MatchStatus::Open),
            ErrorCode::MatchNotOpen
        );
        require!(
            Clock::get()?.unix_timestamp > lobby.join_deadline,
            ErrorCode::JoinStillOpen
        );
        require!(!lobby.is_full(), ErrorCode::MatchFull);
        (
            lobby.joined_players().to_vec(),
            lobby.entry_fee_lamports,
            lobby.vault_bump,
        )
    };
    let refund_accounts = context.remaining_accounts;
    require!(
        refund_accounts.len() == players.len(),
        ErrorCode::WrongRefundAccounts
    );

    // Step 2: refund every player from the vault, signed with the vault's seeds.
    let match_key = context.accounts.match_account.key();
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, match_key.as_ref(), &[vault_bump]];
    for (player, account) in players.iter().zip(refund_accounts) {
        require_keys_eq!(*player, account.key(), ErrorCode::WrongRefundAccounts);
        pay_from_vault(&context, account.clone(), entry_fee, vault_seeds)?;
    }

    // Step 3: what's left in the vault is its rent; it goes back to the creator.
    let vault_rent = context.accounts.vault.lamports();
    let creator = context.accounts.creator.to_account_info();
    pay_from_vault(&context, creator, vault_rent, vault_seeds)?;

    // Step 4: mark it cancelled (the account is then closed by `close = creator`).
    context.accounts.match_account.load_mut()?.status = MatchStatus::Cancelled.to_byte();
    Ok(())
}

/// Sends `lamports` from the vault to `recipient`, signed with the vault's PDA seeds.
fn pay_from_vault<'info>(
    context: &Context<'info, CancelMatch<'info>>,
    recipient: AccountInfo<'info>,
    lamports: u64,
    vault_seeds: &[&[u8]],
) -> Result<()> {
    if lamports == 0 {
        return Ok(());
    }
    let payment = Transfer {
        from: context.accounts.vault.to_account_info(),
        to: recipient,
    };
    let signer_seeds: &[&[&[u8]]] = &[vault_seeds];
    transfer(
        CpiContext::new_with_signer(context.accounts.system_program.key(), payment, signer_seeds),
        lamports,
    )
}
