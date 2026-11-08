//! Match: one game from lobby to settlement (docs/decisions/0009). Everything about a match lives
//! in this one zero-copy account: the lobby settings, who joined, their policy commitments and
//! compiled policies, and the whole game (`civ_core::match_state::MatchState`). The entry fees sit
//! in a separate Vault PDA (`["vault", match]`).

use anchor_lang::prelude::*;
use civ_core::match_state::MatchState;
use civ_core::scoring::WinMetric;

use crate::constants::{MATCH_STATE_BYTES, POLICY_SLOT_BYTES};

/// The most civs one match can have.
pub const MAX_PLAYERS: usize = 4;
/// The fewest players a lobby can be created for.
pub const MIN_PLAYERS: u8 = 2;

/// Where a match is in its life. Stored as one byte (`Match::status`), because a zero-copy account
/// can only hold plain bytes, not a Rust enum.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum MatchStatus {
    /// A lobby: players join, commit and reveal.
    Open,
    /// The game is being played turn by turn.
    Running,
    /// Finished and paid out.
    Settled,
    /// The lobby didn't fill in time; everyone was refunded.
    Cancelled,
    /// `start_match` asked the VRF oracle for the map seed; waiting for its callback.
    SeedRequested,
}

impl MatchStatus {
    /// The stored byte.
    pub fn to_byte(self) -> u8 {
        match self {
            MatchStatus::Open => 0,
            MatchStatus::Running => 1,
            MatchStatus::Settled => 2,
            MatchStatus::Cancelled => 3,
            MatchStatus::SeedRequested => 4,
        }
    }

    /// Reads the stored byte. `None` for a byte no status uses.
    pub fn from_byte(byte: u8) -> Option<MatchStatus> {
        match byte {
            0 => Some(MatchStatus::Open),
            1 => Some(MatchStatus::Running),
            2 => Some(MatchStatus::Settled),
            3 => Some(MatchStatus::Cancelled),
            4 => Some(MatchStatus::SeedRequested),
            _ => None,
        }
    }
}

/// How the pot is shared at the end (PLAN.md section 5).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Payout {
    /// The winner takes everything (tied winners split it).
    WinnerTakesAll,
    /// First, second and third get 60%, 30% and 10%.
    TopThree,
}

impl Payout {
    pub fn from_byte(byte: u8) -> Option<Payout> {
        match byte {
            0 => Some(Payout::WinnerTakesAll),
            1 => Some(Payout::TopThree),
            _ => None,
        }
    }
}

/// Reads a stored win metric byte (0 Territory, 1 Wealth, 2 Conquest, 3 Score).
pub fn win_metric_from_byte(byte: u8) -> Option<WinMetric> {
    match byte {
        0 => Some(WinMetric::Territory),
        1 => Some(WinMetric::Wealth),
        2 => Some(WinMetric::Conquest),
        3 => Some(WinMetric::Score),
        _ => None,
    }
}

/// One match, as plain bytes (3,616 bytes after the discriminator).
///
/// `#[account(zero_copy)]`: Anchor never copies this into a Rust value; instructions read and
/// write the account's bytes in place through `AccountLoader`. Field order keeps every number on
/// its natural boundary so there are no hidden padding bytes.
#[account(zero_copy)]
pub struct Match {
    /// The wallet that created the lobby. Gets the account rent back when the match is closed.
    pub creator: Pubkey,
    /// Players in join order; unused slots are the default (all-zero) key.
    pub players: [Pubkey; MAX_PLAYERS],
    /// Each player's commitment: sha256(compiled policy bytes || 32-byte salt). All zero = none.
    pub commitments: [[u8; 32]; MAX_PLAYERS],
    /// The creator's number for this match; part of the address, so one wallet can run many.
    pub match_id: u64,
    /// What each player pays to join, in lamports.
    pub entry_fee_lamports: u64,
    /// Unix time (seconds) after which nobody can join.
    pub join_deadline: i64,
    /// Unix time after which nobody can commit.
    pub commit_deadline: i64,
    /// Unix time after which nobody can reveal; the match can start then.
    pub reveal_deadline: i64,
    /// Unix time the map seed was last requested from the VRF oracle (0 = never). Lets
    /// `retry_match_seed` ask again if the oracle doesn't answer.
    pub seed_requested_at: i64,
    /// The game, a `civ_core::match_state::MatchState` byte for byte (filled at start_match).
    pub match_state: [u8; MATCH_STATE_BYTES],
    /// Each player's revealed compiled policy, padded with zeros.
    pub policies: [[u8; POLICY_SLOT_BYTES]; MAX_PLAYERS],
    /// How many bytes of each `policies` slot are the policy (0 = not revealed).
    pub policy_lengths: [u16; MAX_PLAYERS],
    /// How many players have joined.
    pub player_count: u8,
    /// How many players the lobby waits for (2 to 4).
    pub max_players: u8,
    /// A `MatchStatus`, as its byte.
    pub status: u8,
    /// The win metric, as its byte (see `win_metric_from_byte`).
    pub win_metric: u8,
    /// A `Payout`, as its byte.
    pub payout: u8,
    /// This account's PDA bump.
    pub bump: u8,
    /// The vault's PDA bump, used to sign transfers out of it.
    pub vault_bump: u8,
    /// Bit i set = player i has committed.
    pub committed_flags: u8,
    /// Bit i set = player i has revealed.
    pub revealed_flags: u8,
    /// Unused; always zero. Rounds the size up to a multiple of 8.
    pub reserved: [u8; 3],
}

impl Match {
    /// The match's status, or `None` if the stored byte is unknown (untrusted data).
    pub fn current_status(&self) -> Option<MatchStatus> {
        MatchStatus::from_byte(self.status)
    }

    /// True once `max_players` players have joined.
    pub fn is_full(&self) -> bool {
        self.player_count >= self.max_players
    }

    /// The players who joined, in join order.
    pub fn joined_players(&self) -> &[Pubkey] {
        let count = usize::from(self.player_count).min(MAX_PLAYERS);
        // Can't go out of range: count is at most MAX_PLAYERS.
        &self.players[..count]
    }

    /// True if `wallet` has joined this match.
    pub fn has_joined(&self, wallet: &Pubkey) -> bool {
        self.joined_players().contains(wallet)
    }

    /// The seat (0..4) of `wallet`, or `None` if it hasn't joined.
    pub fn seat_of(&self, wallet: &Pubkey) -> Option<usize> {
        // `.position(...)` is like `findIndex` in TypeScript, but returns None instead of -1.
        self.joined_players()
            .iter()
            .position(|player| player == wallet)
    }

    /// True if the player in `seat` has committed.
    pub fn has_committed(&self, seat: usize) -> bool {
        is_flag_set(self.committed_flags, seat)
    }

    /// True if the player in `seat` has revealed.
    pub fn has_revealed(&self, seat: usize) -> bool {
        is_flag_set(self.revealed_flags, seat)
    }

    /// True once every joined player has revealed.
    pub fn has_everyone_revealed(&self) -> bool {
        let seats = usize::from(self.player_count).min(MAX_PLAYERS);
        (0..seats).all(|seat| self.has_revealed(seat))
    }

    /// True once every joined player has committed.
    pub fn has_everyone_committed(&self) -> bool {
        let seats = usize::from(self.player_count).min(MAX_PLAYERS);
        (0..seats).all(|seat| self.has_committed(seat))
    }

    /// The game as a read-only `MatchState`. `None` if the bytes aren't 4-byte aligned.
    pub fn game(&self) -> Option<&MatchState> {
        bytemuck::try_from_bytes::<MatchState>(&self.match_state).ok()
    }

    /// The game as a `MatchState`, in place. `None` if the bytes aren't 4-byte aligned (Solana
    /// aligns account data to 8, so this is checked rather than assumed).
    pub fn game_mut(&mut self) -> Option<&mut MatchState> {
        bytemuck::try_from_bytes_mut::<MatchState>(&mut self.match_state).ok()
    }
}

/// True if bit `seat` of `flags` is set (bit 0 = seat 0).
fn is_flag_set(flags: u8, seat: usize) -> bool {
    let Ok(shift) = u32::try_from(seat) else {
        return false;
    };
    flags
        .checked_shr(shift)
        .is_some_and(|shifted| shifted & 1 == 1)
}
