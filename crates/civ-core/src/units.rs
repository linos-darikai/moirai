//! Units: the four unit kinds and how many of each a civ has. Costs, strengths and the
//! rock-paper-scissors battle rules come in the battle step. See PLAN.md section 2, "Units".

/// The four kinds of unit.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum UnitKind {
    /// Triangle. Cheap (Food). Strong against Siege, weak against Guard.
    Infantry,
    /// Square. Ore. Strong against Infantry, weak against Siege.
    Guard,
    /// Tall rectangle. Ore + Gold. Strong against Guard, weak against Infantry.
    Siege,
    /// Star. Gold, expensive. Beats any one unit 1v1; at most one per city.
    Elite,
}

impl UnitKind {
    /// Every unit kind, in a fixed order.
    pub const ALL: [UnitKind; 4] = [
        UnitKind::Infantry,
        UnitKind::Guard,
        UnitKind::Siege,
        UnitKind::Elite,
    ];
}

/// How many units of each kind a civ has.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct UnitCounts {
    pub infantry: u16,
    pub guard: u16,
    pub siege: u16,
    pub elite: u16,
}

impl UnitCounts {
    /// No units at all.
    pub const NONE: UnitCounts = UnitCounts {
        infantry: 0,
        guard: 0,
        siege: 0,
        elite: 0,
    };

    /// How many units of `kind` there are.
    pub fn count(&self, kind: UnitKind) -> u16 {
        match kind {
            UnitKind::Infantry => self.infantry,
            UnitKind::Guard => self.guard,
            UnitKind::Siege => self.siege,
            UnitKind::Elite => self.elite,
        }
    }

    /// Adds `amount` units of `kind`, stopping at the maximum instead of overflowing.
    pub fn add(&mut self, kind: UnitKind, amount: u16) {
        match kind {
            UnitKind::Infantry => self.infantry = self.infantry.saturating_add(amount),
            UnitKind::Guard => self.guard = self.guard.saturating_add(amount),
            UnitKind::Siege => self.siege = self.siege.saturating_add(amount),
            UnitKind::Elite => self.elite = self.elite.saturating_add(amount),
        }
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
    fn total_counts_every_kind() {
        let units = UnitCounts {
            infantry: 3,
            guard: 2,
            siege: 1,
            elite: 1,
        };

        let total = units.total();

        assert_eq!(total, 7);
    }
}
