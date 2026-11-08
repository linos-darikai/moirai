// Integration tests for commit_policy and reveal_policy (Phase 2, PLAN.md section 3): a player
// commits sha256(compiled policy || salt), then reveals once everyone has committed. Covers the
// edge cases in PLAN.md section 5 for this step: wrong hash, invalid bytes, wrong signer, reveal
// too early, double commit / reveal, and both deadlines.

import { expect } from "chai";
import { randomBytes } from "node:crypto";
import {
  KeypairType,
  PublicKeyType,
  commitmentOf,
  compiledBot,
  createLobby,
  failure,
  fundedPlayer,
  join,
  moveClockPast,
  program,
} from "./support/chain";

const turtle = compiledBot("turtle");

function commit(
  match: PublicKeyType,
  player: KeypairType,
  commitment: number[]
) {
  return program.methods
    .commitPolicy(commitment)
    .accounts({ player: player.publicKey, matchAccount: match })
    .signers([player])
    .rpc();
}

function reveal(
  match: PublicKeyType,
  player: KeypairType,
  policy: Buffer,
  salt: Buffer
) {
  return program.methods
    .revealPolicy(policy, Array.from(salt))
    .accounts({ player: player.publicKey, matchAccount: match })
    .signers([player])
    .rpc();
}

/** A full 2-player lobby with Alice and Bob in it. */
async function fullLobby() {
  const [alice, bob] = [await fundedPlayer(), await fundedPlayer()];
  const lobby = await createLobby(2);
  await join(lobby.match, alice);
  await join(lobby.match, bob);
  return { lobby, alice, bob };
}

describe("commit and reveal", () => {
  it("stores a commitment, then the revealed policy once everyone has committed", async () => {
    const { lobby, alice, bob } = await fullLobby();
    const salt = randomBytes(32);
    await commit(lobby.match, alice, commitmentOf(turtle, salt));

    const tooEarly = await failure(() =>
      reveal(lobby.match, alice, turtle, salt)
    );
    await commit(lobby.match, bob, commitmentOf(turtle, randomBytes(32)));
    await reveal(lobby.match, alice, turtle, salt);

    const stored = await program.account.match.fetch(lobby.match);
    expect(tooEarly).to.contain("CommitsStillOpen");
    expect(stored.committedFlags).to.equal(0b11);
    expect(stored.revealedFlags).to.equal(0b01);
    expect(stored.policyLengths[0]).to.equal(turtle.length);
    expect(
      Buffer.from(stored.policies[0].slice(0, turtle.length))
    ).to.deep.equal(turtle);
  });

  it("refuses a reveal that doesn't match the commitment, and a second reveal", async () => {
    const { lobby, alice, bob } = await fullLobby();
    const salt = randomBytes(32);
    await commit(lobby.match, alice, commitmentOf(turtle, salt));
    await commit(lobby.match, bob, commitmentOf(turtle, salt));

    const wrongSalt = await failure(() =>
      reveal(lobby.match, alice, turtle, randomBytes(32))
    );
    const otherPolicy = await failure(() =>
      reveal(lobby.match, alice, compiledBot("raider"), salt)
    );
    await reveal(lobby.match, alice, turtle, salt);
    const again = await failure(() => reveal(lobby.match, alice, turtle, salt));

    expect(wrongSalt).to.contain("WrongPolicyHash");
    expect(otherPolicy).to.contain("WrongPolicyHash");
    expect(again).to.contain("AlreadyRevealed");
  });

  it("refuses bytes that hash correctly but are not a valid policy", async () => {
    const { lobby, alice, bob } = await fullLobby();
    const junk = Buffer.from("not a policy");
    const salt = randomBytes(32);
    await commit(lobby.match, alice, commitmentOf(junk, salt));
    await commit(lobby.match, bob, commitmentOf(turtle, salt));

    const result = await failure(() => reveal(lobby.match, alice, junk, salt));

    expect(result).to.contain("InvalidPolicy");
  });

  it("refuses commits from outsiders, double commits and empty commitments", async () => {
    const { lobby, alice } = await fullLobby();
    const outsider = await fundedPlayer();
    const commitment = commitmentOf(turtle, randomBytes(32));

    const fromOutsider = await failure(() =>
      commit(lobby.match, outsider, commitment)
    );
    const empty = await failure(() =>
      commit(lobby.match, alice, new Array(32).fill(0))
    );
    await commit(lobby.match, alice, commitment);
    const twice = await failure(() => commit(lobby.match, alice, commitment));

    expect(fromOutsider).to.contain("NotAPlayer");
    expect(empty).to.contain("EmptyCommitment");
    expect(twice).to.contain("AlreadyCommitted");
  });

  it("keeps policies secret until the lobby is full", async () => {
    const [alice, bob] = [await fundedPlayer(), await fundedPlayer()];
    const lobby = await createLobby(3);
    await join(lobby.match, alice);
    await join(lobby.match, bob);
    const salt = randomBytes(32);
    await commit(lobby.match, alice, commitmentOf(turtle, salt));
    await commit(lobby.match, bob, commitmentOf(turtle, salt));

    const result = await failure(() =>
      reveal(lobby.match, alice, turtle, salt)
    );

    expect(result).to.contain("LobbyNotFull");
  });

  it("closes commits at the commit deadline and reveals at the reveal deadline", async () => {
    const { lobby, alice, bob } = await fullLobby();
    const salt = randomBytes(32);
    await commit(lobby.match, alice, commitmentOf(turtle, salt));

    await moveClockPast(lobby.commitDeadline);
    const lateCommit = await failure(() =>
      commit(lobby.match, bob, commitmentOf(turtle, salt))
    );
    // Bob never committed, but the commit deadline has passed, so Alice may reveal now.
    await reveal(lobby.match, alice, turtle, salt);
    const bobHasNothing = await failure(() =>
      reveal(lobby.match, bob, turtle, salt)
    );
    await moveClockPast(lobby.revealDeadline);
    const lateReveal = await failure(() =>
      reveal(lobby.match, alice, turtle, salt)
    );

    expect(lateCommit).to.contain("CommitDeadlinePassed");
    expect(bobHasNothing).to.contain("NotCommitted");
    expect(lateReveal).to.contain("RevealDeadlinePassed");
  });
});
