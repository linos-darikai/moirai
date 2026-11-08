import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Civ } from "../target/types/civ";

describe("civ", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.civ as Program<Civ>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
