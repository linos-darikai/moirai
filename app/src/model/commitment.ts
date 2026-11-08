// Policy commitments (PLAN.md section 3): sha256(compiled_policy_bytes || 32-byte salt). The
// program computes the same hash in programs/civ/src/commitment.rs when a player reveals; both
// sides test the same vector, so they can never disagree. Pure: no React, no Solana.

/** Length of the secret salt mixed into a commitment. */
export const SALT_BYTES = 32;

/** A fresh random salt. Keep it secret until you reveal: anyone with it can check your policy. */
export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

/** The commitment for compiled policy bytes and a salt. */
export async function policyCommitment(policy: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
  const joined = new Uint8Array(policy.length + salt.length);
  joined.set(policy, 0);
  joined.set(salt, policy.length);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", joined));
}
