//! Deterministic randomness for the game. Every "random" choice (where deposits go, who wins a
//! close battle) comes from here, computed from the match seed. The same seed always gives the same
//! numbers on chain, in the browser (WASM) and natively, so anyone can replay a match.
//!
//! There is no random-number generator with hidden state: each value is a pure hash of
//! (seed, purpose, first, second), the `hash(seed, turn, tile)` idea in PLAN.md section 4.

/// Length of a match seed in bytes. The program gets it from the MagicBlock VRF oracle.
pub const MATCH_SEED_LENGTH: usize = 32;

/// The 32 random bytes that decide everything random in one match.
///
/// `#[derive(...)]` asks Rust to write common helpers for us: `Clone`/`Copy` (copy it freely, like
/// a number), `PartialEq`/`Eq` (compare with `==`), `Debug` (print it in test failures).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct MatchSeed(pub [u8; MATCH_SEED_LENGTH]);

/// What a random number is for. Mixing the purpose in means, for example, that the number used to
/// decide "is there a deposit on tile 5?" is unrelated to "which resource is on tile 5?".
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum RandomPurpose {
    /// Whether a tile gets a resource deposit.
    DepositPresence = 1,
    /// Which resource a deposit holds.
    DepositResource = 2,
    /// Where the city sites in a map quarter go.
    CitySite = 3,
}

/// Source of random numbers for one match. Create it once from the seed and reuse it: the 32-byte
/// seed is folded into one number up front, so each draw only costs three cheap mixing steps
/// (this matters on chain, where every instruction costs compute units).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct MatchRandom {
    folded_seed: u64,
}

impl MatchRandom {
    /// Prepares the random source for `seed`.
    pub fn new(seed: &MatchSeed) -> MatchRandom {
        MatchRandom {
            folded_seed: fold_seed(seed),
        }
    }

    /// Returns a 64-bit number decided entirely by the seed and these inputs.
    ///
    /// `first` and `second` say which instance we need, e.g. (tile index, 0) for map generation
    /// or (turn, tile index) for a battle.
    pub fn next_u64(&self, purpose: RandomPurpose, first: u64, second: u64) -> u64 {
        let mut state: u64 = mix(self.folded_seed ^ purpose as u64);
        state = mix(state ^ first);
        state = mix(state ^ second);
        state
    }

    /// Returns a number from 0 up to (but not including) `bound`. Returns 0 if `bound` is 0.
    ///
    /// Uses `%`, which very slightly favours small results when `bound` doesn't divide 2^64
    /// evenly. For the small bounds in this game (3, 100, ...) the bias is below one in 10^16, far
    /// too small to matter.
    pub fn below(&self, purpose: RandomPurpose, first: u64, second: u64, bound: u64) -> u64 {
        if bound == 0 {
            return 0;
        }
        self.next_u64(purpose, first, second) % bound
    }
}

/// Squashes the 32-byte seed into one 64-bit number, mixing after each 8-byte chunk so every byte
/// affects the result.
fn fold_seed(seed: &MatchSeed) -> u64 {
    let mut folded: u64 = 0;
    // `chunks_exact(8)` walks the 32 bytes as four 8-byte pieces.
    for chunk in seed.0.chunks_exact(8) {
        let mut chunk_bytes: [u8; 8] = [0; 8];
        chunk_bytes.copy_from_slice(chunk);
        folded = mix(folded ^ u64::from_le_bytes(chunk_bytes));
    }
    folded
}

/// The SplitMix64 mixing function: scrambles a 64-bit number so that changing one input bit
/// changes about half the output bits. A small, well-known function that is identical on every
/// platform.
///
/// It deliberately uses `wrapping_add` / `wrapping_mul`: arithmetic that wraps around past the
/// maximum, which is exactly defined and the whole point of a hash. Game rules elsewhere use
/// checked or saturating arithmetic instead.
fn mix(value: u64) -> u64 {
    let mut scrambled: u64 = value.wrapping_add(0x9E37_79B9_7F4A_7C15);
    scrambled = (scrambled ^ (scrambled >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
    scrambled = (scrambled ^ (scrambled >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
    scrambled ^ (scrambled >> 31)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SEED_A: MatchSeed = MatchSeed([7; MATCH_SEED_LENGTH]);
    const SEED_B: MatchSeed = MatchSeed([8; MATCH_SEED_LENGTH]);

    #[test]
    fn the_same_inputs_always_give_the_same_number() {
        let random = MatchRandom::new(&SEED_A);

        let first_call = random.next_u64(RandomPurpose::DepositPresence, 5, 0);
        let second_call = MatchRandom::new(&SEED_A).next_u64(RandomPurpose::DepositPresence, 5, 0);

        assert_eq!(first_call, second_call);
    }

    #[test]
    fn changing_any_input_changes_the_number() {
        let random_a = MatchRandom::new(&SEED_A);
        let random_b = MatchRandom::new(&SEED_B);

        let base = random_a.next_u64(RandomPurpose::DepositPresence, 5, 0);

        assert_ne!(
            base,
            random_b.next_u64(RandomPurpose::DepositPresence, 5, 0)
        );
        assert_ne!(
            base,
            random_a.next_u64(RandomPurpose::DepositResource, 5, 0)
        );
        assert_ne!(
            base,
            random_a.next_u64(RandomPurpose::DepositPresence, 6, 0)
        );
        assert_ne!(
            base,
            random_a.next_u64(RandomPurpose::DepositPresence, 5, 1)
        );
    }

    #[test]
    fn below_stays_under_the_bound() {
        let random = MatchRandom::new(&SEED_A);

        for tile_index in 0..1_000 {
            let value = random.below(RandomPurpose::DepositResource, tile_index, 0, 3);

            assert!(value < 3);
        }
    }

    #[test]
    fn below_zero_returns_zero_instead_of_crashing() {
        let random = MatchRandom::new(&SEED_A);

        let value = random.below(RandomPurpose::DepositResource, 1, 0, 0);

        assert_eq!(value, 0);
    }

    #[test]
    fn a_known_input_always_gives_the_same_known_output() {
        // Locks the exact algorithm: if this number ever changes, old matches would replay
        // differently. Only update it on purpose, with a decision note.
        let value = MatchRandom::new(&SEED_A).next_u64(RandomPurpose::DepositPresence, 5, 0);

        assert_eq!(value, KNOWN_OUTPUT_FOR_SEED_A);
    }

    const KNOWN_OUTPUT_FOR_SEED_A: u64 = 10_090_202_412_961_694_487;
}
