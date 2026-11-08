//! Instructions of the civ program. One file per instruction in `instructions/`, each holding its
//! accounts struct and its handler.

pub mod increment;
pub mod initialize;

pub use increment::*;
pub use initialize::*;
