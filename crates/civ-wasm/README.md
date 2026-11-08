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

## Where to start reading

`src/lib.rs`.
