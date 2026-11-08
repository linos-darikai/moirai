// Integration tests for advance_turn (Phase 2): the whole flow on chain. Four players join, commit
// and reveal the four sample bots, the match starts from seed 42, and the advance_turn calls play
// it out. Records the compute units of every turn (docs/decisions/0009) and checks the final game
// is byte-for-byte the one native Rust and WASM reach (the Phase 1 gate fingerprint).
// Needs a local-testing build to start the match: run with `pnpm test:program`.

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  ADVANCE_TURN_COMPUTE_UNITS,
  ENTRY_FEE,
  PublicKeyType,
  advance,
  connection,
  createLobby,
  failure,
  fingerprint,
  program,
  startedSampleMatch,
} from "./support/chain";

/** Final fingerprint of the sample match for seed 42 (crates/civ-core/tests/sample_bots_match.rs). */
const NATIVE_MATCH_FINGERPRINT_FOR_SEED_42 = 16_939_628_229_789_221_347n;
const TOTAL_TURNS = 120;
/** 4 × 0.1 SOL pot × 1.5% ÷ 120 turns (programs/civ/src/crank.rs). */
const CRANK_REWARD = (4 * ENTRY_FEE * 150) / 10_000 / TOTAL_TURNS;

describe("advance turn", () => {
  let match: PublicKeyType;
  const unitsPerTurn: number[] = [];

  before(async () => {
    match = (await startedSampleMatch()).match;
  });

  it("plays 60 turns, each well within the compute budget, paying the crank every turn", async () => {
    const vaultAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), match.toBuffer()],
      program.programId
    )[0];
    const vaultBefore = await connection.getBalance(vaultAddress);

    for (let turn = 0; turn < TOTAL_TURNS; turn++)
      unitsPerTurn.push(await advance(match));

    const most = Math.max(...unitsPerTurn);
    const average = Math.round(
      unitsPerTurn.reduce((sum, units) => sum + units, 0) / TOTAL_TURNS
    );
    console.log(
      `      advance_turn: first ${unitsPerTurn[0]} CU, average ${average} CU, most ${most} CU`
    );
    expect(most).to.be.lessThan(ADVANCE_TURN_COMPUTE_UNITS);
    expect(await connection.getBalance(vaultAddress)).to.equal(
      vaultBefore - TOTAL_TURNS * CRANK_REWARD
    );
  });

  it("ends in exactly the state native Rust and WASM reach", async () => {
    const stored = await program.account.match.fetch(match);

    expect(fingerprint(Uint8Array.from(stored.matchState))).to.equal(
      NATIVE_MATCH_FINGERPRINT_FOR_SEED_42
    );
  });

  it("refuses a turn after the last one", async () => {
    const result = await failure(() => advance(match));

    expect(result).to.contain("MatchOver");
  });

  it("refuses to play a match that hasn't started", async () => {
    const lobby = await createLobby(2);

    const result = await failure(() => advance(lobby.match));

    expect(result).to.contain("MatchNotRunning");
  });
});
