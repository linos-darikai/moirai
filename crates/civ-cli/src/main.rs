//! civ-cli: runs local matches between YAML bots and prints the map as text each turn.
//!
//! Phase 0: only prints the engine description, to prove it links against civ-core. Match running
//! arrives in Phase 1 (PLAN.md section 9).

/// Entry point, like `main()` in a Node script.
fn main() {
    println!("{}", civ_core::describe_engine());
}
