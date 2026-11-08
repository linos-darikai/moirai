//! civ-core: every moirai game rule lives here (map generation, mining, units, battles, market,
//! policies, turns, scoring). The Solana program, the browser (through civ-wasm) and civ-cli all
//! call this crate, so they can never disagree about a result.
//!
//! Determinism rules every change must follow are in CLAUDE.md section 6: no floats, no
//! HashMap iteration, no system time or OS randomness, checked/saturating arithmetic.
//!
//! Modules (one topic each):
//! - `actions`: what a civ can do on its turn (build_unit, found_city), checks first
//! - `attack`: the attack action (checks, defenders, battle, result)
//! - `battle`: battle maths (strengths, rolls, losses)
//! - `conquest`: after a won battle: capture or raze, plunder, new capital, elimination
//! - `randomness`: deterministic random numbers from the match seed
//! - `resources`: Food / Ore / Gold and a civ's stock
//! - `units`: the four unit kinds and unit counts
//! - `builds`: one build per city, paid up front; rushing with coins; turn step 3 finishes builds
//! - `city`: one city of a civ (size, growth, capital flag)
//! - `civ`: one player's civilisation, with up to 8 cities
//! - `map`: the 16 x 16 grid, tiles and coordinates
//! - `map_generation`: builds a fair starting map from the seed
//! - `market`: the shared market; prices from supply, sell and buy for coins
//! - `match_state`: the whole match in one plain-bytes struct (seed, turn, market, civs, map)
//! - `match_start`: turn 0 of a match, the map and every civ with its capital
//! - `borders`: the tiles within a city's reach; claiming the free ones
//! - `growth`: turn step 3, cities grow and borders extend (and lock where they meet)
//! - `aggregates`: what each civ owns, counted in one pass over the map per turn
//! - `orders`: the `Action` enum, each civ's orders for a turn, applying one action
//! - `policy`: rules players write (format, compiler behind the `compiler` feature, interpreter)
//! - `production`: turn step 1, resources from owned deposits and cities
//! - `turn`: `run_turn`, the seven steps of one turn
//! - `upkeep`: turn step 6, units eat food; starving civs disband units
//! - `rules`: every rule number of the game (docs/decisions/0006)

pub mod actions;
pub mod aggregates;
pub mod attack;
pub mod battle;
pub mod borders;
pub mod builds;
pub mod city;
pub mod civ;
pub mod conquest;
pub mod growth;
pub mod map;
pub mod map_generation;
pub mod market;
pub mod match_start;
pub mod match_state;
pub mod orders;
pub mod policy;
pub mod production;
pub mod randomness;
pub mod resources;
pub mod rules;
pub mod turn;
pub mod units;
pub mod upkeep;

/// The version of the game rules, taken from this crate's Cargo.toml. Shown in the app and CLI so
/// you can tell which rules a build is running.
pub const ENGINE_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Short description of the engine, shown by the app's connection check and the CLI.
pub fn describe_engine() -> String {
    // `format!` builds a String, like a TypeScript template literal.
    format!("civ-core {ENGINE_VERSION}: game rules ready")
}

// `#[cfg(test)]` means: only compile this module when running `cargo test`.
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn describe_engine_mentions_the_engine_version() {
        let description: String = describe_engine();

        assert!(description.contains(ENGINE_VERSION));
    }
}
