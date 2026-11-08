//! Tests for conquest.rs: capture, raze, plunder, capital succession and elimination.

use super::*;
use crate::borders::claim_unowned_tiles_within;
use crate::units::UnitKind;

fn coordinate(x: u8, y: u8) -> TileCoordinate {
    TileCoordinate::new(x, y).expect("test coordinates are on the map")
}

/// Puts a size 1 city for `civ` on `tile`, on the map and in the civ, and claims its border.
fn add_city(map: &mut Map, civ: &mut Civ, tile: TileCoordinate, founded_turn: u16) {
    let map_tile = map.tile_mut(tile);
    map_tile.set_city(true);
    map_tile.set_city_site(true);
    map_tile.set_owner(Some(civ.id()));
    claim_unowned_tiles_within(map, civ.id(), tile, border_radius(1));
    if civ.city_slot_at(tile).is_none() {
        if let Some(slot) = civ.free_city_slot() {
            *slot = City::founded(tile, founded_turn, false);
        }
    }
}

/// Civ 0 with its capital at (3,3). Civ 1 with its capital at (8,3) and a second city at (13,8).
fn two_civs_at_war() -> (Map, Civ, Civ) {
    let mut map = Map::empty();
    let mut winner = Civ::new(CivId(0), coordinate(3, 3));
    let mut loser = Civ::new(CivId(1), coordinate(8, 3));
    add_city(&mut map, &mut winner, coordinate(3, 3), 0);
    add_city(&mut map, &mut loser, coordinate(8, 3), 0);
    add_city(&mut map, &mut loser, coordinate(13, 8), 10);
    (map, winner, loser)
}

#[test]
fn a_captured_city_and_its_land_change_owner() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();

    let fall = take_city(
        &mut map,
        &mut winner,
        &mut loser,
        coordinate(8, 3),
        CityFallChoice::Capture,
        20,
    );

    assert_eq!(fall, Some(CityFall::Captured));
    assert_eq!(map.tile(coordinate(8, 3)).owner(), Some(CivId(0)));
    assert!(map.tile(coordinate(8, 3)).is_city());
    assert_eq!(map.tile(coordinate(10, 3)).owner(), Some(CivId(0)));
    assert_eq!(winner.city_count(), 2);
    assert_eq!(loser.city_count(), 1);
    assert_eq!(map.tile(coordinate(13, 8)).owner(), Some(CivId(1)));
}

#[test]
fn a_razed_city_leaves_free_land_and_a_city_site() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();

    let fall = take_city(
        &mut map,
        &mut winner,
        &mut loser,
        coordinate(8, 3),
        CityFallChoice::Raze,
        20,
    );

    assert_eq!(fall, Some(CityFall::Razed));
    let tile = map.tile(coordinate(8, 3));
    assert_eq!(tile.owner(), None);
    assert!(!tile.is_city());
    assert!(tile.is_city_site());
    assert_eq!(map.tile(coordinate(9, 3)).owner(), None);
    assert_eq!(winner.city_count(), 1);
}

#[test]
fn taking_a_city_plunders_the_losers_stock_divided_by_its_cities() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();
    loser.resources = ResourceStock {
        food: 100,
        ore: 41,
        gold: 0,
    };

    take_city(
        &mut map,
        &mut winner,
        &mut loser,
        coordinate(13, 8),
        CityFallChoice::Raze,
        20,
    );

    assert_eq!(winner.resources.food, 50);
    assert_eq!(winner.resources.ore, 20);
    assert_eq!(loser.resources.food, 50);
    assert_eq!(loser.resources.ore, 21);
}

#[test]
fn when_the_capital_falls_the_largest_remaining_city_becomes_capital() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();
    add_city(&mut map, &mut loser, coordinate(8, 12), 5);
    if let Some(slot) = loser.city_slot_at(coordinate(13, 8)) {
        loser.cities_mut()[slot].grow();
    }

    take_city(
        &mut map,
        &mut winner,
        &mut loser,
        coordinate(8, 3),
        CityFallChoice::Capture,
        20,
    );

    let new_capital = loser.capital().and_then(|city| city.tile());
    assert_eq!(new_capital, Some(coordinate(13, 8)));
}

#[test]
fn between_two_cities_of_the_same_size_the_older_one_becomes_capital() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();
    add_city(&mut map, &mut loser, coordinate(8, 12), 5);

    take_city(
        &mut map,
        &mut winner,
        &mut loser,
        coordinate(8, 3),
        CityFallChoice::Capture,
        20,
    );

    let new_capital = loser.capital().and_then(|city| city.tile());
    assert_eq!(new_capital, Some(coordinate(8, 12)));
}

#[test]
fn a_winner_with_no_free_city_slot_razes_instead_of_capturing() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();
    for x in 0..7 {
        if let Some(slot) = winner.free_city_slot() {
            *slot = City::founded(coordinate(x, 15), 1, false);
        }
    }

    let fall = take_city(
        &mut map,
        &mut winner,
        &mut loser,
        coordinate(8, 3),
        CityFallChoice::Capture,
        20,
    );

    assert_eq!(fall, Some(CityFall::Razed));
}

#[test]
fn taking_a_tile_with_no_city_changes_nothing() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();
    let map_before = map;

    let fall = take_city(
        &mut map,
        &mut winner,
        &mut loser,
        coordinate(9, 3),
        CityFallChoice::Capture,
        20,
    );

    assert_eq!(fall, None);
    assert_eq!(map, map_before);
}

#[test]
fn a_civ_that_loses_its_last_city_is_eliminated_and_its_land_freed() {
    let (mut map, mut winner, mut loser) = two_civs_at_war();
    loser.units.add(UnitKind::Guard, 3);
    for city in [coordinate(8, 3), coordinate(13, 8)] {
        take_city(
            &mut map,
            &mut winner,
            &mut loser,
            city,
            CityFallChoice::Raze,
            20,
        );
    }
    // A stray tile the loser still owns, outside any city's land.
    map.tile_mut(coordinate(15, 15)).set_owner(Some(CivId(1)));
    let mut civs = [winner, loser];

    eliminate_civs_without_cities(&mut map, &mut civs);

    assert!(civs[0].is_alive());
    assert!(!civs[1].is_alive());
    assert_eq!(civs[1].units, UnitCounts::NONE);
    assert_eq!(map.tile(coordinate(15, 15)).owner(), None);
}
