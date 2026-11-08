//! Expeditions: a civ's army on the march (docs/decisions/0010). `attack` sends the whole fighting
//! army out from the civ's tile nearest the target; each turn it marches a few tiles (its slowest
//! unit's speed) and fights when it arrives. A civ has at most one expedition at a time.
//!
//! Storage: 20 plain bytes inside `Civ`, like the rest of the civ (docs/decisions/0004).

use bytemuck::{Pod, Zeroable};

use crate::conquest::CityFallChoice;
use crate::map::TileCoordinate;
use crate::rules::unit_stats;
use crate::units::{UnitCounts, UnitKind};

/// Bit in `Expedition::flags`: the expedition is out (an all-zero record means "none").
const MARCHING_FLAG: u8 = 0b0000_0001;
/// Bit in `Expedition::flags`: raze a city that falls instead of capturing it.
const RAZE_FLAG: u8 = 0b0000_0010;

/// One army on the march, as 20 plain bytes.
///
/// Field order: the 2-byte-aligned unit counts first, then single bytes, padded to 20 with a
/// named `reserved` field so there is no hidden padding (which `Pod` forbids).
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct Expedition {
    /// The units marching.
    pub units: UnitCounts,
    /// Where the army is now.
    x: u8,
    y: u8,
    /// Where it is going.
    target_x: u8,
    target_y: u8,
    /// Bit flags: marching, raze.
    flags: u8,
    /// Unused; always zero.
    reserved: [u8; 3],
}

impl Expedition {
    /// No expedition.
    pub const NONE: Expedition = Expedition {
        units: UnitCounts::NONE,
        x: 0,
        y: 0,
        target_x: 0,
        target_y: 0,
        flags: 0,
        reserved: [0; 3],
    };

    /// A new expedition of `units` starting on `start`, heading for `target`.
    pub fn new(
        units: UnitCounts,
        start: TileCoordinate,
        target: TileCoordinate,
        choice: CityFallChoice,
    ) -> Expedition {
        let mut flags = MARCHING_FLAG;
        if choice == CityFallChoice::Raze {
            flags |= RAZE_FLAG;
        }
        Expedition {
            units,
            x: start.x(),
            y: start.y(),
            target_x: target.x(),
            target_y: target.y(),
            flags,
            reserved: [0; 3],
        }
    }

    /// True while the army is out.
    pub fn is_marching(&self) -> bool {
        self.flags & MARCHING_FLAG != 0
    }

    /// Where the army is, or `None` if it isn't out (or the bytes are off the map).
    pub fn position(&self) -> Option<TileCoordinate> {
        if !self.is_marching() {
            return None;
        }
        TileCoordinate::new(self.x, self.y)
    }

    /// Where the army is going, or `None` if it isn't out.
    pub fn target(&self) -> Option<TileCoordinate> {
        if !self.is_marching() {
            return None;
        }
        TileCoordinate::new(self.target_x, self.target_y)
    }

    /// Capture or raze a city that falls.
    pub fn choice(&self) -> CityFallChoice {
        if self.flags & RAZE_FLAG != 0 {
            CityFallChoice::Raze
        } else {
            CityFallChoice::Capture
        }
    }

    /// Tiles per turn: the slowest unit's speed (0 if there are no units).
    pub fn speed(&self) -> u8 {
        let mut slowest: Option<u8> = None;
        for kind in UnitKind::ALL {
            if self.units.count(kind) == 0 {
                continue;
            }
            let speed = unit_stats(kind).speed;
            slowest = Some(slowest.map_or(speed, |current| current.min(speed)));
        }
        slowest.unwrap_or(0)
    }

    /// Moves up to `speed()` tiles towards the target: along x first, then y. Returns true once
    /// the army stands on its target.
    pub fn march(&mut self) -> bool {
        for _ in 0..self.speed() {
            if self.x == self.target_x && self.y == self.target_y {
                break;
            }
            if self.x != self.target_x {
                self.x = step_towards(self.x, self.target_x);
            } else {
                self.y = step_towards(self.y, self.target_y);
            }
        }
        self.x == self.target_x && self.y == self.target_y
    }
}

/// One step from `from` towards `to` (never past it).
fn step_towards(from: u8, to: u8) -> u8 {
    if from < to {
        from.saturating_add(1)
    } else {
        from.saturating_sub(1)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn coordinate(x: u8, y: u8) -> TileCoordinate {
        TileCoordinate::new(x, y).expect("test coordinates are on the map")
    }

    fn army(infantry: u16, siege: u16) -> UnitCounts {
        UnitCounts {
            infantry,
            siege,
            ..UnitCounts::NONE
        }
    }

    #[test]
    fn infantry_marches_two_tiles_a_turn_along_x_then_y() {
        let mut expedition = Expedition::new(
            army(5, 0),
            coordinate(3, 3),
            coordinate(6, 5),
            CityFallChoice::Capture,
        );

        let after_one = expedition.march();
        let position_one = expedition.position();
        let after_two = expedition.march();
        let after_three = expedition.march();

        assert!(!after_one);
        assert_eq!(position_one, Some(coordinate(5, 3)));
        assert!(!after_two);
        assert_eq!(expedition.position(), Some(coordinate(6, 5)));
        assert!(after_three);
    }

    #[test]
    fn bringing_siege_slows_the_whole_army_to_one_tile_a_turn() {
        let fast = Expedition::new(
            army(5, 0),
            coordinate(0, 0),
            coordinate(9, 9),
            CityFallChoice::Capture,
        );
        let slow = Expedition::new(
            army(5, 1),
            coordinate(0, 0),
            coordinate(9, 9),
            CityFallChoice::Capture,
        );

        assert_eq!(fast.speed(), 2);
        assert_eq!(slow.speed(), 1);
    }

    #[test]
    fn an_empty_record_is_no_expedition() {
        let none: Expedition = Zeroable::zeroed();

        assert_eq!(none, Expedition::NONE);
        assert!(!none.is_marching());
        assert_eq!(none.position(), None);
    }

    #[test]
    fn an_expedition_is_20_plain_bytes() {
        assert_eq!(std::mem::size_of::<Expedition>(), 20);
    }
}
