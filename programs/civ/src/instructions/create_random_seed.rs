//! `create_random_seed`: creates the caller's empty RandomSeed account (Phase 0 VRF spike).
//! Kept separate from the request because the VRF request context already brings its own
//! `system_program` account, so it can't also create accounts.

use anchor_lang::prelude::*;

use crate::constants::{ANCHOR_DISCRIMINATOR_SIZE, RANDOM_SEED_SEED};
use crate::state::{RandomSeed, SeedStatus};

/// The accounts `create_random_seed` needs.
#[derive(Accounts)]
pub struct CreateRandomSeed<'info> {
    /// The wallet creating the account. Pays the rent.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The new RandomSeed at `["random_seed", authority]`. `init` fails if it already exists.
    #[account(
        init,
        payer = authority,
        space = ANCHOR_DISCRIMINATOR_SIZE + RandomSeed::INIT_SPACE,
        seeds = [RANDOM_SEED_SEED, authority.key().as_ref()],
        bump,
    )]
    pub random_seed: Account<'info, RandomSeed>,

    pub system_program: Program<'info, System>,
}

/// Create an empty RandomSeed in the `Idle` state.
///
/// Checks: it doesn't exist yet (`init`), authority signed.
/// Effects: creates the account with a zero seed.
pub fn handle_create_random_seed(context: Context<CreateRandomSeed>) -> Result<()> {
    let random_seed: &mut Account<RandomSeed> = &mut context.accounts.random_seed;

    random_seed.authority = context.accounts.authority.key();
    random_seed.seed = [0; 32];
    random_seed.status = SeedStatus::Idle;
    random_seed.fulfilled_slot = 0;
    random_seed.bump = context.bumps.random_seed;

    Ok(())
}
