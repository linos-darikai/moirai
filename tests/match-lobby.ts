// Integration tests for the match lobby (Phase 2, docs/decisions/0009): create_match, join_match
// and cancel_match, including the edge cases in PLAN.md section 5 that apply before the game
// starts: double join, late join, a full lobby, and a full refund when a lobby doesn't fill.

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  ENTRY_FEE,
  chainNow,
  connection,
  createLobby,
  failure,
  fundedPlayer,
  join,
  moveClockPast,
  program,
} from "./support/chain";

const { SystemProgram } = anchor.web3;
let nextMatchId = Date.now() + 1_000_000;

describe("match lobby", () => {
  it("opens a lobby with its settings and a vault that holds its rent", async () => {
    const lobby = await createLobby(4);

    const stored = await program.account.match.fetch(lobby.match);
    const vaultBalance = await connection.getBalance(lobby.vault);

    expect(stored.maxPlayers).to.equal(4);
    expect(stored.playerCount).to.equal(0);
    expect(stored.entryFeeLamports.toNumber()).to.equal(ENTRY_FEE);
    expect(vaultBalance).to.equal(
      await connection.getMinimumBalanceForRentExemption(0)
    );
  });

  it("refuses a lobby for 1 player or with deadlines out of order", async () => {
    const now = await chainNow();
    const settings = (maxPlayers: number, commitOffset: number) => ({
      entryFeeLamports: new anchor.BN(ENTRY_FEE),
      maxPlayers,
      winMetric: 0,
      payout: 0,
      joinDeadline: new anchor.BN(now + 600),
      commitDeadline: new anchor.BN(now + commitOffset),
      revealDeadline: new anchor.BN(now + 2000),
    });

    const onePlayer = await failure(() =>
      program.methods
        .createMatch(new anchor.BN(nextMatchId++), settings(1, 1200))
        .rpc()
    );
    const outOfOrder = await failure(() =>
      program.methods
        .createMatch(new anchor.BN(nextMatchId++), settings(4, 300))
        .rpc()
    );

    expect(onePlayer).to.contain("InvalidPlayerCount");
    expect(outOfOrder).to.contain("BadDeadlines");
  });

  it("takes each player's entry fee into the vault and gives them a seat", async () => {
    const lobby = await createLobby(2);
    const [alice, bob] = [await fundedPlayer(), await fundedPlayer()];
    const vaultBefore = await connection.getBalance(lobby.vault);

    await join(lobby.match, alice);
    await join(lobby.match, bob);

    const stored = await program.account.match.fetch(lobby.match);
    expect(stored.playerCount).to.equal(2);
    expect(stored.players[0].toBase58()).to.equal(alice.publicKey.toBase58());
    expect(stored.players[1].toBase58()).to.equal(bob.publicKey.toBase58());
    expect(await connection.getBalance(lobby.vault)).to.equal(
      vaultBefore + 2 * ENTRY_FEE
    );
  });

  it("refuses a double join and a join into a full lobby", async () => {
    const lobby = await createLobby(2);
    const [alice, bob, carol] = [
      await fundedPlayer(),
      await fundedPlayer(),
      await fundedPlayer(),
    ];
    await join(lobby.match, alice);

    const doubleJoin = await failure(() => join(lobby.match, alice));
    await join(lobby.match, bob);
    const tooMany = await failure(() => join(lobby.match, carol));

    expect(doubleJoin).to.contain("AlreadyJoined");
    expect(tooMany).to.contain("MatchFull");
  });

  it("can't be cancelled while players can still join", async () => {
    const lobby = await createLobby(3);
    const alice = await fundedPlayer();
    await join(lobby.match, alice);

    const early = await failure(() =>
      program.methods
        .cancelMatch()
        .accounts({ matchAccount: lobby.match })
        .remainingAccounts([
          { pubkey: alice.publicKey, isSigner: false, isWritable: true },
        ])
        .rpc()
    );

    expect(early).to.contain("JoinStillOpen");
  });

  it("refunds everyone and closes an unfilled lobby after its join deadline; late joins are refused", async () => {
    // Fund everyone first: airdrops take a moment, and joining is only open for 30 chain seconds.
    const [alice, bob, late] = [
      await fundedPlayer(),
      await fundedPlayer(),
      await fundedPlayer(),
    ];
    const lobby = await createLobby(3, 30);
    await join(lobby.match, alice);
    await join(lobby.match, bob);
    const [aliceBefore, bobBefore] = [
      await connection.getBalance(alice.publicKey),
      await connection.getBalance(bob.publicKey),
    ];
    await moveClockPast(lobby.joinDeadline);

    const lateJoin = await failure(() => join(lobby.match, late));
    const refundAccounts = [alice, bob].map((player) => ({
      pubkey: player.publicKey,
      isSigner: false,
      isWritable: true,
    }));
    const wrongOrder = await failure(() =>
      program.methods
        .cancelMatch()
        .accounts({ matchAccount: lobby.match })
        .remainingAccounts([...refundAccounts].reverse())
        .rpc()
    );
    await program.methods
      .cancelMatch()
      .accounts({ matchAccount: lobby.match })
      .remainingAccounts(refundAccounts)
      .rpc();

    expect(lateJoin).to.contain("JoinDeadlinePassed");
    expect(wrongOrder).to.contain("WrongRefundAccounts");
    expect(await connection.getBalance(alice.publicKey)).to.equal(
      aliceBefore + ENTRY_FEE
    );
    expect(await connection.getBalance(bob.publicKey)).to.equal(
      bobBefore + ENTRY_FEE
    );
    expect(await connection.getAccountInfo(lobby.match)).to.equal(null);
    expect(await connection.getAccountInfo(lobby.vault)).to.equal(null);
  });

  it("only takes the vault that belongs to the match", async () => {
    const lobby = await createLobby(2);
    const other = await createLobby(2);
    const alice = await fundedPlayer();

    const wrongVault = await failure(() =>
      program.methods
        .joinMatch()
        .accountsPartial({
          player: alice.publicKey,
          matchAccount: lobby.match,
          vault: other.vault,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc()
    );

    expect(wrongVault).to.contain("ConstraintSeeds");
  });
});
