// Integration tests for the match lobby (Phase 2, docs/decisions/0009): create_match, join_match
// and cancel_match, including the edge cases in PLAN.md section 5 that apply before the game
// starts: double join, late join, a full lobby, and a full refund when a lobby doesn't fill.

import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { expect } from "chai";
import idl from "../target/idl/civ.json";
import type { Civ } from "../target/types/civ";

const { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } = anchor.web3;
type PublicKeyType = anchor.web3.PublicKey;
type KeypairType = anchor.web3.Keypair;

const MATCH_SEED = Buffer.from("match");
const VAULT_SEED = Buffer.from("vault");
const ENTRY_FEE = 0.1 * LAMPORTS_PER_SOL;

describe("match lobby", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new Program<Civ>(idl as Civ, provider);
  const connection = provider.connection;
  const creator = provider.wallet.publicKey;
  let nextMatchId = Date.now();

  /** The chain's current unix time, read from the Clock sysvar: the same value the program sees.
   * (surfpool's clock runs faster than real time, so this computer's clock can't be used.) */
  async function chainNow(): Promise<number> {
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

  /** Moves the chain's clock past `unixTime` without waiting: surfpool's clock doesn't advance
   * on its own while nothing happens. Fails after a few tries instead of looping forever. */
  async function moveClockPast(unixTime: number): Promise<void> {
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

  async function fundedPlayer(): Promise<KeypairType> {
    const player = Keypair.generate();
    const signature = await connection.requestAirdrop(
      player.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature, "confirmed");
    return player;
  }

  function addresses(matchId: anchor.BN): {
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

  /** Opens a lobby; `joinSeconds` sets how long joining stays open. */
  async function createLobby(maxPlayers: number, joinSeconds = 600) {
    const matchId = new anchor.BN(nextMatchId++);
    const now = await chainNow();
    await program.methods
      .createMatch(matchId, {
        entryFeeLamports: new anchor.BN(ENTRY_FEE),
        maxPlayers,
        winMetric: 0,
        payout: 0,
        joinDeadline: new anchor.BN(now + joinSeconds),
        commitDeadline: new anchor.BN(now + joinSeconds + 600),
        revealDeadline: new anchor.BN(now + joinSeconds + 1200),
      })
      .rpc();
    return { matchId, joinDeadline: now + joinSeconds, ...addresses(matchId) };
  }

  async function join(
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
  async function failure(call: () => Promise<unknown>): Promise<string> {
    try {
      await call();
      return "";
    } catch (error) {
      return String(error);
    }
  }

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
