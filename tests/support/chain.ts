// Shared helpers for the integration tests: the program client, the chain clock (with surfpool's
// time travel), funded players, lobbies, and reading an error from a failed call.
// Lives in support/ so the test runner (which loads ./*.ts) doesn't run it as a test file.

import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import idl from "../../target/idl/civ.json";
import type { Civ } from "../../target/types/civ";

const { PublicKey, Keypair, LAMPORTS_PER_SOL } = anchor.web3;
export type PublicKeyType = anchor.web3.PublicKey;
export type KeypairType = anchor.web3.Keypair;

export const MATCH_SEED = Buffer.from("match");
export const VAULT_SEED = Buffer.from("vault");
export const ENTRY_FEE = 0.1 * LAMPORTS_PER_SOL;

export const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
export const program = new Program<Civ>(idl as Civ, provider);
export const connection = provider.connection;
/** The CLI wallet `anchor test` uses; it creates every lobby. */
export const creator = provider.wallet.publicKey;

let nextMatchId = Date.now();

/** The chain's current unix time, read from the Clock sysvar: the same value the program sees.
 * (surfpool's clock runs faster than real time, so this computer's clock can't be used.) */
export async function chainNow(): Promise<number> {
  const clock = await connection.getAccountInfo(
    anchor.web3.SYSVAR_CLOCK_PUBKEY,
    "processed"
  );
  // Clock layout: slot u64, epoch_start_timestamp i64, epoch u64, leader_schedule_epoch u64,
  // unix_timestamp i64 (at byte 32).
  return Number(clock!.data.readBigInt64LE(32));
}

/** Asks surfpool to jump the chain's clock (its `surfnet_timeTravel` cheatcode). */
async function timeTravel(absoluteTimestamp: number): Promise<void> {
  await fetch(connection.rpcEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "surfnet_timeTravel",
      params: [{ absoluteTimestamp }],
    }),
  });
}

/** Moves the chain's clock past `unixTime` without waiting: surfpool's clock doesn't advance on its
 * own while nothing happens. Fails after a few tries instead of looping forever. */
export async function moveClockPast(unixTime: number): Promise<void> {
  const target = unixTime + 10;
  // surfpool takes the timestamp in milliseconds; seconds is tried too in case that changes.
  for (const absoluteTimestamp of [target * 1000, target]) {
    await timeTravel(absoluteTimestamp);
    if ((await chainNow()) > unixTime) return;
  }
  throw new Error(
    `surfnet_timeTravel did not move the clock past ${unixTime} (now ${await chainNow()})`
  );
}

/** A new wallet with 2 SOL. */
export async function fundedPlayer(): Promise<KeypairType> {
  const player = Keypair.generate();
  const signature = await connection.requestAirdrop(
    player.publicKey,
    2 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature, "confirmed");
  return player;
}

/** The Match and Vault addresses for one of the creator's match ids. */
export function addresses(matchId: anchor.BN): {
  match: PublicKeyType;
  vault: PublicKeyType;
} {
  const [match] = PublicKey.findProgramAddressSync(
    [MATCH_SEED, creator.toBuffer(), matchId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [vault] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, match.toBuffer()],
    program.programId
  );
  return { match, vault };
}

/** The deadlines a lobby was opened with, in chain unix seconds. */
export type Deadlines = {
  joinDeadline: number;
  commitDeadline: number;
  revealDeadline: number;
};

/** Opens a lobby. Joining stays open `joinSeconds`, committing 600 s more, revealing 600 s more. */
export async function createLobby(
  maxPlayers: number,
  joinSeconds = 600,
  winMetric = 0
) {
  const matchId = new anchor.BN(nextMatchId++);
  const now = await chainNow();
  const deadlines: Deadlines = {
    joinDeadline: now + joinSeconds,
    commitDeadline: now + joinSeconds + 600,
    revealDeadline: now + joinSeconds + 1200,
  };
  await program.methods
    .createMatch(matchId, {
      entryFeeLamports: new anchor.BN(ENTRY_FEE),
      maxPlayers,
      winMetric,
      payout: 0,
      joinDeadline: new anchor.BN(deadlines.joinDeadline),
      commitDeadline: new anchor.BN(deadlines.commitDeadline),
      revealDeadline: new anchor.BN(deadlines.revealDeadline),
    })
    .rpc();
  return { matchId, ...deadlines, ...addresses(matchId) };
}

export async function join(
  match: PublicKeyType,
  player: KeypairType
): Promise<void> {
  await program.methods
    .joinMatch()
    .accounts({ player: player.publicKey, matchAccount: match })
    .signers([player])
    .rpc();
}

/** The error text of a call that should fail ("" if it succeeded). */
export async function failure(call: () => Promise<unknown>): Promise<string> {
  try {
    await call();
    return "";
  } catch (error) {
    return String(error);
  }
}

/** Compiles a sample bot from policies/ with civ-cli (`civ compile` prints the bytes as hex). */
export function compiledBot(name: string): Buffer {
  const hex = execFileSync(
    "cargo",
    ["run", "-q", "-p", "civ-cli", "--", "compile", `policies/${name}.yaml`],
    {
      cwd: `${__dirname}/../..`,
      encoding: "utf8",
    }
  );
  return Buffer.from(hex.trim(), "hex");
}

/** sha256(policy || salt): the commitment, computed like programs/civ/src/commitment.rs. */
export function commitmentOf(policy: Buffer, salt: Buffer): number[] {
  return Array.from(createHash("sha256").update(policy).update(salt).digest());
}

/** FNV-1a over the bytes: the same hash as civ-core's MatchState::fingerprint. */
export function fingerprint(bytes: Uint8Array): bigint {
  const prime = 0x100000001b3n;
  const mask = (1n << 64n) - 1n;
  let hash = 0xcbf29ce484222325n;
  for (const byte of bytes) {
    hash ^= BigInt(byte);
    hash = (hash * prime) & mask;
  }
  return hash;
}
