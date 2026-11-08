//! `increment`: adds one to the caller's hello-world Counter (Phase 0 only). Lets the app's test
//! page send a transaction more than once, since `initialize` only works the first time.

use anchor_lang::prelude::*;

use crate::constants::COUNTER_SEED;
use crate::errors::ErrorCode;
use crate::state::Counter;

/// The accounts `increment` needs.
#[derive(Accounts)]
pub struct Increment<'info> {
    /// The wallet that owns the counter.
    pub authority: Signer<'info>,

    /// The caller's Counter. `seeds` + `bump = counter.bump` re-derive the PDA with the stored bump,
    /// and `has_one = authority` checks `counter.authority == authority`, so nobody else's wallet
    /// can change it.
    #[account(
        mut,
        seeds = [COUNTER_SEED, authority.key().as_ref()],
        bump = counter.bump,
        has_one = authority,
    )]
    pub counter: Account<'info, Counter>,
}

/// Add one to the caller's Counter.
///
/// Checks: authority signed and owns the counter (account constraints), count doesn't overflow.
/// Effects: `count` goes up by one.
pub fn handle_increment(context: Context<Increment>) -> Result<()> {
    let counter: &mut Account<Counter> = &mut context.accounts.counter;

    // `checked_add` returns `None` instead of wrapping around if the number would overflow.
    // `ok_or(...)` turns that `None` into our error, and `?` means: if this is an error, stop here
    // and return it.
    counter.count = counter
        .count
        .checked_add(1)
        .ok_or(ErrorCode::CounterOverflow)?;

    Ok(())
}
