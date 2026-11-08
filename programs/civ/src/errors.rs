//! All error codes the civ program can return. One enum for the whole program, each variant with
//! a message a player could understand.

use anchor_lang::prelude::*;

/// Errors returned by civ instructions. `#[error_code]` turns this enum into Anchor errors with
/// numeric codes (6000, 6001, ...) and puts the messages in the IDL so the app can show them.
#[error_code]
pub enum ErrorCode {
    #[msg("The counter cannot go any higher")]
    CounterOverflow,
}
