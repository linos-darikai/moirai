//! `advance_turn`: plays one turn of a running match (PLAN.md section 4). Permissionless: anyone
//! may call it and gets the crank reward. Every civ's orders come from its revealed policy, decided
//! from the same start-of-turn state, then the turn runs (civ-core `play_turn`), all in place in
//! the Match account. Uses about 35k–90k compute units for 4 civs (docs/decisions/0009); clients
//! ask for 400,000.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use civ_core::match_state::MatchState;
use civ_core::policy::interpreter::play_turn;

use crate::constants::VAULT_SEED;
use crate::crank::crank_reward_per_turn;
use crate::errors::ErrorCode;
use crate::state::{Match, MatchStatus, MAX_PLAYERS};

#[derive(Accounts)]
pub struct AdvanceTurn<'info> {
    /// Whoever advances the match. Receives the crank reward.
    #[account(mut)]
    pub caller: Signer<'info>,

    /// The running match.
    #[account(mut)]
    pub match_account: AccountLoader<'info, Match>,

    /// This match's vault: pays the crank reward.
    #[account(mut, seeds = [VAULT_SEED, match_account.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// Play the next turn and pay the caller.
///
/// Checks: the match is Running and its last turn hasn't been played.
/// Effects: decides and plays one turn in the Match account; pays the crank reward from the vault.
pub fn handle_advance_turn(context: Context<AdvanceTurn>) -> Result<()> {
    // Step 1 and 2: checks, then play the turn (in a block so the account is released before the
    // transfer below).
    let (reward, vault_bump) = {
        let mut lobby = context.accounts.match_account.load_mut()?;
        require!(
            lobby.current_status() == Some(MatchStatus::Running),
            ErrorCode::MatchNotRunning
        );
        play_next_turn(&mut lobby)?;
        let reward = crank_reward_per_turn(lobby.entry_fee_lamports, lobby.player_count)
            .ok_or(ErrorCode::RewardOverflow)?;
        (reward, lobby.vault_bump)
    };

    // Step 3: pay the crank from the vault, signed with the vault's seeds.
    if reward == 0 {
        return Ok(());
    }
    let match_key = context.accounts.match_account.key();
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, match_key.as_ref(), &[vault_bump]];
    let signer_seeds: &[&[&[u8]]] = &[vault_seeds];
    let payment = Transfer {
        from: context.accounts.vault.to_account_info(),
        to: context.accounts.caller.to_account_info(),
    };
    transfer(
        CpiContext::new_with_signer(context.accounts.system_program.key(), payment, signer_seeds),
        reward,
    )
}

/// Decides every civ's orders from its policy and plays the turn, in the account's bytes.
fn play_next_turn(lobby: &mut Match) -> Result<()> {
    // Take the struct apart so the game bytes (changed) and the policies (read) can be borrowed at
    // the same time.
    let Match {
        match_state,
        policies,
        policy_lengths,
        ..
    } = lobby;

    // Each civ's policy: only the revealed part of its slot (empty if it never revealed).
    let mut policy_slices: [&[u8]; MAX_PLAYERS] = [&[]; MAX_PLAYERS];
    for (seat, slice) in policy_slices.iter_mut().enumerate() {
        let length = usize::from(policy_lengths.get(seat).copied().unwrap_or(0));
        *slice = policies
            .get(seat)
            .and_then(|slot| slot.get(..length))
            .unwrap_or(&[]);
    }

    let game = bytemuck::try_from_bytes_mut::<MatchState>(match_state)
        .map_err(|_| ErrorCode::MisalignedMatchState)?;
    play_turn(game, &policy_slices).map_err(|_| ErrorCode::MatchOver)?;
    Ok(())
}
