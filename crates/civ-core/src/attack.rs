//! Fighting at a tile (docs/decisions/0006 section 5, 0010): an army arrives at an enemy tile or
//! city and fights the defenders there. Armies get there by marching (march.rs); this file picks
//! the defenders, runs the battle and applies the result.
//!
//! The battle maths is in battle.rs and what happens to a fallen city is in conquest.rs.

use crate::actions::ActionError;
use crate::battle::{resolve_battle, BattleOutcome, BattleRolls, DefendingCity};
use crate::civ::{Civ, CivId};
use crate::conquest::{take_city, CityFall, CityFallChoice};
use crate::map::{Map, TileCoordinate};
use crate::randomness::MatchRandom;
use crate::units::{UnitCounts, UnitKind};

/// What one attack did, for the turn feed and tests.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct AttackReport {
    /// Who defended.
    pub defender: CivId,
    /// The battle result: strengths, winner and losses.
    pub outcome: BattleOutcome,
    /// If a city fell: captured or razed. `None` if the attack failed or the target had no city.
    pub city_fall: Option<CityFall>,
}

/// What a fight left: the report, and the attacking army's survivors (who go home).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct FightResult {
    pub report: AttackReport,
    pub survivors: UnitCounts,
}

/// `army` (belonging to `attacker`) fights at the enemy tile `target`. `choice` says whether to
/// keep or destroy a city that falls. The army is not part of the attacker's units at home; the
/// caller sends the survivors home.
///
/// Checks: attacker is in the game; the target is owned by another civ that is still in the game;
/// the army has at least one fighting unit.
/// Effects: the battle (rolls from the match seed, turn and tile), losses on both sides, and if the
/// army wins: the tile changes owner, or the city on it is captured or razed.
#[allow(clippy::too_many_arguments)] // each is a different thing the fight needs; a struct would only hide them
pub fn fight_at(
    map: &mut Map,
    civs: &mut [Civ],
    random: &MatchRandom,
    attacker_id: CivId,
    army: UnitCounts,
    target: TileCoordinate,
    choice: CityFallChoice,
    turn: u16,
) -> Result<FightResult, ActionError> {
    // Step 1: checks. We work on copies of the two civs (a Civ is 132 plain bytes, so copying is
    // cheap) and write them back at the end. That avoids borrowing two items of `civs` at once.
    let mut attacker = living_civ(civs, attacker_id).ok_or(ActionError::CivIsOut)?;
    let defender_id = map
        .tile(target)
        .owner()
        .ok_or(ActionError::NotAnEnemyTile)?;
    if defender_id == attacker_id {
        return Err(ActionError::NotAnEnemyTile);
    }
    let mut defender = living_civ(civs, defender_id).ok_or(ActionError::NotAnEnemyTile)?;
    let army = fighting_units(&army);
    if army.total() == 0 {
        return Err(ActionError::NoArmy);
    }

    // Step 2: who defends, and the city's walls if the target is a city.
    let defenders = defenders_at_target(&defender.units, defender.city_count());
    let city = defending_city(&defender, target);

    // Step 3: the battle, and both sides' losses.
    let rolls = BattleRolls::for_battle(random, turn, target.index());
    let outcome = resolve_battle(&army, &defenders, city, rolls);
    let mut survivors = army;
    remove_losses(&mut survivors, &outcome.attacker_losses);
    remove_losses(&mut defender.units, &outcome.defender_losses);

    // Step 4: a win takes the tile, or the city on it.
    let mut city_fall = None;
    if outcome.did_attacker_win {
        if city.is_some() {
            city_fall = take_city(map, &mut attacker, &mut defender, target, choice, turn);
        } else {
            map.tile_mut(target).set_owner(Some(attacker_id));
        }
    }

    // Step 5: write the changed civs back.
    write_back(civs, attacker);
    write_back(civs, defender);
    Ok(FightResult {
        report: AttackReport {
            defender: defender_id,
            outcome,
            city_fall,
        },
        survivors,
    })
}

/// A copy of civ `id`, if it is in the slice and still in the game.
fn living_civ(civs: &[Civ], id: CivId) -> Option<Civ> {
    let civ = civs.get(id.index())?;
    if civ.is_alive() {
        Some(*civ)
    } else {
        None
    }
}

/// Puts a changed copy of a civ back into its place in the slice.
fn write_back(civs: &mut [Civ], civ: Civ) {
    if let Some(slot) = civs.get_mut(civ.id().index()) {
        *slot = civ;
    }
}

/// The units that fight: every kind where `UnitKind::is_fighter` is true (not Settlers or Workers).
pub fn fighting_units(units: &UnitCounts) -> UnitCounts {
    let mut fighters = UnitCounts::NONE;
    for kind in UnitKind::ALL {
        if kind.is_fighter() {
            fighters.add(kind, units.count(kind));
        }
    }
    fighters
}

/// The defender's army is spread over its cities and its borders, so one target is defended by
/// `units ÷ (cities + 1)` of each kind, rounded down.
pub fn defenders_at_target(units: &UnitCounts, city_count: usize) -> UnitCounts {
    let spread = u16::try_from(city_count.saturating_add(1)).unwrap_or(u16::MAX);
    let mut defenders = UnitCounts::NONE;
    for kind in UnitKind::ALL {
        defenders.add(kind, units.count(kind) / spread);
    }
    defenders
}

/// The walls at `target`, if the defender has a city there.
fn defending_city(defender: &Civ, target: TileCoordinate) -> Option<DefendingCity> {
    let slot = defender.city_slot_at(target)?;
    let city = defender.cities().get(slot)?;
    Some(DefendingCity {
        size: city.size(),
        is_capital: city.is_capital(),
    })
}

/// Takes `losses` out of `units`.
fn remove_losses(units: &mut UnitCounts, losses: &UnitCounts) {
    for kind in UnitKind::ALL {
        units.remove(kind, losses.count(kind));
    }
}

// Tests live in attack_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "attack_tests.rs"]
mod tests;
