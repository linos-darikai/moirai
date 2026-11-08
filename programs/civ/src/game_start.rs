//! Starting the game: the checks `start_match` makes before asking for the map seed, and building
//! turn 0 once the seed arrives. Shared by the VRF callback (`fulfill_match_seed`) and the local
//! test path (`start_match_local_test`), so tests run exactly the code the callback runs.

use anchor_lang::prelude::*;
use civ_core::randomness::MatchSeed;

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
