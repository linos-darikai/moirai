//! RandomSeed: Phase 0 VRF spike account. Holds one 32-byte random value delivered by the
//! MagicBlock VRF oracle. It previews the real design: one VRF seed per Match, requested on the
//! base layer after every policy is revealed (PLAN.md section 4, "Randomness").

use anchor_lang::prelude::*;

/// Where a seed request is in its life. Like a TypeScript union of string literals.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum SeedStatus {
    /// Account created; no randomness asked for yet.
    Idle,
    /// Request sent to the oracle; waiting for its callback.
    Requested,
    /// The oracle's callback has written `seed`. Final: it can't be overwritten.
    Fulfilled,
}

/// One wallet's spike seed, at the PDA `["random_seed", authority]`.
#[account]
#[derive(InitSpace)]
pub struct RandomSeed {
    /// The wallet that created this account and may request randomness for it.
    pub authority: Pubkey,
    /// The 32 random bytes from the VRF oracle. All zeros until `status` is `Fulfilled`.
    pub seed: [u8; 32],
    /// Where the request is: Idle, Requested or Fulfilled.
    pub status: SeedStatus,
    /// Slot in which the oracle's callback landed (0 until fulfilled). Useful to measure latency.
    pub fulfilled_slot: u64,
    /// The PDA bump, stored so later instructions reuse it.
    pub bump: u8,
}
