# civ-wasm

A thin [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen) wrapper that exposes `civ-core`
to the browser. **No game logic here**: each function converts its arguments and calls `civ-core`.

## Build

```sh
# from the repo root
wasm-pack build crates/civ-wasm --target web --out-dir pkg
```

This writes an npm-style package to `crates/civ-wasm/pkg/` (gitignored). The app depends on it as
`civ-wasm` and imports it only from `app/src/lib/engine/`.

## What it exports

| Function | Does |
| --- | --- |
| `describeEngine()` | civ-core's version line |
| `mapTiles(seed, civCount)` / `mapFingerprint(seed, civCount)` | The starting map's 768 tile bytes / its fingerprint |
| `compilePolicy(yaml)` | YAML policy to compiled bytes; throws every problem as `line N: ...` |
| `matchFingerprint(seed, botsYaml)` | Plays a whole match between YAML bots and returns the final fingerprint |

`app/src/lib/engine/determinism.test.ts` checks the map and the full sample-bot match give the
same fingerprints as native Rust.

## Where to start reading

`src/lib.rs`.
