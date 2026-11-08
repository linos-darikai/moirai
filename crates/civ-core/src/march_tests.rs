//! Tests for march.rs: sending an expedition, marching at the slowest unit's speed, fighting on
//! arrival (even at a far capital), coming home, and the one-expedition rule.

use super::*;
use crate::borders::claim_unowned_tiles_within;
use crate::randomness::{MatchSeed, MATCH_SEED_LENGTH};
use crate::rules::border_radius;
use crate::units::UnitCounts;

fn coordinate(x: u8, y: u8) -> TileCoordinate {
    TileCoordinate::new(x, y).expect("test coordinates are on the map")
}

fn random() -> MatchRandom {
    MatchRandom::new(&MatchSeed([9; MATCH_SEED_LENGTH]))
}

/// Civ 0 with its capital at (3,3); civ 1 with its capital far away at (12,12).
fn far_apart() -> (Map, [Civ; 2]) {
    let mut map = Map::empty();
    for (civ, tile) in [(CivId(0), coordinate(3, 3)), (CivId(1), coordinate(12, 12))] {
        let map_tile = map.tile_mut(tile);
        map_tile.set_city(true);
        map_tile.set_owner(Some(civ));
        claim_unowned_tiles_within(&mut map, civ, tile, border_radius(1));
    }
    (
        map,
        [
            Civ::new(CivId(0), coordinate(3, 3)),
            Civ::new(CivId(1), coordinate(12, 12)),
        ],
    )
}

#[test]
fn attacking_sends_the_fighting_army_out_and_keeps_settlers_and_workers_home() {
    let (map, mut civs) = far_apart();
    civs[0].units = UnitCounts {
        infantry: 6,
        worker: 2,
        ..UnitCounts::NONE
    };

    let dispatch = dispatch_expedition(
        &map,
        &mut civs,
        CivId(0),
        coordinate(12, 12),
        CityFallChoice::Capture,
    );

    let dispatch = dispatch.expect("allowed");
    assert_eq!(
        civs[0].units,
        UnitCounts {
            worker: 2,
            ..UnitCounts::NONE
        }
    );
    assert_eq!(civs[0].expedition.units.count(UnitKind::Infantry), 6);
    // (5,3), (4,4) and (3,5) are all 16 tiles from (12,12); the lowest tile index, (5,3), wins.
    // Infantry march 2 a turn.
    assert_eq!(dispatch.start, coordinate(5, 3));
    assert_eq!(dispatch.turns_to_arrive, 8);
}

#[test]
fn an_army_marches_to_a_far_capital_and_captures_it_when_it_arrives() {
    let (mut map, mut civs) = far_apart();
    civs[0].units.add(UnitKind::Infantry, 20);
    dispatch_expedition(
        &map,
        &mut civs,
        CivId(0),
        coordinate(12, 12),
        CityFallChoice::Capture,
    )
    .expect("allowed");

    let mut fights = Vec::new();
    for turn in 0..10 {
        fights.push(march_expeditions(&mut map, &mut civs, &random(), turn));
    }

    let arrivals: Vec<usize> = fights
        .iter()
        .enumerate()
        .filter(|(_, fight)| fight[0].is_some())
        .map(|(turn, _)| turn)
        .collect();
    assert_eq!(arrivals, vec![7]); // 8 turns of marching: turns 0..=7
    assert_eq!(map.tile(coordinate(12, 12)).owner(), Some(CivId(0)));
    assert!(!civs[0].expedition.is_marching());
    assert!(
        civs[0].units.count(UnitKind::Infantry) > 0,
        "survivors came home"
    );
}

#[test]
fn siege_slows_the_whole_army() {
    let (map, mut civs) = far_apart();
    civs[0].units = UnitCounts {
        infantry: 6,
        siege: 1,
        ..UnitCounts::NONE
    };

    let dispatch = dispatch_expedition(
        &map,
        &mut civs,
        CivId(0),
        coordinate(12, 12),
        CityFallChoice::Capture,
    );

    // 16 tiles at the Siege's 1 tile a turn, instead of 8 turns for Infantry alone.
    assert_eq!(dispatch.map(|dispatch| dispatch.turns_to_arrive), Ok(16));
}

#[test]
fn one_expedition_at_a_time_and_only_at_enemy_land() {
    let (map, mut civs) = far_apart();
    civs[0].units.add(UnitKind::Infantry, 6);

    let own_land = dispatch_expedition(
        &map,
        &mut civs,
        CivId(0),
        coordinate(3, 3),
        CityFallChoice::Capture,
    );
    dispatch_expedition(
        &map,
        &mut civs,
        CivId(0),
        coordinate(12, 12),
        CityFallChoice::Capture,
    )
    .expect("allowed");
    civs[0].units.add(UnitKind::Infantry, 6);
    let second = dispatch_expedition(
        &map,
        &mut civs,
        CivId(0),
        coordinate(12, 12),
        CityFallChoice::Capture,
    );

    assert_eq!(own_land, Err(ActionError::NotAnEnemyTile));
    assert_eq!(second, Err(ActionError::AlreadyMarching));
}

#[test]
fn an_army_whose_target_is_no_longer_an_enemy_tile_comes_home_without_fighting() {
    let (mut map, mut civs) = far_apart();
    civs[0].units.add(UnitKind::Infantry, 6);
    dispatch_expedition(
        &map,
        &mut civs,
        CivId(0),
        coordinate(11, 12),
        CityFallChoice::Capture,
    )
    .expect("allowed");
    map.tile_mut(coordinate(11, 12)).set_owner(None);

    let mut fought = false;
    for turn in 0..10 {
        fought |= march_expeditions(&mut map, &mut civs, &random(), turn)[0].is_some();
    }

    assert!(!fought);
    assert_eq!(civs[0].units.count(UnitKind::Infantry), 6);
}
