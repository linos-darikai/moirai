//! Profile: one wallet's record across matches (PLAN.md section 4). Created the first time the
//! wallet joins a match (the player pays its small rent once) and updated by `settle_match`.

use anchor_lang::prelude::*;

/// A player's rating and history.
#[account]
#[derive(InitSpace)]
pub struct Profile {
    /// The wallet this profile belongs to.
    pub wallet: Pubkey,
    /// Elo rating (starts at 1,200; see elo.rs).
    pub elo: u32,
    /// Matches settled with this wallet in them.
    pub matches_played: u32,
    /// Matches this wallet won (tied winners all count as winning).
    pub wins: u32,
    /// Total lamports won from pots.
    pub winnings_lamports: u64,
    /// This account's PDA bump.
    pub bump: u8,
}
