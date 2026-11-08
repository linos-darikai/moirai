// The secret part of a commitment, kept in this browser: the compiled policy and its salt. A
// player needs both to reveal; without the salt nobody (not even the player) can prove what they
// committed to. Stored per match and wallet. Storage can be blocked (private windows), so every
// read and write is guarded; the Lobby page warns players to keep this browser.

/** What a player must keep between commit and reveal. */
export type SavedCommitment = {
  /** The compiled policy bytes, as hex. */
  policyHex: string;
  /** The 32-byte salt, as hex. */
  saltHex: string;
  /** The name of the policy draft that was committed (shown on the page). */
  policyName: string;
};

function storageKey(match: string, wallet: string): string {
  return `moirai.commitment.${match}.${wallet}`;
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/** Saves the commitment's secret. Returns false if this browser couldn't store it. */
export function saveCommitment(match: string, wallet: string, saved: SavedCommitment): boolean {
  try {
    window.localStorage.setItem(storageKey(match, wallet), JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

/** The saved secret for this match and wallet, or null if this browser doesn't have it. */
export function loadCommitment(match: string, wallet: string): SavedCommitment | null {
  try {
    const text = window.localStorage.getItem(storageKey(match, wallet));
    if (text === null) return null;
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { policyHex, saltHex, policyName } = parsed as Record<string, unknown>;
    if (typeof policyHex !== "string" || typeof saltHex !== "string" || typeof policyName !== "string") return null;
    return { policyHex, saltHex, policyName };
  } catch {
    return null;
  }
}
