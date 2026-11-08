//! `settle_match`: ends a finished match (PLAN.md section 4). Scores it under its win metric, pays
//! the pot from the vault, updates every player's Profile and the Top 10, then closes the Match and
//! Vault (rent back to the creator). Anyone may call it once the last turn has been played.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use civ_core::scoring::final_standings;

use crate::constants::{ANCHOR_DISCRIMINATOR_SIZE, TOP_TEN_SEED, VAULT_SEED};
use crate::elo::updated_ratings;
use crate::errors::ErrorCode;
use crate::payout::{split_pot, winners, FinalResult};
use crate::state::{
    win_metric_from_byte, Match, MatchStatus, Payout, Profile, TopTen, MAX_PLAYERS,
};

#[derive(Accounts)]
pub struct SettleMatch<'info> {
    /// Whoever settles. Pays for the Top 10 account the very first time any match is settled.
    #[account(mut)]
    pub caller: Signer<'info>,

    /// The finished match. Closed at the end, its rent going to the creator.
    #[account(mut, has_one = creator, close = creator)]
    pub match_account: AccountLoader<'info, Match>,

    /// This match's vault: pays the winners.
    #[account(mut, seeds = [VAULT_SEED, match_account.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    /// CHECK: only receives lamports; `has_one = creator` above proves it is the stored creator.
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    /// The leaderboard at `["top10"]`, created the first time any match settles.
    #[account(
        init_if_needed,
        payer = caller,
        space = ANCHOR_DISCRIMINATOR_SIZE + TopTen::INIT_SPACE,
        seeds = [TOP_TEN_SEED],
        bump,
    )]
    pub top_ten: Account<'info, TopTen>,

    pub system_program: Program<'info, System>,
    // Then, as remaining accounts, for every seat in order: the player's wallet (writable, gets
    // their winnings) and their Profile (writable).
}

/// The scored match, worked out before any money moves.
struct Settlement {
    players: Vec<Pubkey>,
    results: Vec<FinalResult>,
    amounts: [u64; MAX_PLAYERS],
    is_winner: [bool; MAX_PLAYERS],
    vault_bump: u8,
}

/// Settle a finished match.
///
/// Checks: the match is Running and its game is finished; the remaining accounts are each player's
/// wallet and Profile, in seat order.
/// Effects: pays each player their share of the pot (vault minus its rent) from the vault; updates
/// every Profile (matches, wins, winnings, Elo) and the Top 10; sends the vault's rent to the
/// creator; marks the match Settled and closes it.
///
/// The `<'info>` written out ties the remaining accounts' lifetime to the others', which Anchor
/// needs before we can read them as Profiles and pay them.
pub fn handle_settle_match<'info>(context: Context<'info, SettleMatch<'info>>) -> Result<()> {
    // Step 1: checks and scoring.
    let settlement = score_match(&context)?;
    let accounts = context.remaining_accounts;
    require!(
        accounts.len() == settlement.players.len() * 2,
        ErrorCode::WrongSettleAccounts
    );

    // Step 2: load every Profile and work out the new ratings.
    let mut profiles: Vec<Account<'info, Profile>> = Vec::new();
    for (seat, player) in settlement.players.iter().enumerate() {
        let wallet = accounts
            .get(seat * 2)
            .ok_or(ErrorCode::WrongSettleAccounts)?;
        let profile_info = accounts
            .get(seat * 2 + 1)
            .ok_or(ErrorCode::WrongSettleAccounts)?;
        require_keys_eq!(wallet.key(), *player, ErrorCode::WrongSettleAccounts);
        // `Account::try_from` checks the account is a Profile owned by this program.
        let profile: Account<'info, Profile> = Account::try_from(profile_info)?;
        require_keys_eq!(profile.wallet, *player, ErrorCode::WrongSettleAccounts);
        profiles.push(profile);
    }
    let ratings: Vec<u32> = profiles.iter().map(|profile| profile.elo).collect();
    let scores: Vec<u64> = settlement
        .results
        .iter()
        .map(|result| result.score)
        .collect();
    let new_ratings = updated_ratings(&ratings, &scores);

    // Step 3: pay each player and update their Profile and the Top 10.
    let match_key = context.accounts.match_account.key();
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, match_key.as_ref(), &[settlement.vault_bump]];
    for (seat, profile) in profiles.iter_mut().enumerate() {
        let amount = settlement.amounts.get(seat).copied().unwrap_or(0);
        let wallet = accounts
            .get(seat * 2)
            .ok_or(ErrorCode::WrongSettleAccounts)?;
        pay_from_vault(&context, wallet.clone(), amount, vault_seeds)?;

        profile.matches_played = profile.matches_played.saturating_add(1);
        if settlement.is_winner.get(seat).copied().unwrap_or(false) {
            profile.wins = profile.wins.saturating_add(1);
        }
        profile.winnings_lamports = profile.winnings_lamports.saturating_add(amount);
        profile.elo = new_ratings.get(seat).copied().unwrap_or(profile.elo);
        context.accounts.top_ten.record(profile.wallet, profile.elo);
        // Write the changed Profile back into its account (remaining accounts aren't saved
        // automatically the way the named accounts are).
        profile.exit(&crate::ID)?;
    }
    context.accounts.top_ten.bump = context.bumps.top_ten;

    // Step 4: the vault's rent (and nothing else) goes back to the creator; mark it settled.
    let vault_rent = context.accounts.vault.lamports();
    let creator = context.accounts.creator.to_account_info();
    pay_from_vault(&context, creator, vault_rent, vault_seeds)?;
    context.accounts.match_account.load_mut()?.status = MatchStatus::Settled.to_byte();
    Ok(())
}

/// The checks before settling, then the scores and each seat's share of the pot.
fn score_match(context: &Context<SettleMatch>) -> Result<Settlement> {
    let lobby = context.accounts.match_account.load()?;
    require!(
        lobby.current_status() == Some(MatchStatus::Running),
        ErrorCode::MatchNotRunning
    );
    let game = lobby.game().ok_or(ErrorCode::MisalignedMatchState)?;
    require!(game.is_finished(), ErrorCode::MatchNotFinished);
    let metric = win_metric_from_byte(lobby.win_metric).ok_or(ErrorCode::UnknownWinMetric)?;
    let payout = Payout::from_byte(lobby.payout).ok_or(ErrorCode::UnknownPayout)?;

    let standings = final_standings(game, metric);
    let mut results: Vec<FinalResult> = Vec::new();
    for (seat, civ) in game.active_civs().iter().enumerate() {
        results.push(FinalResult {
            score: standings.scores.get(seat).copied().unwrap_or(0),
            is_alive: civ.is_alive(),
        });
    }

    // The pot is everything in the vault except the rent it needs to exist.
    let vault_rent = Rent::get()?.minimum_balance(0);
    let pot = context.accounts.vault.lamports().saturating_sub(vault_rent);
    Ok(Settlement {
        players: lobby.joined_players().to_vec(),
        amounts: split_pot(&results, payout, pot),
        is_winner: winners(&results),
        results,
        vault_bump: lobby.vault_bump,
    })
}

/// Sends `lamports` from the vault to `recipient`, signed with the vault's PDA seeds.
fn pay_from_vault<'info>(
    context: &Context<'info, SettleMatch<'info>>,
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
