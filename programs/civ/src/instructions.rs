//! Instructions of the civ program. One file per instruction in `instructions/`, each holding its
//! accounts struct and its handler.

pub mod bench_create;
pub mod bench_set_policy;
pub mod bench_turn;
pub mod cancel_match;
pub mod commit_policy;
pub mod create_match;
pub mod create_random_seed;
pub mod delegate_counter;
pub mod fulfill_match_seed;
pub mod fulfill_random_seed;
pub mod increment;
pub mod initialize;
pub mod join_match;
pub mod request_random_seed;
pub mod reveal_policy;
pub mod start_match;
pub mod start_match_local_test;
pub mod undelegate_counter;

pub use bench_create::*;
pub use bench_set_policy::*;
pub use bench_turn::*;
pub use cancel_match::*;
pub use commit_policy::*;
pub use create_match::*;
pub use create_random_seed::*;
pub use delegate_counter::*;
pub use fulfill_match_seed::*;
pub use fulfill_random_seed::*;
pub use increment::*;
pub use initialize::*;
pub use join_match::*;
pub use request_random_seed::*;
pub use reveal_policy::*;
pub use start_match::*;
pub use start_match_local_test::*;
pub use undelegate_counter::*;
