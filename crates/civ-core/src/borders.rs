//! Borders: the tiles a city reaches (docs/decisions/0006, "Cities, growth and borders").
//!
//! A city of size s reaches every tile within Manhattan distance `border_radius(s)` (s + 1). It
//! claims only tiles nobody owns: growing never takes land from another civ. Used by match start
//! (the capital's first border), city growth, and later founding a city.

use crate::civ::CivId;
use crate::map::{Map, TileCoordinate, MAP_HEIGHT, MAP_WIDTH};

/// Calls `visit` once for every tile within `radius` Manhattan steps of `center`, row by row.
///
/// `impl FnMut(TileCoordinate)` means "any function that takes a tile", like passing a callback
/// `(tile: TileCoordinate) => void` in TypeScript. `FnMut` lets the callback change variables it
/// captured (a counter, the map).
///
/// Scans only the square around the center (at most 13 x 13 tiles for radius 6), not the whole
/// map, to keep the turn cheap on chain.
pub fn for_each_tile_within(
    center: TileCoordinate,
    radius: u8,
    mut visit: impl FnMut(TileCoordinate),
) {
    // Clamp the square to the map edges. saturating_sub stops at 0 instead of going negative.
    let min_x = center.x.saturating_sub(radius);
    let max_x = center.x.saturating_add(radius).min(MAP_WIDTH - 1);
    let min_y = center.y.saturating_sub(radius);
    let max_y = center.y.saturating_add(radius).min(MAP_HEIGHT - 1);

    for y in min_y..=max_y {
        for x in min_x..=max_x {
            // Inside the clamped square, so always on the map.
            let tile = TileCoordinate { x, y };
            if tile.manhattan_distance(center) <= radius {
                visit(tile);
            }
        }
    }
}

/// How many tiles within `radius` of `center` nobody owns yet (what a border of that radius
/// would gain).
pub fn count_unowned_tiles_within(map: &Map, center: TileCoordinate, radius: u8) -> u16 {
    let mut count: u16 = 0;
    for_each_tile_within(center, radius, |tile| {
        if map.tile(tile).owner().is_none() {
            count = count.saturating_add(1);
        }
    });
    count
}

/// Gives `civ` every unowned tile within `radius` of `center`. Returns how many it claimed.
pub fn claim_unowned_tiles_within(
    map: &mut Map,
    civ: CivId,
    center: TileCoordinate,
    radius: u8,
) -> u16 {
    let mut claimed: u16 = 0;
    for_each_tile_within(center, radius, |tile| {
        let tile = map.tile_mut(tile);
        if tile.owner().is_none() {
            tile.set_owner(Some(civ));
            claimed = claimed.saturating_add(1);
        }
    });
    claimed
}

/// How many deposit tiles `civ` owns within `radius` of `center` (feeds city growth).
pub fn count_owned_deposits_within(
    map: &Map,
    civ: CivId,
    center: TileCoordinate,
    radius: u8,
) -> u16 {
    let mut count: u16 = 0;
    for_each_tile_within(center, radius, |tile| {
        let tile = map.tile(tile);
        if tile.owner() == Some(civ) && tile.deposit().is_some() {
            count = count.saturating_add(1);
        }
    });
    count
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::resources::Resource;

    fn coordinate(x: u8, y: u8) -> TileCoordinate {
        TileCoordinate::new(x, y).expect("test coordinates are on the map")
    }

    #[test]
    fn a_radius_two_border_in_open_land_covers_thirteen_tiles() {
        // A diamond of radius r has 2r(r+1) + 1 tiles: 13 for r = 2.
        let mut visited = 0;

        for_each_tile_within(coordinate(8, 8), 2, |_| visited += 1);

        assert_eq!(visited, 13);
    }

    #[test]
    fn a_border_in_the_corner_is_cut_off_by_the_map_edge() {
        // Only the quarter of the diamond that is on the map: (0,0), (1,0), (2,0), (0,1), (1,1), (0,2).
        let mut visited = 0;

        for_each_tile_within(coordinate(0, 0), 2, |_| visited += 1);

        assert_eq!(visited, 6);
    }

    #[test]
    fn claiming_skips_tiles_another_civ_owns() {
        let mut map = Map::empty();
        map.tile_mut(coordinate(9, 8)).set_owner(Some(CivId(1)));

        let claimed = claim_unowned_tiles_within(&mut map, CivId(0), coordinate(8, 8), 1);

        assert_eq!(claimed, 4);
        assert_eq!(map.tile(coordinate(9, 8)).owner(), Some(CivId(1)));
        assert_eq!(map.tile(coordinate(7, 8)).owner(), Some(CivId(0)));
        assert_eq!(count_unowned_tiles_within(&map, coordinate(8, 8), 1), 0);
    }

    #[test]
    fn only_deposits_the_civ_owns_count() {
        let mut map = Map::empty();
        for (x, owner) in [(9, Some(CivId(0))), (7, Some(CivId(1))), (10, None)] {
            let tile = map.tile_mut(coordinate(x, 8));
            tile.set_deposit(Some(Resource::Food));
            tile.set_owner(owner);
        }

        let count = count_owned_deposits_within(&map, CivId(0), coordinate(8, 8), 2);

        assert_eq!(count, 1);
    }
}
