//! civ-core: every moirai game rule lives here (map generation, mining, units, battles, market,
//! policies, turns, scoring). The Solana program, the browser (through civ-wasm) and civ-cli all
//! call this crate, so they can never disagree about a result.
//!
//! Phase 0: only a placeholder so the other crates have something to call. Game rules start in
//! Phase 1 (see PLAN.md section 9). Determinism rules: CLAUDE.md section 6.

/// The version of the game rules, taken from this crate's Cargo.toml. Shown in the app and CLI so
/// you can tell which rules a build is running.
pub const ENGINE_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Placeholder that proves civ-core can be called from WASM and the CLI.
/// Returns a short greeting that includes the engine version.
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
