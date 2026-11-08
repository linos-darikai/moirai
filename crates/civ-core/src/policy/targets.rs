//! Targets: how the interpreter picks the tile or civ an action is aimed at (docs/decisions/0008,
//! "Actions"). Every choice is deterministic: equally near tiles go to the lower tile index
//! (row by row), equally strong civs to the lower civ index.

use super::interpreter::army_size;
use super::{AttackObjective, CivTarget, TileTarget};
use crate::aggregates::MapAggregates;
use crate::civ::{Civ, CivId};
use crate::map::{Map, Tile, TileCoordinate, TILE_COUNT};
use crate::match_state::MatchState;
use crate::scoring::{civ_score, wealth, WinMetric};

/// The other living civ that `target` picks, as an index into the civs (lower index on a tie).
pub fn choose_neighbor(
    state: &MatchState,
    aggregates: &MapAggregates,
    civ_index: usize,
    target: CivTarget,
) -> Option<usize> {
    let me = state.active_civs().get(civ_index)?;
    let mut best: Option<(usize, u64)> = None;
    for (index, other) in state.active_civs().iter().enumerate() {
        if index == civ_index || !other.is_alive() {
            continue;
        }
        let rank = civ_rank(state, aggregates, me, other, target);
        // Every target is "the biggest rank wins" (smallest-is-best targets negate in civ_rank).
        if best.is_none_or(|(_, best_rank)| rank > best_rank) {
            best = Some((index, rank));
        }
    }
    best.map(|(index, _)| index)
}

/// How much `target` wants `other`: bigger is chosen. "Fewest" and "nearest" targets turn the
/// number around (u64::MAX - n) so one comparison serves every target.
fn civ_rank(
    state: &MatchState,
    aggregates: &MapAggregates,
    me: &Civ,
    other: &Civ,
    target: CivTarget,
) -> u64 {
    match target {
        CivTarget::WeakestNeighbor => u64::MAX - army_size(other),
        CivTarget::StrongestNeighbor => army_size(other),
        CivTarget::NearestEnemy => u64::MAX - u64::from(land_distance(&state.map, me, other.id())),
        CivTarget::RichestEnemy => wealth(other, &state.market),
        CivTarget::LargestEnemy => u64::from(aggregates.for_civ(other.id()).tiles_owned),
        CivTarget::Leader => civ_score(other, aggregates, &state.market, WinMetric::Score),
    }
}

/// Tiles from `me`'s capital to the nearest tile `other` owns (u8::MAX if either is missing).
pub fn land_distance(map: &Map, me: &Civ, other: CivId) -> u8 {
    let Some(capital) = me.capital().and_then(|city| city.tile()) else {
        return u8::MAX;
    };
    let mut nearest = u8::MAX;
    for index in 0..TILE_COUNT {
        let Some(tile) = TileCoordinate::from_index(index) else {
            continue;
        };
        if map.tile(tile).owner() == Some(other) {
            nearest = nearest.min(capital.manhattan_distance(tile));
        }
    }
    nearest
}

/// The free city site (or one of the civ's own empty sites) in or next to its land, nearest its
/// capital.
pub fn nearest_free_city_site(state: &MatchState, civ: &Civ) -> Option<TileCoordinate> {
    let id = civ.id();
    nearest_to_capital(state, civ, |coordinate, tile| {
        let is_free_or_mine = tile.owner().is_none() || tile.owner() == Some(id);
        tile.is_city_site()
            && !tile.is_city()
            && is_free_or_mine
            && (tile.owner() == Some(id) || touches_land(&state.map, id, coordinate))
    })
}

/// The free tile next to the civ's land nearest its capital: a deposit tile for
/// `NearestDeposit`, any tile for `NearestFree`.
pub fn nearest_claimable_tile(
    state: &MatchState,
    civ: &Civ,
    target: TileTarget,
) -> Option<TileCoordinate> {
    let id = civ.id();
    nearest_to_capital(state, civ, |coordinate, tile| {
        let is_wanted = match target {
            TileTarget::NearestDeposit => tile.deposit().is_some(),
            TileTarget::NearestFree => true,
        };
        tile.owner().is_none() && is_wanted && touches_land(&state.map, id, coordinate)
    })
}

/// The enemy tile an attack marches on (docs/decisions/0010): their tile nearest your capital
/// (`Border`), their city nearest your capital (`City`), or their capital (`Capital`). No border
/// is needed: expeditions march through any land.
pub fn attack_target(
    state: &MatchState,
    civ: &Civ,
    enemy_index: usize,
    objective: AttackObjective,
) -> Option<TileCoordinate> {
    let enemy_civ = state.active_civs().get(enemy_index)?;
    let enemy = enemy_civ.id();
    match objective {
        AttackObjective::Capital => enemy_civ.capital().and_then(|city| city.tile()),
        AttackObjective::City => nearest_to_capital(state, civ, |_, tile| {
            tile.is_city() && tile.owner() == Some(enemy)
        }),
        AttackObjective::Border => {
            nearest_to_capital(state, civ, |_, tile| tile.owner() == Some(enemy))
        }
    }
}

/// The accepted tile nearest the civ's capital (lowest tile index on a tie). Scans the map once.
///
/// `accept: impl Fn(...) -> bool` is a callback that says whether a tile qualifies, like
/// `(coordinate, tile) => boolean` in TypeScript.
fn nearest_to_capital(
    state: &MatchState,
    civ: &Civ,
    accept: impl Fn(TileCoordinate, &Tile) -> bool,
) -> Option<TileCoordinate> {
    let capital = civ.capital().and_then(|city| city.tile());
    let mut best: Option<(TileCoordinate, u8)> = None;
    for index in 0..TILE_COUNT {
        let Some(coordinate) = TileCoordinate::from_index(index) else {
            continue;
        };
        if !accept(coordinate, state.map.tile(coordinate)) {
            continue;
        }
        let distance = capital.map_or(0, |capital| capital.manhattan_distance(coordinate));
        let is_nearer = best.is_none_or(|(_, best_distance)| distance < best_distance);
        if is_nearer {
            best = Some((coordinate, distance));
        }
    }
    best.map(|(coordinate, _)| coordinate)
}

/// True if a tile sharing an edge with `coordinate` belongs to `civ`.
fn touches_land(map: &Map, civ: CivId, coordinate: TileCoordinate) -> bool {
    for neighbor in coordinate.neighbors().into_iter().flatten() {
        if map.tile(neighbor).owner() == Some(civ) {
            return true;
        }
    }
    false
}
