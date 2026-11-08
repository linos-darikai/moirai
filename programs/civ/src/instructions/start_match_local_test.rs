//! `start_match_local_test`: starts a match with a seed the caller chooses. ONLY for the local test
//! validator, where the VRF oracle doesn't exist. It does anything only when the program is built
//! with the `local-testing` cargo feature (`anchor build -- --features local-testing`); in every
//! other build, including the one deployed to devnet, it fails with LocalTestingDisabled.
//!
//! It runs the same checks as `start_match` and the same `start_game` as the VRF callback, so the
//! tests exercise the real code.

use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::game_start::{check_ready_to_start, start_game};
use crate::state::Match;

#[derive(Accounts)]
pub struct StartMatchLocalTest<'info> {
    pub caller: Signer<'info>,

    #[account(mut)]
    pub match_account: AccountLoader<'info, Match>,
}

/// Start the match with `seed` (local tests only).
///
/// Checks: the program was built with `local-testing`; the same checks as `start_match`.
/// Effects: builds turn 0 from `seed` and marks the match Running.
pub fn handle_start_match_local_test(
    context: Context<StartMatchLocalTest>,
    seed: [u8; 32],
) -> Result<()> {
    // `cfg!(...)` is true only when the program was compiled with that feature.
    require!(
        cfg!(feature = "local-testing"),
        ErrorCode::LocalTestingDisabled
    );
    let mut lobby = context.accounts.match_account.load_mut()?;
    check_ready_to_start(&lobby, Clock::get()?.unix_timestamp)?;
    start_game(&mut lobby, seed)
}
