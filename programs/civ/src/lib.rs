//! The civ Solana program: entrypoints only. Each instruction is a one-line call into its handler
//! in `instructions/`. Phase 0 has just the hello-world Counter (`initialize`, `increment`).

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

// The program's on-chain address. Must match Anchor.toml; `anchor keys sync` keeps them in step.
declare_id!("GPdm56hssFExZrtGspZprjbfecXbRKYtAJGQ4X1ysNkc");

/// `#[program]` marks this module as the list of instructions the program accepts.
#[program]
pub mod civ {
    use super::*;

    /// Create the caller's Counter (hello-world).
    pub fn initialize(context: Context<Initialize>) -> Result<()> {
        handle_initialize(context)
    }

    /// Add one to the caller's Counter (hello-world).
    pub fn increment(context: Context<Increment>) -> Result<()> {
        handle_increment(context)
    }
}
