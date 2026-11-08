// Phase 0 spikes, run against DEVNET (not part of `anchor test`; it spends a little devnet SOL).
//
// Spike 1, rollup: delegate the Counter to a MagicBlock Ephemeral Rollup, increment it there, then
//   commit + undelegate and check the new count is back on Solana.
// Spike 2, VRF: request one random seed from MagicBlock's VRF oracle and wait for the callback.
//
// Run from the repo root (see README "Phase 0 spikes"):
//   pnpm spike:magicblock

import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";
import idl from "../../target/idl/civ.json";
import type { Civ } from "../../target/types/civ";

const { Connection, PublicKey } = anchor.web3;

// Endpoints. Base layer = Solana devnet through MagicBlock's RPC (see 0001-toolchain.md).
const BASE_RPC = process.env.BASE_RPC ?? "https://rpc.magicblock.app/devnet";
const ROUTER_RPC =
  process.env.ROUTER_RPC ?? "https://devnet-router.magicblock.app/";
// Europe ER by default (closest to the UK); override with ER_RPC=https://devnet-us.magicblock.app/
const ER_RPC = process.env.ER_RPC ?? "https://devnet-eu.magicblock.app/";

// MagicBlock program addresses (from the magicblock skill's resources.md).
const DELEGATION_PROGRAM_ID = new PublicKey(
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
);
// Base-layer VRF queue for devnet/mainnet (`vrf::consts::DEFAULT_QUEUE`).
const VRF_BASE_QUEUE = new PublicKey(
  "Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh"
);

const COUNTER_INCREMENTS_ON_ROLLUP = 3;
const POLL_INTERVAL_MS = 1_000;
const POLL_TIMEOUT_MS = 90_000;

/** Calls a JSON-RPC method directly (for router/ER methods web3.js doesn't wrap). */
async function callJsonRpc<T>(
  url: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await response.json()) as {
    result?: T;
    error?: { message: string };
  };
  if (body.error !== undefined) {
    throw new Error(`${method} failed: ${body.error.message}`);
  }
  return body.result as T;
}

/** Polls `check` until it returns true, or fails the test after POLL_TIMEOUT_MS. */
async function waitUntil(
  description: string,
  check: () => Promise<boolean>
): Promise<number> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    if (await check()) {
      return Date.now() - startedAt;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(
    `Timed out after ${POLL_TIMEOUT_MS} ms waiting for: ${description}`
  );
}

/** Which runtime a transaction ran on; decides which Explorer cluster its link opens. */
type Layer = "base" | "rollup";

/** Explorer link for a signature. Rollup transactions only exist on the rollup, so their link
 * opens Explorer with the rollup's RPC as a custom cluster. */
function explorerLink(signature: string, layer: Layer): string {
  if (layer === "rollup") {
    const customUrl = encodeURIComponent(ER_RPC);
    return `https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${customUrl}`;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/** Prints a step with how long it took, plus an Explorer link if it sent a transaction. */
function logStep(
  label: string,
  milliseconds: number,
  signature?: string,
  layer: Layer = "base"
): void {
  const link =
    signature === undefined ? "" : `  ${explorerLink(signature, layer)}`;
  console.log(`    ${label}: ${milliseconds} ms${link}`);
}

describe("Phase 0 MagicBlock spikes (devnet)", function () {
  this.timeout(10 * 60_000);

  // Signs with your Solana CLI wallet (ANCHOR_WALLET, default ~/.config/solana/id.json).
  const wallet = anchor.Wallet.local();
  const baseConnection = new Connection(BASE_RPC, "confirmed");
  const erConnection = new Connection(ER_RPC, "confirmed");
  const baseProgram = new Program<Civ>(
    idl as Civ,
    new anchor.AnchorProvider(baseConnection, wallet, {
      commitment: "confirmed",
    })
  );
  const erProgram = new Program<Civ>(
    idl as Civ,
    new anchor.AnchorProvider(erConnection, wallet, { commitment: "confirmed" })
  );

  const [counterAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), wallet.publicKey.toBuffer()],
    baseProgram.programId
  );
  const [randomSeedAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("random_seed"), wallet.publicKey.toBuffer()],
    baseProgram.programId
  );

  before(async () => {
    const balance = await baseConnection.getBalance(wallet.publicKey);
    console.log(
      `    wallet ${wallet.publicKey.toBase58()}: ${balance / 1e9} SOL`
    );
    console.log(
      `    base ${BASE_RPC} | router ${ROUTER_RPC} | rollup ${ER_RPC}`
    );
  });

  describe("Spike 1: Ephemeral Rollup delegation round trip", () => {
    let countBefore = 0;

    it("has a Counter on the base layer owned by our program", async () => {
      const existing = await baseProgram.account.counter.fetchNullable(
        counterAddress
      );
      if (existing === null) {
        await baseProgram.methods.initialize().rpc();
      }

      const counter = await baseProgram.account.counter.fetch(counterAddress);
      const accountInfo = await baseConnection.getAccountInfo(counterAddress);

      countBefore = counter.count.toNumber();
      expect(accountInfo?.owner.toBase58()).to.equal(
        baseProgram.programId.toBase58()
      );
      console.log(
        `    counter ${counterAddress.toBase58()} starts at ${countBefore}`
      );
    });

    it("delegates the Counter to the rollup (base layer)", async () => {
      // Ask the chosen ER for its validator identity and delegate to that validator.
      const identity = await callJsonRpc<{ identity: string }>(
        ER_RPC,
        "getIdentity",
        []
      );
      const startedAt = Date.now();

      const signature = await baseProgram.methods
        .delegateCounter()
        .accountsPartial({
          authority: wallet.publicKey,
          counter: counterAddress,
        })
        .remainingAccounts([
          {
            pubkey: new PublicKey(identity.identity),
            isSigner: false,
            isWritable: false,
          },
        ])
        .rpc();
      logStep("delegate (base)", Date.now() - startedAt, signature);

      const waitedMs = await waitUntil(
        "router reports the Counter as delegated",
        async () => {
          const status = await callJsonRpc<{ isDelegated: boolean }>(
            ROUTER_RPC,
            "getDelegationStatus",
            [counterAddress.toBase58()]
          );
          return status.isDelegated;
        }
      );
      logStep("router sees delegation", waitedMs);

      const baseOwner = (await baseConnection.getAccountInfo(counterAddress))
        ?.owner;
      expect(baseOwner?.toBase58()).to.equal(DELEGATION_PROGRAM_ID.toBase58());
    });

    it(`increments ${COUNTER_INCREMENTS_ON_ROLLUP} times inside the rollup`, async () => {
      await waitUntil("the rollup has cloned the Counter", async () => {
        const info = await erConnection.getAccountInfo(counterAddress);
        return info !== null && info.owner.equals(erProgram.programId);
      });

      for (let i = 0; i < COUNTER_INCREMENTS_ON_ROLLUP; i++) {
        const startedAt = Date.now();
        const signature = await erProgram.methods.increment().rpc();
        logStep(
          `increment ${i + 1} (rollup)`,
          Date.now() - startedAt,
          signature,
          "rollup"
        );
      }

      const rollupCounter = await erProgram.account.counter.fetch(
        counterAddress
      );
      expect(rollupCounter.count.toNumber()).to.equal(
        countBefore + COUNTER_INCREMENTS_ON_ROLLUP
      );
    });

    it("commits and undelegates, and the new count lands back on Solana", async () => {
      const startedAt = Date.now();
      const signature = await erProgram.methods.undelegateCounter().rpc();
      logStep(
        "undelegate (rollup)",
        Date.now() - startedAt,
        signature,
        "rollup"
      );

      const waitedMs = await waitUntil(
        "base layer owns the Counter again",
        async () => {
          const info = await baseConnection.getAccountInfo(counterAddress);
          return info !== null && info.owner.equals(baseProgram.programId);
        }
      );
      logStep("back on base layer", waitedMs);

      const baseCounter = await baseProgram.account.counter.fetch(
        counterAddress
      );
      expect(baseCounter.count.toNumber()).to.equal(
        countBefore + COUNTER_INCREMENTS_ON_ROLLUP
      );
    });
  });

  describe("Spike 2: VRF random seed", () => {
    it("requests a seed on the base layer and receives it through the oracle callback", async () => {
      const existing = await baseProgram.account.randomSeed.fetchNullable(
        randomSeedAddress
      );
      if (existing === null) {
        await baseProgram.methods.createRandomSeed().rpc();
      }

      const before = await baseProgram.account.randomSeed.fetch(
        randomSeedAddress
      );
      if (before.status.fulfilled !== undefined) {
        // Each wallet's spike seed can only be filled once (by design: one seed per match).
        console.log(
          `    already fulfilled earlier: ${Buffer.from(before.seed).toString(
            "hex"
          )}`
        );
        return;
      }

      const startedAt = Date.now();
      const signature = await baseProgram.methods
        .requestRandomSeed()
        .accountsPartial({
          authority: wallet.publicKey,
          oracleQueue: VRF_BASE_QUEUE,
        })
        .rpc();
      logStep("request (base)", Date.now() - startedAt, signature);

      const waitedMs = await waitUntil(
        "the VRF oracle callback fills the seed",
        async () => {
          const seed = await baseProgram.account.randomSeed.fetch(
            randomSeedAddress
          );
          return seed.status.fulfilled !== undefined;
        }
      );
      logStep("oracle callback landed", waitedMs);

      const after = await baseProgram.account.randomSeed.fetch(
        randomSeedAddress
      );
      const seedHex = Buffer.from(after.seed).toString("hex");
      console.log(
        `    seed: ${seedHex} (slot ${after.fulfilledSlot.toString()})`
      );
      expect(seedHex).to.not.equal("0".repeat(64));
    });
  });
});
