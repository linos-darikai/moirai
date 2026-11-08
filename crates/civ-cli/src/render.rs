//! Drawing the game as text: the 16 x 16 board and one summary line per civ.

use civ_core::aggregates::aggregate_map;
use civ_core::map::{Map, Tile, TileCoordinate, MAP_HEIGHT, MAP_WIDTH};
use civ_core::match_state::MatchState;
use civ_core::policy::interpreter::army_size;

/// What each board character means, printed under the first board.
pub const LEGEND: &str = "legend: 0-3 = city of civ N, a-d = land of civ 0-3, \
s = free city site, F/O/G = free Food/Ore/Gold deposit, . = free land";

/// Draws the map as 16 lines of 16 characters (with a space between tiles for readability).
pub fn render_map(map: &Map) -> String {
    let mut text = String::new();
    for y in 0..MAP_HEIGHT {
        for x in 0..MAP_WIDTH {
            // `new` checks the bounds; `if let Some(..)` only runs the block when it succeeded.
            if let Some(coordinate) = TileCoordinate::new(x, y) {
                text.push(tile_symbol(map.tile(coordinate)));
                text.push(' ');
            }
        }
        text.push('\n');
    }
    text
}

/// One character for a tile: a city shows its owner's number, owned land its owner's letter,
/// free tiles a site / resource mark or '.'.
fn tile_symbol(tile: &Tile) -> char {
    if let Some(owner) = tile.owner() {
        if tile.is_city() {
            // Civ ids are 0-3, so this gives '0'..'3' ('?' if that ever stops being true).
            return char::from_digit(u32::from(owner.0), 10).unwrap_or('?');
        }
        // 'a' + civ id: civ 0 is 'a', civ 3 is 'd'.
        return char::from(b'a'.saturating_add(owner.0));
    }
    if tile.is_city_site() {
        return 's';
    }
    match tile.deposit() {
        Some(resource) => resource.letter(),
        None => '.',
    }
}

/// One line per civ: name, whether it is still in, cities, tiles, army, stock and coins.
pub fn render_civs(state: &MatchState, names: &[String]) -> String {
    let aggregates = aggregate_map(&state.map);
    let mut text = String::new();
    for (index, civ) in state.active_civs().iter().enumerate() {
        let name = names.get(index).map_or("?", String::as_str);
        let status = if civ.is_alive() { "" } else { "  (out)" };
        text.push_str(&format!(
            "  {index} {name:<14} cities {:>1}  tiles {:>3}  army {:>3}  food {:>4}  ore {:>4}  gold {:>4}  coins {:>4}{status}\n",
            civ.city_count(),
            aggregates.for_civ(civ.id()).tiles_owned,
            army_size(civ),
            civ.resources.food,
            civ.resources.ore,
            civ.resources.gold,
            civ.coins,
        ));
    }
    text
}
