//! The civ Solana program: entrypoints only. Each instruction is a one-line call into its handler
//! in `instructions/`.
//!
//! Phase 0 contents:
//! - hello-world Counter: `initialize`, `increment`
//! - MagicBlock rollup spike: `delegate_counter` (base layer), `undelegate_counter` (rollup)
//! - MagicBlock VRF spike: `create_random_seed`, `request_random_seed`, `fulfill_random_seed`

// clippy flags code that `#[program]` generates once `#[ephemeral]` is added (not our code; it is
// emitted at crate level, so a module-level allow doesn't reach it). Only this one lint is off.
#![allow(clippy::diverging_sub_expression)]

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::ephemeral;

pub use constants::*;
pub use instructions::*;
pub use state::*;

// The program's on-chain address. Must match Anchor.toml; `anchor keys sync` keeps them in step.
declare_id!("GPdm56hssFExZrtGspZprjbfecXbRKYtAJGQ4X1ysNkc");

/// `#[program]` marks this module as the list of instructions the program accepts.
/// `#[ephemeral]` (MagicBlock SDK, must come before `#[program]`) adds the hidden instruction the
/// Delegation Program calls to hand a delegated account back when it is undelegated.
#[ephemeral]
#[program]
pub mod civ {
    use super::*;

    /// Create the caller's Counter (hello-world).
    pub fn initialize(context: Context<Initialize>) -> Result<()> {
        handle_initialize(context)
    }

    /// Add one to the caller's Counter (hello-world). Works on the base layer and in the rollup.
    pub fn increment(context: Context<Increment>) -> Result<()> {
        handle_increment(context)
    }

    /// Hand the caller's Counter to an Ephemeral Rollup. Send to the base layer.
    pub fn delegate_counter(context: Context<DelegateCounter>) -> Result<()> {
        handle_delegate_counter(context)
    }

    /// Commit the Counter back to Solana and end the delegation. Send to the rollup.
    pub fn undelegate_counter(context: Context<UndelegateCounter>) -> Result<()> {
        handle_undelegate_counter(context)
    }

    /// Create the caller's empty RandomSeed (VRF spike).
    pub fn create_random_seed(context: Context<CreateRandomSeed>) -> Result<()> {
        handle_create_random_seed(context)
    }

    /// Ask the VRF oracle for randomness for the caller's RandomSeed (VRF spike).
    pub fn request_random_seed(context: Context<RequestRandomSeed>) -> Result<()> {
        handle_request_random_seed(context)
    }

    /// VRF oracle callback: stores the randomness. Only the VRF program can call it.
    pub fn fulfill_random_seed(
        context: Context<FulfillRandomSeed>,
        randomness: [u8; 32],
    ) -> Result<()> {
        handle_fulfill_random_seed(context, randomness)
    }
}
