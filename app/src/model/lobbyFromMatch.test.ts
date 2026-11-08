import { describe, expect, it } from "vitest";
import type { MatchAccountView } from "../types/chain";
import { countdown, lobbySeatsFromMatch, lobbySummaryFromMatch, nextLobbyStep } from "./lobbyFromMatch";

const NOW = 1_000_000;
const ALICE = "AL1CEaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const BOB = "B0Bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

/** A 2-seat lobby with deadlines 10, 20 and 30 minutes away; override what a test needs. */
function lobby(overrides: Partial<MatchAccountView> = {}): MatchAccountView {
  return {
    address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    creator: ALICE,
    players: [],
    maxPlayers: 2,
    entryFeeLamports: 100_000_000,
    joinDeadline: NOW + 600,
    commitDeadline: NOW + 1_200,
    revealDeadline: NOW + 1_800,
    seedRequestedAt: 0,
    status: "open",
    winMetric: "territory",
    payout: "winnerTakesAll",
    committed: [],
    revealed: [],
    commitments: [],
    turn: 0,
    vaultLamports: 890_880,
    ...overrides,
  };
}

/** A full lobby where Alice and Bob joined, with their commit/reveal flags. */
function fullLobby(committed: boolean[], revealed: boolean[], overrides: Partial<MatchAccountView> = {}) {
  return lobby({ players: [ALICE, BOB], committed, revealed, commitments: committed.map((done) => (done ? "ab".repeat(32) : "")), ...overrides });
}

describe("lobbySummaryFromMatch", () => {
  it("shows the lobby with its short label, fee, pool and time left", () => {
    const summary = lobbySummaryFromMatch(lobby({ players: [ALICE] }), NOW);

    expect(summary).toMatchObject({ label: "#9xQe", entryFeeSol: 0.1, poolSol: 0.1, joinedCount: 1, seatCount: 2, closesInMinutes: 10 });
  });

  it("calls a free lobby a practice lobby", () => {
    expect(lobbySummaryFromMatch(lobby({ entryFeeLamports: 0 }), NOW).payout).toBe("practice");
  });
});

describe("lobbySeatsFromMatch", () => {
  it("lists joined seats, marks yours, and leaves the rest open", () => {
    const seats = lobbySeatsFromMatch(fullLobby([true, false], [false, false]), BOB);

    expect(seats.map((seat) => [seat.hasJoined, seat.hasCommitted, seat.isYou])).toEqual([
      [true, true, false],
      [true, false, true],
    ]);
    expect(seats[0]?.policyHash).toBe("abab…abab");
  });
});

describe("nextLobbyStep", () => {
  it("asks to connect, then to join, then to commit", () => {
    expect(nextLobbyStep(lobby(), null, NOW)).toBe("connect");
    expect(nextLobbyStep(lobby(), ALICE, NOW)).toBe("join");
    expect(nextLobbyStep(lobby({ players: [ALICE], committed: [false], revealed: [false] }), ALICE, NOW)).toBe("commit");
  });

  it("waits for the others, then reveals once everyone committed", () => {
    expect(nextLobbyStep(fullLobby([true, false], [false, false]), ALICE, NOW)).toBe("waitForCommits");
    expect(nextLobbyStep(fullLobby([true, true], [false, false]), ALICE, NOW)).toBe("reveal");
    expect(nextLobbyStep(fullLobby([true, true], [true, false]), ALICE, NOW)).toBe("waitForReveals");
  });

  it("lets anyone start once everyone revealed or the reveal deadline passed", () => {
    expect(nextLobbyStep(fullLobby([true, true], [true, true]), null, NOW)).toBe("start");
    expect(nextLobbyStep(fullLobby([true, true], [true, false]), null, NOW + 1_801)).toBe("start");
  });

  it("offers a refund once an unfilled lobby's join deadline has passed", () => {
    expect(nextLobbyStep(lobby({ players: [ALICE] }), null, NOW + 601)).toBe("cancel");
  });

  it("waits for the seed, and offers a retry after the oracle's timeout", () => {
    const requested = lobby({ status: "seedRequested", seedRequestedAt: NOW });

    expect(nextLobbyStep(requested, null, NOW + 5)).toBe("waitForSeed");
    expect(nextLobbyStep(requested, null, NOW + 121)).toBe("retrySeed");
  });

  it("plays the turns, then settles, then the lobby is closed", () => {
    expect(nextLobbyStep(lobby({ status: "running", turn: 12 }), null, NOW)).toBe("play");
    expect(nextLobbyStep(lobby({ status: "running", turn: 120 }), null, NOW)).toBe("settle");
    expect(nextLobbyStep(null, null, NOW)).toBe("closed");
  });
});

describe("countdown", () => {
  it("shows minutes and seconds left, never below zero", () => {
    expect(countdown(NOW + 125, NOW)).toBe("02:05");
    expect(countdown(NOW - 5, NOW)).toBe("00:00");
  });
});
