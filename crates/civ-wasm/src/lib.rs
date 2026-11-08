//! civ-wasm: exposes civ-core to JavaScript. Every function here only converts arguments and calls
//! civ-core; the game logic stays in civ-core. The app imports the built package only from
//! `app/src/lib/engine/`.

use civ_core::map_generation::generate_map;
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
