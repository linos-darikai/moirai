//! `fulfill_match_seed`: the VRF oracle's callback with the match's map seed. Builds turn 0 of the
//! game. Only the MagicBlock VRF program can call it successfully; players never send it.

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::vrf_callback;

use crate::errors::ErrorCode;
use crate::game_start::start_game;
use crate::state::{Match, MatchStatus};

/// `#[vrf_callback]` (MagicBlock SDK) adds a required signer: this program's VRF identity, which
/// only the VRF program can sign for. Without it anyone could start a match with a seed of their
/// choosing, so never remove the macro.
#[vrf_callback]
#[derive(Accounts)]
pub struct FulfillMatchSeed<'info> {
    /// The Match named in the request (`accounts_metas` in `start_match`).
    #[account(mut)]
    pub match_account: AccountLoader<'info, Match>,
}

/// Start the game with the oracle's randomness.
///
/// Checks: called by the VRF program (macro); the match is waiting for its seed, so a duplicate or
/// late callback can't restart a running match.
/// Effects: builds turn 0 (map, civs, market) in the Match and marks it Running.
pub fn handle_fulfill_match_seed(
    context: Context<FulfillMatchSeed>,
    randomness: [u8; 32],
) -> Result<()> {
    let mut lobby = context.accounts.match_account.load_mut()?;
    require!(
        lobby.current_status() == Some(MatchStatus::SeedRequested),
        ErrorCode::SeedNotRequested
    );
    start_game(&mut lobby, randomness)
}
