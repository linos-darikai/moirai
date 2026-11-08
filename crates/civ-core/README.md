# civ-core

All moirai game rules, in plain Rust with **no Solana dependencies**. The on-chain program, the
browser (through `civ-wasm`) and `civ-cli` all use this crate, so they always agree on a result.

## What's here

| Module | What it does |
| --- | --- |
| `randomness` | Deterministic random numbers: a pure hash of (match seed, purpose, a, b). No hidden state. |
| `resources` | `Resource` (Food, Ore, Gold) and `ResourceStock` (saturating adds) |
| `units` | `UnitKind` (Infantry, Guard, Siege, Elite, Settler, Worker; `is_fighter`, `to_byte`) and `UnitCounts` (12 plain bytes; `add`, `remove`, `total`) |
| `builds` | One build per city (docs/decisions/0007). `start_build(&mut civ, kind)` pays resources + coins up front in the first idle city; `finish_builds(&mut civs)` (turn step 3) adds finished units; `rush_build(&mut civ, slot)` finishes now for 2 × coin cost × turns left. Tests in `builds_tests.rs` |
| `city` | `City` (10 plain bytes: tile, size, growth points, founded turn, capital / growth-stopped flags, the unit being built and its turns left) |
| `civ` | `CivId` and `Civ` (112 plain bytes: alive, units, worker focus, resources, coins, 8 city slots; read via `capital()`, `cities()`, `city_count()`, `total_city_size()`, `is_alive()`) |
| `attack` | `attack(&mut map, &mut civs, &random, attacker, target, choice, turn)`: the whole army (minus Settlers) hits one enemy tile next to the attacker's land. Defended by `units ÷ (cities + 1)`. A win takes the tile, or captures / razes the city on it. Returns an `AttackReport`. Tests in `attack_tests.rs` |
| `battle` | `resolve_battle(&attackers, &defenders, city, rolls)`: pure battle maths. Attack = Σ units × attack × matchup bonus (×1.5 vs the kind it beats, weighted by the defenders' mix; Elite ×1.25; Siege ×1.5 vs a city). Defence = Σ units × defence + walls (10 × size, +50% capital). Each side rolls ±10% (`BattleRolls::for_battle`). Win: defenders there are destroyed. Loss or tie: both lose in proportion |
| `borders` | Tiles within a city's reach (`for_each_tile_within`, Manhattan radius = size + 1); claim, count free tiles, count owned deposits |
| `conquest` | After a won battle. `take_city(...)`: plunder (`stock ÷ cities`), then capture (city −1 size, its land to the winner) or raze (land freed, tile back to a city site; also used when the winner has no free slot), then capital succession (largest city, oldest on a tie). `eliminate_civs_without_cities`: turn step 7. Tests in `conquest_tests.rs` |
| `growth` | `grow_cities(&mut map, &mut civs, turn)`: turn step 3. Each city gains 1 + owned deposits in its border per turn; at 20 × size² it grows and claims the free tiles of its bigger border. If that would gain nothing, the border locks for good. Who grows first rotates each turn |
| `actions` | `found_city(&mut map, &mut civ, site, turn)` (a Settler on a city site in or next to the civ's land) and `claim_tile(&mut map, &mut civ, tile)` (buy one free tile next to your land for 10 Food + 10 Gold). Checks first; nothing changes if one fails. Holds `ActionError`, the refusal reasons every action returns |
| `aggregates` | `aggregate_map(&map)`: each civ's tiles, cities and owned deposits, counted in one pass per turn |
| `orders` | `Action` (StartBuild, RushBuild, FoundCity, ClaimTile, AssignWorkers, Sell, Buy, Attack), `CivOrders` (up to 3 per turn), `ActionPhase` and `apply_action` |
| `policy` | Policies (docs/decisions/0008). `format`: compiled bytes (3-byte header + fixed 31-byte rules, at most 499 bytes; `validate_policy`, `read_rule`, `encode_policy`). `compiler` (feature `compiler` only): YAML to bytes with line-numbered errors. `interpreter`: `decide_all` / `play_turn` / `play_until_finished`; `targets` picks tiles and civs |
| `production` | `produce_resources(&aggregates, &mut civs)`: turn step 2. Deposits need Workers: each Worker works one owned deposit for 2 a turn (focus resource first, then spread evenly; `worked_deposits`). Each city adds 2 Food, 1 Ore, 1 Gold and 1 coin per size (docs/decisions/0007) |
| `turn` | `run_turn(&mut state, &orders) -> TurnReport`: the seven steps of a turn (aggregates, produce, grow + finish builds, decide, resolve by phase in rotating civ order, upkeep, eliminate). Tests in `turn_tests.rs` include a 60-turn match played twice with identical fingerprints |
| `scoring` | `final_standings(&state, metric)`: Territory, Wealth (coins + resources at final prices), Conquest, Score; knocked-out civs score 0; ties all win |
| `upkeep` | `pay_upkeep(&mut civs)`: turn step 6. Each unit eats its food upkeep (Elite 2, others 1). A civ that can't pay disbands units in `DISBAND_ORDER` (Elite, Settler, Siege, Guard, Infantry) until it can; food never goes below 0 |
| `rules` | Every rule number in one place (docs/decisions/0006): cities, growth, economy, `unit_stats(kind)` and the disband order, market, battle, scoring. Integer maths; percentages in basis points |
| `map` | `TileCoordinate` (always on the map), `Tile` (3 plain bytes, read via `owner()`, `deposit()`, `is_city()`), `Map` (768 bytes, zero-copy ready) and `Map::fingerprint()` |
| `map_generation` | `generate_map_into(seed, civ_count, &mut map)` / `generate_map(...)`: the top-left quarter comes from the seed and is mirrored into the other three, so every civ gets identical surroundings. 3 mirrored city sites per quarter (≥3 tiles apart; capitals are sites too). Cities at (3,3), (12,3), (3,12), (12,12); two-civ games use opposite corners. 30% of tiles get a deposit. |
| `market` | The shared `Market` (12 plain bytes of supply). `price = base × 200 ÷ supply`, kept within 25%–400%. `sell` pays 95%, `buy` costs 105% (rounded up), both priced at the supply after the trade so a round trip always loses. Prices in coins × 10_000. Tests in `market_tests.rs` |
| `match_state` | `MatchState` (1,264 plain bytes: seed, turn, market, 4 civs, map), so the program can keep a whole match in one zero-copy account. `MatchState::new(seed, civ_count)` / `start_into`, `is_finished()`, `fingerprint()` |
| `match_start` | `start_match(seed, &mut map, &mut civs)`: turn 0. Generates the map and gives each civ its size 1 capital on its spawn tile with a radius 2 border, so map and civs always agree |

On-chain rules this crate follows (details in docs/decisions/0004): plain-bytes `Pod` state so the
program can use it as zero-copy account data, no panics (bounds-checked coordinates, `match`
instead of array lookups), no truncating casts, and nothing large returned by value.

Determinism is locked by tests that pin a known output: `random_u64` for a fixed seed, the map
fingerprint for seed 42 (`14264378160424497879`), and the final fingerprint of a 60-turn match
between the four sample bots for seed 42 (`13451523736825787217`, in
`tests/sample_bots_match.rs`, the Phase 1 gate). The app's `src/lib/engine/determinism.test.ts`
checks the WASM build gives the same two fingerprints. If one changes, every past match would
replay differently, so change them only on purpose (and in both places).

## Build and test

```sh
cargo build -p civ-core
cargo test -p civ-core                       # unit tests (no YAML compiler)
cargo test -p civ-core --features compiler   # plus the compiler and the 60-turn gate test
cargo run -p civ-cli -- play                 # watch the four sample bots play
```

## Where to start reading

`src/lib.rs`, then `turn.rs` (one whole turn, step by step), then the module each step calls.
For policies: `policy/mod.rs`, then `policy/interpreter.rs`. The determinism rules every change
must follow are in CLAUDE.md section 6.
