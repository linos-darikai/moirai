//! Civs: one player's civilisation inside a match. See the glossary in CLAUDE.md section 3.
//!
//! Storage layout: `Civ` is 112 plain bytes (`#[repr(C)]`, `Pod`) so the program can use it as
//! zero-copy account data, like the map (docs/decisions/0004). Read it through the methods.

use bytemuck::{Pod, Zeroable};

use crate::city::City;
use crate::map::TileCoordinate;
use crate::resources::{Resource, ResourceStock};
use crate::rules::MAX_CITIES_PER_CIV;
use crate::units::UnitCounts;

/// The most civs one match can have (PLAN.md section 2: 4 civs).
pub const MAX_CIVS: usize = 4;

/// Bit in `Civ::flags` that says the civ is still in the game.
const ALIVE_FLAG: u8 = 0b0000_0001;

/// The turn number a match starts on. The capital is founded on this turn.
pub const FIRST_TURN: u16 = 0;

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

/// One civ's state, as 112 plain bytes.
///
/// Field order matters for `#[repr(C)]`: 2 single bytes + 12 bytes of unit counts + 2 more single
/// bytes end exactly at byte 16, where the 4-byte-aligned resource stock and coins can start,
/// followed by the cities. `Pod` forbids hidden padding, and this order needs none.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct Civ {
    /// Which civ this is (0..4).
    id: u8,
    /// Bit flags; bit 0 = alive. Other bits are reserved.
    flags: u8,
    /// Units of each kind.
    pub units: UnitCounts,
    /// Resource that Workers go to first, as `Resource::to_byte` (0 = no focus, spread evenly).
    worker_focus: u8,
    /// Unused; always zero. Keeps `resources` on a 4-byte boundary without hidden padding.
    reserved: u8,
    /// Food, ore and gold on hand.
    pub resources: ResourceStock,
    /// Coins on hand (docs/decisions/0007): earned from cities and market sales, spent on units
    /// and market purchases.
    pub coins: u32,
    /// Up to MAX_CITIES_PER_CIV cities. Slots not in use are `City::EMPTY`. The capital is
    /// whichever city has the capital flag, not always slot 0 (it moves when the capital falls).
    cities: [City; MAX_CITIES_PER_CIV],
}

impl Civ {
    /// A new civ with an empty stock and no units, alive, with its capital (size 1) on `capital`.
    pub fn new(id: CivId, capital: TileCoordinate) -> Civ {
        let mut cities = [City::EMPTY; MAX_CITIES_PER_CIV];
        cities[0] = City::founded(capital, FIRST_TURN, true);
        Civ {
            id: id.0,
            flags: ALIVE_FLAG,
            units: UnitCounts::NONE,
            worker_focus: 0,
            reserved: 0,
            resources: ResourceStock::EMPTY,
            coins: 0,
            cities,
        }
    }

    /// Which civ this is.
    pub fn id(&self) -> CivId {
        CivId(self.id)
    }

    /// All city slots, in slot order. Check `City::is_in_use` to skip the empty ones.
    pub fn cities(&self) -> &[City; MAX_CITIES_PER_CIV] {
        &self.cities
    }

    /// All city slots, borrowed so the caller can change them (growth, capture).
    pub fn cities_mut(&mut self) -> &mut [City; MAX_CITIES_PER_CIV] {
        &mut self.cities
    }

    /// The first empty city slot, borrowed so the caller can put a city in it, or `None` if the
    /// civ already has MAX_CITIES_PER_CIV cities.
    pub fn free_city_slot(&mut self) -> Option<&mut City> {
        self.cities.iter_mut().find(|city| !city.is_in_use())
    }

    /// Which slot holds the civ's city on `tile`, or `None` if the civ has no city there.
    pub fn city_slot_at(&self, tile: TileCoordinate) -> Option<usize> {
        // `.position(...)` is like `findIndex` in TypeScript, but returns None instead of -1.
        self.cities
            .iter()
            .position(|city| city.tile() == Some(tile))
    }

    /// How many cities the civ has.
    pub fn city_count(&self) -> usize {
        let mut count = 0;
        for city in &self.cities {
            if city.is_in_use() {
                count += 1;
            }
        }
        count
    }

    /// The sizes of all the civ's cities added up (a size 3 city and a size 1 city make 4).
    /// City income scales with this.
    pub fn total_city_size(&self) -> u32 {
        let mut total: u32 = 0;
        for city in &self.cities {
            if city.is_in_use() {
                total = total.saturating_add(u32::from(city.size()));
            }
        }
        total
    }

    /// The civ's capital, or `None` if it has no cities left.
    pub fn capital(&self) -> Option<&City> {
        // `.find(...)` returns the first city the test is true for, or None.
        self.cities.iter().find(|city| city.is_capital())
    }

    /// The resource Workers go to first, or `None` to spread them evenly.
    pub fn worker_focus(&self) -> Option<Resource> {
        Resource::from_byte(self.worker_focus)
    }

    /// Sets (or clears, with `None`) the resource Workers go to first.
    pub fn set_worker_focus(&mut self, focus: Option<Resource>) {
        self.worker_focus = match focus {
            Some(resource) => resource.to_byte(),
            None => 0,
        };
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
    use crate::city::STARTING_CITY_SIZE;

    fn coordinate(x: u8, y: u8) -> TileCoordinate {
        TileCoordinate::new(x, y).expect("test coordinates are on the map")
    }

    #[test]
    fn a_new_civ_is_alive_with_nothing_but_its_capital() {
        let capital_tile = coordinate(3, 3);

        let civ = Civ::new(CivId(2), capital_tile);

        assert_eq!(civ.id(), CivId(2));
        assert!(civ.is_alive());
        assert_eq!(civ.resources, ResourceStock::EMPTY);
        assert_eq!(civ.units, UnitCounts::NONE);
        assert_eq!(civ.city_count(), 1);
    }

    #[test]
    fn the_capital_is_a_size_one_city_founded_on_the_first_turn() {
        let capital_tile = coordinate(12, 3);

        let civ = Civ::new(CivId(1), capital_tile);
        let capital = civ.capital().expect("a new civ has a capital");

        assert_eq!(capital.tile(), Some(capital_tile));
        assert_eq!(capital.size(), STARTING_CITY_SIZE);
        assert_eq!(capital.founded_turn(), FIRST_TURN);
    }

    #[test]
    fn every_other_city_slot_starts_empty() {
        let civ = Civ::new(CivId(0), coordinate(3, 3));

        let empty_slots = civ.cities().iter().filter(|city| !city.is_in_use()).count();

        assert_eq!(empty_slots, MAX_CITIES_PER_CIV - 1);
    }

    #[test]
    fn total_city_size_adds_up_every_city() {
        let mut civ = Civ::new(CivId(0), coordinate(3, 3));
        civ.cities_mut()[0].grow();
        civ.cities_mut()[1] = City::founded(coordinate(6, 3), 5, false);

        let total = civ.total_city_size();

        assert_eq!(total, 2 + 1);
    }

    #[test]
    fn a_civ_can_be_knocked_out() {
        let mut civ = Civ::new(CivId(0), coordinate(3, 3));

        civ.set_alive(false);

        assert!(!civ.is_alive());
    }

    #[test]
    fn a_civ_is_112_plain_bytes() {
        // The on-chain Civ account's size depends on this; rethink the layout before changing it.
        // 2 (id, flags) + 12 (units) + 2 (worker focus, reserved) + 12 (resources) + 4 (coins)
        // + 8 cities x 10 bytes.
        assert_eq!(std::mem::size_of::<Civ>(), 112);
    }
}
