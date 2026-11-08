//! MatchState: everything one match needs from turn to turn, in one plain-bytes struct: the seed,
//! the turn number, the market, every civ and the map.
//!
//! Plain bytes (`#[repr(C)]`, `Pod`, 1,264 bytes) so the program can keep the whole match in one
//! zero-copy account and hand `run_turn` a reference to it, without copying 1 KB onto the 4 KB SBF
//! stack (docs/decisions/0004). Natively and in WASM it is an ordinary value.

use bytemuck::{Pod, Zeroable};

use crate::civ::{Civ, CivId, MAX_CIVS};
use crate::map::{Map, TileCoordinate, FNV_OFFSET_BASIS, FNV_PRIME};
use crate::map_generation::MapGenerationError;
use crate::market::Market;
use crate::match_start::start_match;
use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};
use crate::rules::TOTAL_TURNS;

/// One match's whole state.
///
/// Field order keeps everything on its natural boundary with no hidden padding: 4 header bytes,
/// the 32-byte seed (ends at 36, a multiple of 4), then the 4-byte-aligned market and civs, then
/// the 1-byte-aligned map.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct MatchState {
    /// The next turn to play, starting at 0. The match is over at TOTAL_TURNS.
    pub turn: u16,
    /// How many civs play (1 to 4). Only `civs[..civ_count]` are used.
    civ_count: u8,
    /// Unused; always zero.
    reserved: u8,
    /// The match seed: every random roll comes from it (map, battles).
    seed: [u8; MATCH_SEED_LENGTH],
    /// The shared market.
    pub market: Market,
    /// Every civ, in join order. Slots past `civ_count` are unused.
    pub civs: [Civ; MAX_CIVS],
    /// The 16 x 16 map.
    pub map: Map,
}

impl MatchState {
    /// Turn 0 of a match for `civ_count` civs (1 to 4): the generated map, every civ with its
    /// capital, the opening market.
    ///
    /// Returns a 1.2 KB value: fine natively and in WASM. On chain use `start_into`.
    pub fn new(seed: &MatchSeed, civ_count: u8) -> Result<MatchState, MapGenerationError> {
        let mut state: MatchState = Zeroable::zeroed();
        state.start_into(seed, civ_count)?;
        Ok(state)
    }

    /// Writes turn 0 of a match into `self` (on chain: straight into the account's data).
    pub fn start_into(
        &mut self,
        seed: &MatchSeed,
        civ_count: u8,
    ) -> Result<(), MapGenerationError> {
        let count = usize::from(civ_count);
        // `get_mut(..count)` returns None instead of crashing when count is more than MAX_CIVS.
        let Some(civs) = self.civs.get_mut(..count) else {
            return Err(MapGenerationError::InvalidCivCount);
        };
        start_match(seed, &mut self.map, civs)?;

        self.turn = 0;
        self.civ_count = civ_count;
        self.reserved = 0;
        self.seed = seed.0;
        self.market = Market::OPENING;
        Ok(())
    }

    /// The match seed.
    pub fn seed(&self) -> MatchSeed {
        MatchSeed(self.seed)
    }

    /// How many civs play, never more than MAX_CIVS (account data is untrusted).
    pub fn civ_count(&self) -> usize {
        usize::from(self.civ_count).min(MAX_CIVS)
    }

    /// The civs that play, in join order.
    pub fn active_civs(&self) -> &[Civ] {
        // Slicing can't go out of range: civ_count() is at most MAX_CIVS.
        &self.civs[..self.civ_count()]
    }

    /// The civs that play, borrowed so the caller can change them.
    pub fn active_civs_mut(&mut self) -> &mut [Civ] {
        let count = self.civ_count();
        &mut self.civs[..count]
    }

    /// The map and the playing civs, both borrowed for changing at once (growth and elimination
    /// change both). Returns a pair because Rust lets one function hand out two separate borrows
    /// of different fields, but not two calls that each borrow the whole state.
    pub fn map_and_civs_mut(&mut self) -> (&mut Map, &mut [Civ]) {
        let count = self.civ_count();
        (&mut self.map, &mut self.civs[..count])
    }

    /// True once the last turn has been played, or at most one civ is left.
    pub fn is_finished(&self) -> bool {
        let mut civs_alive = 0;
        for civ in self.active_civs() {
            if civ.is_alive() {
                civs_alive += 1;
            }
        }
        self.turn >= TOTAL_TURNS || civs_alive <= 1
    }

    /// The owner of `tile`, a shortcut for policies and tests.
    pub fn owner_of(&self, tile: TileCoordinate) -> Option<CivId> {
        self.map.tile(tile).owner()
    }

    /// A 64-bit hash of every byte of the state. Two runs of the same match must give the same
    /// fingerprint natively, in WASM and on chain (the determinism tests compare these).
    pub fn fingerprint(&self) -> u64 {
        let mut hash: u64 = FNV_OFFSET_BASIS;
        // `bytes_of` views the struct as its raw bytes; Pod guarantees there are no padding bytes.
        for byte in bytemuck::bytes_of(self) {
            hash ^= u64::from(*byte);
            // Wrapping multiply is part of the FNV definition, not an accident.
            hash = hash.wrapping_mul(FNV_PRIME);
        }
        hash
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn seed() -> MatchSeed {
        MatchSeed([42; MATCH_SEED_LENGTH])
    }

    #[test]
    fn a_new_match_starts_on_turn_zero_with_every_civ_alive() {
        let state = MatchState::new(&seed(), 4).expect("valid count");

        assert_eq!(state.turn, 0);
        assert_eq!(state.active_civs().len(), 4);
        assert!(state.active_civs().iter().all(|civ| civ.is_alive()));
        assert_eq!(state.market, Market::OPENING);
        assert!(!state.is_finished());
    }

    #[test]
    fn a_two_civ_match_uses_only_two_civ_slots() {
        let state = MatchState::new(&seed(), 2).expect("valid count");

        assert_eq!(state.active_civs().len(), 2);
    }

    #[test]
    fn more_than_four_civs_is_rejected() {
        let result = MatchState::new(&seed(), 5);

        assert_eq!(result, Err(MapGenerationError::InvalidCivCount));
    }

    #[test]
    fn the_match_is_finished_after_the_last_turn_or_with_one_civ_left() {
        let mut out_of_turns = MatchState::new(&seed(), 2).expect("valid count");
        let mut last_one_standing = MatchState::new(&seed(), 2).expect("valid count");

        out_of_turns.turn = TOTAL_TURNS;
        last_one_standing.civs[1].set_alive(false);

        assert!(out_of_turns.is_finished());
        assert!(last_one_standing.is_finished());
    }

    #[test]
    fn the_same_seed_gives_the_same_fingerprint() {
        let first = MatchState::new(&seed(), 4).expect("valid count");
        let second = MatchState::new(&seed(), 4).expect("valid count");

        assert_eq!(first.fingerprint(), second.fingerprint());
    }

    #[test]
    fn a_match_state_is_1264_plain_bytes() {
        // The on-chain match account's size depends on this.
        // 4 header + 32 seed + 12 market + 4 civs x 112 + 768 map.
        assert_eq!(std::mem::size_of::<MatchState>(), 1_264);
    }
}
