//! Every rule number of the game in one place (docs/decisions/0006-game-rules-v2.md). Other
//! modules read these constants; the app's Rules page shows the same values (app/src/data/rules.ts).
//!
//! All maths is integer. Percentages are basis points (bps): 10_000 bps = 100%. Prices are in
//! "gold units" × 10_000, so 12_500 means 1.25 gold.

use crate::resources::ResourceStock;
use crate::units::UnitKind;

/// Basis points in 100%.
pub const BPS_PER_WHOLE: u32 = 10_000;

// ----- Match -----

/// Turns in a match.
pub const TOTAL_TURNS: u16 = 60;

// ----- Cities, growth and borders -----

/// Most cities one civ can hold (capital included).
pub const MAX_CITIES_PER_CIV: usize = 8;
/// Largest city size.
pub const MAX_CITY_SIZE: u8 = 5;
/// Buildable city sites per map quarter, besides the capital's tile.
pub const CITY_SITES_PER_QUADRANT: usize = 3;
/// Smallest Manhattan distance between two city sites (and between a site and a capital).
pub const MIN_CITY_SITE_DISTANCE: u8 = 3;
/// Growth points to grow from size `s` are `GROWTH_BASE × s²`.
pub const GROWTH_BASE: u32 = 20;
/// Growth points every city gains each turn, before adding 1 per owned deposit in its border.
pub const BASE_GROWTH_PER_TURN: u16 = 1;

/// Growth points a city of `size` needs to reach the next size: 20, 80, 180, 320.
pub fn growth_threshold(size: u8) -> u32 {
    let size = u32::from(size);
    GROWTH_BASE.saturating_mul(size).saturating_mul(size)
}

/// How far a city of `size` reaches, in Manhattan steps: size + 1.
pub fn border_radius(size: u8) -> u8 {
    size.saturating_add(1)
}

// ----- Economy -----

/// Units an owned deposit tile produces each turn.
pub const DEPOSIT_YIELD_PER_TURN: u32 = 1;

/// What each city produces per size, per turn.
pub const CITY_INCOME_PER_SIZE: ResourceStock = ResourceStock {
    food: 2,
    ore: 1,
    gold: 1,
};

/// Price of the paid `claim_tile` action (one free tile next to your land).
pub const CLAIM_TILE_COST: ResourceStock = ResourceStock {
    food: 10,
    ore: 0,
    gold: 10,
};

// ----- Units -----

/// One unit kind's numbers (docs/decisions/0006, section 4).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct UnitStats {
    /// Strength when attacking.
    pub attack: u32,
    /// Strength when defending.
    pub defence: u32,
    /// What building one costs.
    pub cost: ResourceStock,
    /// Food it eats every turn.
    pub upkeep_food: u32,
}

/// The stats of each unit kind. A `match` with one arm per kind, so adding a kind to `UnitKind`
/// fails to compile until it has stats here.
pub fn unit_stats(kind: UnitKind) -> UnitStats {
    match kind {
        UnitKind::Infantry => UnitStats {
            attack: 3,
            defence: 2,
            cost: resources(10, 0, 0),
            upkeep_food: 1,
        },
        UnitKind::Guard => UnitStats {
            attack: 2,
            defence: 5,
            cost: resources(0, 15, 0),
            upkeep_food: 1,
        },
        UnitKind::Siege => UnitStats {
            attack: 6,
            defence: 1,
            cost: resources(0, 10, 10),
            upkeep_food: 1,
        },
        UnitKind::Elite => UnitStats {
            attack: 8,
            defence: 8,
            cost: resources(0, 0, 40),
            upkeep_food: 2,
        },
        UnitKind::Settler => UnitStats {
            attack: 0,
            defence: 1,
            cost: resources(30, 10, 0),
            upkeep_food: 1,
        },
    }
}

/// A civ may field one Elite per city size it owns in total.
pub const ELITES_PER_CITY_SIZE: u32 = 1;

/// When a civ can't feed its army, units are disbanded in this order: most valuable first, judged
/// by cost at base market prices (Elite 60, Settler 42.5, Siege 27.5, Guard 18.75, Infantry 10
/// gold units).
pub const DISBAND_ORDER: [UnitKind; 5] = [
    UnitKind::Elite,
    UnitKind::Settler,
    UnitKind::Siege,
    UnitKind::Guard,
    UnitKind::Infantry,
];

/// Shorthand for a stock of food, ore and gold, to keep the unit table short.
const fn resources(food: u32, ore: u32, gold: u32) -> ResourceStock {
    ResourceStock { food, ore, gold }
}

// ----- Market -----

/// Supply at which a resource costs exactly its base price; also the starting supply.
pub const MARKET_TARGET_SUPPLY: u32 = 200;
/// Lowest price, as bps of the base price (25%).
pub const MARKET_MIN_PRICE_BPS: u32 = 2_500;
/// Highest price, as bps of the base price (400%).
pub const MARKET_MAX_PRICE_BPS: u32 = 40_000;
/// Share of every trade lost to the spread (5%).
pub const MARKET_SPREAD_BPS: u32 = 500;

// Checked when compiling: the price bounds must surround the base price (100%). If someone edits
// them wrongly, the build fails instead of the market misbehaving.
const _: () = assert!(MARKET_MIN_PRICE_BPS < BPS_PER_WHOLE && MARKET_MAX_PRICE_BPS > BPS_PER_WHOLE);
/// Base prices in gold units × 10_000: Food 1.00, Ore 1.25, Gold 1.50.
pub const MARKET_BASE_PRICE: ResourceStock = ResourceStock {
    food: 10_000,
    ore: 12_500,
    gold: 15_000,
};

// ----- Battle -----

/// Matchup bonus when a unit is strong against the defender (×1.5).
pub const STRONG_MATCHUP_BPS: u32 = 15_000;
/// The elite's bonus against every unit (×1.25).
pub const ELITE_MATCHUP_BPS: u32 = 12_500;
/// Siege against city walls (×1.5).
pub const SIEGE_VS_WALLS_BPS: u32 = 15_000;
/// City walls per city size.
pub const WALLS_PER_CITY_SIZE: u32 = 10;
/// Extra walls for a capital (+50%).
pub const CAPITAL_WALLS_BONUS_BPS: u32 = 5_000;
/// Largest random swing each side gets in a battle (±10%).
pub const BATTLE_ROLL_BPS: u32 = 1_000;

// ----- Policies -----

/// Most rules a policy may have.
pub const MAX_RULES_PER_POLICY: usize = 16;
/// Only this many matching rules act each turn.
pub const MAX_ACTIVE_RULES_PER_TURN: usize = 3;

// ----- Scoring -----

/// Score = tiles × SCORE_TILE_WEIGHT + wealth ÷ SCORE_WEALTH_DIVISOR + army strength.
pub const SCORE_TILE_WEIGHT: u32 = 3;
pub const SCORE_WEALTH_DIVISOR: u32 = 10;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn growth_gets_slower_with_every_size() {
        let thresholds: Vec<u32> = (1..MAX_CITY_SIZE).map(growth_threshold).collect();

        assert_eq!(thresholds, vec![20, 80, 180, 320]);
    }

    #[test]
    fn settlers_cannot_attack_and_elites_eat_double() {
        assert_eq!(unit_stats(UnitKind::Settler).attack, 0);
        assert_eq!(unit_stats(UnitKind::Elite).upkeep_food, 2);
    }

    #[test]
    fn the_disband_order_lists_every_unit_kind_once() {
        for kind in UnitKind::ALL {
            let times_listed = DISBAND_ORDER
                .iter()
                .filter(|listed| **listed == kind)
                .count();

            assert_eq!(times_listed, 1, "{kind:?}");
        }
    }

    #[test]
    fn a_city_reaches_one_tile_further_than_its_size() {
        assert_eq!(border_radius(1), 2);
        assert_eq!(border_radius(MAX_CITY_SIZE), 6);
    }
}
