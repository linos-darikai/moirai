//! civ-wasm: exposes civ-core to JavaScript. Every function here only converts arguments and calls
//! civ-core; the game logic stays in civ-core. The app imports the built package only from
//! `app/src/lib/engine/`.

use civ_core::map_generation::generate_map;
use civ_core::match_state::MatchState;
use civ_core::policy::interpreter::play_until_finished;
use civ_core::randomness::{MatchSeed, MATCH_SEED_LENGTH};
use wasm_bindgen::prelude::*;

/// Returns civ-core's engine description. Phase 0 placeholder used by the app's toolchain page.
///
/// `#[wasm_bindgen]` generates the JavaScript glue, so the app can call `describeEngine()`.
#[wasm_bindgen(js_name = describeEngine)]
pub fn describe_engine() -> String {
    civ_core::describe_engine()
}

/// Generates the starting map and returns its raw tile bytes (768 bytes: owner, deposit, flags per
/// tile, row by row; see `civ_core::map::Tile`). The app decodes them to draw the map board.
#[wasm_bindgen(js_name = mapTiles)]
pub fn map_tiles(seed_bytes: &[u8], civ_count: u8) -> Result<Vec<u8>, JsError> {
    let seed_array: [u8; MATCH_SEED_LENGTH] = seed_bytes
        .try_into()
        .map_err(|_| JsError::new("the seed must be exactly 32 bytes"))?;

    let map = generate_map(&MatchSeed(seed_array), civ_count)
        .map_err(|_| JsError::new("civ count must be between 1 and 4"))?;

    Ok(map.as_bytes().to_vec())
}

/// Generates the starting map for `civ_count` civs from a 32-byte seed and returns its fingerprint
/// as a decimal string (a string because JavaScript numbers can't hold every 64-bit value).
/// Used to check the WASM build makes exactly the same map as native Rust.
#[wasm_bindgen(js_name = mapFingerprint)]
pub fn map_fingerprint(seed_bytes: &[u8], civ_count: u8) -> Result<String, JsError> {
    // `try_into` turns the byte slice into a fixed 32-byte array, failing if the length is wrong.
    let seed_array: [u8; MATCH_SEED_LENGTH] = seed_bytes
        .try_into()
        .map_err(|_| JsError::new("the seed must be exactly 32 bytes"))?;

    let map = generate_map(&MatchSeed(seed_array), civ_count)
        .map_err(|_| JsError::new("civ count must be between 1 and 4"))?;

    Ok(map.fingerprint().to_string())
}

/// Compiles a YAML policy and returns its bytes (what a player commits to and reveals). Throws a
/// JavaScript error listing every problem, one `line N: ...` per line, if the YAML is wrong.
#[wasm_bindgen(js_name = compilePolicy)]
pub fn compile_policy(yaml: &str) -> Result<Vec<u8>, JsError> {
    civ_core::policy::compiler::compile_policy(yaml)
        .map(|compiled| compiled.bytes)
        .map_err(|errors| JsError::new(&problem_lines(&errors)))
}

/// Every problem in a YAML policy, one string each: `line<TAB>code<TAB>detail` (line 0 = the whole
/// policy; `code` is a stable name like `unknownValue`; `detail` is the word it is about, or
/// empty). An empty list means the policy compiles. The editor turns these into translated text.
#[wasm_bindgen(js_name = policyProblems)]
pub fn policy_problems(yaml: &str) -> Vec<String> {
    let Err(errors) = civ_core::policy::compiler::compile_policy(yaml) else {
        return Vec::new();
    };
    errors
        .iter()
        .map(|error| {
            format!(
                "{}\t{}\t{}",
                error.line,
                error.problem.code(),
                error.problem.detail()
            )
        })
        .collect()
}

/// Plays a whole match between YAML bots (in join order) from a 32-byte seed and returns the
/// final state's fingerprint as a decimal string. Used to check the WASM build plays exactly like
/// native Rust (see crates/civ-core/tests/sample_bots_match.rs).
#[wasm_bindgen(js_name = matchFingerprint)]
pub fn match_fingerprint(seed_bytes: &[u8], bots_yaml: Vec<String>) -> Result<String, JsError> {
    let seed_array: [u8; MATCH_SEED_LENGTH] = seed_bytes
        .try_into()
        .map_err(|_| JsError::new("the seed must be exactly 32 bytes"))?;

    let mut compiled: Vec<Vec<u8>> = Vec::new();
    for yaml in &bots_yaml {
        let policy = civ_core::policy::compiler::compile_policy(yaml)
            .map_err(|errors| JsError::new(&problem_lines(&errors)))?;
        compiled.push(policy.bytes);
    }
    let policies: Vec<&[u8]> = compiled.iter().map(Vec::as_slice).collect();

    let civ_count =
        u8::try_from(policies.len()).map_err(|_| JsError::new("at most 4 bots can play"))?;
    let mut state = MatchState::new(&MatchSeed(seed_array), civ_count)
        .map_err(|_| JsError::new("between 1 and 4 bots can play"))?;
    play_until_finished(&mut state, &policies);
    Ok(state.fingerprint().to_string())
}

/// Every compile problem as `line N: ...`, one per line.
fn problem_lines(errors: &[civ_core::policy::compiler::CompileError]) -> String {
    let lines: Vec<String> = errors.iter().map(ToString::to_string).collect();
    lines.join("\n")
}

/// Numbers per civ in `Simulation::civStats`, in this order: alive (0/1), tiles, cities, army,
/// food, ore, gold, coins, wealth, units on the march, march x, march y (x and y are -1 when no
/// army is out).
pub const CIV_STAT_COUNT: usize = 12;

/// A simulated match (civ-core `simulate_match`), kept in WASM memory; JavaScript reads one turn
/// at a time. `#[wasm_bindgen]` on a struct makes it a JavaScript class.
#[wasm_bindgen]
pub struct Simulation {
    inner: civ_core::simulation::Simulation,
    civ_count: usize,
}

#[wasm_bindgen]
impl Simulation {
    /// How many snapshots there are: the start plus one per turn played.
    #[wasm_bindgen(js_name = snapshotCount)]
    pub fn snapshot_count(&self) -> usize {
        self.inner.snapshots.len()
    }

    /// The map's 768 tile bytes after `index` turns (empty if out of range).
    #[wasm_bindgen(js_name = mapTiles)]
    pub fn map_tiles(&self, index: usize) -> Vec<u8> {
        self.inner
            .snapshots
            .get(index)
            .map(|snapshot| snapshot.map.as_bytes().to_vec())
            .unwrap_or_default()
    }

    /// Every civ's numbers after `index` turns: CIV_STAT_COUNT per civ, civ 0 first. Numbers are
    /// f64 because JavaScript has no u64.
    #[wasm_bindgen(js_name = civStats)]
    pub fn civ_stats(&self, index: usize) -> Vec<f64> {
        let Some(snapshot) = self.inner.snapshots.get(index) else {
            return Vec::new();
        };
        let mut stats = Vec::with_capacity(self.civ_count * CIV_STAT_COUNT);
        for civ in snapshot.civs.iter().take(self.civ_count) {
            stats.extend_from_slice(&[
                f64::from(u8::from(civ.is_alive)),
                f64::from(civ.tiles),
                f64::from(civ.cities),
                f64::from(civ.army),
                f64::from(civ.resources.food),
                f64::from(civ.resources.ore),
                f64::from(civ.resources.gold),
                f64::from(civ.coins),
                civ.wealth as f64, // only for display; exact up to 2^53
                f64::from(civ.marching),
                civ.army_position.map_or(-1.0, |tile| f64::from(tile.x())),
                civ.army_position.map_or(-1.0, |tile| f64::from(tile.y())),
            ]);
        }
        stats
    }

    /// How many turns each of civ `civ`'s rules acted, rule 1 first.
    #[wasm_bindgen(js_name = ruleCounts)]
    pub fn rule_counts(&self, civ: usize) -> Vec<u32> {
        self.inner
            .rule_counts
            .get(civ)
            .map(|counts| counts.to_vec())
            .unwrap_or_default()
    }

    /// The final state's fingerprint, as a decimal string.
    pub fn fingerprint(&self) -> String {
        self.inner.final_state.fingerprint().to_string()
    }
}

/// Simulates a whole match between YAML bots (civ 0 first) from a 32-byte seed, recording every
/// turn for the simulator page.
#[wasm_bindgen(js_name = simulateMatch)]
pub fn simulate_match(seed_bytes: &[u8], bots_yaml: Vec<String>) -> Result<Simulation, JsError> {
    let seed_array: [u8; MATCH_SEED_LENGTH] = seed_bytes
        .try_into()
        .map_err(|_| JsError::new("the seed must be exactly 32 bytes"))?;
    let mut compiled: Vec<Vec<u8>> = Vec::new();
    for yaml in &bots_yaml {
        let policy = civ_core::policy::compiler::compile_policy(yaml)
            .map_err(|errors| JsError::new(&problem_lines(&errors)))?;
        compiled.push(policy.bytes);
    }
    let policies: Vec<&[u8]> = compiled.iter().map(Vec::as_slice).collect();
    let inner = civ_core::simulation::simulate_match(&MatchSeed(seed_array), &policies)
        .map_err(|_| JsError::new("between 1 and 4 bots can play"))?;
    Ok(Simulation {
        inner,
        civ_count: policies.len(),
    })
}
