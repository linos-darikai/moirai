//! Civs: one player's civilisation inside a match. See the glossary in CLAUDE.md section 3.

use crate::map::TileCoordinate;
use crate::resources::ResourceStock;
use crate::units::UnitCounts;

/// The most civs one match can have (PLAN.md section 2: 4 civs).
pub const MAX_CIVS: usize = 4;

/// Which civ something belongs to: 0, 1, 2 or 3, in join order.
///
/// A "newtype" (a struct wrapping one number) so a civ id can't be mixed up with a tile index or a
/// unit count by accident.
#[derive(Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub struct CivId(pub u8);

/// One civ's state.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Civ {
    pub id: CivId,
    /// The tile of this civ's starting city.
    pub city: TileCoordinate,
    pub resources: ResourceStock,
    pub units: UnitCounts,
    /// False once the civ has lost its last city (relevant for the Conquest win metric).
    pub is_alive: bool,
}

impl Civ {
    /// A new civ with an empty stock and no units, living in its starting city.
    pub fn new(id: CivId, city: TileCoordinate) -> Civ {
        Civ {
            id,
            city,
            resources: ResourceStock::EMPTY,
            units: UnitCounts::NONE,
            is_alive: true,
        }
    }
}
