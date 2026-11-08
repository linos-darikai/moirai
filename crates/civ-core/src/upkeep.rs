//! Upkeep: turn step 6, "Pay upkeep (disband if starving)" (docs/decisions/0006, sections 3 and 6).
//!
//! Every unit eats food each turn (`unit_stats(kind).upkeep_food`). If a civ can't pay, units are
//! disbanded in `DISBAND_ORDER` (most valuable first) until what's left can be fed. Food never goes
//! below zero.

use crate::civ::Civ;
use crate::rules::{unit_stats, DISBAND_ORDER};
use crate::units::{UnitCounts, UnitKind};

/// Food the civ's whole army eats in one turn.
pub fn food_upkeep(units: &UnitCounts) -> u32 {
    let mut total: u32 = 0;
    for kind in UnitKind::ALL {
        let per_unit = unit_stats(kind).upkeep_food;
        total = total.saturating_add(u32::from(units.count(kind)).saturating_mul(per_unit));
    }
    total
}

/// Makes every living civ pay its food upkeep for this turn.
pub fn pay_upkeep(civs: &mut [Civ]) {
    for civ in civs.iter_mut() {
        if civ.is_alive() {
            pay_civ_upkeep(civ);
        }
    }
}

/// Makes one civ pay its food upkeep, disbanding units first if it can't. Units on an expedition
/// eat too (docs/decisions/0010); units at home are disbanded first, then units on the march.
/// Returns the units that were disbanded (all zero if none), so the turn feed can report them.
pub fn pay_civ_upkeep(civ: &mut Civ) -> UnitCounts {
    let food = civ.resources.food;
    let away_upkeep = food_upkeep(&civ.expedition.units);

    // Step 1: home units go first, until home + away upkeep fits in the food.
    let food_for_home = food.saturating_sub(away_upkeep);
    let mut disbanded = disband_until_fed(&mut civ.units, food_for_home);

    // Step 2: if the army away still can't be fed, it loses units too.
    let food_for_away = food.saturating_sub(food_upkeep(&civ.units));
    let disbanded_away = disband_until_fed(&mut civ.expedition.units, food_for_away);
    for kind in UnitKind::ALL {
        disbanded.add(kind, disbanded_away.count(kind));
    }

    let upkeep = food_upkeep(&civ.units).saturating_add(food_upkeep(&civ.expedition.units));
    civ.resources.food = civ.resources.food.saturating_sub(upkeep);
    disbanded
}

/// Disbands `units`, most valuable kind first, until their upkeep fits in `food`.
fn disband_until_fed(units: &mut UnitCounts, food: u32) -> UnitCounts {
    let mut upkeep = food_upkeep(units);
    let mut disbanded = UnitCounts::NONE;

    for kind in DISBAND_ORDER {
        if upkeep <= food {
            break;
        }
        let per_unit = unit_stats(kind).upkeep_food;
        if per_unit == 0 {
            continue; // disbanding a unit that eats nothing wouldn't help
        }
        // How many of this kind must go to cover the shortfall. `div_ceil` divides and rounds up:
        // a shortfall of 3 food with Elites (2 food each) needs 2 Elites gone, not 1.
        let shortfall = upkeep.saturating_sub(food);
        let units_needed = shortfall.div_ceil(per_unit);
        let to_remove = u16::try_from(units_needed).unwrap_or(u16::MAX);
        let removed = units.remove(kind, to_remove);
        disbanded.add(kind, removed);
        upkeep = upkeep.saturating_sub(u32::from(removed).saturating_mul(per_unit));
    }
    disbanded
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::civ::CivId;
    use crate::map::TileCoordinate;

    fn civ_with(food: u32, units: UnitCounts) -> Civ {
        let mut civ = Civ::new(CivId(0), TileCoordinate::new(3, 3).expect("on the map"));
        civ.resources.food = food;
        civ.units = units;
        civ
    }

    #[test]
    fn elites_eat_two_food_and_everything_else_one() {
        let units = UnitCounts {
            infantry: 2,
            elite: 1,
            settler: 1,
            ..UnitCounts::NONE
        };

        let upkeep = food_upkeep(&units);

        assert_eq!(upkeep, 2 + 2 + 1);
    }

    #[test]
    fn a_civ_with_enough_food_pays_and_keeps_its_army() {
        let army = UnitCounts {
            infantry: 3,
            guard: 2,
            ..UnitCounts::NONE
        };
        let mut civ = civ_with(10, army);

        let disbanded = pay_civ_upkeep(&mut civ);

        assert_eq!(disbanded, UnitCounts::NONE);
        assert_eq!(civ.units, army);
        assert_eq!(civ.resources.food, 10 - 5);
    }

    #[test]
    fn a_starving_civ_disbands_its_most_valuable_units_first() {
        // Needs 2 (elite) + 3 (infantry) = 5 food but has 3: losing the elite is enough.
        let mut civ = civ_with(
            3,
            UnitCounts {
                infantry: 3,
                elite: 1,
                ..UnitCounts::NONE
            },
        );

        let disbanded = pay_civ_upkeep(&mut civ);

        assert_eq!(disbanded.count(UnitKind::Elite), 1);
        assert_eq!(civ.units.count(UnitKind::Infantry), 3);
        assert_eq!(civ.resources.food, 0);
    }

    #[test]
    fn a_civ_with_no_food_loses_its_whole_army() {
        let mut civ = civ_with(
            0,
            UnitCounts {
                infantry: 4,
                siege: 2,
                settler: 1,
                ..UnitCounts::NONE
            },
        );

        pay_civ_upkeep(&mut civ);

        assert_eq!(civ.units, UnitCounts::NONE);
        assert_eq!(civ.resources.food, 0);
    }

    #[test]
    fn a_knocked_out_civ_pays_nothing() {
        let mut civs = [civ_with(
            5,
            UnitCounts {
                guard: 2,
                ..UnitCounts::NONE
            },
        )];
        civs[0].set_alive(false);

        pay_upkeep(&mut civs);

        assert_eq!(civs[0].resources.food, 5);
    }

    #[test]
    fn units_on_the_march_eat_too_and_starve_after_the_units_at_home() {
        use crate::conquest::CityFallChoice;
        use crate::expedition::Expedition;
        let mut civ = civ_with(
            3,
            UnitCounts {
                guard: 2,
                ..UnitCounts::NONE
            },
        );
        let tile = TileCoordinate::new(5, 5).expect("on the map");
        civ.expedition = Expedition::new(
            UnitCounts {
                infantry: 2,
                ..UnitCounts::NONE
            },
            tile,
            tile,
            CityFallChoice::Capture,
        );

        let disbanded = pay_civ_upkeep(&mut civ);

        // 4 mouths, 3 food: one home Guard goes; the marching Infantry are fed.
        assert_eq!(disbanded.count(UnitKind::Guard), 1);
        assert_eq!(civ.expedition.units.count(UnitKind::Infantry), 2);
        assert_eq!(civ.resources.food, 0);
    }
}
