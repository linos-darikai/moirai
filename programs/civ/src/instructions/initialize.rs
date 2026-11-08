//! `initialize`: creates the caller's hello-world Counter (Phase 0 only).

use anchor_lang::prelude::*;

use crate::constants::{ANCHOR_DISCRIMINATOR_SIZE, COUNTER_SEED};
use crate::state::Counter;

/// The accounts `initialize` needs. Anchor checks every constraint in `#[account(...)]` before the
/// handler runs, so the handler can trust them.
///
/// `'info` is a Rust "lifetime": it says these account references are only valid while this
/// instruction runs. You can treat it as boilerplate that every accounts struct carries.
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The wallet creating the counter. It signs the transaction and pays the rent.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The new Counter. Its address is a PDA derived from `["counter", authority]`, so each wallet
    /// has exactly one and anyone can find it. `init` fails if it already exists.
    #[account(
        init,
        payer = authority,
        space = ANCHOR_DISCRIMINATOR_SIZE + Counter::INIT_SPACE,
        seeds = [COUNTER_SEED, authority.key().as_ref()],
        bump,
    )]
    pub counter: Account<'info, Counter>,

    /// Needed because creating an account is done by the built-in System Program.
    pub system_program: Program<'info, System>,
}

/// Create the caller's Counter with a count of zero.
///
/// Checks: the counter doesn't exist yet (enforced by `init`), authority signed.
/// Effects: creates the Counter, stores the authority, a count of 0 and the bump.
pub fn handle_initialize(context: Context<Initialize>) -> Result<()> {
    // `&mut` borrows the account so we can change it in place instead of copying it.
    let counter: &mut Account<Counter> = &mut context.accounts.counter;

    counter.authority = context.accounts.authority.key();
    counter.count = 0;
    counter.bump = context.bumps.counter;

    Ok(())
}
