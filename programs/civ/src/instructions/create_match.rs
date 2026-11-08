//! `create_match`: opens a lobby. Creates the Match account and its Vault; nobody has joined yet
//! (the creator joins with `join_match` like everyone else if they want to play).

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::{ANCHOR_DISCRIMINATOR_SIZE, MATCH_SEED, VAULT_SEED};
use crate::errors::ErrorCode;
use crate::state::{win_metric_from_byte, Match, MatchStatus, Payout, MAX_PLAYERS, MIN_PLAYERS};

/// The lobby's settings, chosen by the creator.
///
/// `AnchorSerialize`/`AnchorDeserialize` let this struct travel as instruction data (Anchor
/// turns it into bytes in the client and back here), and it shows up as a type in the IDL.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub struct MatchSettings {
    /// What each player pays to join, in lamports.
    pub entry_fee_lamports: u64,
    /// How many players the lobby waits for (2 to 4).
    pub max_players: u8,
    /// 0 Territory, 1 Wealth, 2 Conquest, 3 Score.
    pub win_metric: u8,
    /// 0 winner takes all, 1 top three (60/30/10).
    pub payout: u8,
    /// Unix time after which nobody can join.
    pub join_deadline: i64,
    /// Unix time after which nobody can commit (after the join deadline).
    pub commit_deadline: i64,
    /// Unix time after which nobody can reveal (after the commit deadline).
    pub reveal_deadline: i64,
}

#[derive(Accounts)]
#[instruction(match_id: u64)]
pub struct CreateMatch<'info> {
    /// Opens the lobby and pays the rent for the Match and Vault accounts.
    #[account(mut)]
    pub creator: Signer<'info>,

    /// The new match, at `["match", creator, match_id]`.
    #[account(
        init,
        payer = creator,
        space = ANCHOR_DISCRIMINATOR_SIZE + core::mem::size_of::<Match>(),
        seeds = [MATCH_SEED, creator.key().as_ref(), &match_id.to_le_bytes()],
        bump,
    )]
    pub match_account: AccountLoader<'info, Match>,

    /// The match's vault: a plain System-owned account at `["vault", match]` that only ever holds
    /// lamports. It comes into existence when the rent deposit below lands in it.
    #[account(mut, seeds = [VAULT_SEED, match_account.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Open a lobby with these settings.
///
/// Checks: 2 to 4 players, a known win metric and payout, deadlines in the future and in order
/// (join < commit < reveal).
/// Effects: creates the Match (status Open), funds the Vault with its rent-exempt minimum so it
/// exists, stores the settings and both bumps.
pub fn handle_create_match(
    context: Context<CreateMatch>,
    match_id: u64,
    settings: MatchSettings,
) -> Result<()> {
    // Step 1: checks
    check_settings(&settings, Clock::get()?.unix_timestamp)?;

    // Step 2: the vault needs its rent-exempt minimum to exist (a System account with 0 data).
    // The creator pays it now and gets it back when the match is closed.
    let vault_rent = Rent::get()?.minimum_balance(0);
    let deposit = Transfer {
        from: context.accounts.creator.to_account_info(),
        to: context.accounts.vault.to_account_info(),
    };
    transfer(
        CpiContext::new(context.accounts.system_program.key(), deposit),
        vault_rent,
    )?;

    // Step 3: store the lobby.
    let mut lobby = context.accounts.match_account.load_init()?;
    lobby.creator = context.accounts.creator.key();
    lobby.match_id = match_id;
    lobby.entry_fee_lamports = settings.entry_fee_lamports;
    lobby.max_players = settings.max_players;
    lobby.win_metric = settings.win_metric;
    lobby.payout = settings.payout;
    lobby.join_deadline = settings.join_deadline;
    lobby.commit_deadline = settings.commit_deadline;
    lobby.reveal_deadline = settings.reveal_deadline;
    lobby.status = MatchStatus::Open.to_byte();
    lobby.bump = context.bumps.match_account;
    lobby.vault_bump = context.bumps.vault;
    Ok(())
}

/// Every check on the settings, in order.
fn check_settings(settings: &MatchSettings, now: i64) -> Result<()> {
    let players = usize::from(settings.max_players);
    require!(
        settings.max_players >= MIN_PLAYERS && players <= MAX_PLAYERS,
        ErrorCode::InvalidPlayerCount
    );
    require!(
        win_metric_from_byte(settings.win_metric).is_some(),
        ErrorCode::UnknownWinMetric
    );
    require!(
        Payout::from_byte(settings.payout).is_some(),
        ErrorCode::UnknownPayout
    );
    // `require!(condition, error)` returns the error when the condition is false.
    require!(
        now < settings.join_deadline
            && settings.join_deadline < settings.commit_deadline
            && settings.commit_deadline < settings.reveal_deadline,
        ErrorCode::BadDeadlines
    );
    Ok(())
}
