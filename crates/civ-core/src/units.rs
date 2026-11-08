//! Units: the six unit kinds and how many of each a civ has. In v1 units are counts per civ, not
//! pieces on the map (docs/decisions/0006 section 4, 0007). Each kind's attack, defence, cost,
//! build time and upkeep live in rules.rs (`unit_stats`).

/// The six kinds of unit.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum UnitKind {
    /// Triangle. Cheap (Food). Strong against Siege.
    Infantry,
    /// Square. Ore. Strong against Infantry.
    Guard,
    /// Tall rectangle. Ore + Gold. Strong against Guard and city walls.
    Siege,
    /// Star. Gold, expensive. A bonus against everything; at most one per city size.
    Elite,
    /// Doesn't fight (defence only). Used up by `found_city` to build a new city on a city site.
    Settler,
    /// Doesn't fight (defence only). Works one owned deposit so it produces (docs/decisions/0007).
    Worker,
}

impl UnitKind {
    /// Every unit kind, in a fixed order.
    pub const ALL: [UnitKind; 6] = [
        UnitKind::Infantry,
        UnitKind::Guard,
        UnitKind::Siege,
        UnitKind::Elite,
        UnitKind::Settler,
        UnitKind::Worker,
    ];

    /// True for the kinds that join an attack (everything except Settlers and Workers).
    pub fn is_fighter(self) -> bool {
        // `matches!(value, A | B)` is true if the value is one of those variants.
        !matches!(self, UnitKind::Settler | UnitKind::Worker)
    }

    /// The kind as one stored byte (1..=6). 0 is kept for "nothing", e.g. a city that isn't
    /// building anything.
    pub fn to_byte(self) -> u8 {
        match self {
            UnitKind::Infantry => 1,
            UnitKind::Guard => 2,
            UnitKind::Siege => 3,
            UnitKind::Elite => 4,
            UnitKind::Settler => 5,
            UnitKind::Worker => 6,
        }
    }

    /// Reads a stored byte back. `None` for 0 ("nothing") and for bytes no kind uses (account
    /// data is untrusted).
    pub fn from_byte(byte: u8) -> Option<UnitKind> {
        match byte {
            1 => Some(UnitKind::Infantry),
            2 => Some(UnitKind::Guard),
            3 => Some(UnitKind::Siege),
            4 => Some(UnitKind::Elite),
            5 => Some(UnitKind::Settler),
            6 => Some(UnitKind::Worker),
            _ => None,
        }
    }
}

/// How many units of each kind a civ has. 12 plain bytes, like `ResourceStock`.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default, bytemuck::Pod, bytemuck::Zeroable)]
pub struct UnitCounts {
    pub infantry: u16,
    pub guard: u16,
    pub siege: u16,
    pub elite: u16,
    pub settler: u16,
    pub worker: u16,
}

impl UnitCounts {
    /// No units at all.
    pub const NONE: UnitCounts = UnitCounts {
        infantry: 0,
        guard: 0,
        siege: 0,
        elite: 0,
        settler: 0,
        worker: 0,
    };

    /// How many units of `kind` there are.
    pub fn count(&self, kind: UnitKind) -> u16 {
        match kind {
            UnitKind::Infantry => self.infantry,
            UnitKind::Guard => self.guard,
            UnitKind::Siege => self.siege,
            UnitKind::Elite => self.elite,
            UnitKind::Settler => self.settler,
            UnitKind::Worker => self.worker,
        }
    }

    /// The count of `kind`, borrowed so `add` and `remove` can change it. Private: outside code
    /// goes through `add` and `remove`, which can't overflow.
    fn count_mut(&mut self, kind: UnitKind) -> &mut u16 {
        match kind {
            UnitKind::Infantry => &mut self.infantry,
            UnitKind::Guard => &mut self.guard,
            UnitKind::Siege => &mut self.siege,
            UnitKind::Elite => &mut self.elite,
            UnitKind::Settler => &mut self.settler,
            UnitKind::Worker => &mut self.worker,
        }
    }

    /// Adds `amount` units of `kind`, stopping at the maximum instead of overflowing.
    pub fn add(&mut self, kind: UnitKind, amount: u16) {
        let count = self.count_mut(kind);
        *count = count.saturating_add(amount);
    }

    /// Removes up to `amount` units of `kind` (never below zero). Returns how many were removed.
    pub fn remove(&mut self, kind: UnitKind, amount: u16) -> u16 {
        let count = self.count_mut(kind);
        let removed = amount.min(*count);
        // `*count` means "the number `count` points at". removed <= count, so this never stops
        // at zero early; saturating_sub just keeps the no-overflow rule visible.
        *count = count.saturating_sub(removed);
        removed
    }

    /// Total number of units of all kinds.
    pub fn total(&self) -> u32 {
        let mut total: u32 = 0;
        for kind in UnitKind::ALL {
            total = total.saturating_add(u32::from(self.count(kind)));
        }
        total
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adding_units_only_changes_that_kind() {
        let mut units = UnitCounts::NONE;

        units.add(UnitKind::Siege, 2);

        assert_eq!(units.count(UnitKind::Siege), 2);
        assert_eq!(units.count(UnitKind::Infantry), 0);
    }

    #[test]
    fn removing_more_units_than_there_are_stops_at_zero() {
        let mut units = UnitCounts {
            settler: 2,
            ..UnitCounts::NONE
        };

        let removed = units.remove(UnitKind::Settler, 5);

        assert_eq!(removed, 2);
        assert_eq!(units.count(UnitKind::Settler), 0);
    }

    #[test]
    fn total_counts_every_kind() {
        let units = UnitCounts {
            infantry: 3,
            guard: 2,
            siege: 1,
            elite: 1,
            settler: 1,
            worker: 2,
        };

        let total = units.total();

        assert_eq!(total, 10);
    }

    #[test]
    fn every_kind_survives_a_round_trip_through_its_byte() {
        for kind in UnitKind::ALL {
            assert_eq!(UnitKind::from_byte(kind.to_byte()), Some(kind));
        }
        assert_eq!(UnitKind::from_byte(0), None);
    }

    #[test]
    fn settlers_and_workers_do_not_fight() {
        assert!(!UnitKind::Settler.is_fighter());
        assert!(!UnitKind::Worker.is_fighter());
        assert!(UnitKind::Siege.is_fighter());
    }
}
