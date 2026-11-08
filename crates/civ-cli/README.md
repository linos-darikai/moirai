# civ-cli

Runs local moirai matches between YAML bots and prints the board as text. All game rules come from
`civ-core`; this crate only reads arguments and prints.

## Run

```sh
# Play the four sample bots from policies/ (seed byte 42), printing every turn:
cargo run -p civ-cli -- play

# Another seed, only the final board and standings:
cargo run -p civ-cli -- play 7 --quiet

# Your own bots (2 to 4 YAML files, in join order):
cargo run -p civ-cli -- play 42 policies/turtle.yaml my-bot.yaml

# Just the starting map for a seed and civ count:
cargo run -p civ-cli -- map 42 4
```

Board legend: `0`-`3` city of civ N, `a`-`d` land of civ 0-3, `s` free city site, `F`/`O`/`G` free
Food/Ore/Gold deposit, `.` free land.

The final lines show the match fingerprint (the same number for the same seed and bots, every
run, natively and in WASM) and the winner under each win metric.

## Where to start reading

`src/main.rs` (commands), then `src/render.rs` (drawing the board).
