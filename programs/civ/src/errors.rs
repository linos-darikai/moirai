//! All error codes the civ program can return. One enum for the whole program, each variant with
//! a message a player could understand.

use anchor_lang::prelude::*;

/// Errors returned by civ instructions. `#[error_code]` turns this enum into Anchor errors with
/// numeric codes (6000, 6001, ...) and puts the messages in the IDL so the app can show them.
#[error_code]
pub enum ErrorCode {
    #[msg("The counter cannot go any higher")]
    CounterOverflow,
    #[msg("Randomness has already been requested or delivered for this seed")]
    SeedAlreadyRequested,
    #[msg("This seed is not waiting for randomness (it was never requested, or already filled)")]
    SeedNotRequested,
    #[msg("A match needs between 1 and 4 civs")]
    BenchInvalidCivCount,
    #[msg("Those bytes are not a valid compiled policy")]
    BenchBadPolicy,
    #[msg("There is no civ with that number in this match")]
    BenchBadCivIndex,
    #[msg("This match is over: no more turns can be played")]
    BenchMatchOver,
    #[msg("The match data in this account is not laid out as expected")]
    BenchMisalignedState,
    #[msg("A match needs between 2 and 4 players")]
    InvalidPlayerCount,
    #[msg("Unknown win metric: use 0 Territory, 1 Wealth, 2 Conquest or 3 Score")]
    UnknownWinMetric,
    #[msg("Unknown payout: use 0 winner takes all or 1 top three")]
    UnknownPayout,
    #[msg("Deadlines must be in the future and in order: join, then commit, then reveal")]
    BadDeadlines,
    #[msg("This match is not accepting new players")]
    MatchNotOpen,
    #[msg("The join deadline has passed")]
    JoinDeadlinePassed,
    #[msg("This match is full")]
    MatchFull,
    #[msg("You have already joined this match")]
    AlreadyJoined,
    #[msg("Players can still join this match; it can only be cancelled after the join deadline")]
    JoinStillOpen,
    #[msg("The refund accounts must be exactly the joined players, in join order")]
    WrongRefundAccounts,
}
