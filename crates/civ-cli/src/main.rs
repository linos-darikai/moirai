//! civ-cli: runs local matches between YAML bots and prints the map as text each turn.
//!
//! For now it generates the starting map from a seed and prints it, so you can see what map
//! generation produces. Match running arrives later in Phase 1 (PLAN.md section 9).
//!
//! Usage: `cargo run -p civ-cli -- [seed-byte] [civ-count]` (defaults: 42 and 4). The seed byte
//! fills all 32 seed bytes; real matches get their seed from the VRF oracle.

use civ_core::map::{Map, Tile, TileCoordinate, MAP_HEIGHT, MAP_WIDTH};
use civ_core::map_generation::generate_map;
use civ_core::randomness::{MatchSeed, MATCH_SEED_LENGTH};

/// Entry point, like `main()` in a Node script.
fn main() {
    println!("{}", civ_core::describe_engine());

    // Read optional arguments; fall back to the defaults if they're missing or not numbers.
    let arguments: Vec<String> = std::env::args().collect();
    let seed_byte: u8 = parse_argument(&arguments, 1).unwrap_or(42);
    let civ_count: u8 = parse_argument(&arguments, 2).unwrap_or(4);

    let seed = MatchSeed([seed_byte; MATCH_SEED_LENGTH]);
    match generate_map(&seed, civ_count) {
        Ok(map) => {
            println!(
                "seed byte {seed_byte}, {civ_count} civs, fingerprint {}",
                map.fingerprint()
            );
            println!("{}", render_map(&map));
            println!("legend: 0-3 = city of civ N, F/O/G = Food/Ore/Gold deposit, . = empty");
        }
        Err(error) => eprintln!("could not generate the map: {error:?}"),
    }
}

/// Parses the argument at `position` as a number, or `None` if it's missing or invalid.
/// `<T: std::str::FromStr>` means "any type that can be parsed from text" (u8, usize, ...).
fn parse_argument<T: std::str::FromStr>(arguments: &[String], position: usize) -> Option<T> {
    arguments.get(position)?.parse().ok()
}

/// Draws the map as 16 lines of 16 characters (with a space between tiles for readability).
fn render_map(map: &Map) -> String {
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

/// One character for a tile: the owner's number for a city, a resource letter for a deposit,
/// '.' for an empty tile.
fn tile_symbol(tile: &Tile) -> char {
    if tile.is_city() {
        if let Some(owner) = tile.owner() {
            // Civ ids are 0-3, so this gives '0'..'3' ('?' if that ever stops being true).
            return char::from_digit(u32::from(owner.0), 10).unwrap_or('?');
        }
    }
    match tile.deposit() {
        Some(resource) => resource.letter(),
        None => '.',
    }
}
