//! Elo ratings for Profiles. A match of n players counts as one game between every pair, decided
//! by final score (higher wins, equal draws). Integer maths only, like the rest of the game: the
//! expected score comes from a table instead of `10^(d/400)`.

/// Every new Profile starts here.
pub const STARTING_ELO: u32 = 1_200;
/// The most a rating can move against one opponent in a 2-player match. With more players the
/// K-factor is shared between the opponents, so one match moves a rating by at most K.
pub const ELO_K_FACTOR: i64 = 32;
/// Ratings never drop below this.
pub const MINIMUM_ELO: u32 = 100;

/// Expected score (in thousandths) of the higher-rated player, for rating gaps 0, 50, ..., 800:
/// round(1000 / (1 + 10^(-gap/400))). Gaps beyond 800 use the last value.
const EXPECTED_PERMILLE_BY_GAP: [i64; 17] = [
    500, 571, 640, 703, 760, 808, 849, 882, 909, 930, 947, 960, 969, 977, 983, 987, 990,
];
const GAP_STEP: i64 = 50;

/// Expected score, in thousandths, of a player rated `rating` against `opponent`. Linear between
/// table rows.
pub fn expected_permille(rating: u32, opponent: u32) -> i64 {
    let gap = i64::from(rating) - i64::from(opponent);
    let higher = expected_for_gap(gap.abs());
    if gap >= 0 {
        higher
    } else {
        1_000 - higher
    }
}

fn expected_for_gap(gap: i64) -> i64 {
    let row = usize::try_from(gap / GAP_STEP).unwrap_or(usize::MAX);
    let last = EXPECTED_PERMILLE_BY_GAP.len() - 1;
    if row >= last {
        return EXPECTED_PERMILLE_BY_GAP[last];
    }
    let low = EXPECTED_PERMILLE_BY_GAP[row];
    let high = EXPECTED_PERMILLE_BY_GAP[row + 1];
    low + (high - low) * (gap % GAP_STEP) / GAP_STEP
}

/// New ratings after a match. `ratings` and `scores` are in seat order.
pub fn updated_ratings(ratings: &[u32], scores: &[u64]) -> [u32; 4] {
    let mut new_ratings = [0u32; 4];
    let count = ratings.len().min(scores.len()).min(4);
    let opponents = i64::try_from(count.saturating_sub(1)).unwrap_or(1).max(1);
    for seat in 0..count {
        let mut change_thousandths: i64 = 0;
        for other in 0..count {
            if other == seat {
                continue;
            }
            // 1000 for a win, 500 for a draw, 0 for a loss.
            let actual = match scores[seat].cmp(&scores[other]) {
                core::cmp::Ordering::Greater => 1_000,
                core::cmp::Ordering::Equal => 500,
                core::cmp::Ordering::Less => 0,
            };
            change_thousandths += actual - expected_permille(ratings[seat], ratings[other]);
        }
        let change = change_thousandths * ELO_K_FACTOR / opponents / 1_000;
        let new_rating = (i64::from(ratings[seat]) + change).max(i64::from(MINIMUM_ELO));
        new_ratings[seat] = u32::try_from(new_rating).unwrap_or(u32::MAX);
    }
    new_ratings
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equal_players_expect_half_and_a_big_favourite_expects_most() {
        assert_eq!(expected_permille(1_200, 1_200), 500);
        assert_eq!(expected_permille(1_600, 1_200), 909);
        assert_eq!(expected_permille(1_200, 1_600), 91);
    }

    #[test]
    fn beating_an_equal_player_gains_half_the_k_factor() {
        let ratings = updated_ratings(&[1_200, 1_200], &[10, 5]);

        assert_eq!(&ratings[..2], &[1_216, 1_184]);
    }

    #[test]
    fn a_draw_between_equals_changes_nothing() {
        let ratings = updated_ratings(&[1_200, 1_200], &[7, 7]);

        assert_eq!(&ratings[..2], &[1_200, 1_200]);
    }

    #[test]
    fn in_a_four_player_match_the_winner_gains_and_the_last_loses() {
        let ratings = updated_ratings(&[1_200; 4], &[40, 30, 20, 10]);

        assert!(ratings[0] > 1_200);
        assert!(ratings[3] < 1_200);
        assert!(ratings[0] - 1_200 <= ELO_K_FACTOR as u32);
    }

    #[test]
    fn ratings_never_fall_below_the_floor() {
        let ratings = updated_ratings(&[MINIMUM_ELO, 2_000], &[0, 9]);

        assert_eq!(ratings[0], MINIMUM_ELO);
    }
}
