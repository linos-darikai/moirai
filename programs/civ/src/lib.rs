//! The civ Solana program: entrypoints only. Each instruction is a one-line call into its handler
//! in `instructions/`.
//!
//! Phase 0 contents:
//! - hello-world Counter: `initialize`, `increment`
//! - MagicBlock rollup spike: `delegate_counter` (base layer), `undelegate_counter` (rollup)
//! - MagicBlock VRF spike: `create_random_seed`, `request_random_seed`, `fulfill_random_seed`
//!
//! Phase 2 match lobby (docs/decisions/0009): `create_match`, `join_match`, `cancel_match`.
//!
//! Phase 2 measuring spike (docs/decisions/0009): `bench_create`, `bench_set_policy`,
//! `bench_turn` run civ-core's turn on chain so tests can measure compute units and stack use.

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

    /// Open a lobby: create the Match and its Vault.
    pub fn create_match(
        context: Context<CreateMatch>,
        match_id: u64,
        settings: MatchSettings,
    ) -> Result<()> {
        handle_create_match(context, match_id, settings)
    }

    /// Join an open lobby, paying the entry fee into its vault.
    pub fn join_match(context: Context<JoinMatch>) -> Result<()> {
        handle_join_match(context)
    }

    /// Cancel a lobby that didn't fill by its join deadline and refund every player. Pass the
    /// players as remaining accounts, in join order.
    pub fn cancel_match<'info>(context: Context<'info, CancelMatch<'info>>) -> Result<()> {
        handle_cancel_match(context)
    }

    /// Create the caller's TurnBench and start a match in it (measuring spike).
    pub fn bench_create(
        context: Context<BenchCreate>,
        seed: [u8; 32],
        civ_count: u8,
    ) -> Result<()> {
        handle_bench_create(context, seed, civ_count)
    }

    /// Store one civ's compiled policy in the caller's TurnBench (measuring spike).
    pub fn bench_set_policy(
        context: Context<BenchSetPolicy>,
        civ_index: u8,
        policy: Vec<u8>,
    ) -> Result<()> {
        handle_bench_set_policy(context, civ_index, policy)
    }

    /// Play one turn of a TurnBench's match on chain (measuring spike).
    pub fn bench_turn(context: Context<BenchTurn>) -> Result<()> {
        handle_bench_turn(context)
    }
}
