// Integration tests for the civ program, run against a local validator by `anchor test`.
// Phase 0: the hello-world Counter (`initialize` and `increment`).

import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";
import idl from "../target/idl/civ.json";
import type { Civ } from "../target/types/civ";

const { PublicKey } = anchor.web3;

const COUNTER_SEED = Buffer.from("counter");

describe("civ hello-world counter", () => {
  // Uses the cluster and wallet that `anchor test` sets up (a local validator and your CLI wallet).
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Build the client from the IDL that `anchor build` generates (the same way the app will).
  const program = new Program<Civ>(idl as Civ, provider);
  const authority = provider.wallet.publicKey;
  const [counterAddress] = PublicKey.findProgramAddressSync(
    [COUNTER_SEED, authority.toBuffer()],
    program.programId
  );

  it("initialize creates a counter at zero owned by the caller", async () => {
    await program.methods.initialize().rpc();

    const counter = await program.account.counter.fetch(counterAddress);

    expect(counter.count.toNumber()).to.equal(0);
    expect(counter.authority.toBase58()).to.equal(authority.toBase58());
  });

  it("initialize fails the second time for the same wallet", async () => {
    let didFail = false;

    try {
      await program.methods.initialize().rpc();
    } catch {
      didFail = true;
    }

    expect(didFail).to.equal(true);
  });

  it("increment adds one to the count", async () => {
    await program.methods.increment().rpc();

    const counter = await program.account.counter.fetch(counterAddress);

    expect(counter.count.toNumber()).to.equal(1);
  });

  it("increment rejects a wallet that does not own the counter", async () => {
    const stranger = anchor.web3.Keypair.generate();
    let didFail = false;

    try {
      // The stranger signs, but the counter PDA they pass belongs to `authority`, so the
      // `seeds` / `has_one` constraints must reject it.
      await program.methods
        .increment()
        .accountsPartial({
          authority: stranger.publicKey,
          counter: counterAddress,
        })
        .signers([stranger])
        .rpc();
    } catch {
      didFail = true;
    }

    expect(didFail).to.equal(true);
  });
});
