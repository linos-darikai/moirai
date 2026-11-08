//! TurnBench: a Phase 2 measuring spike, not a real game account. It holds one whole match
//! (`civ_core::match_state::MatchState`) and four compiled policies in a single zero-copy account
//! so `bench_turn` can run civ-core's `play_turn` on chain and we can measure its compute units
//! and stack use (PLAN.md section 9, "Compute check"). The results decide the real account
//! layout; see docs/decisions/0009. Remove it once the real Match accounts exist.

use anchor_lang::prelude::*;
use civ_core::civ::MAX_CIVS;
use civ_core::match_state::MatchState;
use civ_core::policy::format::MAX_POLICY_BYTES;

/// Bytes of one `MatchState`. A literal (not `size_of`) because the IDL needs a plain number; the
/// check below fails the build if civ-core's layout ever changes size.
pub const MATCH_STATE_BYTES: usize = 1_264;
/// Bytes kept for each compiled policy (the largest a policy can be).
pub const POLICY_SLOT_BYTES: usize = 499;
/// Policies one bench holds.
pub const BENCH_CIVS: usize = 4;

// Compile-time checks: these literals must match civ-core, or the build fails here.
const _: () = assert!(MATCH_STATE_BYTES == core::mem::size_of::<MatchState>());
const _: () = assert!(POLICY_SLOT_BYTES == MAX_POLICY_BYTES);
const _: () = assert!(BENCH_CIVS == MAX_CIVS);

/// One match plus its policies, as plain bytes.
///
/// `#[account(zero_copy)]` means Anchor never copies this account into a Rust value: the program
/// reads and writes the account's bytes in place (through `AccountLoader`). That matters here
/// because the account is 3.3 KB and a Solana function only gets 4 KB of stack.
///
/// The match is stored as raw bytes and viewed as a `MatchState` with bytemuck (`match_state_mut`),
/// because Anchor's IDL can't describe a type from another crate.
#[account(zero_copy)]
pub struct TurnBench {
    /// The wallet that created the bench; only it may load policies.
    pub authority: Pubkey,
    /// A `civ_core::match_state::MatchState`, byte for byte.
    pub match_state: [u8; MATCH_STATE_BYTES],
    /// Each civ's compiled policy, padded with zeros to POLICY_SLOT_BYTES.
    pub policies: [[u8; POLICY_SLOT_BYTES]; BENCH_CIVS],
    /// How many bytes of each `policies` slot are the policy (0 = no policy yet).
    pub policy_lengths: [u16; BENCH_CIVS],
}

/// Views the stored bytes as a `MatchState`, in place. `None` if the bytes aren't 4-byte aligned
/// (Solana aligns account data to 8, so this never happens; checked instead of trusted).
pub fn match_state_mut(bytes: &mut [u8; MATCH_STATE_BYTES]) -> Option<&mut MatchState> {
    // `try_from_bytes_mut` checks the size and alignment and returns an error instead of crashing.
    bytemuck::try_from_bytes_mut::<MatchState>(bytes).ok()
}
