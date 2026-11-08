//! Scoring: who wins a match under each win metric, after the last turn (docs/decisions/0006
//! section 7, 0008 "Scoring"). The program reads `final_standings` in `settle_match` to pay out.
//!
//! - Territory: tiles owned.
//! - Wealth: coins + every resource valued at the final market price (whole coins, rounded down).
//! - Conquest: last civ standing; among several survivors, most tiles.
//! - Score: tiles × 3 + wealth ÷ 10 + Σ units × (attack + defence).
//!
//! Knocked-out civs score 0. Every civ with the top score is a winner (the prize is split).

use crate::aggregates::{aggregate_map, MapAggregates};
use crate::civ::{Civ, MAX_CIVS};
use crate::market::Market;
use crate::match_state::MatchState;
use crate::resources::Resource;
use crate::rules::{unit_stats, BPS_PER_WHOLE, SCORE_TILE_WEIGHT, SCORE_WEALTH_DIVISOR};
use crate::units::UnitKind;

/// How a match is won, chosen when the match is created.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum WinMetric {
    Territory,
    Wealth,
    Conquest,
    Score,
}

/// Every civ's final score and whether it won.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Standings {
    /// `scores[i]` is civ i's score (0 for unused slots and knocked-out civs).
    pub scores: [u64; MAX_CIVS],
    /// `is_winner[i]` is true for every civ with the top score.
    pub is_winner: [bool; MAX_CIVS],
}

/// Scores every civ under `metric` and marks the winners.
pub fn final_standings(state: &MatchState, metric: WinMetric) -> Standings {
    let aggregates = aggregate_map(&state.map);
    let mut scores = [0; MAX_CIVS];
    for (index, civ) in state.active_civs().iter().enumerate() {
        if let Some(score) = scores.get_mut(index) {
            *score = civ_score(civ, &aggregates, &state.market, metric);
        }
    }

    let top_score = scores.iter().copied().max().unwrap_or(0);
    let mut is_winner = [false; MAX_CIVS];
    for (index, civ) in state.active_civs().iter().enumerate() {
        let score = scores.get(index).copied().unwrap_or(0);
        if let Some(winner) = is_winner.get_mut(index) {
            *winner = civ.is_alive() && score == top_score;
        }
    }
    Standings { scores, is_winner }
}

/// One civ's score under `metric`.
pub fn civ_score(civ: &Civ, aggregates: &MapAggregates, market: &Market, metric: WinMetric) -> u64 {
    if !civ.is_alive() {
        return 0;
    }
    let tiles = u64::from(aggregates.for_civ(civ.id()).tiles_owned);
    match metric {
        // Conquest and Territory rank survivors the same way (by tiles); they differ in what
        // players aim for, and Conquest ends early when one civ is left (MatchState::is_finished).
        WinMetric::Territory | WinMetric::Conquest => tiles,
        WinMetric::Wealth => wealth(civ, market),
        WinMetric::Score => {
            let from_tiles = tiles.saturating_mul(u64::from(SCORE_TILE_WEIGHT));
            let from_wealth = wealth(civ, market) / u64::from(SCORE_WEALTH_DIVISOR);
            from_tiles
                .saturating_add(from_wealth)
                .saturating_add(army_strength(civ))
        }
    }
}

/// Coins plus every resource valued at the market's current price, in whole coins.
pub fn wealth(civ: &Civ, market: &Market) -> u64 {
    let mut value_bps: u64 = 0;
    for resource in Resource::ALL {
        let amount = u64::from(civ.resources.amount(resource));
        value_bps = value_bps.saturating_add(amount.saturating_mul(market.price_bps(resource)));
    }
    u64::from(civ.coins).saturating_add(value_bps / u64::from(BPS_PER_WHOLE))
}

/// Σ units × (attack + defence), for the Score metric.
pub fn army_strength(civ: &Civ) -> u64 {
    let mut total: u64 = 0;
    for kind in UnitKind::ALL {
        let stats = unit_stats(kind);
        let per_unit = u64::from(stats.attack.saturating_add(stats.defence));
        total = total.saturating_add(u64::from(civ.units.count(kind)).saturating_mul(per_unit));
    }
    total
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::civ::CivId;
    use crate::map::TileCoordinate;
    use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};
    use crate::resources::ResourceStock;

    fn new_match() -> MatchState {
        MatchState::new(&MatchSeed([5; MATCH_SEED_LENGTH]), 2).expect("valid count")
    }

    #[test]
    fn wealth_counts_coins_and_resources_at_market_prices() {
        let mut civ = Civ::new(CivId(0), TileCoordinate::new(3, 3).expect("on the map"));
        civ.coins = 7;
        civ.resources = ResourceStock {
            food: 10,
            ore: 4,
            gold: 2,
        };

        let value = wealth(&civ, &Market::OPENING);

        // 7 + 10 × 1.00 + 4 × 1.25 + 2 × 1.50 = 25
        assert_eq!(value, 25);
    }

    #[test]
    fn army_strength_adds_attack_and_defence_of_every_unit() {
        let mut civ = Civ::new(CivId(0), TileCoordinate::new(3, 3).expect("on the map"));
        civ.units.add(UnitKind::Guard, 2);
        civ.units.add(UnitKind::Elite, 1);

        assert_eq!(army_strength(&civ), 2 * (2 + 5) + (8 + 8));
    }

    #[test]
    fn at_the_start_every_civ_ties_and_all_of_them_win() {
        let state = new_match();

        for metric in [
            WinMetric::Territory,
            WinMetric::Wealth,
            WinMetric::Conquest,
            WinMetric::Score,
        ] {
            let standings = final_standings(&state, metric);

            assert_eq!(standings.scores[0], standings.scores[1], "{metric:?}");
            assert_eq!(standings.is_winner, [true, true, false, false]);
        }
    }

    #[test]
    fn the_civ_with_more_land_wins_territory() {
        let mut state = new_match();
        let extra = TileCoordinate::new(7, 7).expect("on the map");
        state.map.tile_mut(extra).set_owner(Some(CivId(1)));

        let standings = final_standings(&state, WinMetric::Territory);

        assert_eq!(standings.scores[1], standings.scores[0] + 1);
        assert_eq!(standings.is_winner, [false, true, false, false]);
    }

    #[test]
    fn a_knocked_out_civ_scores_zero_and_cannot_win() {
        let mut state = new_match();
        state.civs[0].set_alive(false);

        let standings = final_standings(&state, WinMetric::Wealth);

        assert_eq!(standings.scores[0], 0);
        assert_eq!(standings.is_winner, [false, true, false, false]);
    }
}
