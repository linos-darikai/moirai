// Integration tests for advance_turn (Phase 2): the whole flow on chain. Four players join, commit
// and reveal the four sample bots, the match starts from seed 42, and 60 advance_turn calls play
// it out. Records the compute units of every turn (docs/decisions/0009) and checks the final game
// is byte-for-byte the one native Rust and WASM reach (the Phase 1 gate fingerprint).
// Needs a local-testing build to start the match: run with `pnpm test:program`.

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { randomBytes } from "node:crypto";
import {
  ENTRY_FEE,
  KeypairType,
  PublicKeyType,
  commitmentOf,
  compiledBot,
  connection,
  createLobby,
  failure,
  fingerprint,
  fundedPlayer,
  join,
  program,
} from "./support/chain";

const { ComputeBudgetProgram } = anchor.web3;

/** The CU limit clients ask for: about 4.5 × the heaviest turn measured (docs/decisions/0009). */
const ADVANCE_TURN_COMPUTE_UNITS = 400_000;
/** Final fingerprint of the sample match for seed 42 (crates/civ-core/tests/sample_bots_match.rs). */
const NATIVE_MATCH_FINGERPRINT_FOR_SEED_42 = 13_451_523_736_825_787_217n;
const SAMPLE_BOTS = ["turtle", "raider", "trader", "expander"];
const TOTAL_TURNS = 60;
/** 4 × 0.1 SOL pot × 1.5% ÷ 60 turns (programs/civ/src/crank.rs). */
const CRANK_REWARD = (4 * ENTRY_FEE * 150) / 10_000 / TOTAL_TURNS;

/** A started 4-player match whose players revealed the sample bots, in join order. */
async function startedSampleMatch(): Promise<PublicKeyType> {
  const players: KeypairType[] = [];
  for (const _ of SAMPLE_BOTS) players.push(await fundedPlayer());
  const lobby = await createLobby(4);
  const policies = SAMPLE_BOTS.map(compiledBot);
  const salts = SAMPLE_BOTS.map(() => randomBytes(32));

  for (const player of players) await join(lobby.match, player);
  for (const [seat, player] of players.entries()) {
    await program.methods
      .commitPolicy(commitmentOf(policies[seat], salts[seat]))
      .accounts({ player: player.publicKey, matchAccount: lobby.match })
      .signers([player])
      .rpc();
  }
  for (const [seat, player] of players.entries()) {
    await program.methods
      .revealPolicy(policies[seat], Array.from(salts[seat]))
      .accounts({ player: player.publicKey, matchAccount: lobby.match })
      .signers([player])
      .rpc();
  }
  await program.methods
    .startMatchLocalTest(Array.from({ length: 32 }, () => 42))
    .accounts({ matchAccount: lobby.match })
    .rpc();
  return lobby.match;
}

/** Sends advance_turn and returns the compute units it used. */
async function advance(match: PublicKeyType): Promise<number> {
  const signature = await program.methods
    .advanceTurn()
    .accounts({ matchAccount: match })
    .preInstructions([
      ComputeBudgetProgram.setComputeUnitLimit({
        units: ADVANCE_TURN_COMPUTE_UNITS,
      }),
    ])
    .rpc();
  const transaction = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  return transaction?.meta?.computeUnitsConsumed ?? -1;
}

describe("advance turn", () => {
  let match: PublicKeyType;
  const unitsPerTurn: number[] = [];

  before(async () => {
    match = await startedSampleMatch();
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
