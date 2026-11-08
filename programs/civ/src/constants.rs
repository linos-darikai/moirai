//! Constants for the civ program: PDA seeds, sizes and limits. Every seed is defined here once
//! so the program, tests and app can't drift apart.

use anchor_lang::prelude::*;

/// Every Anchor account starts with an 8-byte "discriminator" that says which account type it is.
/// We add it to each account's size when we create the account.
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

/// Seed for the Phase 0 hello-world Counter PDA: `["counter", authority]`.
/// `#[constant]` also exports the value into the IDL, so the app can read the same seed.
#[constant]
pub const COUNTER_SEED: &[u8] = b"counter";
