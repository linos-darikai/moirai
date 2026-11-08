//! Cities: one city of a civ (docs/decisions/0006, "Cities"). A civ keeps its cities in a fixed
//! array of `MAX_CITIES_PER_CIV` slots inside `Civ` (civ.rs); a slot is either in use or empty.
//!
//! Storage layout: `City` is 8 plain bytes (`#[repr(C)]`, `Pod`), like the rest of the civ, so the
//! program can read it straight out of account data (docs/decisions/0004).

use bytemuck::{Pod, Zeroable};

use crate::map::TileCoordinate;
use crate::rules::MAX_CITY_SIZE;

/// Bit in `City::flags`: this slot holds a real city (an all-zero slot is an empty one).
const IN_USE_FLAG: u8 = 0b0000_0001;
/// Bit in `City::flags`: this city is the civ's capital (exactly one per living civ).
const CAPITAL_FLAG: u8 = 0b0000_0010;
/// Bit in `City::flags`: the city's border met another civ's, so it never grows again
/// (docs/decisions/0006, "Borders lock where they meet").
const GROWTH_STOPPED_FLAG: u8 = 0b0000_0100;

/// The size every city starts at.
pub const STARTING_CITY_SIZE: u8 = 1;

/// One city, as 8 plain bytes.
///
/// Field order: four single bytes, then two 2-byte numbers, so there is no hidden padding
/// (which `Pod` forbids).
// `#[derive(...)]` asks the compiler to write standard code for us: copying, comparing, printing
// for tests (`Debug`), and `Pod`/`Zeroable` from bytemuck, which promise "any bytes are a valid
// City", so it can be read straight from account data.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct City {
    /// Column of the city's tile.
    x: u8,
    /// Row of the city's tile.
    y: u8,
    /// Size 1 to MAX_CITY_SIZE (rules.rs). Sets income and border radius.
    size: u8,
    /// Bit flags: in use, capital, growth stopped. Other bits are reserved.
    flags: u8,
    /// Food-driven growth progress towards the next size (see `rules::growth_threshold`).
    growth_points: u16,
    /// The turn the city was founded (or captured). Breaks ties when picking a new capital:
    /// the oldest city wins.
    founded_turn: u16,
}

impl City {
    /// An empty slot: no city here.
    pub const EMPTY: City = City {
        x: 0,
        y: 0,
        size: 0,
        flags: 0,
        growth_points: 0,
        founded_turn: 0,
    };

    /// A brand-new size 1 city on `tile`, founded on `founded_turn`.
    pub fn founded(tile: TileCoordinate, founded_turn: u16, is_capital: bool) -> City {
        let mut flags = IN_USE_FLAG;
        if is_capital {
            flags |= CAPITAL_FLAG;
        }
        City {
            x: tile.x(),
            y: tile.y(),
            size: STARTING_CITY_SIZE,
            flags,
            growth_points: 0,
            founded_turn,
        }
    }

    /// True if this slot holds a city; false for an empty slot.
    pub fn is_in_use(&self) -> bool {
        self.flags & IN_USE_FLAG != 0
    }

    /// True if this is the civ's capital.
    pub fn is_capital(&self) -> bool {
        self.is_in_use() && self.flags & CAPITAL_FLAG != 0
    }

    /// True once the city's border has locked against another civ's (it never grows again).
    pub fn has_stopped_growing(&self) -> bool {
        self.flags & GROWTH_STOPPED_FLAG != 0
    }

    /// The city's tile, or `None` for an empty slot or if the stored bytes are off the map
    /// (account data is untrusted, so this can't assume they are valid).
    // `Option<T>` is either `Some(value)` or `None`, like `T | null` in TypeScript.
    pub fn tile(&self) -> Option<TileCoordinate> {
        if !self.is_in_use() {
            return None;
        }
        TileCoordinate::new(self.x, self.y)
    }

    /// The city's size (0 for an empty slot).
    pub fn size(&self) -> u8 {
        self.size
    }

    /// Growth progress towards the next size.
    pub fn growth_points(&self) -> u16 {
        self.growth_points
    }

    /// The turn the city was founded or captured.
    pub fn founded_turn(&self) -> u16 {
        self.founded_turn
    }

    /// True if the city can still grow: in use, not at MAX_CITY_SIZE, border not locked.
    pub fn can_grow(&self) -> bool {
        self.is_in_use() && self.size < MAX_CITY_SIZE && !self.has_stopped_growing()
    }

    /// Adds this turn's growth points. Saturates instead of overflowing.
    pub fn add_growth_points(&mut self, points: u16) {
        self.growth_points = self.growth_points.saturating_add(points);
    }

    /// Grows the city one size (up to MAX_CITY_SIZE) and starts its growth over from zero.
    pub fn grow(&mut self) {
        self.size = self.size.saturating_add(1).min(MAX_CITY_SIZE);
        self.growth_points = 0;
    }

    /// Makes this city the capital, or takes the title away.
    pub fn set_capital(&mut self, is_capital: bool) {
        if is_capital {
            self.flags |= CAPITAL_FLAG;
        } else {
            self.flags &= !CAPITAL_FLAG;
        }
    }

    /// This city as its new owner gets it after a capture (docs/decisions/0006, section 5): one
    /// size smaller (never below 1), growth restarted, never a capital, captured on `turn`. A
    /// locked border stays locked.
    pub fn captured(&self, turn: u16) -> City {
        let mut flags = IN_USE_FLAG;
        if self.has_stopped_growing() {
            flags |= GROWTH_STOPPED_FLAG;
        }
        City {
            x: self.x,
            y: self.y,
            size: self.size.saturating_sub(1).max(STARTING_CITY_SIZE),
            flags,
            growth_points: 0,
            founded_turn: turn,
        }
    }

    /// Locks the city at its current size for the rest of the match.
    pub fn stop_growing(&mut self) {
        self.flags |= GROWTH_STOPPED_FLAG;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_founded_city_starts_at_size_one_with_no_growth() {
        let tile = TileCoordinate::new(5, 2).expect("on the map");

        let city = City::founded(tile, 7, false);

        assert!(city.is_in_use());
        assert!(!city.is_capital());
        assert!(!city.has_stopped_growing());
        assert_eq!(city.tile(), Some(tile));
        assert_eq!(city.size(), STARTING_CITY_SIZE);
        assert_eq!(city.growth_points(), 0);
        assert_eq!(city.founded_turn(), 7);
    }

    #[test]
    fn an_empty_slot_has_no_tile_and_is_not_a_capital() {
        let slot = City::EMPTY;

        assert!(!slot.is_in_use());
        assert!(!slot.is_capital());
        assert_eq!(slot.tile(), None);
    }

    #[test]
    fn an_all_zero_slot_reads_as_empty() {
        // A freshly created account is all zero bytes; every slot must read as "no city".
        let slot: City = Zeroable::zeroed();

        assert_eq!(slot, City::EMPTY);
    }

    #[test]
    fn growing_raises_the_size_and_resets_growth_points() {
        let mut city = City::founded(TileCoordinate::new(3, 3).expect("on the map"), 0, true);
        city.add_growth_points(25);

        city.grow();

        assert_eq!(city.size(), 2);
        assert_eq!(city.growth_points(), 0);
    }

    #[test]
    fn a_city_at_max_size_or_with_a_locked_border_cannot_grow() {
        let tile = TileCoordinate::new(3, 3).expect("on the map");
        let mut biggest = City::founded(tile, 0, false);
        let mut locked = City::founded(tile, 0, false);

        for _ in 0..10 {
            biggest.grow();
        }
        locked.stop_growing();

        assert_eq!(biggest.size(), MAX_CITY_SIZE);
        assert!(!biggest.can_grow());
        assert!(!locked.can_grow());
        assert!(City::founded(tile, 0, false).can_grow());
    }

    #[test]
    fn a_captured_city_drops_one_size_and_is_no_longer_a_capital() {
        let mut capital = City::founded(TileCoordinate::new(3, 3).expect("on the map"), 0, true);
        capital.grow();
        capital.grow();

        let captured = capital.captured(30);

        assert_eq!(captured.size(), 2);
        assert!(!captured.is_capital());
        assert_eq!(captured.founded_turn(), 30);
        assert_eq!(captured.tile(), capital.tile());
    }

    #[test]
    fn a_captured_size_one_city_stays_size_one() {
        let city = City::founded(TileCoordinate::new(3, 3).expect("on the map"), 0, false);

        assert_eq!(city.captured(5).size(), 1);
    }

    #[test]
    fn a_city_is_8_plain_bytes() {
        // Civ holds MAX_CITIES_PER_CIV of these; rethink the Civ layout before changing it.
        assert_eq!(std::mem::size_of::<City>(), 8);
    }
}
