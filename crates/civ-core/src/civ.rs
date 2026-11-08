//! Civs: one player's civilisation inside a match. See the glossary in CLAUDE.md section 3.
//!
//! Storage layout: `Civ` is 24 plain bytes (`#[repr(C)]`, `Pod`) so the program can use it as
//! zero-copy account data, like the map (docs/decisions/0004). Read it through the methods.

use bytemuck::{Pod, Zeroable};

use crate::map::TileCoordinate;
use crate::resources::ResourceStock;
use crate::units::UnitCounts;

/// The most civs one match can have (PLAN.md section 2: 4 civs).
pub const MAX_CIVS: usize = 4;

/// Bit in `Civ::flags` that says the civ is still in the game.
const ALIVE_FLAG: u8 = 0b0000_0001;

/// Which civ something belongs to: 0, 1, 2 or 3, in join order.
///
/// A "newtype" (a struct wrapping one number) so a civ id can't be mixed up with a tile index or a
/// unit count by accident.
#[derive(Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub struct CivId(pub u8);

impl CivId {
    /// The civ's position in arrays indexed by civ (0..4).
    pub fn index(self) -> usize {
        usize::from(self.0)
    }
}

/// One civ's state, as 24 plain bytes.
///
/// Field order matters for `#[repr(C)]`: the four single bytes come first, then the 4-byte-aligned
/// resource stock, then the unit counts, so there is no hidden padding (which `Pod` forbids).
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct Civ {
    /// Which civ this is (0..4).
    id: u8,
    /// Column of the starting city.
    city_x: u8,
    /// Row of the starting city.
    city_y: u8,
    /// Bit flags; bit 0 = alive. Other bits are reserved.
    flags: u8,
    /// Food, ore and gold on hand.
    pub resources: ResourceStock,
    /// Units of each kind.
    pub units: UnitCounts,
}

impl Civ {
    /// A new civ with an empty stock and no units, alive in its starting city.
    pub fn new(id: CivId, city: TileCoordinate) -> Civ {
        Civ {
            id: id.0,
            city_x: city.x(),
            city_y: city.y(),
            flags: ALIVE_FLAG,
            resources: ResourceStock::EMPTY,
            units: UnitCounts::NONE,
        }
    }

    /// Which civ this is.
    pub fn id(&self) -> CivId {
        CivId(self.id)
    }

    /// The tile of this civ's starting city, or `None` if the stored bytes are off the map
    /// (account data is untrusted, so this can't assume they are valid).
    pub fn city(&self) -> Option<TileCoordinate> {
        TileCoordinate::new(self.city_x, self.city_y)
    }

    /// False once the civ has lost its last city (relevant for the Conquest win metric).
    pub fn is_alive(&self) -> bool {
        self.flags & ALIVE_FLAG != 0
    }

    /// Marks the civ as alive or out of the game.
    pub fn set_alive(&mut self, is_alive: bool) {
        if is_alive {
            self.flags |= ALIVE_FLAG;
        } else {
            self.flags &= !ALIVE_FLAG;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_new_civ_is_alive_in_its_city_with_nothing() {
        let city = TileCoordinate::new(3, 3).expect("on the map");

        let civ = Civ::new(CivId(2), city);

        assert_eq!(civ.id(), CivId(2));
        assert_eq!(civ.city(), Some(city));
        assert!(civ.is_alive());
        assert_eq!(civ.resources, ResourceStock::EMPTY);
    }

    #[test]
    fn a_civ_can_be_knocked_out() {
        let mut civ = Civ::new(CivId(0), TileCoordinate::new(3, 3).expect("on the map"));

        civ.set_alive(false);

        assert!(!civ.is_alive());
    }

    #[test]
    fn a_civ_is_24_plain_bytes() {
        // The on-chain Civ account's size depends on this; rethink the layout before changing it.
        assert_eq!(std::mem::size_of::<Civ>(), 24);
    }
}
