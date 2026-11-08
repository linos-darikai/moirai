//! Instructions of the civ program. One file per instruction in `instructions/`, each holding its
//! accounts struct and its handler.

pub mod bench_create;
pub mod bench_set_policy;
pub mod bench_turn;
pub mod create_random_seed;
pub mod delegate_counter;
pub mod fulfill_random_seed;
pub mod increment;
pub mod initialize;
pub mod request_random_seed;
pub mod undelegate_counter;

pub use bench_create::*;
pub use bench_set_policy::*;
pub use bench_turn::*;
pub use create_random_seed::*;
pub use delegate_counter::*;
pub use fulfill_random_seed::*;
pub use increment::*;
pub use initialize::*;
pub use request_random_seed::*;
pub use undelegate_counter::*;
