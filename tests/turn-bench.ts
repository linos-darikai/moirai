// Phase 2 measuring spike (docs/decisions/0009): plays the 60-turn sample-bot match on chain with
// civ-core's play_turn and records the compute units of every turn. Also checks the final state
// is byte-for-byte the one native Rust and WASM reach (the Phase 1 gate fingerprint), so the
// program can never disagree with the browser.

import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";
import { execFileSync } from "node:child_process";
import idl from "../target/idl/civ.json";
import type { Civ } from "../target/types/civ";

const { PublicKey, ComputeBudgetProgram } = anchor.web3;

const TURN_BENCH_SEED = Buffer.from("turn_bench");
/** The most compute units one transaction may ask for. */
const MAX_COMPUTE_UNITS = 1_400_000;
/** Where the MatchState bytes start in the account: 8-byte discriminator + 32-byte authority. */
const MATCH_STATE_OFFSET = 8 + 32;
const MATCH_STATE_BYTES = 1_264;
/** The final fingerprint of the sample match for seed 42 (crates/civ-core/tests/sample_bots_match.rs). */
const NATIVE_MATCH_FINGERPRINT_FOR_SEED_42 = 13_451_523_736_825_787_217n;
const SAMPLE_BOTS = ["turtle", "raider", "trader", "expander"];
const TOTAL_TURNS = 60;

/** Compiles a sample bot with civ-cli (`civ compile`), which prints the bytes as hex. */
function compiledBot(name: string): Buffer {
  const hex = execFileSync(
    "cargo",
    ["run", "-q", "-p", "civ-cli", "--", "compile", `policies/${name}.yaml`],
    {
      cwd: `${__dirname}/..`,
      encoding: "utf8",
    }
  );
  return Buffer.from(hex.trim(), "hex");
}

/** FNV-1a over the bytes, the same hash as civ-core's MatchState::fingerprint. */
function fingerprint(bytes: Uint8Array): bigint {
  const prime = 0x100000001b3n;
  const mask = (1n << 64n) - 1n;
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & mask;
  }
  return hash;
}

describe("on-chain turn (measuring spike)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new Program<Civ>(idl as Civ, provider);
  const authority = provider.wallet.publicKey;
  const [benchAddress] = PublicKey.findProgramAddressSync(
    [TURN_BENCH_SEED, authority.toBuffer()],
    program.programId
  );
  const computeUnitsPerTurn: number[] = [];

  /** Sends one instruction with the largest compute budget and returns the units it used. */
  async function unitsUsed(builder: {
    rpc: () => Promise<string>;
  }): Promise<number> {
    const signature = await builder.rpc();
    const transaction = await provider.connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    return transaction?.meta?.computeUnitsConsumed ?? -1;
  }

  const bigBudget = ComputeBudgetProgram.setComputeUnitLimit({
    units: MAX_COMPUTE_UNITS,
  });

  it("starts a 4-civ match in one account", async () => {
    const seed = Array.from({ length: 32 }, () => 42);

    const units = await unitsUsed(
      program.methods.benchCreate(seed, 4).preInstructions([bigBudget])
    );

    console.log(`      bench_create (map + 4 civs): ${units} CU`);
    expect(units).to.be.greaterThan(0);
  });

  it("stores the four sample bots", async () => {
    for (const [index, name] of SAMPLE_BOTS.entries()) {
      const units = await unitsUsed(
        program.methods.benchSetPolicy(index, compiledBot(name))
      );

      console.log(`      bench_set_policy ${name}: ${units} CU`);
    }
  });

  it("plays 60 turns, each within one transaction's compute budget", async () => {
    for (let turn = 0; turn < TOTAL_TURNS; turn++) {
      const units = await unitsUsed(
        program.methods
          .benchTurn()
          .accounts({ bench: benchAddress })
          .preInstructions([bigBudget])
      );
      computeUnitsPerTurn.push(units);
    }

    const most = Math.max(...computeUnitsPerTurn);
    const average = Math.round(
      computeUnitsPerTurn.reduce((sum, units) => sum + units, 0) / TOTAL_TURNS
    );
    console.log(
      `      turns: first ${computeUnitsPerTurn[0]} CU, average ${average} CU, most ${most} CU`
    );
    console.log(`      every turn: ${computeUnitsPerTurn.join(", ")}`);
    expect(most).to.be.lessThan(MAX_COMPUTE_UNITS);
  });

  it("ends in exactly the state native Rust reaches", async () => {
    const account = await provider.connection.getAccountInfo(benchAddress);
    const matchBytes = account!.data.subarray(
      MATCH_STATE_OFFSET,
      MATCH_STATE_OFFSET + MATCH_STATE_BYTES
    );

    expect(fingerprint(matchBytes)).to.equal(
      NATIVE_MATCH_FINGERPRINT_FOR_SEED_42
    );
  });

  it("refuses a turn after the last one", async () => {
    let message = "";

    try {
      await program.methods.benchTurn().accounts({ bench: benchAddress }).rpc();
    } catch (error) {
      message = String(error);
    }

    expect(message).to.contain("BenchMatchOver");
  });
});
