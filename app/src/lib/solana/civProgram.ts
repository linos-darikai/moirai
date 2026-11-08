// The typed client for the on-chain civ program, plus its PDA helpers.
// The IDL in ./idl is copied from target/ by `pnpm sync:idl` after every `anchor build`.

import { AnchorProvider, Program } from "@anchor-lang/core";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl/civ.json";
import type { Civ } from "./idl/civ";

/** The civ program's address, read from the IDL so it always matches the deployed build. */
export const CIV_PROGRAM_ID = new PublicKey(idl.address);

/** Seed for the hello-world Counter PDA. Must match COUNTER_SEED in programs/civ/src/constants.rs. */
const COUNTER_SEED = new TextEncoder().encode("counter");

/** The civ program client, signing with the connected wallet. */
export type CivProgram = Program<Civ>;

/** Creates a program client that sends transactions signed by `wallet`. */
export function createCivProgram(connection: Connection, wallet: AnchorWallet): CivProgram {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program<Civ>(idl as Civ, provider);
}

/** The address of `authority`'s Counter: the PDA from seeds ["counter", authority]. */
export function findCounterAddress(authority: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [COUNTER_SEED, authority.toBytes()],
    CIV_PROGRAM_ID,
  );
  return address;
}
