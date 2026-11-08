//! `delegate_counter`: hands the caller's Counter to a MagicBlock Ephemeral Rollup (ER).
//! Phase 0 spike. Sent to the BASE LAYER. After it, the Counter's base-layer owner becomes the
//! Delegation Program, and the ER runs `increment` on its copy until `undelegate_counter`.
//! See PLAN.md section 10, "MagicBlock rollup and VRF".

use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::delegate;
use ephemeral_rollups_sdk::cpi::DelegateConfig;

use crate::constants::COUNTER_SEED;

/// The accounts `delegate_counter` needs.
///
/// `#[delegate]` (from the MagicBlock SDK) adds the extra accounts the Delegation Program needs and
/// generates a `delegate_counter()` helper on this struct (named after the `counter` field).
#[delegate]
#[derive(Accounts)]
pub struct DelegateCounter<'info> {
    /// The counter's owner. Pays for the delegation bookkeeping accounts.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: The caller's Counter PDA, checked by `seeds` + `bump`. It must be a raw
    /// `UncheckedAccount` (not `Account<Counter>`) because delegation reassigns its owner; `del`
    /// marks it as the account to delegate. Only the authority's own PDA can match these seeds.
    #[account(mut, del, seeds = [COUNTER_SEED, authority.key().as_ref()], bump)]
    pub counter: UncheckedAccount<'info>,
}

/// Delegate the caller's Counter to an ER validator.
///
/// Checks: authority signed; `counter` is the authority's own Counter PDA (seeds).
/// Effects: the Delegation Program takes ownership on the base layer; the ER clones the account.
/// The ER validator to use is passed as the first remaining account (optional; MagicBlock picks
/// one if it's missing).
pub fn handle_delegate_counter(context: Context<DelegateCounter>) -> Result<()> {
    let authority_key: Pubkey = context.accounts.authority.key();
    let validator: Option<Pubkey> = context
        .remaining_accounts
        .first()
        .map(|account| account.key());

    // The seeds must be exactly the ones in the `counter` constraint above.
    context.accounts.delegate_counter(
        &context.accounts.authority,
        &[COUNTER_SEED, authority_key.as_ref()],
        DelegateConfig {
            validator,
            ..Default::default()
        },
    )?;

    Ok(())
}
