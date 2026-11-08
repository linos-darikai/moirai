//! civ-wasm: exposes civ-core to JavaScript. Every function here only converts arguments and calls
//! civ-core; the game logic stays in civ-core. The app imports the built package only from
//! `app/src/lib/engine/`.

use wasm_bindgen::prelude::*;

/// Returns civ-core's engine description. Phase 0 placeholder used by the app's toolchain page.
///
/// `#[wasm_bindgen]` generates the JavaScript glue, so the app can call `describeEngine()`.
#[wasm_bindgen(js_name = describeEngine)]
pub fn describe_engine() -> String {
    civ_core::describe_engine()
}
