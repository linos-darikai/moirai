//! Targets: how the interpreter picks the tile or civ an action is aimed at (docs/decisions/0008,
//! "Actions"). Every choice is deterministic: equally near tiles go to the lower tile index
//! (row by row), equally strong civs to the lower civ index.

use super::{CivTarget, TileTarget};
use crate::civ::{Civ, CivId};
use crate::map::{Map, Tile, TileCoordinate, TILE_COUNT};
use crate::match_state::MatchState;

use super::interpreter::army_size;

/// The other living civ with the fewest (or most) fighting units, as an index into the civs.
pub fn choose_neighbor(state: &MatchState, civ_index: usize, target: CivTarget) -> Option<usize> {
    let mut best: Option<(usize, u64)> = None;
    for (index, other) in state.active_civs().iter().enumerate() {
        if index == civ_index || !other.is_alive() {
            continue;
        }
        let army = army_size(other);
        let is_better = match (best, target) {
            (None, _) => true,
            (Some((_, best_army)), CivTarget::WeakestNeighbor) => army < best_army,
            (Some((_, best_army)), CivTarget::StrongestNeighbor) => army > best_army,
        };
        if is_better {
            best = Some((index, army));
        }
    }
    best.map(|(index, _)| index)
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

/// The enemy tile to attack: the enemy's city next to the civ's land if there is one, otherwise
/// its plain tile next to the civ's land; nearest the capital either way.
pub fn attack_target(state: &MatchState, civ: &Civ, enemy_index: usize) -> Option<TileCoordinate> {
    let id = civ.id();
    let enemy = CivId(u8::try_from(enemy_index).ok()?);
    let is_enemy_border = |coordinate: TileCoordinate, tile: &Tile| {
        tile.owner() == Some(enemy) && touches_land(&state.map, id, coordinate)
    };
    let city = nearest_to_capital(state, civ, |coordinate, tile| {
        tile.is_city() && is_enemy_border(coordinate, tile)
    });
    city.or_else(|| nearest_to_capital(state, civ, is_enemy_border))
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
