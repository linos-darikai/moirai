//! Marching (docs/decisions/0010): the `attack` action sends the civ's fighting army out as an
//! expedition, and each turn every expedition marches towards its target and fights on arrival.
//! Survivors go straight home. One expedition per civ at a time.

use crate::actions::ActionError;
use crate::attack::{fight_at, fighting_units, AttackReport};
use crate::civ::{rotating_civ_order, Civ, CivId, MAX_CIVS};
use crate::conquest::CityFallChoice;
use crate::expedition::Expedition;
use crate::map::{Map, TileCoordinate, TILE_COUNT};
use crate::randomness::MatchRandom;
use crate::units::UnitKind;

/// What sending an expedition did.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct Dispatch {
    /// The civ's own tile the army set out from.
    pub start: TileCoordinate,
    /// Turns until it arrives (at its speed).
    pub turns_to_arrive: u8,
}

/// Sends `attacker`'s whole fighting army towards the enemy tile `target`.
///
/// Checks: attacker is in the game and has no expedition out; the target is owned by another civ
/// that is still in the game; the attacker has at least one fighting unit.
/// Effects: the fighting units leave home and march from the attacker's tile nearest the target.
pub fn dispatch_expedition(
    map: &Map,
    civs: &mut [Civ],
    attacker_id: CivId,
    target: TileCoordinate,
    choice: CityFallChoice,
) -> Result<Dispatch, ActionError> {
    // Step 1: checks
    let defender_id = map
        .tile(target)
        .owner()
        .ok_or(ActionError::NotAnEnemyTile)?;
    let defender_is_alive = civs
        .get(defender_id.index())
        .is_some_and(|defender| defender.is_alive());
    if defender_id == attacker_id || !defender_is_alive {
        return Err(ActionError::NotAnEnemyTile);
    }
    let attacker = civs
        .get_mut(attacker_id.index())
        .ok_or(ActionError::CivIsOut)?;
    if !attacker.is_alive() {
        return Err(ActionError::CivIsOut);
    }
    if attacker.expedition.is_marching() {
        return Err(ActionError::AlreadyMarching);
    }
    let army = fighting_units(&attacker.units);
    if army.total() == 0 {
        return Err(ActionError::NoArmy);
    }
    let start = nearest_owned_tile(map, attacker_id, target).ok_or(ActionError::CivIsOut)?;

    // Step 2: the army leaves home.
    for kind in UnitKind::ALL {
        attacker.units.remove(kind, army.count(kind));
    }
    attacker.expedition = Expedition::new(army, start, target, choice);
    let speed = u16::from(attacker.expedition.speed().max(1));
    let distance = u16::from(start.manhattan_distance(target));
    Ok(Dispatch {
        start,
        turns_to_arrive: u8::try_from(distance.div_ceil(speed)).unwrap_or(u8::MAX),
    })
}

/// Turn step: every expedition marches; those that arrive fight (if the target is still an enemy
/// tile) and their survivors go home. Civs march in this turn's rotating order. Returns the fights,
/// one per civ at most.
pub fn march_expeditions(
    map: &mut Map,
    civs: &mut [Civ],
    random: &MatchRandom,
    turn: u16,
) -> [Option<AttackReport>; MAX_CIVS] {
    let mut fights = [None; MAX_CIVS];
    let civ_count = civs.len();
    for index in rotating_civ_order(turn, civ_count)
        .into_iter()
        .take(civ_count)
    {
        let Some(civ) = civs.get_mut(index) else {
            continue;
        };
        if !civ.is_alive() || !civ.expedition.is_marching() {
            continue;
        }
        if !civ.expedition.march() {
            continue; // still on the way
        }
        let expedition = civ.expedition;
        civ.expedition = Expedition::NONE;
        let attacker_id = civ.id();
        let Some(target) = expedition.target() else {
            continue;
        };

        // Step 1: fight if the target is still an enemy tile; otherwise just come home.
        let result = fight_at(
            map,
            civs,
            random,
            attacker_id,
            expedition.units,
            target,
            expedition.choice(),
            turn,
        );
        let survivors = match result {
            Ok(fight) => {
                if let Some(slot) = fights.get_mut(index) {
                    *slot = Some(fight.report);
                }
                fight.survivors
            }
            Err(_) => expedition.units,
        };

        // Step 2: the survivors go home.
        if let Some(civ) = civs.get_mut(index) {
            for kind in UnitKind::ALL {
                civ.units.add(kind, survivors.count(kind));
            }
        }
    }
    fights
}

/// The civ's own tile nearest `target` (lowest tile index on a tie), to march from.
fn nearest_owned_tile(map: &Map, civ: CivId, target: TileCoordinate) -> Option<TileCoordinate> {
    let mut best: Option<(TileCoordinate, u8)> = None;
    for index in 0..TILE_COUNT {
        let Some(tile) = TileCoordinate::from_index(index) else {
            continue;
        };
        if map.tile(tile).owner() != Some(civ) {
            continue;
        }
        let distance = tile.manhattan_distance(target);
        if best.is_none_or(|(_, best_distance)| distance < best_distance) {
            best = Some((tile, distance));
        }
    }
    best.map(|(tile, _)| tile)
}

// Tests live in march_tests.rs (see conquest.rs for how `#[path]` works).
#[cfg(test)]
#[path = "march_tests.rs"]
mod tests;
