//! The crank reward (PLAN.md section 4): whoever calls `advance_turn` gets a small share of the
//! pot for that turn, so somebody always has a reason to keep the match moving. Over a whole match
//! the rewards add up to CRANK_REWARD_BPS of the pot.

use civ_core::rules::{BPS_PER_WHOLE, TOTAL_TURNS};

/// The share of the pot paid to cranks over a whole match: 150 bps = 1.5%.
pub const CRANK_REWARD_BPS: u64 = 150;

/// Lamports paid for one `advance_turn`: pot × 1.5% ÷ number of turns, rounded down. `None` only if
/// the numbers overflow (they can't for any real entry fee).
pub fn crank_reward_per_turn(entry_fee_lamports: u64, player_count: u8) -> Option<u64> {
    let pot = entry_fee_lamports.checked_mul(u64::from(player_count))?;
    let reward_for_match = pot
        .checked_mul(CRANK_REWARD_BPS)?
        .checked_div(u64::from(BPS_PER_WHOLE))?;
    reward_for_match.checked_div(u64::from(TOTAL_TURNS))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sixty_turns_of_rewards_add_up_to_one_and_a_half_percent_of_the_pot() {
        // 4 players × 1 SOL = 4 SOL pot; 1.5% = 0.06 SOL over 60 turns = 0.001 SOL a turn.
        let reward = crank_reward_per_turn(1_000_000_000, 4);

        assert_eq!(reward, Some(1_000_000));
        assert_eq!(1_000_000 * u64::from(TOTAL_TURNS), 60_000_000);
    }

    #[test]
    fn a_free_match_pays_no_reward() {
        assert_eq!(crank_reward_per_turn(0, 4), Some(0));
    }

    #[test]
    fn an_overflowing_fee_is_refused_not_wrapped() {
        assert_eq!(crank_reward_per_turn(u64::MAX, 4), None);
    }
}
