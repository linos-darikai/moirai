//! Counter: the Phase 0 hello-world account. One per wallet. It proves the toolchain works end to
//! end (build, test, deploy, call from the app) and will be removed once real accounts exist.

use anchor_lang::prelude::*;

/// A tiny account that stores who owns it and a number they can increase.
///
/// `#[account]` tells Anchor this struct is stored on chain (it handles saving and loading).
/// `#[derive(InitSpace)]` makes Anchor work out how many bytes the struct needs (`Counter::INIT_SPACE`).
#[account]
#[derive(InitSpace)]
pub struct Counter {
    /// The wallet that created this counter and is allowed to increase it.
    pub authority: Pubkey,
    /// How many times `increment` has been called. Starts at 0.
    pub count: u64,
    /// The PDA bump, stored so later instructions reuse it instead of searching again.
    pub bump: u8,
}
