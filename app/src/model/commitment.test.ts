import { describe, expect, it } from "vitest";
import { SALT_BYTES, policyCommitment, randomSalt } from "./commitment";

/** sha256(b"moirai" || [7; 32]); programs/civ/src/commitment.rs tests the same value. */
const KNOWN_COMMITMENT_HEX = "dd24f52f86cd8acf2bca8144bf34b1e4a3efd5762a23c227582c0d3187399c4b";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("policyCommitment", () => {
  it("matches the program's commitment for the shared test vector", async () => {
    const policy = new TextEncoder().encode("moirai");
    const salt = new Uint8Array(SALT_BYTES).fill(7);

    const commitment = await policyCommitment(policy, salt);

    expect(toHex(commitment)).toBe(KNOWN_COMMITMENT_HEX);
  });

  it("makes a new 32-byte salt each time", () => {
    const first = randomSalt();
    const second = randomSalt();

    expect(first).toHaveLength(SALT_BYTES);
    expect(toHex(first)).not.toBe(toHex(second));
  });
});
