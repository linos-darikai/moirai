//! Resources: Food, Ore and Gold, and a civ's stock of them. All amounts are whole numbers.
//! See PLAN.md section 2, "Resources".

/// One of the three resources. Colours in the app: Food = blue, Ore = red, Gold = gold.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Resource {
    Food,
    Ore,
    Gold,
}

impl Resource {
    /// Every resource, in a fixed order. Loops over resources use this so the order never changes.
    pub const ALL: [Resource; 3] = [Resource::Food, Resource::Ore, Resource::Gold];

    /// Picks a resource from a random roll: 0 = Food, 1 = Ore, 2 = Gold (larger rolls wrap
    /// around). A `match` instead of indexing `ALL[roll]`, so a bad roll can never crash.
    pub fn from_roll(roll: u64) -> Resource {
        match roll % 3 {
            0 => Resource::Food,
            1 => Resource::Ore,
            _ => Resource::Gold,
        }
    }

    /// The byte stored in a map tile for this resource: 1 = Food, 2 = Ore, 3 = Gold
    /// (0 means "no deposit", see `map::Tile`).
    pub fn to_byte(self) -> u8 {
        match self {
            Resource::Food => 1,
            Resource::Ore => 2,
            Resource::Gold => 3,
        }
    }

    /// The resource for a stored byte, or `None` for 0 or any byte that isn't a resource
    /// (account data is untrusted, so bad bytes mean "nothing" rather than a crash).
    pub fn from_byte(byte: u8) -> Option<Resource> {
        match byte {
            1 => Some(Resource::Food),
            2 => Some(Resource::Ore),
            3 => Some(Resource::Gold),
            _ => None,
        }
    }

    /// A one-letter label for text maps and logs: F, O or G.
    pub fn letter(self) -> char {
        // `match` is like a TypeScript `switch` that must handle every case.
        match self {
            Resource::Food => 'F',
            Resource::Ore => 'O',
            Resource::Gold => 'G',
        }
    }
}

/// How much of each resource a civ holds.
///
/// Plain bytes (`#[repr(C)]`, `Pod`) so it can sit inside an on-chain Civ account as-is
/// (docs/decisions/0004).
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default, bytemuck::Pod, bytemuck::Zeroable)]
pub struct ResourceStock {
    pub food: u32,
    pub ore: u32,
    pub gold: u32,
}

impl ResourceStock {
    /// A stock with nothing in it.
    pub const EMPTY: ResourceStock = ResourceStock {
        food: 0,
        ore: 0,
        gold: 0,
    };

    /// A stock holding `amount` of one resource and nothing else.
    pub fn only(resource: Resource, amount: u32) -> ResourceStock {
        let mut stock = ResourceStock::EMPTY;
        stock.add(resource, amount);
        stock
    }

    /// How much of `resource` this stock holds.
    pub fn amount(&self, resource: Resource) -> u32 {
        match resource {
            Resource::Food => self.food,
            Resource::Ore => self.ore,
            Resource::Gold => self.gold,
        }
    }

    /// Adds `amount` of `resource`. Stops at the maximum instead of overflowing (saturating).
    pub fn add(&mut self, resource: Resource, amount: u32) {
        match resource {
            Resource::Food => self.food = self.food.saturating_add(amount),
            Resource::Ore => self.ore = self.ore.saturating_add(amount),
            Resource::Gold => self.gold = self.gold.saturating_add(amount),
        }
    }

    /// True if this stock holds at least `cost` of every resource.
    pub fn can_afford(&self, cost: &ResourceStock) -> bool {
        self.food >= cost.food && self.ore >= cost.ore && self.gold >= cost.gold
    }

    /// Takes `cost` out of the stock, stopping at zero instead of going negative. Check
    /// `can_afford` first when the full cost must be paid.
    pub fn subtract(&mut self, cost: &ResourceStock) {
        self.food = self.food.saturating_sub(cost.food);
        self.ore = self.ore.saturating_sub(cost.ore);
        self.gold = self.gold.saturating_sub(cost.gold);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adding_a_resource_only_changes_that_resource() {
        let mut stock = ResourceStock::EMPTY;

        stock.add(Resource::Ore, 5);

        assert_eq!(stock.amount(Resource::Ore), 5);
        assert_eq!(stock.amount(Resource::Food), 0);
        assert_eq!(stock.amount(Resource::Gold), 0);
    }

    #[test]
    fn a_stock_can_afford_a_cost_only_if_it_covers_every_resource() {
        let stock = ResourceStock {
            food: 30,
            ore: 5,
            gold: 0,
        };

        let cheap = ResourceStock {
            food: 10,
            ..ResourceStock::EMPTY
        };
        let too_much_ore = ResourceStock {
            food: 10,
            ore: 10,
            gold: 0,
        };

        assert!(stock.can_afford(&cheap));
        assert!(!stock.can_afford(&too_much_ore));
    }

    #[test]
    fn subtracting_stops_at_zero() {
        let mut stock = ResourceStock {
            food: 30,
            ore: 5,
            gold: 0,
        };

        stock.subtract(&ResourceStock {
            food: 10,
            ore: 10,
            gold: 0,
        });

        assert_eq!(
            stock,
            ResourceStock {
                food: 20,
                ore: 0,
                gold: 0
            }
        );
    }

    #[test]
    fn adding_past_the_maximum_stops_at_the_maximum() {
        let mut stock = ResourceStock {
            gold: u32::MAX - 1,
            ..ResourceStock::EMPTY
        };

        stock.add(Resource::Gold, 10);

        assert_eq!(stock.gold, u32::MAX);
    }
}
