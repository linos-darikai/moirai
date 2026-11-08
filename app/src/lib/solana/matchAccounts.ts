// Reading Match accounts from the civ program and turning them into plain MatchAccountView objects
// (types/chain.ts). Also the PDA helpers every match instruction needs. Layout and seeds match
// programs/civ (state/match_account.rs, constants.rs).

import { AnchorProvider, Program } from "@anchor-lang/core";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import idl from "./idl/civ.json";
import type { Civ } from "./idl/civ";
import { CIV_PROGRAM_ID } from "./civProgram";
import type { MatchAccountView, MatchStatusName } from "../../types/chain";
import type { PayoutKind, WinMetric } from "../../types/game";

const MATCH_SEED = new TextEncoder().encode("match");
const VAULT_SEED = new TextEncoder().encode("vault");
const PROFILE_SEED = new TextEncoder().encode("profile");

/** Byte offset of `status` in the account data: 8 discriminator + 3,686 bytes of fields before it. */
const STATUS_OFFSET = 8 + 3_686;
/** Where the game (MatchState) starts in the account data; its first u16 is the turn. */
const MATCH_STATE_OFFSET = 8 + 336;

const STATUS_NAMES: readonly MatchStatusName[] = ["open", "running", "settled", "cancelled", "seedRequested"];
const WIN_METRICS: readonly WinMetric[] = ["territory", "wealth", "conquest", "score"];
const PAYOUTS: readonly PayoutKind[] = ["winnerTakesAll", "topThree"];

export function findMatchAddress(creator: PublicKey, matchId: bigint): PublicKey {
  const id = new Uint8Array(8);
  new DataView(id.buffer).setBigUint64(0, matchId, true);
  return PublicKey.findProgramAddressSync([MATCH_SEED, creator.toBytes(), id], CIV_PROGRAM_ID)[0];
}

export function findVaultAddress(match: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([VAULT_SEED, match.toBytes()], CIV_PROGRAM_ID)[0];
}

export function findProfileAddress(wallet: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([PROFILE_SEED, wallet.toBytes()], CIV_PROGRAM_ID)[0];
}

/** A wallet that can't sign: lets us build a Program client for reads before anyone connects. */
const READ_ONLY_WALLET: AnchorWallet = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: <T extends Transaction | VersionedTransaction>(): Promise<T> =>
    Promise.reject(new Error("Connect a wallet to sign")),
  signAllTransactions: <T extends Transaction | VersionedTransaction>(): Promise<T[]> =>
    Promise.reject(new Error("Connect a wallet to sign")),
};

/** A program client for reading accounts (no wallet needed). */
export function createCivReader(connection: Connection): Program<Civ> {
  const provider = new AnchorProvider(connection, READ_ONLY_WALLET, { commitment: "confirmed" });
  return new Program<Civ>(idl as Civ, provider);
}

/** The decoded Match account type, as Anchor gives it. */
type MatchAccount = Awaited<ReturnType<Program<Civ>["account"]["match"]["fetch"]>>;

function bit(flags: number, seat: number): boolean {
  return ((flags >> seat) & 1) === 1;
}

function toHex(bytes: readonly number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Converts a decoded Match account into the app's plain view. */
export function matchView(address: PublicKey, account: MatchAccount, vaultLamports: number): MatchAccountView {
  const seats = Array.from({ length: account.playerCount }, (_, seat) => seat);
  const game = Uint8Array.from(account.matchState);
  return {
    address: address.toBase58(),
    creator: account.creator.toBase58(),
    players: seats.map((seat) => account.players[seat]?.toBase58() ?? ""),
    maxPlayers: account.maxPlayers,
    entryFeeLamports: account.entryFeeLamports.toNumber(),
    joinDeadline: account.joinDeadline.toNumber(),
    commitDeadline: account.commitDeadline.toNumber(),
    revealDeadline: account.revealDeadline.toNumber(),
    seedRequestedAt: account.seedRequestedAt.toNumber(),
    status: STATUS_NAMES[account.status] ?? "open",
    winMetric: WIN_METRICS[account.winMetric] ?? "territory",
    payout: PAYOUTS[account.payout] ?? "winnerTakesAll",
    committed: seats.map((seat) => bit(account.committedFlags, seat)),
    revealed: seats.map((seat) => bit(account.revealedFlags, seat)),
    commitments: seats.map((seat) => (bit(account.committedFlags, seat) ? toHex(account.commitments[seat] ?? []) : "")),
    turn: new DataView(game.buffer).getUint16(0, true),
    vaultLamports,
  };
}

/** Every match still in its lobby (status Open), newest deadline first. */
export async function fetchOpenMatches(connection: Connection): Promise<MatchAccountView[]> {
  const program = createCivReader(connection);
  // Only accounts whose status byte is 0 (Open): the RPC filters, so we don't download them all.
  const accounts = await program.account.match.all([{ memcmp: { offset: STATUS_OFFSET, bytes: "1" } }]);
  const views: MatchAccountView[] = [];
  for (const { publicKey, account } of accounts) {
    const vaultLamports = await connection.getBalance(findVaultAddress(publicKey));
    views.push(matchView(publicKey, account, vaultLamports));
  }
  return views.sort((a, b) => b.joinDeadline - a.joinDeadline);
}

/** One match, or null once it has been settled or cancelled (its account is closed then). */
export async function fetchMatch(connection: Connection, address: string): Promise<MatchAccountView | null> {
  const program = createCivReader(connection);
  const key = new PublicKey(address);
  const account = await program.account.match.fetchNullable(key);
  if (account === null) return null;
  return matchView(key, account, await connection.getBalance(findVaultAddress(key)));
}

/** The turn a match is on, read straight from its bytes (cheap: no decoding). */
export async function fetchTurn(connection: Connection, match: PublicKey): Promise<number> {
  const info = await connection.getAccountInfo(match, "confirmed");
  if (info === null) throw new Error("This match no longer exists");
  return new DataView(info.data.buffer, info.data.byteOffset).getUint16(MATCH_STATE_OFFSET, true);
}
