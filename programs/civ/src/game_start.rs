//! Starting the game: the checks `start_match` makes before asking for the map seed, and building
//! turn 0 once the seed arrives. Shared by the VRF callback (`fulfill_match_seed`) and the local
//! test path (`start_match_local_test`), so tests run exactly the code the callback runs.

use anchor_lang::prelude::*;
use civ_core::randomness::MatchSeed;

use crate::constants::SEED_REQUEST_TIMEOUT_SECONDS;
use crate::errors::ErrorCode;
use crate::state::{Match, MatchStatus};

/// Checks a lobby is ready for its game to start.
///
/// The lobby must be Open and full, and every player must have revealed, or the reveal deadline
/// must have passed (a player who never revealed plays with no policy: their civ sits idle).
pub fn check_ready_to_start(lobby: &Match, now: i64) -> Result<()> {
    require!(
        lobby.current_status() == Some(MatchStatus::Open),
        ErrorCode::MatchNotOpen
    );
    require!(lobby.is_full(), ErrorCode::LobbyNotFull);
    require!(
        lobby.has_everyone_revealed() || now > lobby.reveal_deadline,
        ErrorCode::RevealsStillOpen
    );
    Ok(())
}

/// Checks the map seed may be asked for again: the match is still waiting for it and the oracle
/// has had SEED_REQUEST_TIMEOUT_SECONDS to answer.
pub fn check_seed_retry(
    status: Option<MatchStatus>,
    seed_requested_at: i64,
    now: i64,
) -> Result<()> {
    require!(
        status == Some(MatchStatus::SeedRequested),
        ErrorCode::SeedNotRequested
    );
    let retry_from = seed_requested_at
        .checked_add(SEED_REQUEST_TIMEOUT_SECONDS)
        .ok_or(ErrorCode::SeedNotRequested)?;
    require!(now > retry_from, ErrorCode::SeedRequestNotTimedOut);
    Ok(())
}

/// Builds turn 0 of the game in the Match account from `seed` (map, civs with their capitals,
/// market) and marks the match Running. Civ i is the player in seat i.
pub fn start_game(lobby: &mut Match, seed: [u8; 32]) -> Result<()> {
    let civ_count = lobby.player_count;
    let game = lobby.game_mut().ok_or(ErrorCode::MisalignedMatchState)?;
    game.start_into(&MatchSeed(seed), civ_count)
        .map_err(|_| ErrorCode::InvalidPlayerCount)?;
    lobby.status = MatchStatus::Running.to_byte();
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    const ASKED_AT: i64 = 1_000;

    #[test]
    fn a_seed_request_can_be_retried_once_the_oracle_has_had_its_time() {
        let now = ASKED_AT + SEED_REQUEST_TIMEOUT_SECONDS + 1;

        let result = check_seed_retry(Some(MatchStatus::SeedRequested), ASKED_AT, now);

        assert!(result.is_ok());
    }

    #[test]
    fn a_seed_request_cannot_be_retried_while_the_oracle_may_still_answer() {
        let now = ASKED_AT + SEED_REQUEST_TIMEOUT_SECONDS;

        let result = check_seed_retry(Some(MatchStatus::SeedRequested), ASKED_AT, now);

        assert_eq!(result, Err(ErrorCode::SeedRequestNotTimedOut.into()));
    }

    #[test]
    fn only_a_match_waiting_for_its_seed_can_retry() {
        let late = ASKED_AT + 10 * SEED_REQUEST_TIMEOUT_SECONDS;

        for status in [
            MatchStatus::Open,
            MatchStatus::Running,
            MatchStatus::Settled,
        ] {
            let result = check_seed_retry(Some(status), ASKED_AT, late);

            assert_eq!(
                result,
                Err(ErrorCode::SeedNotRequested.into()),
                "{status:?}"
            );
        }
    }
}
