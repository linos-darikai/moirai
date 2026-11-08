//! Policy commitments (PLAN.md section 3): `sha256(compiled_policy_bytes || 32-byte salt)`.
//!
//! A player first commits only this hash, then reveals the bytes and the salt once everyone has
//! committed, so nobody can read another policy before locking in their own. The app computes the
//! same hash with Web Crypto (app/src/model/commitment.ts); both sides test against the same vector
//! below, so they can't drift apart.

use solana_sha256_hasher::hashv;

/// Length of the secret salt a player mixes into their commitment.
pub const SALT_BYTES: usize = 32;

/// The commitment for a compiled policy and a salt.
pub fn policy_commitment(policy: &[u8], salt: &[u8; SALT_BYTES]) -> [u8; 32] {
    // `hashv` hashes the pieces one after another, exactly like hashing them joined together.
    hashv(&[policy, salt]).to_bytes()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// sha256(b"moirai" || [7; 32]). The app's commitment test checks the same value.
    const KNOWN_COMMITMENT_HEX: &str =
        "dd24f52f86cd8acf2bca8144bf34b1e4a3efd5762a23c227582c0d3187399c4b";

    #[test]
    fn the_commitment_matches_the_shared_test_vector() {
        let commitment = policy_commitment(b"moirai", &[7; SALT_BYTES]);

        let hex: String = commitment
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect();
        assert_eq!(hex, KNOWN_COMMITMENT_HEX);
    }

    #[test]
    fn a_different_salt_gives_a_different_commitment() {
        assert_ne!(
            policy_commitment(b"moirai", &[7; SALT_BYTES]),
            policy_commitment(b"moirai", &[8; SALT_BYTES])
        );
    }
}
