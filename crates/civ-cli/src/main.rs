//! civ-cli: runs local moirai matches between YAML bots and prints the board as text.
//!
//! Commands:
//! - `cargo run -p civ-cli -- play [seed-byte] [--quiet] [bot.yaml ...]`: plays a full match and
//!   prints the board and every civ after each turn (only the end with `--quiet`), then the final
//!   standings under all four win metrics. With no YAML files it plays the four sample bots from
//!   `policies/`.
//! - `cargo run -p civ-cli -- map [seed-byte] [civ-count]`: prints the starting map only.
//!
//! The seed byte fills all 32 seed bytes (default 42); real matches get their seed from the VRF
//! oracle. The game rules all live in civ-core; this file only reads arguments and prints.

mod render;

use civ_core::map_generation::generate_map;
use civ_core::match_state::MatchState;
use civ_core::policy::compiler::compile_policy;
use civ_core::policy::interpreter::play_turn;
use civ_core::randomness::{MatchSeed, MATCH_SEED_LENGTH};
use civ_core::scoring::{final_standings, WinMetric};

use render::{render_civs, render_map, LEGEND};

/// The sample bots, built into the binary so `play` works from any folder.
const SAMPLE_BOTS: [(&str, &str); 4] = [
    ("turtle.yaml", include_str!("../../../policies/turtle.yaml")),
    ("raider.yaml", include_str!("../../../policies/raider.yaml")),
    ("trader.yaml", include_str!("../../../policies/trader.yaml")),
    (
        "expander.yaml",
        include_str!("../../../policies/expander.yaml"),
    ),
];

/// Entry point, like `main()` in a Node script.
fn main() {
    println!("{}", civ_core::describe_engine());
    let arguments: Vec<String> = std::env::args().skip(1).collect();

    let result = match arguments.first().map(String::as_str) {
        Some("map") => print_starting_map(&arguments[1..]),
        Some("play") => play_match(&arguments[1..]),
        _ => Err("usage: civ play [seed-byte] [--quiet] [bot.yaml ...] | civ map [seed-byte] [civ-count]".to_string()),
    };
    // `if let Err(message)` runs only when something went wrong.
    if let Err(message) = result {
        eprintln!("{message}");
        std::process::exit(1);
    }
}

/// `map [seed-byte] [civ-count]`: the starting map for a seed.
fn print_starting_map(arguments: &[String]) -> Result<(), String> {
    let seed_byte: u8 = parse_argument(arguments, 0).unwrap_or(42);
    let civ_count: u8 = parse_argument(arguments, 1).unwrap_or(4);
    let map = generate_map(&seed_from(seed_byte), civ_count)
        .map_err(|error| format!("could not generate the map: {error:?}"))?;
    println!(
        "seed byte {seed_byte}, {civ_count} civs, fingerprint {}",
        map.fingerprint()
    );
    println!("{}", render_map(&map));
    println!("{LEGEND}");
    Ok(())
}

/// `play [seed-byte] [--quiet] [bot.yaml ...]`: a whole match, turn by turn.
fn play_match(arguments: &[String]) -> Result<(), String> {
    // Step 1: read the arguments.
    let seed_byte: u8 = parse_argument(arguments, 0).unwrap_or(42);
    let is_quiet = arguments.iter().any(|argument| argument == "--quiet");
    let bot_files: Vec<&String> = arguments
        .iter()
        .filter(|argument| argument.ends_with(".yaml") || argument.ends_with(".yml"))
        .collect();

    // Step 2: compile the bots.
    let sources = read_bots(&bot_files)?;
    let mut names: Vec<String> = Vec::new();
    let mut compiled: Vec<Vec<u8>> = Vec::new();
    for (file, yaml) in &sources {
        let policy = compile_policy(yaml).map_err(|errors| {
            let lines: Vec<String> = errors.iter().map(ToString::to_string).collect();
            format!("{file} has problems:\n  {}", lines.join("\n  "))
        })?;
        names.push(policy.name);
        compiled.push(policy.bytes);
    }
    let policies: Vec<&[u8]> = compiled.iter().map(Vec::as_slice).collect();

    // Step 3: play every turn, printing as we go.
    let civ_count = u8::try_from(policies.len()).map_err(|_| "too many bots".to_string())?;
    let mut state = MatchState::new(&seed_from(seed_byte), civ_count)
        .map_err(|error| format!("could not start the match: {error:?}"))?;
    println!("seed byte {seed_byte}: {}", names.join(" vs "));
    while let Ok(report) = play_turn(&mut state, &policies) {
        if !is_quiet {
            println!("\nturn {}", report.turn);
            print!("{}", render_map(&state.map));
            print!("{}", render_civs(&state, &names));
        }
    }

    // Step 4: the result.
    print_result(&state, &names);
    Ok(())
}

/// The YAML of each bot file given, or the four sample bots if none were.
fn read_bots(files: &[&String]) -> Result<Vec<(String, String)>, String> {
    if files.is_empty() {
        let samples = SAMPLE_BOTS.iter();
        return Ok(samples
            .map(|(file, yaml)| ((*file).to_string(), (*yaml).to_string()))
            .collect());
    }
    let mut bots = Vec::new();
    for file in files {
        let yaml = std::fs::read_to_string(file).map_err(|error| format!("{file}: {error}"))?;
        bots.push(((*file).clone(), yaml));
    }
    Ok(bots)
}

/// The final board, every civ, the fingerprint and the winners under each metric.
fn print_result(state: &MatchState, names: &[String]) {
    println!("\nfinal board after turn {}", state.turn);
    print!("{}", render_map(&state.map));
    println!("{LEGEND}");
    print!("{}", render_civs(state, names));
    println!("fingerprint {}", state.fingerprint());
    for metric in [
        WinMetric::Territory,
        WinMetric::Wealth,
        WinMetric::Conquest,
        WinMetric::Score,
    ] {
        let standings = final_standings(state, metric);
        let mut winners: Vec<&str> = Vec::new();
        for (index, name) in names.iter().enumerate() {
            if standings.is_winner.get(index).copied().unwrap_or(false) {
                winners.push(name);
            }
        }
        let scores = &standings.scores[..names.len().min(standings.scores.len())];
        println!(
            "{:<9} winner {:<28} scores {scores:?}",
            format!("{metric:?}"),
            winners.join(" + ")
        );
    }
}

fn seed_from(seed_byte: u8) -> MatchSeed {
    MatchSeed([seed_byte; MATCH_SEED_LENGTH])
}

/// Parses the argument at `position` as a number, or `None` if it's missing or invalid.
/// `<T: std::str::FromStr>` means "any type that can be parsed from text" (u8, usize, ...).
fn parse_argument<T: std::str::FromStr>(arguments: &[String], position: usize) -> Option<T> {
    arguments.get(position)?.parse().ok()
}
