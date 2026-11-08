// Integration tests for settle_match (Phase 2): the sample-bot match is played to the end, then
// settled. Covers settling too early, both payouts, Profiles, the Top 10, wrong accounts and
// settling twice (PLAN.md section 5). Needs a local-testing build: run with `pnpm test:program`.
//
// In the sample match (seed 42) the final tiles are turtle 57, raider 74, trader 58, expander 44,
// so under Territory the raider (seat 1) wins, the trader is second and the turtle third.

import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  ENTRY_FEE,
  KeypairType,
  PublicKeyType,
  advance,
  addresses,
  connection,
  creator,
  failure,
  profileAddress,
  program,
  startedSampleMatch,
} from "./support/chain";

const TOTAL_TURNS = 120;
const PAYOUT_WINNER_TAKES_ALL = 0;
const PAYOUT_TOP_THREE = 1;

/** Every player's wallet then Profile, in seat order: the remaining accounts settle_match needs. */
function settleAccounts(players: KeypairType[]) {
  return players.flatMap((player) => [
    { pubkey: player.publicKey, isSigner: false, isWritable: true },
    {
      pubkey: profileAddress(player.publicKey),
      isSigner: false,
      isWritable: true,
    },
  ]);
}

function settle(match: PublicKeyType, players: KeypairType[]) {
  return program.methods
    .settleMatch()
    .accounts({ matchAccount: match })
    .remainingAccounts(settleAccounts(players))
    .rpc();
}

/** A sample match played to its last turn. */
async function finishedSampleMatch(payout: number) {
  const lobby = await startedSampleMatch(payout);
  for (let turn = 0; turn < TOTAL_TURNS; turn++) await advance(lobby.match);
  return lobby;
}

async function balances(players: KeypairType[]): Promise<number[]> {
  return Promise.all(
    players.map((player) => connection.getBalance(player.publicKey))
  );
}

describe("settle match", () => {
  it("can't settle before the last turn", async () => {
    const lobby = await startedSampleMatch();
    await advance(lobby.match);

    const result = await failure(() => settle(lobby.match, lobby.players));

    expect(result).to.contain("MatchNotFinished");
  });

  it("pays the whole pot to the winner, updates every Profile and the Top 10, and closes the match", async () => {
    const lobby = await finishedSampleMatch(PAYOUT_WINNER_TAKES_ALL);
    const vault = addresses(lobby.matchId).vault;
    const rent = await connection.getMinimumBalanceForRentExemption(0);
    const pot = (await connection.getBalance(vault)) - rent;
    const before = await balances(lobby.players);
    const creatorBefore = await connection.getBalance(creator);

    await settle(lobby.match, lobby.players);

    const after = await balances(lobby.players);
    // The raider (seat 1) wins Territory on seed 42.
    expect(after.map((balance, seat) => balance - before[seat])).to.deep.equal([
      0,
      pot,
      0,
      0,
    ]);
    const raider = await program.account.profile.fetch(
      profileAddress(lobby.players[1].publicKey)
    );
    const expander = await program.account.profile.fetch(
      profileAddress(lobby.players[3].publicKey)
    );
    expect(raider.matchesPlayed).to.equal(1);
    expect(raider.wins).to.equal(1);
    expect(raider.winningsLamports.toNumber()).to.equal(pot);
    expect(raider.elo).to.be.greaterThan(1_200);
    expect(expander.wins).to.equal(0);
    expect(expander.elo).to.be.lessThan(raider.elo);

    const [topTenAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("top10")],
      program.programId
    );
    const topTen = await program.account.topTen.fetch(topTenAddress);
    const elos = topTen.entries
      .map((entry) => entry.elo)
      .filter((elo) => elo > 0);
    expect(elos).to.deep.equal([...elos].sort((a, b) => b - a));
    expect(
      topTen.entries.some((entry) =>
        entry.wallet.equals(lobby.players[1].publicKey)
      )
    ).to.equal(true);

    expect(await connection.getAccountInfo(lobby.match)).to.equal(null);
    expect(await connection.getAccountInfo(vault)).to.equal(null);
    expect(await connection.getBalance(creator)).to.be.greaterThan(
      creatorBefore
    );
  });

  it("pays 60/30/10 to the top three", async () => {
    const lobby = await finishedSampleMatch(PAYOUT_TOP_THREE);
    const vault = addresses(lobby.matchId).vault;
    const pot =
      (await connection.getBalance(vault)) -
      (await connection.getMinimumBalanceForRentExemption(0));
    const before = await balances(lobby.players);

    await settle(lobby.match, lobby.players);

    const gained = (await balances(lobby.players)).map(
      (balance, seat) => balance - before[seat]
    );
    // Seats: turtle (3rd), raider (1st), trader (2nd), expander (4th). Rounding dust goes to 1st.
    const second = Math.floor((pot * 3_000) / 10_000);
    const third = Math.floor((pot * 1_000) / 10_000);
    const first = pot - second - third;
    expect(gained).to.deep.equal([third, first, second, 0]);
    expect(gained.reduce((sum, amount) => sum + amount, 0)).to.equal(pot);
  });

  it("refuses the wrong accounts and can't settle twice", async () => {
    const lobby = await finishedSampleMatch(PAYOUT_WINNER_TAKES_ALL);
    const swapped = [
      lobby.players[1],
      lobby.players[0],
      lobby.players[2],
      lobby.players[3],
    ];

    const wrongOrder = await failure(() => settle(lobby.match, swapped));
    await settle(lobby.match, lobby.players);
    const twice = await failure(() => settle(lobby.match, lobby.players));

    expect(wrongOrder).to.contain("WrongSettleAccounts");
    expect(twice).to.not.equal("");
  });

  it("starts every new Profile at 1,200 when the player first joins", async () => {
    const lobby = await startedSampleMatch();

    const profile = await program.account.profile.fetch(
      profileAddress(lobby.players[0].publicKey)
    );

    expect(profile.elo).to.equal(1_200);
    expect(profile.matchesPlayed).to.equal(0);
    expect(ENTRY_FEE).to.be.greaterThan(0);
  });
});
