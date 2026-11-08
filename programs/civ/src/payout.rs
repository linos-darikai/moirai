//! Splitting the pot at settlement (PLAN.md section 5, "Payout"). Pure maths, no accounts, so it
//! is unit-tested directly.
//!
//! - Winner takes all: every civ with the top score shares the whole pot evenly.
//! - Top three: places 1, 2, 3 get 60%, 30%, 10%. Civs with equal scores share the places they
//!   cover (two tied for first share 60% + 30%). Knocked-out civs get nothing; a place nobody can
//!   take (fewer than 3 civs still in) goes to the winners.
//!
//! Rounding dust (at most a few lamports) goes to the first winner, so every lamport is paid out.

use crate::state::{Payout, MAX_PLAYERS};

/// Basis points in 100%.
const BPS_PER_WHOLE: u64 = 10_000;
/// Top-three shares of the pot, in bps, for places 1, 2 and 3.
pub const TOP_THREE_SHARES_BPS: [u64; 3] = [6_000, 3_000, 1_000];

/// One civ's result, as settlement needs it.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct FinalResult {
    pub score: u64,
    /// False for a civ knocked out of the game.
    pub is_alive: bool,
}

/// Lamports for each seat. `results` has one entry per player, in seat order.
pub fn split_pot(results: &[FinalResult], payout: Payout, pot: u64) -> [u64; MAX_PLAYERS] {
    let mut amounts = [0u64; MAX_PLAYERS];
    let shares = match payout {
        Payout::WinnerTakesAll => winner_takes_all_shares(results),
        Payout::TopThree => top_three_shares(results),
    };
    // Turn each seat's share (in bps of the pot) into lamports.
    let mut paid: u64 = 0;
    for (seat, share_bps) in shares.iter().enumerate() {
        let amount = mul_div(pot, *share_bps, BPS_PER_WHOLE);
        if let Some(slot) = amounts.get_mut(seat) {
            *slot = amount;
        }
        paid = paid.saturating_add(amount);
    }
    // Rounding dust goes to the first winner.
    if let Some(first) = first_winner(results) {
        if let Some(slot) = amounts.get_mut(first) {
            *slot = slot.saturating_add(pot.saturating_sub(paid));
        }
    }
    amounts
}

/// The seats with the top score among civs still in the game.
pub fn winners(results: &[FinalResult]) -> [bool; MAX_PLAYERS] {
    let mut is_winner = [false; MAX_PLAYERS];
    let Some(top) = results
        .iter()
        .filter(|result| result.is_alive)
        .map(|result| result.score)
        .max()
    else {
        return is_winner;
    };
    for (seat, result) in results.iter().enumerate() {
        if let Some(flag) = is_winner.get_mut(seat) {
            *flag = result.is_alive && result.score == top;
        }
    }
    is_winner
}

fn first_winner(results: &[FinalResult]) -> Option<usize> {
    winners(results).iter().position(|is_winner| *is_winner)
}

/// Each seat's share in bps: the winners split 100%.
fn winner_takes_all_shares(results: &[FinalResult]) -> [u64; MAX_PLAYERS] {
    let is_winner = winners(results);
    let winner_count = is_winner.iter().filter(|flag| **flag).count() as u64; // at most 4
    let mut shares = [0u64; MAX_PLAYERS];
    if winner_count == 0 {
        return shares;
    }
    for (share, is_winner) in shares.iter_mut().zip(is_winner) {
        if is_winner {
            *share = BPS_PER_WHOLE / winner_count;
        }
    }
    shares
}

/// Each seat's share in bps for a 60/30/10 split, with ties sharing the places they cover.
fn top_three_shares(results: &[FinalResult]) -> [u64; MAX_PLAYERS] {
    // Step 1: civs still in, best score first (lower seat first on a tie, which doesn't change
    // the money because tied civs share).
    let mut order: [usize; MAX_PLAYERS] = [0, 1, 2, 3];
    let count = results.len().min(MAX_PLAYERS);
    let ranked = &mut order[..count];
    ranked.sort_by(|a, b| {
        let score = |seat: &usize| results.get(*seat).map_or(0, |result| result.score);
        score(b).cmp(&score(a)).then(a.cmp(b))
    });

    // Step 2: walk down the ranking in groups of equal score; each group shares its places.
    let mut shares = [0u64; MAX_PLAYERS];
    let mut place = 0;
    let mut index = 0;
    while index < count {
        let seat = ranked[index];
        let Some(result) = results.get(seat) else {
            break;
        };
        if !result.is_alive {
            index += 1;
            continue;
        }
        let group_end = end_of_tie(results, ranked, index);
        let group_size = (group_end - index) as u64; // at most 4
        let mut group_bps: u64 = 0;
        for covered in place..place + (group_end - index) {
            group_bps += TOP_THREE_SHARES_BPS.get(covered).copied().unwrap_or(0);
        }
        for tied_seat in &ranked[index..group_end] {
            if let Some(share) = shares.get_mut(*tied_seat) {
                *share = group_bps / group_size;
            }
        }
        place += group_end - index;
        index = group_end;
    }

    // Step 3: places nobody took go to the winners.
    let given: u64 = shares.iter().sum();
    let leftover = BPS_PER_WHOLE.saturating_sub(given);
    let is_winner = winners(results);
    let winner_count = is_winner.iter().filter(|flag| **flag).count() as u64;
    if winner_count > 0 {
        for (share, is_winner) in shares.iter_mut().zip(is_winner) {
            if is_winner {
                *share += leftover / winner_count;
            }
        }
    }
    shares
}

/// The index just past the run of living civs tied with `ranked[start]`.
fn end_of_tie(results: &[FinalResult], ranked: &[usize], start: usize) -> usize {
    let score_at = |index: usize| ranked.get(index).and_then(|seat| results.get(*seat));
    let Some(first) = score_at(start) else {
        return start + 1;
    };
    let mut end = start + 1;
    while let Some(next) = score_at(end) {
        if !next.is_alive || next.score != first.score {
            break;
        }
        end += 1;
    }
    end
}

/// `value × numerator ÷ denominator` without overflowing (u128 in the middle).
fn mul_div(value: u64, numerator: u64, denominator: u64) -> u64 {
    if denominator == 0 {
        return 0;
    }
    let product = u128::from(value) * u128::from(numerator);
    u64::try_from(product / u128::from(denominator)).unwrap_or(u64::MAX)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn alive(score: u64) -> FinalResult {
        FinalResult {
            score,
            is_alive: true,
        }
    }

    fn out() -> FinalResult {
        FinalResult {
            score: 0,
            is_alive: false,
        }
    }

    #[test]
    fn the_winner_takes_the_whole_pot() {
        let amounts = split_pot(
            &[alive(5), alive(9), alive(2)],
            Payout::WinnerTakesAll,
            1_000,
        );

        assert_eq!(amounts, [0, 1_000, 0, 0]);
    }

    #[test]
    fn tied_winners_split_the_pot_and_the_dust_goes_to_the_first() {
        let amounts = split_pot(
            &[alive(9), alive(9), alive(9)],
            Payout::WinnerTakesAll,
            1_000,
        );

        assert_eq!(amounts, [334, 333, 333, 0]);
        assert_eq!(amounts.iter().sum::<u64>(), 1_000);
    }

    #[test]
    fn top_three_pays_sixty_thirty_ten() {
        let amounts = split_pot(
            &[alive(1), alive(9), alive(5), alive(7)],
            Payout::TopThree,
            1_000,
        );

        assert_eq!(amounts, [0, 600, 100, 300]);
    }

    #[test]
    fn two_tied_for_first_share_first_and_second_place() {
        let amounts = split_pot(
            &[alive(9), alive(9), alive(5), alive(1)],
            Payout::TopThree,
            1_000,
        );

        assert_eq!(amounts, [450, 450, 100, 0]);
    }

    #[test]
    fn with_two_players_the_unused_third_place_goes_to_the_winner() {
        let amounts = split_pot(&[alive(3), alive(8)], Payout::TopThree, 1_000);

        assert_eq!(amounts, [300, 700, 0, 0]);
    }

    #[test]
    fn a_knocked_out_civ_gets_nothing_and_its_place_goes_to_the_winner() {
        let amounts = split_pot(&[alive(8), out(), alive(3)], Payout::TopThree, 1_000);

        assert_eq!(amounts, [700, 0, 300, 0]);
    }

    #[test]
    fn every_lamport_of_the_pot_is_paid_out() {
        for pot in [0, 1, 7, 999_999_937] {
            let amounts = split_pot(&[alive(4), alive(4), alive(1)], Payout::TopThree, pot);

            assert_eq!(amounts.iter().sum::<u64>(), pot, "pot {pot}");
        }
    }
}
