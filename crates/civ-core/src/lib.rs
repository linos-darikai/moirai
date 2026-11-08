//! civ-core: every moirai game rule lives here (map generation, mining, units, battles, market,
//! policies, turns, scoring). The Solana program, the browser (through civ-wasm) and civ-cli all
//! call this crate, so they can never disagree about a result.
//!
//! Determinism rules every change must follow are in CLAUDE.md section 6: no floats, no
//! HashMap iteration, no system time or OS randomness, checked/saturating arithmetic.
//!
//! Modules (one topic each):
//! - `randomness`: deterministic random numbers from the match seed
//! - `resources`: Food / Ore / Gold and a civ's stock
//! - `units`: the four unit kinds and unit counts
//! - `civ`: one player's civilisation
//! - `map`: the 16 x 16 grid, tiles and coordinates
//! - `map_generation`: builds a fair starting map from the seed
//! - `aggregates`: what each civ owns, counted in one pass over the map per turn
//! - `production`: turn step 1, resources from owned deposits and cities
//! - `rules`: every rule number of the game (docs/decisions/0006)

pub mod aggregates;
pub mod civ;
pub mod map;
pub mod map_generation;
pub mod production;
pub mod randomness;
pub mod resources;
pub mod rules;
pub mod units;

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
