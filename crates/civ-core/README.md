# civ-core

All moirai game rules, in plain Rust with **no Solana dependencies**. The on-chain program, the
browser (through `civ-wasm`) and `civ-cli` all use this crate, so they always agree on a result.

Phase 0: only a placeholder (`describe_engine`). The game rules arrive in Phase 1.

## Build and test

```sh
cargo build -p civ-core
cargo test -p civ-core
```

## Where to start reading

`src/lib.rs`. The determinism rules every change must follow are in CLAUDE.md section 6.
