//! civ-cli: runs local moirai matches between YAML bots and prints the board as text.
//!
//! Commands:
//! - `cargo run -p civ-cli -- play [seed-byte] [--quiet] [bot.yaml ...]`: plays a full match and
//!   prints the board and every civ after each turn (only the end with `--quiet`), then the final
//!   standings under all four win metrics. With no YAML files it plays the four sample bots from
//!   `policies/`.
//! - `cargo run -p civ-cli -- map [seed-byte] [civ-count]`: prints the starting map only.
//! - `cargo run -p civ-cli -- compile bot.yaml`: prints the compiled policy bytes as hex (what a
//!   player commits to and reveals), or every problem with its line.
//!
//! The seed is either one byte that fills all 32 seed bytes (default 42) or the full seed as 64 hex
//! characters (to replay a real match, whose seed came from the VRF oracle). The game rules all live in civ-core; this file only reads arguments and prints.

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
    let arguments: Vec<String> = std::env::args().skip(1).collect();

    let result = match arguments.first().map(String::as_str) {
        Some("map") => print_starting_map(&arguments[1..]),
        Some("play") => play_match(&arguments[1..]),
        Some("compile") => compile_file(&arguments[1..]),
        _ => Err("usage: civ play [seed-byte | 64-hex-seed] [--quiet] [bot.yaml ...] | civ map [seed-byte] [civ-count] | civ compile bot.yaml".to_string()),
    };
    // `if let Err(message)` runs only when something went wrong.
    if let Err(message) = result {
        eprintln!("{message}");
        std::process::exit(1);
    }
}

/// `compile bot.yaml`: the compiled bytes as one line of hex.
fn compile_file(arguments: &[String]) -> Result<(), String> {
    let file = arguments.first().ok_or("usage: civ compile bot.yaml")?;
    let yaml = std::fs::read_to_string(file).map_err(|error| format!("{file}: {error}"))?;
    let policy = compile_policy(&yaml).map_err(|errors| {
        let lines: Vec<String> = errors.iter().map(ToString::to_string).collect();
        format!("{file} has problems:\n  {}", lines.join("\n  "))
    })?;
    let hex: Vec<String> = policy
        .bytes
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect();
    println!("{}", hex.join(""));
    Ok(())
}

/// `map [seed-byte] [civ-count]`: the starting map for a seed.
fn print_starting_map(arguments: &[String]) -> Result<(), String> {
    println!("{}", civ_core::describe_engine());
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
    println!("{}", civ_core::describe_engine());
    // Step 1: read the arguments.
    let seed = seed_argument(arguments.first());
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
    let mut state = MatchState::new(&seed, civ_count)
        .map_err(|error| format!("could not start the match: {error:?}"))?;
    println!("seed {}: {}", hex(&seed.0), names.join(" vs "));
    let mut war = WarSummary::default();
    while let Ok(report) = play_turn(&mut state, &policies) {
        war.record(&report);
        if !is_quiet {
            println!("\nturn {}", report.turn);
            print!("{}", render_map(&state.map));
            print!("{}", render_civs(&state, &names));
        }
    }

    // Step 4: the result.
    print_result(&state, &names);
    let knocked_out = state
        .active_civs()
        .iter()
        .filter(|civ| !civ.is_alive())
        .count();
    println!(
        "war: {} battles, {} won by the attacker, {} cities captured, {} razed, {} civs knocked out",
        war.battles, war.attacker_wins, war.captured, war.razed, knocked_out
    );
    Ok(())
}

/// Counts of the fighting in a match, for the summary line.
#[derive(Default)]
struct WarSummary {
    battles: u32,
    attacker_wins: u32,
    captured: u32,
    razed: u32,
}

impl WarSummary {
    fn record(&mut self, report: &civ_core::turn::TurnReport) {
        for battle in report.battles.iter().flatten() {
            self.battles += 1;
            if battle.outcome.did_attacker_win {
                self.attacker_wins += 1;
            }
            match battle.city_fall {
                Some(civ_core::conquest::CityFall::Captured) => self.captured += 1,
                Some(civ_core::conquest::CityFall::Razed) => self.razed += 1,
                None => {}
            }
        }
    }
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

/// The seed from the first argument: 64 hex characters, or one byte that fills all 32 (default 42).
fn seed_argument(argument: Option<&String>) -> MatchSeed {
    if let Some(text) = argument {
        if let Some(bytes) = parse_hex_seed(text) {
            return MatchSeed(bytes);
        }
    }
    let seed_byte: u8 = argument.and_then(|text| text.parse().ok()).unwrap_or(42);
    seed_from(seed_byte)
}

/// 64 hex characters to 32 bytes, or `None` if the text isn't exactly that.
fn parse_hex_seed(text: &str) -> Option<[u8; MATCH_SEED_LENGTH]> {
    if text.len() != MATCH_SEED_LENGTH * 2 {
        return None;
    }
    let mut bytes = [0u8; MATCH_SEED_LENGTH];
    for (index, byte) in bytes.iter_mut().enumerate() {
        let pair = text.get(index * 2..index * 2 + 2)?;
        *byte = u8::from_str_radix(pair, 16).ok()?;
    }
    Some(bytes)
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn seed_from(seed_byte: u8) -> MatchSeed {
    MatchSeed([seed_byte; MATCH_SEED_LENGTH])
}

/// Parses the argument at `position` as a number, or `None` if it's missing or invalid.
/// `<T: std::str::FromStr>` means "any type that can be parsed from text" (u8, usize, ...).
fn parse_argument<T: std::str::FromStr>(arguments: &[String], position: usize) -> Option<T> {
    arguments.get(position)?.parse().ok()
}
