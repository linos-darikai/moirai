//! Per-civ aggregates: what each civ owns on the map, counted in ONE pass over the tiles.
//!
//! CLAUDE.md section 6: "Precompute per-civ aggregates once per turn; rules read cached values
//! instead of rescanning the map." Production (and later policies, battles and scoring) read these
//! numbers instead of looping over all 256 tiles again.

use crate::civ::{CivId, MAX_CIVS};
use crate::map::Map;
use crate::resources::{Resource, ResourceStock};

/// What one civ owns on the map right now.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct CivAggregate {
    /// Tiles owned, including city tiles.
    pub tiles_owned: u16,
    /// City tiles owned (its starting city plus any it conquered).
    pub cities_owned: u16,
    /// Owned deposit tiles of each resource (stored as counts in a ResourceStock).
    pub deposits_owned: ResourceStock,
}

/// Aggregates for every civ, indexed by civ id (0..4). Slots for civs not in the match stay zero.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct MapAggregates {
    pub civs: [CivAggregate; MAX_CIVS],
}

impl MapAggregates {
    /// The aggregate for `civ` (an all-zero aggregate for an id outside 0..4).
    pub fn for_civ(&self, civ: CivId) -> CivAggregate {
        self.civs.get(civ.index()).copied().unwrap_or_default()
    }
}

/// Counts every civ's tiles, cities and deposits in a single pass over the map.
pub fn aggregate_map(map: &Map) -> MapAggregates {
    let mut aggregates = MapAggregates::default();

    for tile in map.tiles().iter() {
        let Some(owner) = tile.owner() else {
            continue; // unowned tiles count for nobody
        };
        // `get_mut` returns None instead of panicking if the owner id were ever out of range.
        let Some(civ) = aggregates.civs.get_mut(owner.index()) else {
            continue;
        };

        civ.tiles_owned = civ.tiles_owned.saturating_add(1);
        if tile.is_city() {
            civ.cities_owned = civ.cities_owned.saturating_add(1);
        }
        if let Some(resource) = tile.deposit() {
            civ.deposits_owned.add(resource, 1);
        }
    }

    aggregates
}

/// How many deposits of `resource` the aggregate counts.
pub fn deposits_of(aggregate: &CivAggregate, resource: Resource) -> u32 {
    aggregate.deposits_owned.amount(resource)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::map::TileCoordinate;

    fn coordinate(x: u8, y: u8) -> TileCoordinate {
        TileCoordinate::new(x, y).expect("test coordinates are on the map")
    }

    #[test]
    fn an_empty_map_gives_everyone_nothing() {
        let aggregates = aggregate_map(&Map::empty());

        assert_eq!(aggregates, MapAggregates::default());
    }

    #[test]
    fn owned_tiles_cities_and_deposits_are_counted_per_civ() {
        let mut map = Map::empty();
        let city = map.tile_mut(coordinate(3, 3));
        city.set_owner(Some(CivId(1)));
        city.set_city(true);
        let gold_mine = map.tile_mut(coordinate(4, 3));
        gold_mine.set_owner(Some(CivId(1)));
        gold_mine.set_deposit(Some(Resource::Gold));
        map.tile_mut(coordinate(9, 9)).set_owner(Some(CivId(2)));
        map.tile_mut(coordinate(10, 10))
            .set_deposit(Some(Resource::Food)); // nobody owns it

        let aggregates = aggregate_map(&map);

        let civ_one = aggregates.for_civ(CivId(1));
        assert_eq!(civ_one.tiles_owned, 2);
        assert_eq!(civ_one.cities_owned, 1);
        assert_eq!(deposits_of(&civ_one, Resource::Gold), 1);
        assert_eq!(aggregates.for_civ(CivId(2)).tiles_owned, 1);
        assert_eq!(
            deposits_of(&aggregates.for_civ(CivId(2)), Resource::Food),
            0
        );
    }
}
