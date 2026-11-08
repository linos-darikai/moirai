//! Building units (docs/decisions/0007, "Build time"). Each city builds one unit at a time.
//!
//! - `start_build` (turn step 5) pays the full cost up front and puts the build in the first idle
//!   city.
//! - `rush_build` (turn step 5) finishes a city's build right away for coins: faster is expensive.
//! - `finish_builds` (turn step 3) moves every build on one turn and adds finished units to the
//!   army.

use crate::actions::ActionError;
use crate::civ::Civ;
use crate::rules::{unit_stats, ELITES_PER_CITY_SIZE, RUSH_COINS_PER_TURN_MULTIPLIER};
use crate::units::{UnitCounts, UnitKind};

/// Starts building one `kind` in the civ's first idle city. Returns that city's slot.
///
/// Checks: civ is alive; the Elite limit (one per city size, counting Elites being built); some
/// city is idle; the civ can afford the resources and the coins.
/// Effects: takes the cost, starts the build in that city.
pub fn start_build(civ: &mut Civ, kind: UnitKind) -> Result<usize, ActionError> {
    // Step 1: checks
    if !civ.is_alive() {
        return Err(ActionError::CivIsOut);
    }
    if kind == UnitKind::Elite && has_reached_elite_limit(civ) {
        return Err(ActionError::EliteLimitReached);
    }
    let slot = first_idle_city(civ).ok_or(ActionError::NoIdleCity)?;
    let stats = unit_stats(kind);
    if !civ.resources.can_afford(&stats.cost) || civ.coins < stats.coin_cost {
        return Err(ActionError::CannotAfford);
    }

    // Step 2: pay up front
    civ.resources.subtract(&stats.cost);
    civ.coins = civ.coins.saturating_sub(stats.coin_cost);

    // Step 3: the city starts building
    if let Some(city) = civ.cities_mut().get_mut(slot) {
        city.start_build(kind, stats.build_turns);
    }
    Ok(slot)
}

/// What rushing the build in city `slot` would cost: 2 × the unit's coin cost × turns left.
/// `None` if that city isn't building anything.
pub fn rush_cost(civ: &Civ, slot: usize) -> Option<u32> {
    let city = civ.cities().get(slot)?;
    let kind = city.building()?;
    let turns_left = u32::from(city.build_turns_left());
    let cost = unit_stats(kind)
        .coin_cost
        .saturating_mul(RUSH_COINS_PER_TURN_MULTIPLIER)
        .saturating_mul(turns_left);
    Some(cost)
}

/// Finishes the build in city `slot` right away: the unit joins the army now. Returns the coins
/// paid.
///
/// Checks: civ is alive; that city is building something; the civ has the coins.
/// Effects: takes the coins, adds the unit, frees the city.
pub fn rush_build(civ: &mut Civ, slot: usize) -> Result<u32, ActionError> {
    // Step 1: checks
    if !civ.is_alive() {
        return Err(ActionError::CivIsOut);
    }
    let cost = rush_cost(civ, slot).ok_or(ActionError::NothingToRush)?;
    if civ.coins < cost {
        return Err(ActionError::CannotAfford);
    }

    // Step 2: pay, then finish the build by running out its turns.
    civ.coins = civ.coins.saturating_sub(cost);
    let mut finished = None;
    if let Some(city) = civ.cities_mut().get_mut(slot) {
        while finished.is_none() && city.building().is_some() {
            finished = city.advance_build();
        }
    }
    if let Some(kind) = finished {
        civ.units.add(kind, 1);
    }
    Ok(cost)
}

/// Turn step 3: every city of every living civ moves its build on one turn; finished units join
/// the army.
pub fn finish_builds(civs: &mut [Civ]) {
    for civ in civs.iter_mut() {
        if !civ.is_alive() {
            continue;
        }
        let mut finished_units = UnitCounts::NONE;
        for city in civ.cities_mut().iter_mut() {
            if let Some(kind) = city.advance_build() {
                finished_units.add(kind, 1);
            }
        }
        for kind in UnitKind::ALL {
            civ.units.add(kind, finished_units.count(kind));
        }
    }
}

/// The first city (in slot order) that is in use and not building anything.
fn first_idle_city(civ: &Civ) -> Option<usize> {
    civ.cities()
        .iter()
        .position(|city| city.is_in_use() && city.building().is_none())
}

/// True if the civ already fields, or is building, as many Elites as its city sizes allow.
fn has_reached_elite_limit(civ: &Civ) -> bool {
    let elite_limit = civ.total_city_size().saturating_mul(ELITES_PER_CITY_SIZE);
    let mut elites = u32::from(civ.units.count(UnitKind::Elite));
    for city in civ.cities() {
        if city.building() == Some(UnitKind::Elite) {
            elites = elites.saturating_add(1);
        }
    }
    elites >= elite_limit
}

// Tests live in builds_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "builds_tests.rs"]
mod tests;
