//! Constants for the civ program: PDA seeds, sizes and limits. Every seed is defined here once
//! so the program, tests and app can't drift apart.

use anchor_lang::prelude::*;
use civ_core::match_state::MatchState;
use civ_core::policy::format::MAX_POLICY_BYTES;

/// Every Anchor account starts with an 8-byte "discriminator" that says which account type it is.
/// We add it to each account's size when we create the account.
pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

/// Seed for the Phase 0 hello-world Counter PDA: `["counter", authority]`.
/// `#[constant]` also exports the value into the IDL, so the app can read the same seed.
#[constant]
pub const COUNTER_SEED: &[u8] = b"counter";

/// Seed for the Phase 0 VRF spike RandomSeed PDA: `["random_seed", authority]`.
#[constant]
pub const RANDOM_SEED_SEED: &[u8] = b"random_seed";

/// Seed for the Phase 2 measuring spike TurnBench PDA: `["turn_bench", authority]`.
#[constant]
pub const TURN_BENCH_SEED: &[u8] = b"turn_bench";

/// Seed for a Match PDA: `["match", creator, match_id as 8 little-endian bytes]`.
#[constant]
pub const MATCH_SEED: &[u8] = b"match";

/// Seed for a match's Vault PDA (holds the entry fees): `["vault", match]`.
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

/// Bytes of one `civ_core::match_state::MatchState`. A literal (not `size_of`) because the IDL
/// needs a plain number; the check below fails the build if civ-core's layout changes size.
pub const MATCH_STATE_BYTES: usize = 1_264;

/// Bytes kept for each compiled policy (the largest a policy can be).
pub const POLICY_SLOT_BYTES: usize = 499;

// Compile-time checks: these literals must match civ-core, or the build fails here.
const _: () = assert!(MATCH_STATE_BYTES == core::mem::size_of::<MatchState>());
const _: () = assert!(POLICY_SLOT_BYTES == MAX_POLICY_BYTES);
