# civ-core

All moirai game rules, in plain Rust with **no Solana dependencies**. The on-chain program, the
browser (through `civ-wasm`) and `civ-cli` all use this crate, so they always agree on a result.

## What's here so far

| Module | What it does |
| --- | --- |
| `randomness` | Deterministic random numbers: a pure hash of (match seed, purpose, a, b). No hidden state. |
| `resources` | `Resource` (Food, Ore, Gold) and `ResourceStock` (saturating adds) |
| `units` | `UnitKind` (Infantry, Guard, Siege, Elite) and `UnitCounts` |
| `civ` | `CivId` and `Civ` (24 plain bytes: city, resources, units, alive; read via `city()`, `is_alive()`) |
| `aggregates` | `aggregate_map(&map)`: each civ's tiles, cities and owned deposits, counted in one pass per turn |
| `production` | `produce_resources(&aggregates, &mut civs)`: turn step 1. Each owned deposit yields 1 unit; each owned city adds `CITY_BASE_INCOME` (food 2, ore 1, gold 1 until balancing) |
| `map` | `TileCoordinate` (always on the map), `Tile` (3 plain bytes, read via `owner()`, `deposit()`, `is_city()`), `Map` (768 bytes, zero-copy ready) and `Map::fingerprint()` |
| `map_generation` | `generate_map_into(seed, civ_count, &mut map)` / `generate_map(...)`: the top-left quarter comes from the seed and is mirrored into the other three, so every civ gets identical surroundings. Cities at (3,3), (12,3), (3,12), (12,12); two-civ games use opposite corners. 30% of tiles get a deposit. |

On-chain rules this crate follows (details in docs/decisions/0004): plain-bytes `Pod` state so the
program can use it as zero-copy account data, no panics (bounds-checked coordinates, `match`
instead of array lookups), no truncating casts, and nothing large returned by value.

Determinism is locked by tests that pin a known output: `random_u64` for a fixed seed, and the map
fingerprint for seed 42 (`13807811971971621171`). The app's
`src/lib/engine/determinism.test.ts` checks that the WASM build produces the same fingerprint.
If either value changes, every past match would replay differently, so change them only on purpose.

## Build and test

```sh
cargo build -p civ-core
cargo test -p civ-core
cargo run -p civ-cli -- 42 4     # print the map for seed byte 42 with 4 civs
```

## Where to start reading

`src/lib.rs`, then `map.rs` and `map_generation.rs`. The determinism rules every change must
follow are in CLAUDE.md section 6.
