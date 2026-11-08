//! `undelegate_counter`: commits the Counter's rollup state back to Solana and returns ownership
//! to this program. Phase 0 spike. Sent to the EPHEMERAL ROLLUP, not the base layer.

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::commit;
// `FoldableIntentBuilder` is a trait (like a TypeScript interface) that provides
// `.commit_and_undelegate(...)` and `.build_and_invoke()`. Rust only lets us call trait methods
// when the trait is imported, and `#[ephemeral]` imports it only inside lib.rs's program module.
use ephemeral_rollups_sdk::ephem::{FoldableIntentBuilder, MagicIntentBundleBuilder};

use crate::constants::COUNTER_SEED;
use crate::state::Counter;

/// The accounts `undelegate_counter` needs.
///
/// `#[commit]` (from the MagicBlock SDK) adds `magic_context` and `magic_program`, the ER accounts
/// that schedule the commit back to Solana.
#[commit]
#[derive(Accounts)]
pub struct UndelegateCounter<'info> {
    /// The counter's owner. Pays for the commit.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The caller's Counter, as the ER sees it (owned by this program inside the rollup).
    #[account(
        mut,
        seeds = [COUNTER_SEED, authority.key().as_ref()],
        bump = counter.bump,
        has_one = authority,
    )]
    pub counter: Account<'info, Counter>,
}

/// Commit the Counter to Solana and end its delegation.
///
/// Checks: authority signed and owns the counter (constraints).
/// Effects: schedules "commit + undelegate". Shortly after, the base-layer Counter holds the ER's
/// count and is owned by this program again. The base-layer update arrives in a separate
/// transaction, so callers must wait for it.
pub fn handle_undelegate_counter(context: Context<UndelegateCounter>) -> Result<()> {
    MagicIntentBundleBuilder::new(
        context.accounts.authority.to_account_info(),
        context.accounts.magic_context.to_account_info(),
        context.accounts.magic_program.to_account_info(),
    )
    .commit_and_undelegate(&[context.accounts.counter.to_account_info()])
    .build_and_invoke()?;

    Ok(())
}
