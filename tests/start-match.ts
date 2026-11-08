// Integration tests for starting a match (Phase 2). On the local validator there is no VRF oracle,
// so these use `start_match_local_test`, which runs the same checks as `start_match` and the same
// `start_game` as the oracle's callback. Needs the program built with the local-testing feature:
// `NO_DNA=1 anchor build -- --features local-testing`, then `anchor test --skip-build`.

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

/** MatchStatus bytes (programs/civ/src/state/match_account.rs). */
const RUNNING = 1;
/** Where the game bytes start in the fetched Match (after the fields before `match_state`). */
const SEED = Array.from({ length: 32 }, () => 42);

const turtle = compiledBot("turtle");
const raider = compiledBot("raider");

function startLocal(match: PublicKeyType) {
  return program.methods
    .startMatchLocalTest(SEED)
    .accounts({ matchAccount: match })
    .rpc();
}

/** A full 2-player lobby where both players committed; `reveal` picks who reveals. */
async function committedLobby(reveal: { alice: boolean; bob: boolean }) {
  const [alice, bob] = [await fundedPlayer(), await fundedPlayer()];
  const lobby = await createLobby(2);
  const players: [KeypairType, Buffer, Buffer][] = [
    [alice, turtle, randomBytes(32)],
    [bob, raider, randomBytes(32)],
  ];
  for (const [player] of players) await join(lobby.match, player);
  for (const [player, policy, salt] of players) {
    await program.methods
      .commitPolicy(commitmentOf(policy, salt))
      .accounts({ player: player.publicKey, matchAccount: lobby.match })
      .signers([player])
      .rpc();
  }
  const revealers = players.filter(([player]) =>
    player === alice ? reveal.alice : reveal.bob
  );
  for (const [player, policy, salt] of revealers) {
    await program.methods
      .revealPolicy(policy, Array.from(salt))
      .accounts({ player: player.publicKey, matchAccount: lobby.match })
      .signers([player])
      .rpc();
  }
  return lobby;
}

describe("start match", () => {
  it("builds turn 0 of the game in the Match once everyone has revealed", async () => {
    const lobby = await committedLobby({ alice: true, bob: true });

    await startLocal(lobby.match);

    const stored = await program.account.match.fetch(lobby.match);
    const game = Buffer.from(stored.matchState);
    expect(stored.status).to.equal(RUNNING);
    // MatchState layout: turn u16, civ_count u8, reserved u8, then the 32-byte seed.
    expect(game.readUInt16LE(0)).to.equal(0);
    expect(game[2]).to.equal(2);
    expect(Array.from(game.subarray(4, 36))).to.deep.equal(SEED);
  });

  it("can only be started once", async () => {
    const lobby = await committedLobby({ alice: true, bob: true });
    await startLocal(lobby.match);

    const again = await failure(() => startLocal(lobby.match));

    expect(again).to.contain("MatchNotOpen");
  });

  it("waits for every reveal until the reveal deadline, then starts without the missing policy", async () => {
    const lobby = await committedLobby({ alice: true, bob: false });

    const early = await failure(() => startLocal(lobby.match));
    await moveClockPast(lobby.revealDeadline);
    await startLocal(lobby.match);

    const stored = await program.account.match.fetch(lobby.match);
    expect(early).to.contain("RevealsStillOpen");
    expect(stored.status).to.equal(RUNNING);
    expect(stored.policyLengths[1]).to.equal(0);
  });

  it("refuses a lobby that isn't full", async () => {
    const alice = await fundedPlayer();
    const lobby = await createLobby(3);
    await join(lobby.match, alice);

    const result = await failure(() => startLocal(lobby.match));

    expect(result).to.contain("LobbyNotFull");
  });

  it("refuses to let anyone but the VRF program deliver the seed", async () => {
    const lobby = await committedLobby({ alice: true, bob: true });

    const forged = await failure(() =>
      program.methods
        .fulfillMatchSeed(SEED)
        .accountsPartial({ matchAccount: lobby.match })
        .rpc()
    );

    expect(forged).to.not.equal("");
    const stored = await program.account.match.fetch(lobby.match);
    expect(stored.status).to.not.equal(RUNNING);
  });
});
