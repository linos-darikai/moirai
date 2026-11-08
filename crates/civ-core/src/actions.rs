//! Actions: what a civ can do on its turn, as plain functions that check the rules and then change
//! the state. Policies (later) choose actions; the turn function resolves them in a rotating order
//! (docs/decisions/0006, section 6). Each function checks everything first and changes nothing
//! when a check fails, so a refused action costs nothing.
//!
//! So far: `build_unit` and `found_city`. Attacks, trades and `claim_tile` come in later steps.

use crate::borders::claim_unowned_tiles_within;
use crate::city::{City, STARTING_CITY_SIZE};
use crate::civ::Civ;
use crate::map::{Map, TileCoordinate};
use crate::rules::{border_radius, unit_stats, ELITES_PER_CITY_SIZE};
use crate::units::UnitKind;

/// Why an action was refused. Like a TypeScript union of error strings, but checked by the
/// compiler.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ActionError {
    /// The civ has lost all its cities and can't act.
    CivIsOut,
    /// The civ doesn't hold enough resources for the cost.
    CannotAfford,
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
    /// The tile is neither inside the civ's territory nor next to it.
    NotNextToTerritory,
    /// The civ already has MAX_CITIES_PER_CIV cities.
    NoFreeCitySlot,
}

/// Builds one unit of `kind`, paying its cost from the civ's stock.
///
/// Checks: civ is alive, the Elite limit (one per city size), the civ can afford the cost.
/// Effects: takes the cost from the stock, adds one unit.
pub fn build_unit(civ: &mut Civ, kind: UnitKind) -> Result<(), ActionError> {
    // Step 1: checks
    if !civ.is_alive() {
        return Err(ActionError::CivIsOut);
    }
    if kind == UnitKind::Elite && has_reached_elite_limit(civ) {
        return Err(ActionError::EliteLimitReached);
    }
    let cost = unit_stats(kind).cost;
    if !civ.resources.can_afford(&cost) {
        return Err(ActionError::CannotAfford);
    }

    // Step 2: pay and build
    civ.resources.subtract(&cost);
    civ.units.add(kind, 1);
    Ok(())
}

/// True if the civ already fields as many Elites as its city sizes allow.
fn has_reached_elite_limit(civ: &Civ) -> bool {
    let elite_limit = civ.total_city_size().saturating_mul(ELITES_PER_CITY_SIZE);
    u32::from(civ.units.count(UnitKind::Elite)) >= elite_limit
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
    fn building_a_unit_pays_its_cost() {
        let mut civ = rich_civ();

        let result = build_unit(&mut civ, UnitKind::Siege);

        assert_eq!(result, Ok(()));
        assert_eq!(civ.units.count(UnitKind::Siege), 1);
        assert_eq!(civ.resources.ore, 1_000 - 10);
        assert_eq!(civ.resources.gold, 1_000 - 10);
    }

    #[test]
    fn a_civ_that_cannot_afford_a_unit_keeps_its_stock() {
        let mut civ = Civ::new(CivId(0), coordinate(3, 3));
        civ.resources.gold = 39;

        let result = build_unit(&mut civ, UnitKind::Elite);

        assert_eq!(result, Err(ActionError::CannotAfford));
        assert_eq!(civ.resources.gold, 39);
        assert_eq!(civ.units.count(UnitKind::Elite), 0);
    }

    #[test]
    fn a_size_one_civ_can_field_only_one_elite() {
        let mut civ = rich_civ();

        let first = build_unit(&mut civ, UnitKind::Elite);
        let second = build_unit(&mut civ, UnitKind::Elite);

        assert_eq!(first, Ok(()));
        assert_eq!(second, Err(ActionError::EliteLimitReached));
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
}
