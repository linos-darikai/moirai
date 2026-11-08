//! Policies: a player's ordered list of Rules (docs/decisions/0008). Each Rule is an `if`
//! (Conditions) and a `do` (an Action).
//!
//! - `format`: the compiled bytes (what is committed, revealed and stored on chain) and how to
//!   read and check them.
//! - `compiler` (only with the `compiler` cargo feature): YAML text to compiled bytes. Never
//!   compiled into the on-chain program.
//! - `interpreter`: runs a compiled policy against the match state and returns this turn's orders.

pub mod format;

#[cfg(feature = "compiler")]
pub mod compile_errors;
#[cfg(feature = "compiler")]
pub mod compiler;

use crate::conquest::CityFallChoice;
use crate::resources::Resource;
use crate::units::UnitKind;

/// A rule tests at most this many comparisons, joined with `and`.
pub const MAX_CONDITIONS_PER_RULE: usize = 3;

/// A number a condition can read from the match state. Each one's YAML name is `name()`.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Value {
    Food,
    Ore,
    Gold,
    Coins,
    FoodPrice,
    OrePrice,
    GoldPrice,
    BaseFoodPrice,
    BaseOrePrice,
    BaseGoldPrice,
    MyArmy,
    MyTiles,
    MyCities,
    MyInfantry,
    MyGuards,
    MySiege,
    MyElites,
    MySettlers,
    MyWorkers,
    WeakestNeighborArmy,
    StrongestNeighborArmy,
    Turn,
}

impl Value {
    /// Every value, in byte order: a value's byte is its position here + 1 (0 means "none").
    pub const ALL: [Value; 22] = [
        Value::Food,
        Value::Ore,
        Value::Gold,
        Value::Coins,
        Value::FoodPrice,
        Value::OrePrice,
        Value::GoldPrice,
        Value::BaseFoodPrice,
        Value::BaseOrePrice,
        Value::BaseGoldPrice,
        Value::MyArmy,
        Value::MyTiles,
        Value::MyCities,
        Value::MyInfantry,
        Value::MyGuards,
        Value::MySiege,
        Value::MyElites,
        Value::MySettlers,
        Value::MyWorkers,
        Value::WeakestNeighborArmy,
        Value::StrongestNeighborArmy,
        Value::Turn,
    ];

    /// The name a policy writes for this value.
    pub fn name(self) -> &'static str {
        match self {
            Value::Food => "food",
            Value::Ore => "ore",
            Value::Gold => "gold",
            Value::Coins => "coins",
            Value::FoodPrice => "food_price",
            Value::OrePrice => "ore_price",
            Value::GoldPrice => "gold_price",
            Value::BaseFoodPrice => "base_food_price",
            Value::BaseOrePrice => "base_ore_price",
            Value::BaseGoldPrice => "base_gold_price",
            Value::MyArmy => "my.army",
            Value::MyTiles => "my.tiles",
            Value::MyCities => "my.cities",
            Value::MyInfantry => "my.infantry",
            Value::MyGuards => "my.guards",
            Value::MySiege => "my.siege",
            Value::MyElites => "my.elites",
            Value::MySettlers => "my.settlers",
            Value::MyWorkers => "my.workers",
            Value::WeakestNeighborArmy => "weakest_neighbor.army",
            Value::StrongestNeighborArmy => "strongest_neighbor.army",
            Value::Turn => "turn",
        }
    }
}

/// How a condition compares its two sides.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Comparison {
    Less,
    LessOrEqual,
    Greater,
    GreaterOrEqual,
    Equal,
    NotEqual,
}

impl Comparison {
    /// Every comparison, in byte order (byte = position + 1).
    pub const ALL: [Comparison; 6] = [
        Comparison::Less,
        Comparison::LessOrEqual,
        Comparison::Greater,
        Comparison::GreaterOrEqual,
        Comparison::Equal,
        Comparison::NotEqual,
    ];

    /// The symbol a policy writes.
    pub fn symbol(self) -> &'static str {
        match self {
            Comparison::Less => "<",
            Comparison::LessOrEqual => "<=",
            Comparison::Greater => ">",
            Comparison::GreaterOrEqual => ">=",
            Comparison::Equal => "==",
            Comparison::NotEqual => "!=",
        }
    }

    /// True if `left` compared with `right` this way holds.
    pub fn holds(self, left: u64, right: u64) -> bool {
        match self {
            Comparison::Less => left < right,
            Comparison::LessOrEqual => left <= right,
            Comparison::Greater => left > right,
            Comparison::GreaterOrEqual => left >= right,
            Comparison::Equal => left == right,
            Comparison::NotEqual => left != right,
        }
    }
}

/// The right-hand side of a comparison.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Operand {
    /// A whole number: `food < 40`.
    Number(u32),
    /// A percentage of another value: `gold_price > 150% base_gold_price`.
    PercentOf { percent: u32, value: Value },
}

/// One comparison: `value comparison right`.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Condition {
    pub value: Value,
    pub comparison: Comparison,
    pub right: Operand,
}

/// Which free tile `claim_tile` buys.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum TileTarget {
    /// The nearest free deposit tile next to your land.
    NearestDeposit,
    /// The nearest free tile of any kind next to your land.
    NearestFree,
}

/// Which other civ `attack` goes after.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum CivTarget {
    /// The living civ with the fewest fighting units.
    WeakestNeighbor,
    /// The living civ with the most fighting units.
    StrongestNeighbor,
}

/// What a rule does when its conditions hold. The interpreter turns it into a concrete `Action`
/// (orders.rs) by picking the target tile from the current state.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum PolicyAction {
    Build(UnitKind),
    Rush,
    FoundCity,
    ClaimTile(TileTarget),
    /// `None` spreads Workers evenly.
    AssignWorkers(Option<Resource>),
    Sell(Resource, u32),
    Buy(Resource, u32),
    Attack {
        target: CivTarget,
        choice: CityFallChoice,
    },
}

/// One `if` / `do` line. All-`None` conditions mean `always`.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Rule {
    pub conditions: [Option<Condition>; MAX_CONDITIONS_PER_RULE],
    pub action: PolicyAction,
}

/// The byte for an item of a list: its position + 1, so 0 stays free for "none". Shared by every
/// enum above that has an `ALL` list.
///
/// `<T: PartialEq>` makes this work for any type that can be compared with `==` (Value,
/// Comparison, ...), like a TypeScript generic `<T>`.
fn byte_of<T: PartialEq>(item: T, all: &[T]) -> u8 {
    let position = all
        .iter()
        .position(|candidate| *candidate == item)
        .unwrap_or(0);
    u8::try_from(position + 1).unwrap_or(0)
}

/// The item for a byte made by `byte_of`, or `None` for 0 and unknown bytes.
fn item_of<T: Copy>(byte: u8, all: &[T]) -> Option<T> {
    let position = usize::from(byte).checked_sub(1)?;
    all.get(position).copied()
}
