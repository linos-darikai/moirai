//! Tests for attack.rs. Armies are lopsided on purpose so the ±10% roll can't change the result.

use super::*;
use crate::borders::claim_unowned_tiles_within;
use crate::city::City;
use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};
use crate::rules::border_radius;

fn coordinate(x: u8, y: u8) -> TileCoordinate {
    TileCoordinate::new(x, y).expect("test coordinates are on the map")
}

fn random() -> MatchRandom {
    MatchRandom::new(&MatchSeed([9; MATCH_SEED_LENGTH]))
}

/// Marks `tile` as `civ`'s city on the map and claims its size 1 border.
fn place_city(map: &mut Map, civ: CivId, tile: TileCoordinate) {
    let map_tile = map.tile_mut(tile);
    map_tile.set_city(true);
    map_tile.set_city_site(true);
    map_tile.set_owner(Some(civ));
    claim_unowned_tiles_within(map, civ, tile, border_radius(1));
}

/// Civ 0: capital (3,3), land up to (5,3). Civ 1: capital (6,3) right next to it, plus a second
/// city far away at (12,12).
fn border_war() -> (Map, [Civ; 2]) {
    let mut map = Map::empty();
    place_city(&mut map, CivId(0), coordinate(3, 3));
    place_city(&mut map, CivId(1), coordinate(6, 3));
    place_city(&mut map, CivId(1), coordinate(12, 12));
    let attacker = Civ::new(CivId(0), coordinate(3, 3));
    let mut defender = Civ::new(CivId(1), coordinate(6, 3));
    if let Some(slot) = defender.free_city_slot() {
        *slot = City::founded(coordinate(12, 12), 4, false);
    }
    (map, [attacker, defender])
}

fn attack_from_civ_zero(
    map: &mut Map,
    civs: &mut [Civ; 2],
    target: TileCoordinate,
    choice: CityFallChoice,
) -> Result<AttackReport, ActionError> {
    attack(map, civs, &random(), CivId(0), target, choice, 15)
}

#[test]
fn a_strong_army_captures_an_enemy_capital_next_to_its_land() {
    let (mut map, mut civs) = border_war();
    civs[0].units.add(UnitKind::Siege, 10);

    let report = attack_from_civ_zero(
        &mut map,
        &mut civs,
        coordinate(6, 3),
        CityFallChoice::Capture,
    );

    let report = report.expect("the attack is allowed");
    assert!(report.outcome.did_attacker_win);
    assert_eq!(report.city_fall, Some(CityFall::Captured));
    assert_eq!(map.tile(coordinate(6, 3)).owner(), Some(CivId(0)));
    assert_eq!(civs[0].city_count(), 2);
    let new_capital = civs[1].capital().and_then(|city| city.tile());
    assert_eq!(new_capital, Some(coordinate(12, 12)));
}

#[test]
fn winning_on_plain_land_takes_just_that_tile() {
    let (mut map, mut civs) = border_war();
    // (5,4) is civ 1's plain land (2 steps from its capital) and touches civ 0's (4,4).
    civs[0].units.add(UnitKind::Infantry, 20);

    let report = attack_from_civ_zero(
        &mut map,
        &mut civs,
        coordinate(5, 4),
        CityFallChoice::Capture,
    );

    let report = report.expect("the attack is allowed");
    assert!(report.outcome.did_attacker_win);
    assert_eq!(report.city_fall, None);
    assert_eq!(map.tile(coordinate(5, 4)).owner(), Some(CivId(0)));
    assert_eq!(civs[1].city_count(), 2);
}

#[test]
fn a_weak_attack_fails_costs_the_attacker_and_leaves_the_city() {
    let (mut map, mut civs) = border_war();
    civs[0].units.add(UnitKind::Infantry, 2);
    civs[1].units.add(UnitKind::Guard, 30);

    let report = attack_from_civ_zero(
        &mut map,
        &mut civs,
        coordinate(6, 3),
        CityFallChoice::Capture,
    );

    let report = report.expect("the attack is allowed");
    assert!(!report.outcome.did_attacker_win);
    assert_eq!(map.tile(coordinate(6, 3)).owner(), Some(CivId(1)));
    assert!(civs[0].units.count(UnitKind::Infantry) < 2);
}

#[test]
fn attacking_your_own_or_unowned_land_is_refused() {
    let (mut map, mut civs) = border_war();
    civs[0].units.add(UnitKind::Infantry, 5);

    let own = attack_from_civ_zero(
        &mut map,
        &mut civs,
        coordinate(4, 3),
        CityFallChoice::Capture,
    );
    let free = attack_from_civ_zero(
        &mut map,
        &mut civs,
        coordinate(0, 15),
        CityFallChoice::Capture,
    );

    assert_eq!(own, Err(ActionError::NotAnEnemyTile));
    assert_eq!(free, Err(ActionError::NotAnEnemyTile));
}

#[test]
fn an_enemy_tile_far_from_the_attackers_land_is_refused() {
    let (mut map, mut civs) = border_war();
    civs[0].units.add(UnitKind::Infantry, 5);

    let result = attack_from_civ_zero(
        &mut map,
        &mut civs,
        coordinate(12, 12),
        CityFallChoice::Capture,
    );

    assert_eq!(result, Err(ActionError::NotNextToTerritory));
}

#[test]
fn settlers_alone_cannot_attack() {
    let (mut map, mut civs) = border_war();
    civs[0].units.add(UnitKind::Settler, 3);

    let result = attack_from_civ_zero(
        &mut map,
        &mut civs,
        coordinate(6, 3),
        CityFallChoice::Capture,
    );

    assert_eq!(result, Err(ActionError::NoArmy));
}

#[test]
fn the_defenders_army_is_spread_over_its_cities_and_borders() {
    let units = UnitCounts {
        guard: 9,
        infantry: 4,
        ..UnitCounts::NONE
    };

    let defenders = defenders_at_target(&units, 2);

    assert_eq!(defenders.count(UnitKind::Guard), 3);
    assert_eq!(defenders.count(UnitKind::Infantry), 1);
}

#[test]
fn the_same_attack_on_the_same_turn_always_ends_the_same_way() {
    let (map, mut civs) = border_war();
    civs[0].units.add(UnitKind::Infantry, 6);
    civs[1].units.add(UnitKind::Guard, 6);
    let (mut map_a, mut civs_a) = (map, civs);
    let (mut map_b, mut civs_b) = (map, civs);

    let first = attack_from_civ_zero(
        &mut map_a,
        &mut civs_a,
        coordinate(6, 3),
        CityFallChoice::Raze,
    );
    let second = attack_from_civ_zero(
        &mut map_b,
        &mut civs_b,
        coordinate(6, 3),
        CityFallChoice::Raze,
    );

    assert_eq!(first, second);
    assert_eq!(map_a, map_b);
    assert_eq!(civs_a, civs_b);
}
