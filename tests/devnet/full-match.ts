// A whole match on DEVNET with the real program and the real VRF oracle (not part of
// `anchor test`; it spends devnet SOL: about 0.05 SOL for players and fees, plus small rents that
// come back when the match closes).
//
// Two fresh wallets, funded from your CLI wallet, play turtle vs raider:
// create_match -> join x2 -> commit x2 -> reveal x2 -> start_match (VRF) -> wait for the seed
// (retry_match_seed if the oracle is slow) -> 60 x advance_turn -> settle_match.
// Prints timings, compute units, the seed, payouts and Elo, and checks the final game matches a
// native replay of the same seed (`civ play <seed-hex> turtle raider`).
//
// Run from the repo root (after deploying the program to devnet):
//   pnpm devnet:match
// Resume a match that stopped partway (anyone may advance and settle a match):
//   MATCH=<match address> pnpm devnet:match

import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import idl from "../../target/idl/civ.json";
import type { Civ } from "../../target/types/civ";

const {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} = anchor.web3;
type KeypairType = anchor.web3.Keypair;

const BASE_RPC = process.env.BASE_RPC ?? "https://rpc.magicblock.app/devnet";
/** Base-layer VRF queue for devnet/mainnet (`vrf::consts::DEFAULT_QUEUE`). */
const VRF_BASE_QUEUE = new PublicKey(
  "Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh"
);
const ENTRY_FEE = 0.01 * LAMPORTS_PER_SOL;
/** What each player wallet is funded with: entry fee + Profile rent + fees, with margin. */
const PLAYER_FUNDING = 0.03 * LAMPORTS_PER_SOL;
const BOTS = ["turtle", "raider"];
const TOTAL_TURNS = 60;
const RUNNING = 1;
/** programs/civ SEED_REQUEST_TIMEOUT_SECONDS, plus a little margin. */
const SEED_RETRY_AFTER_MS = 130_000;
const SEED_GIVE_UP_AFTER_MS = 300_000;
const ROOT = `${__dirname}/../..`;
/** How many times one turn is sent before giving up. */
const MAX_SEND_ATTEMPTS = 5;
/** A small priority fee so turns land on a busy devnet (same as the deploy command). */
const PRIORITY_FEE_MICRO_LAMPORTS = 10_000;

function compiledBot(name: string): Buffer {
  const hex = execFileSync(
    "cargo",
    ["run", "-q", "-p", "civ-cli", "--", "compile", `policies/${name}.yaml`],
    {
      cwd: ROOT,
      encoding: "utf8",
    }
  );
  return Buffer.from(hex.trim(), "hex");
}

/** FNV-1a: the same hash as civ-core's MatchState::fingerprint. */
function fingerprint(bytes: Uint8Array): bigint {
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes)
    hash = ((hash ^ BigInt(byte)) * 0x100000001b3n) & ((1n << 64n) - 1n);
  return hash;
}

function secondsSince(start: number): string {
  return `${((Date.now() - start) / 1000).toFixed(1)} s`;
}

describe("devnet: a whole match with the real VRF oracle", () => {
  const wallet = anchor.Wallet.local();
  const connection = new Connection(BASE_RPC, "confirmed");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program<Civ>(idl as Civ, provider);
  const players: KeypairType[] = BOTS.map(() => Keypair.generate());
  const policies = BOTS.map(compiledBot);
  const salts = BOTS.map(() => randomBytes(32));
  /** Set MATCH=<address> to resume an existing match instead of starting a new one. */
  const resumedMatch = process.env.MATCH;
  const setupStep = resumedMatch === undefined ? it : it.skip;
  const matchId = new anchor.BN(Date.now());
  const [newMatch] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("match"),
      wallet.publicKey.toBuffer(),
      matchId.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );
  const match =
    resumedMatch === undefined ? newMatch : new PublicKey(resumedMatch);
  const explorer = (signature: string) =>
    `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  const unitsPerTurn: number[] = [];

  async function unitsOf(signature: string): Promise<number> {
    const transaction = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    return transaction?.meta?.computeUnitsConsumed ?? -1;
  }

  setupStep("funds two fresh player wallets", async () => {
    const funding = new Transaction();
    for (const player of players) {
      funding.add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: player.publicKey,
          lamports: PLAYER_FUNDING,
        })
      );
    }
    await provider.sendAndConfirm(funding);
    console.log(
      `      players: ${players
        .map((player) => player.publicKey.toBase58())
        .join(", ")}`
    );
  });

  setupStep("opens a lobby, both players join, commit and reveal", async () => {
    const start = Date.now();
    const now = Math.floor(Date.now() / 1000);
    const create = await program.methods
      .createMatch(matchId, {
        entryFeeLamports: new anchor.BN(ENTRY_FEE),
        maxPlayers: BOTS.length,
        winMetric: 0,
        payout: 0,
        joinDeadline: new anchor.BN(now + 600),
        commitDeadline: new anchor.BN(now + 1200),
        revealDeadline: new anchor.BN(now + 1800),
      })
      .rpc();
    console.log(`      match ${match.toBase58()} created: ${explorer(create)}`);

    for (const player of players) {
      await program.methods
        .joinMatch()
        .accounts({ player: player.publicKey, matchAccount: match })
        .signers([player])
        .rpc();
    }
    for (const [seat, player] of players.entries()) {
      const commitment = Array.from(
        createHash("sha256").update(policies[seat]).update(salts[seat]).digest()
      );
      await program.methods
        .commitPolicy(commitment)
        .accounts({ player: player.publicKey, matchAccount: match })
        .signers([player])
        .rpc();
    }
    for (const [seat, player] of players.entries()) {
      await program.methods
        .revealPolicy(policies[seat], Array.from(salts[seat]))
        .accounts({ player: player.publicKey, matchAccount: match })
        .signers([player])
        .rpc();
    }
    console.log(
      `      lobby, 2 joins, 2 commits, 2 reveals: ${secondsSince(start)}`
    );
    const stored = await program.account.match.fetch(match);
    expect(stored.revealedFlags).to.equal(0b11);
  });

  setupStep("starts the match with a seed from the VRF oracle", async () => {
    const start = Date.now();
    const request = await program.methods
      .startMatch()
      .accountsPartial({ matchAccount: match, oracleQueue: VRF_BASE_QUEUE })
      .rpc();
    console.log(`      start_match (VRF request): ${explorer(request)}`);

    let hasRetried = false;
    for (;;) {
      const stored = await program.account.match.fetch(match);
      if (stored.status === RUNNING) break;
      const waited = Date.now() - start;
      if (waited > SEED_GIVE_UP_AFTER_MS)
        throw new Error(
          `no seed after ${secondsSince(start)} (status ${stored.status})`
        );
      if (!hasRetried && waited > SEED_RETRY_AFTER_MS) {
        const retry = await program.methods
          .retryMatchSeed()
          .accountsPartial({ matchAccount: match, oracleQueue: VRF_BASE_QUEUE })
          .rpc();
        console.log(`      oracle slow, retry_match_seed: ${explorer(retry)}`);
        hasRetried = true;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    const game = Buffer.from(
      (await program.account.match.fetch(match)).matchState
    );
    console.log(
      `      seed delivered after ${secondsSince(start)}: ${game
        .subarray(4, 36)
        .toString("hex")}`
    );
  });

  /** The turn the match is on (MatchState starts at byte 8 + 336 of the account; turn is its
   * first u16). */
  async function turnOnChain(): Promise<number> {
    const info = await connection.getAccountInfo(match, "confirmed");
    return info!.data.readUInt16LE(8 + 336);
  }

  /**
   * Plays exactly one turn. Under load devnet can drop a transaction; resending blindly could play
   * two turns if the first did land after all, so after a failure we re-read the turn and only send
   * again if it didn't move. Returns the compute units used (-1 if unknown).
   */
  async function advanceOneTurn(): Promise<number> {
    const turnBefore = await turnOnChain();
    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
      try {
        const signature = await program.methods
          .advanceTurn()
          .accounts({ matchAccount: match })
          .preInstructions([
            ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: PRIORITY_FEE_MICRO_LAMPORTS,
            }),
          ])
          .rpc();
        return await unitsOf(signature);
      } catch (error) {
        if ((await turnOnChain()) > turnBefore) return -1; // it landed after all
        console.log(
          `      turn ${turnBefore}: attempt ${attempt} failed (${String(
            error
          ).slice(0, 80)}), resending`
        );
      }
    }
    throw new Error(`turn ${turnBefore} failed ${MAX_SEND_ATTEMPTS} times`);
  }

  it("plays every remaining turn with advance_turn", async () => {
    const start = Date.now();
    const firstTurn = await turnOnChain();
    while ((await turnOnChain()) < TOTAL_TURNS)
      unitsPerTurn.push(await advanceOneTurn());

    const measured = unitsPerTurn.filter((units) => units > 0);
    const average = Math.round(
      measured.reduce((sum, units) => sum + units, 0) /
        Math.max(measured.length, 1)
    );
    console.log(
      `      turns ${firstTurn}-${TOTAL_TURNS} in ${secondsSince(start)} (${(
        (Date.now() - start) /
        1000 /
        Math.max(unitsPerTurn.length, 1)
      ).toFixed(2)} s a turn); CU average ${average}, most ${Math.max(
        ...measured
      )}`
    );
  });

  it("ends in the same state as a native replay of the same seed", async () => {
    const game = Buffer.from(
      (await program.account.match.fetch(match)).matchState
    );
    const seedHex = game.subarray(4, 36).toString("hex");
    const replay = execFileSync(
      "cargo",
      [
        "run",
        "-q",
        "-p",
        "civ-cli",
        "--",
        "play",
        seedHex,
        "--quiet",
        ...BOTS.map((bot) => `policies/${bot}.yaml`),
      ],
      { cwd: ROOT, encoding: "utf8" }
    );
    const nativeFingerprint = BigInt(
      /fingerprint (\d+)/.exec(replay)?.[1] ?? "0"
    );
    console.log(
      `      on chain ${fingerprint(game)}, native replay ${nativeFingerprint}`
    );
    console.log(
      replay
        .split("\n")
        .filter((line) => line.includes("winner"))
        .map((line) => `      ${line}`)
        .join("\n")
    );

    expect(fingerprint(game)).to.equal(nativeFingerprint);
  });

  it("settles: pays the winner and updates Profiles", async () => {
    // The players' wallets come from the match itself, so this works when resuming too.
    const stored = await program.account.match.fetch(match);
    const wallets = stored.players.slice(0, stored.playerCount);
    const before = await Promise.all(
      wallets.map((wallet) => connection.getBalance(wallet))
    );
    const signature = await program.methods
      .settleMatch()
      .accounts({ matchAccount: match })
      .remainingAccounts(
        wallets.flatMap((wallet) => [
          { pubkey: wallet, isSigner: false, isWritable: true },
          {
            pubkey: PublicKey.findProgramAddressSync(
              [Buffer.from("profile"), wallet.toBuffer()],
              program.programId
            )[0],
            isSigner: false,
            isWritable: true,
          },
        ])
      )
      .rpc();
    console.log(
      `      settle_match: ${explorer(signature)} (${await unitsOf(
        signature
      )} CU)`
    );

    const after = await Promise.all(
      wallets.map((wallet) => connection.getBalance(wallet))
    );
    for (const [seat, wallet] of wallets.entries()) {
      const profile = await program.account.profile.fetch(
        PublicKey.findProgramAddressSync(
          [Buffer.from("profile"), wallet.toBuffer()],
          program.programId
        )[0]
      );
      console.log(
        `      ${BOTS[seat]}: won ${
          (after[seat] - before[seat]) / LAMPORTS_PER_SOL
        } SOL, Elo ${profile.elo}, wins ${profile.wins}`
      );
    }
    expect(await connection.getAccountInfo(match)).to.equal(null);
  });
});
