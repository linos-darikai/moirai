//! Actions: what a civ can do on its turn, as plain functions that check the rules and then change
//! the state. Policies (later) choose actions; the turn function resolves them in a rotating order
//! (docs/decisions/0006, section 6). Each function checks everything first and changes nothing
//! when a check fails, so a refused action costs nothing.
//!
//! Here: `found_city`, `claim_tile`, and the `ActionError` every action returns. Building units is
//! in builds.rs, `attack` in attack.rs, market trades in market.rs.

use crate::borders::claim_unowned_tiles_within;
use crate::city::{City, STARTING_CITY_SIZE};
use crate::civ::Civ;
use crate::map::{Map, TileCoordinate};
use crate::rules::{border_radius, CLAIM_TILE_COST};
use crate::units::UnitKind;

/// Why an action was refused. Like a TypeScript union of error strings, but checked by the
/// compiler.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ActionError {
    /// The civ has lost all its cities and can't act.
    CivIsOut,
    /// The civ doesn't hold enough resources or coins for the cost.
    CannotAfford,
    /// Every city is already building something (one build per city).
    NoIdleCity,
    /// `rush_build` was asked to rush a city that isn't building anything.
    NothingToRush,
    /// A market trade of 0 units.
    NothingToTrade,
    /// `buy` asked for more than the market holds.
    NotEnoughSupply,
    /// The civ already fields one Elite per city size.
    EliteLimitReached,
    /// `found_city` needs a Settler and the civ has none.
    NoSettler,
    /// Cities can only be founded on city-site tiles.
    NotACitySite,
    /// There is already a city on that tile.
    AlreadyACity,
    /// Another civ owns that tile.
    OwnedByAnotherCiv,
    /// `claim_tile` on a tile the civ already owns.
    AlreadyYours,
    /// The tile is neither inside the civ's territory nor next to it.
    NotNextToTerritory,
    /// The civ already has MAX_CITIES_PER_CIV cities.
    NoFreeCitySlot,
    /// `attack` needs a tile owned by another civ that is still in the game.
    NotAnEnemyTile,
    /// `attack` needs at least one fighting unit (Settlers and Workers don't fight).
    NoArmy,
}

/// Uses one Settler to found a size 1 city on `site`, which then claims its border.
///
/// Checks: civ is alive and has a Settler; the tile is a city site with no city on it; no other civ
/// owns it; it is inside or next to the civ's territory; the civ has a free city slot.
/// Effects: removes the Settler, marks the tile as the civ's city, records the city, claims the
/// free tiles of its border.
pub fn found_city(
    map: &mut Map,
    civ: &mut Civ,
    site: TileCoordinate,
    turn: u16,
) -> Result<(), ActionError> {
    // Step 1: checks
    check_can_found_city(map, civ, site)?;

    // Step 2: use up the settler
    civ.units.remove(UnitKind::Settler, 1);

    // Step 3: the city on the map and in the civ's city list
    let tile = map.tile_mut(site);
    tile.set_owner(Some(civ.id()));
    tile.set_city(true);
    if let Some(slot) = civ.free_city_slot() {
        *slot = City::founded(site, turn, false);
    }

    // Step 4: the new city claims its border, like a capital at match start
    claim_unowned_tiles_within(map, civ.id(), site, border_radius(STARTING_CITY_SIZE));
    Ok(())
}

/// Every check of `found_city`, in order. Returns the first one that fails.
fn check_can_found_city(map: &Map, civ: &Civ, site: TileCoordinate) -> Result<(), ActionError> {
    if !civ.is_alive() {
        return Err(ActionError::CivIsOut);
    }
    if civ.units.count(UnitKind::Settler) == 0 {
        return Err(ActionError::NoSettler);
    }
    let tile = map.tile(site);
    if !tile.is_city_site() {
        return Err(ActionError::NotACitySite);
    }
    if tile.is_city() {
        return Err(ActionError::AlreadyACity);
    }
    let is_owned_by_another_civ = tile.owner().is_some_and(|owner| owner != civ.id());
    if is_owned_by_another_civ {
        return Err(ActionError::OwnedByAnotherCiv);
    }
    if !touches_territory(map, civ, site) {
        return Err(ActionError::NotNextToTerritory);
    }
    if civ.city_count() >= civ.cities().len() {
        return Err(ActionError::NoFreeCitySlot);
    }
    Ok(())
}

/// Buys one free tile next to the civ's land (docs/decisions/0006, "Paid claim_tile"): faster
/// than waiting for a city to grow.
///
/// Checks: civ is alive; nobody owns the tile; it shares an edge with the civ's land; the civ can
/// afford CLAIM_TILE_COST (10 Food + 10 Gold).
/// Effects: takes the cost, the tile becomes the civ's.
pub fn claim_tile(map: &mut Map, civ: &mut Civ, tile: TileCoordinate) -> Result<(), ActionError> {
    // Step 1: checks
    if !civ.is_alive() {
        return Err(ActionError::CivIsOut);
    }
    // `Some(owner) if ...` is a match arm with an extra test (a "guard"): it only matches when the
    // tile is owned AND the owner is this civ. Other owners fall through to `Some(_)`.
    match map.tile(tile).owner() {
        Some(owner) if owner == civ.id() => return Err(ActionError::AlreadyYours),
        Some(_) => return Err(ActionError::OwnedByAnotherCiv),
        None => {}
    }
    if !touches_territory(map, civ, tile) {
        return Err(ActionError::NotNextToTerritory);
    }
    if !civ.resources.can_afford(&CLAIM_TILE_COST) {
        return Err(ActionError::CannotAfford);
    }

    // Step 2: pay and take the tile
    civ.resources.subtract(&CLAIM_TILE_COST);
    map.tile_mut(tile).set_owner(Some(civ.id()));
    Ok(())
}

/// True if `site` is owned by the civ or shares an edge with a tile the civ owns.
fn touches_territory(map: &Map, civ: &Civ, site: TileCoordinate) -> bool {
    if map.tile(site).owner() == Some(civ.id()) {
        return true;
    }
    for neighbor in site.neighbors().into_iter().flatten() {
        if map.tile(neighbor).owner() == Some(civ.id()) {
            return true;
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::civ::CivId;
    use crate::resources::ResourceStock;

    fn coordinate(x: u8, y: u8) -> TileCoordinate {
        TileCoordinate::new(x, y).expect("test coordinates are on the map")
    }

    fn rich_civ() -> Civ {
        let mut civ = Civ::new(CivId(0), coordinate(3, 3));
        civ.resources = ResourceStock {
            food: 1_000,
            ore: 1_000,
            gold: 1_000,
        };
        civ
    }

    /// Civ 0 owns its capital's radius 2 border at (3,3); (6,3) is a free city site just outside.
    fn map_with_a_site_next_to_civ_zero() -> Map {
        let mut map = Map::empty();
        map.tile_mut(coordinate(3, 3)).set_city(true);
        claim_unowned_tiles_within(&mut map, CivId(0), coordinate(3, 3), 2);
        map.tile_mut(coordinate(6, 3)).set_city_site(true);
        map
    }

    fn settler_civ() -> Civ {
        let mut civ = rich_civ();
        civ.units.add(UnitKind::Settler, 1);
        civ
    }

    #[test]
    fn founding_a_city_uses_the_settler_and_claims_a_border() {
        let mut map = map_with_a_site_next_to_civ_zero();
        let mut civ = settler_civ();

        let result = found_city(&mut map, &mut civ, coordinate(6, 3), 12);

        assert_eq!(result, Ok(()));
        assert_eq!(civ.units.count(UnitKind::Settler), 0);
        assert_eq!(civ.city_count(), 2);
        assert!(map.tile(coordinate(6, 3)).is_city());
        assert_eq!(map.tile(coordinate(8, 3)).owner(), Some(CivId(0)));
        let new_city = civ.cities()[1];
        assert_eq!(new_city.founded_turn(), 12);
        assert!(!new_city.is_capital());
    }

    #[test]
    fn founding_a_city_without_a_settler_is_refused() {
        let mut map = map_with_a_site_next_to_civ_zero();
        let mut civ = rich_civ();

        let result = found_city(&mut map, &mut civ, coordinate(6, 3), 12);

        assert_eq!(result, Err(ActionError::NoSettler));
        assert!(!map.tile(coordinate(6, 3)).is_city());
    }

    #[test]
    fn a_city_can_only_be_founded_on_a_city_site() {
        let mut map = map_with_a_site_next_to_civ_zero();
        let mut civ = settler_civ();

        let result = found_city(&mut map, &mut civ, coordinate(5, 4), 12);

        assert_eq!(result, Err(ActionError::NotACitySite));
        assert_eq!(civ.units.count(UnitKind::Settler), 1);
    }

    #[test]
    fn a_site_far_from_the_civs_land_is_refused() {
        let mut map = map_with_a_site_next_to_civ_zero();
        map.tile_mut(coordinate(10, 10)).set_city_site(true);
        let mut civ = settler_civ();

        let result = found_city(&mut map, &mut civ, coordinate(10, 10), 12);

        assert_eq!(result, Err(ActionError::NotNextToTerritory));
    }

    #[test]
    fn a_site_another_civ_owns_is_refused() {
        let mut map = map_with_a_site_next_to_civ_zero();
        map.tile_mut(coordinate(6, 3)).set_owner(Some(CivId(1)));
        let mut civ = settler_civ();

        let result = found_city(&mut map, &mut civ, coordinate(6, 3), 12);

        assert_eq!(result, Err(ActionError::OwnedByAnotherCiv));
    }

    #[test]
    fn a_tile_that_is_already_a_city_is_refused() {
        let mut map = map_with_a_site_next_to_civ_zero();
        map.tile_mut(coordinate(3, 3)).set_city_site(true);
        let mut civ = settler_civ();

        let result = found_city(&mut map, &mut civ, coordinate(3, 3), 12);

        assert_eq!(result, Err(ActionError::AlreadyACity));
    }

    #[test]
    fn claiming_a_free_tile_next_to_your_land_costs_ten_food_and_ten_gold() {
        let mut map = map_with_a_site_next_to_civ_zero();
        let mut civ = rich_civ();

        let result = claim_tile(&mut map, &mut civ, coordinate(6, 3));

        assert_eq!(result, Ok(()));
        assert_eq!(map.tile(coordinate(6, 3)).owner(), Some(CivId(0)));
        assert_eq!(civ.resources.food, 1_000 - 10);
        assert_eq!(civ.resources.gold, 1_000 - 10);
        assert_eq!(civ.resources.ore, 1_000);
    }

    #[test]
    fn claiming_a_tile_away_from_your_land_is_refused() {
        let mut map = map_with_a_site_next_to_civ_zero();
        let mut civ = rich_civ();

        let result = claim_tile(&mut map, &mut civ, coordinate(7, 3));

        assert_eq!(result, Err(ActionError::NotNextToTerritory));
        assert_eq!(civ.resources.food, 1_000);
    }

    #[test]
    fn owned_tiles_cannot_be_claimed() {
        let mut map = map_with_a_site_next_to_civ_zero();
        map.tile_mut(coordinate(6, 3)).set_owner(Some(CivId(1)));
        let mut civ = rich_civ();

        let enemy = claim_tile(&mut map, &mut civ, coordinate(6, 3));
        let own = claim_tile(&mut map, &mut civ, coordinate(4, 3));

        assert_eq!(enemy, Err(ActionError::OwnedByAnotherCiv));
        assert_eq!(own, Err(ActionError::AlreadyYours));
    }

    #[test]
    fn a_civ_that_cannot_afford_the_claim_keeps_its_stock() {
        let mut map = map_with_a_site_next_to_civ_zero();
        let mut civ = Civ::new(CivId(0), coordinate(3, 3));
        civ.resources.food = 10;
        civ.resources.gold = 9;

        let result = claim_tile(&mut map, &mut civ, coordinate(6, 3));

        assert_eq!(result, Err(ActionError::CannotAfford));
        assert_eq!(map.tile(coordinate(6, 3)).owner(), None);
        assert_eq!(civ.resources.food, 10);
    }
}
