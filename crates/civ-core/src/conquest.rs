//! Conquest: what happens to land, cities and stock after a battle is won
//! (docs/decisions/0006, section 5).
//!
//! - A city that falls is **captured** (it changes owner and drops 1 size) or **razed** (destroyed;
//!   the tile becomes a city site again).
//! - "Its land" means the loser's tiles within the city's border radius, except other cities'
//!   tiles. Captured land goes to the winner; razed land becomes unowned.
//! - **Plunder:** taking or razing a city also takes `stock ÷ cities` of each loser resource.
//! - **Capital succession:** if the capital falls, the loser's largest city (oldest on a tie)
//!   becomes the capital.
//! - **Elimination** (turn step 7): a civ with no cities is out; its remaining land becomes free.

use crate::borders::for_each_tile_within;
use crate::city::City;
use crate::civ::{Civ, CivId};
use crate::map::{Map, TileCoordinate, TILE_COUNT};
use crate::resources::{Resource, ResourceStock};
use crate::rules::border_radius;
use crate::units::UnitCounts;

/// What the winner wants to do with a city it beats.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum CityFallChoice {
    /// Keep the city.
    Capture,
    /// Destroy the city.
    Raze,
}

/// What actually happened to a fallen city.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum CityFall {
    /// The winner now owns it, one size smaller.
    Captured,
    /// It is gone, and the tile is a city site again. Also what happens to a capture when the
    /// winner already has MAX_CITIES_PER_CIV cities.
    Razed,
}

/// The loser's city on `city_tile` falls to the winner.
///
/// Steps: plunder, decide capture or raze, move the city's land, move or remove the city record,
/// then pick a new capital if the capital fell. Returns `None` (and changes nothing) if the loser
/// has no city on that tile.
pub fn take_city(
    map: &mut Map,
    winner: &mut Civ,
    loser: &mut Civ,
    city_tile: TileCoordinate,
    choice: CityFallChoice,
    turn: u16,
) -> Option<CityFall> {
    let slot_index = loser.city_slot_at(city_tile)?;
    let fallen_city: City = *loser.cities().get(slot_index)?;

    // Step 1: plunder, while the loser still counts this city.
    plunder(winner, loser);

    // Step 2: a capture needs a free slot; without one the city is razed.
    let has_free_slot = winner.free_city_slot().is_some();
    let fall = if choice == CityFallChoice::Capture && has_free_slot {
        CityFall::Captured
    } else {
        CityFall::Razed
    };

    // Step 3: the city's land, and the city tile itself.
    let new_owner = match fall {
        CityFall::Captured => Some(winner.id()),
        CityFall::Razed => None,
    };
    let radius = border_radius(fallen_city.size());
    move_city_land(map, loser.id(), city_tile, radius, new_owner);
    let tile = map.tile_mut(city_tile);
    tile.set_owner(new_owner);
    tile.set_city(fall == CityFall::Captured);
    tile.set_city_site(true);

    // Step 4: the city record.
    if let Some(slot) = loser.cities_mut().get_mut(slot_index) {
        *slot = City::EMPTY;
    }
    if fall == CityFall::Captured {
        if let Some(slot) = winner.free_city_slot() {
            *slot = fallen_city.captured(turn);
        }
    }

    // Step 5: capital succession.
    if fallen_city.is_capital() {
        promote_new_capital(loser);
    }
    Some(fall)
}

/// Gives the loser's tiles within `radius` of a fallen city to `new_owner` (or frees them).
/// Other city tiles are left alone: a city only changes hands when it is attacked itself.
fn move_city_land(
    map: &mut Map,
    loser: CivId,
    center: TileCoordinate,
    radius: u8,
    new_owner: Option<CivId>,
) {
    for_each_tile_within(center, radius, |coordinate| {
        let tile = map.tile_mut(coordinate);
        if tile.owner() == Some(loser) && !tile.is_city() {
            tile.set_owner(new_owner);
        }
    });
}

/// Moves `stock ÷ cities` of each of the loser's resources to the winner.
pub fn plunder(winner: &mut Civ, loser: &mut Civ) -> ResourceStock {
    let mut taken = ResourceStock::EMPTY;
    // usize -> u32: a civ has at most 8 cities, so this never fails; 0 cities means nothing.
    let city_count = u32::try_from(loser.city_count()).unwrap_or(0);
    if city_count == 0 {
        return taken;
    }
    for resource in Resource::ALL {
        taken.add(resource, loser.resources.amount(resource) / city_count);
    }
    loser.resources.subtract(&taken);
    for resource in Resource::ALL {
        winner.resources.add(resource, taken.amount(resource));
    }
    taken
}

/// Makes the civ's largest city its capital (oldest on a tie, then the lowest slot). Does nothing
/// if the civ has no cities left.
pub fn promote_new_capital(civ: &mut Civ) {
    let mut best_slot: Option<usize> = None;
    let mut best_city = City::EMPTY;
    for (slot, city) in civ.cities().iter().enumerate() {
        if city.is_in_use() && is_better_capital(city, &best_city, best_slot.is_none()) {
            best_slot = Some(slot);
            best_city = *city;
        }
    }

    for (slot, city) in civ.cities_mut().iter_mut().enumerate() {
        city.set_capital(Some(slot) == best_slot);
    }
}

/// True if `candidate` should be the capital rather than `current` (bigger, or as big and older).
fn is_better_capital(candidate: &City, current: &City, is_first: bool) -> bool {
    if is_first {
        return true;
    }
    if candidate.size() != current.size() {
        return candidate.size() > current.size();
    }
    candidate.founded_turn() < current.founded_turn()
}

/// Turn step 7: every civ that is still marked alive but has no cities is out of the game. Its
/// units are gone and its remaining land becomes free for others.
pub fn eliminate_civs_without_cities(map: &mut Map, civs: &mut [Civ]) {
    for civ in civs.iter_mut() {
        if !civ.is_alive() || civ.city_count() > 0 {
            continue;
        }
        civ.set_alive(false);
        civ.units = UnitCounts::NONE;
        civ.expedition = crate::expedition::Expedition::NONE;
        release_all_land(map, civ.id());
    }
}

/// Frees every tile `civ` owns.
fn release_all_land(map: &mut Map, civ: CivId) {
    for index in 0..TILE_COUNT {
        let Some(coordinate) = TileCoordinate::from_index(index) else {
            continue;
        };
        let tile = map.tile_mut(coordinate);
        if tile.owner() == Some(civ) {
            tile.set_owner(None);
        }
    }
}

// The tests live in their own file to keep this one short. `#[path]` tells Rust where to find
// the module's code; it is still compiled only for `cargo test`.
#[cfg(test)]
#[path = "conquest_tests.rs"]
mod tests;
