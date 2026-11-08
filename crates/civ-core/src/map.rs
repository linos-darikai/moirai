//! The map: a 16 x 16 grid of tiles, each with an owner, maybe a resource deposit, and maybe a
//! city. Tiles live in one fixed-size array (no growing collections), indexed row by row.
//! See PLAN.md section 2, "Map".
//!
//! Storage layout: each `Tile` is 3 plain bytes and `Map` is 768 bytes, so the Solana program can
//! use `Map` directly as zero-copy account data (docs/decisions/0004-civ-core-state-layout.md).
//! All-zero bytes mean an empty tile, so a freshly created (zeroed) account is an empty map.

use bytemuck::{Pod, Zeroable};

use crate::civ::{CivId, MAX_CIVS};
use crate::resources::Resource;

/// Number of tile columns.
pub const MAP_WIDTH: u8 = 16;
/// Number of tile rows.
pub const MAP_HEIGHT: u8 = 16;
/// Total tiles on the map (16 x 16 = 256).
pub const TILE_COUNT: usize = MAP_WIDTH as usize * MAP_HEIGHT as usize;

/// A tile's position. `x` is the column (0 = left), `y` the row (0 = top).
///
/// Always on the map: outside civ-core the only way to make one is `new` or `from_index`, which
/// check the bounds. So indexing the map with a coordinate can never go out of range, which would
/// crash (panic) the instruction on chain. (`pub(crate)` = visible inside civ-core only.)
#[derive(Clone, Copy, PartialEq, Eq, Debug, PartialOrd, Ord)]
pub struct TileCoordinate {
    pub(crate) x: u8,
    pub(crate) y: u8,
}

impl TileCoordinate {
    /// The coordinate (x, y), or `None` if it is off the map.
    ///
    /// `Option<T>` means "a T, or nothing", like `T | undefined` in TypeScript.
    pub fn new(x: u8, y: u8) -> Option<TileCoordinate> {
        if x >= MAP_WIDTH || y >= MAP_HEIGHT {
            return None;
        }
        Some(TileCoordinate { x, y })
    }

    /// The column, 0 (left) to 15 (right).
    pub fn x(self) -> u8 {
        self.x
    }

    /// The row, 0 (top) to 15 (bottom).
    pub fn y(self) -> u8 {
        self.y
    }

    /// The tile's position in the map's array: row by row, so (0,0) is 0, (15,0) is 15, (0,1) is 16.
    pub fn index(self) -> usize {
        usize::from(self.y) * usize::from(MAP_WIDTH) + usize::from(self.x)
    }

    /// The coordinate for an array position, or `None` if it is past the end of the map.
    pub fn from_index(index: usize) -> Option<TileCoordinate> {
        if index >= TILE_COUNT {
            return None;
        }
        let width = usize::from(MAP_WIDTH);
        // `try_from` converts usize to u8 and gives an error instead of silently cutting off
        // bits; `.ok()?` turns that error into `None`. (Both values are below 16 here anyway.)
        let x = u8::try_from(index % width).ok()?;
        let y = u8::try_from(index / width).ok()?;
        Some(TileCoordinate { x, y })
    }

    /// Steps between two tiles moving only up, down, left or right (no diagonals). This is how far
    /// a city "reaches" and how far apart city sites must be.
    pub fn manhattan_distance(self, other: TileCoordinate) -> u8 {
        self.x
            .abs_diff(other.x)
            .saturating_add(self.y.abs_diff(other.y))
    }

    /// The four tiles that share an edge with this one, in the order north, east, south, west.
    /// Entries are `None` where the map ends.
    pub fn neighbors(self) -> [Option<TileCoordinate>; 4] {
        let north = self
            .y
            .checked_sub(1)
            .and_then(|y| TileCoordinate::new(self.x, y));
        let east = TileCoordinate::new(self.x.saturating_add(1), self.y);
        let south = TileCoordinate::new(self.x, self.y.saturating_add(1));
        let west = self
            .x
            .checked_sub(1)
            .and_then(|x| TileCoordinate::new(x, self.y));
        [north, east, south, west]
    }
}

/// Bit in `Tile::flags` that marks a city.
const CITY_FLAG: u8 = 0b0000_0001;
/// Bit in `Tile::flags` that marks a city site: a tile where a city may be built.
const CITY_SITE_FLAG: u8 = 0b0000_0010;

/// One square of the map, stored as 3 plain bytes. Read and change it through the methods
/// (`owner()`, `set_owner(...)`, ...), which turn the bytes into proper Rust types.
///
/// `#[repr(C)]` fixes the field order and size in memory, and `Pod`/`Zeroable` (from bytemuck)
/// promise "any bytes are a valid Tile, and all zeros is a valid Tile". That is what lets the
/// program treat account data as tiles without copying.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct Tile {
    /// 0 = nobody, 1..=4 = civ 0..=3 (stored as civ id + 1 so all zeros means "unowned").
    owner_byte: u8,
    /// 0 = no deposit, otherwise `Resource::to_byte`.
    deposit_byte: u8,
    /// Bit flags; bit 0 = city. Other bits are reserved and ignored.
    flags: u8,
}

impl Tile {
    /// An unowned tile with no deposit and no city (all zero bytes).
    pub const EMPTY: Tile = Tile {
        owner_byte: 0,
        deposit_byte: 0,
        flags: 0,
    };

    /// Which civ owns this tile, if any. A byte that isn't a valid civ reads as "nobody".
    pub fn owner(&self) -> Option<CivId> {
        let civ_number = self.owner_byte.checked_sub(1)?;
        if usize::from(civ_number) >= MAX_CIVS {
            return None;
        }
        Some(CivId(civ_number))
    }

    /// Sets (or clears, with `None`) the owner.
    pub fn set_owner(&mut self, owner: Option<CivId>) {
        self.owner_byte = match owner {
            Some(civ) => civ.0.saturating_add(1),
            None => 0,
        };
    }

    /// The resource deposit on this tile, if any. An owned deposit produces 1 unit per turn.
    pub fn deposit(&self) -> Option<Resource> {
        Resource::from_byte(self.deposit_byte)
    }

    /// Sets (or clears, with `None`) the deposit.
    pub fn set_deposit(&mut self, deposit: Option<Resource>) {
        self.deposit_byte = match deposit {
            Some(resource) => resource.to_byte(),
            None => 0,
        };
    }

    /// Whether a city stands here.
    pub fn is_city(&self) -> bool {
        self.flags & CITY_FLAG != 0
    }

    /// Adds or removes the city.
    pub fn set_city(&mut self, is_city: bool) {
        if is_city {
            self.flags |= CITY_FLAG;
        } else {
            self.flags &= !CITY_FLAG;
        }
    }

    /// Whether a city may be built here (a city site). Capitals start on sites; a razed city's
    /// tile becomes a site again.
    pub fn is_city_site(&self) -> bool {
        self.flags & CITY_SITE_FLAG != 0
    }

    /// Marks or unmarks the tile as a city site.
    pub fn set_city_site(&mut self, is_site: bool) {
        if is_site {
            self.flags |= CITY_SITE_FLAG;
        } else {
            self.flags &= !CITY_SITE_FLAG;
        }
    }
}

/// The whole 16 x 16 grid: 768 bytes of plain data.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Eq, Debug, Pod, Zeroable)]
pub struct Map {
    tiles: [Tile; TILE_COUNT],
}

impl Map {
    /// A map where every tile is empty.
    pub fn empty() -> Map {
        Map {
            tiles: [Tile::EMPTY; TILE_COUNT],
        }
    }

    /// Empties every tile in place. Used to reuse an existing map's memory (on chain: the Map
    /// account's data) instead of building a new map on the small SBF stack.
    pub fn clear(&mut self) {
        for tile in self.tiles.iter_mut() {
            *tile = Tile::EMPTY;
        }
    }

    /// The tile at `coordinate`. Always exists, because a `TileCoordinate` is always on the map.
    ///
    /// Indexing an array with `[..]` would panic if the index were out of range. It can't be here:
    /// `TileCoordinate` guarantees x and y are below 16, so `index()` is below 256 (TILE_COUNT).
    /// This invariant is why the coordinate fields are private outside civ-core.
    pub fn tile(&self, coordinate: TileCoordinate) -> &Tile {
        &self.tiles[coordinate.index()]
    }

    /// The tile at `coordinate`, borrowed so it can be changed.
    pub fn tile_mut(&mut self, coordinate: TileCoordinate) -> &mut Tile {
        &mut self.tiles[coordinate.index()]
    }

    /// All tiles in array order (row by row).
    pub fn tiles(&self) -> &[Tile; TILE_COUNT] {
        &self.tiles
    }

    /// The map's raw storage: 768 bytes, 3 per tile in row order (owner, deposit, flags), exactly
    /// as an on-chain Map account stores it. The browser decodes this to draw the board.
    pub fn as_bytes(&self) -> &[u8] {
        bytemuck::bytes_of(self)
    }

    /// A 64-bit summary of every tile, used to check two maps are identical (for example the
    /// native build and the WASM build). Uses FNV-1a, a simple hash that is the same everywhere.
    ///
    /// It hashes what each tile *means* (owner, deposit, city), not the raw storage bytes, so
    /// the storage layout can change without changing the fingerprint of the same map.
    pub fn fingerprint(&self) -> u64 {
        let mut hash: u64 = FNV_OFFSET_BASIS;
        for tile in self.tiles.iter() {
            for byte in fingerprint_bytes(tile) {
                hash ^= u64::from(byte);
                // Wrapping multiply is part of the FNV definition, not an accident.
                hash = hash.wrapping_mul(FNV_PRIME);
            }
        }
        hash
    }
}

/// FNV-1a starting value. `pub(crate)` so MatchState can hash with the same function.
pub(crate) const FNV_OFFSET_BASIS: u64 = 0xcbf2_9ce4_8422_2325;
/// FNV-1a multiplier.
pub(crate) const FNV_PRIME: u64 = 0x0000_0100_0000_01b3;

/// The three bytes a tile contributes to the fingerprint: owner (255 = none), deposit (0 = none,
/// 1 = Food, 2 = Ore, 3 = Gold) and marks (bit 0 = city, bit 1 = city site).
fn fingerprint_bytes(tile: &Tile) -> [u8; 3] {
    let owner_byte: u8 = match tile.owner() {
        Some(civ) => civ.0,
        None => u8::MAX,
    };
    let deposit_byte: u8 = match tile.deposit() {
        Some(resource) => resource.to_byte(),
        None => 0,
    };
    let marks_byte: u8 = u8::from(tile.is_city()) | (u8::from(tile.is_city_site()) << 1);
    [owner_byte, deposit_byte, marks_byte]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn index_and_from_index_round_trip_for_every_tile() {
        for index in 0..TILE_COUNT {
            let coordinate = TileCoordinate::from_index(index);

            assert_eq!(coordinate.map(|c| c.index()), Some(index));
        }
    }

    #[test]
    fn coordinates_off_the_map_are_rejected() {
        assert_eq!(TileCoordinate::new(MAP_WIDTH, 0), None);
        assert_eq!(TileCoordinate::new(0, MAP_HEIGHT), None);
        assert_eq!(TileCoordinate::from_index(TILE_COUNT), None);
    }

    #[test]
    fn a_corner_tile_has_only_two_neighbors() {
        let top_left = TileCoordinate { x: 0, y: 0 };

        let [north, east, south, west] = top_left.neighbors();

        assert_eq!(north, None);
        assert_eq!(east, Some(TileCoordinate { x: 1, y: 0 }));
        assert_eq!(south, Some(TileCoordinate { x: 0, y: 1 }));
        assert_eq!(west, None);
    }

    #[test]
    fn a_tile_remembers_what_is_set_on_it() {
        let mut tile = Tile::EMPTY;

        tile.set_owner(Some(CivId(3)));
        tile.set_deposit(Some(Resource::Ore));
        tile.set_city(true);

        assert_eq!(tile.owner(), Some(CivId(3)));
        assert_eq!(tile.deposit(), Some(Resource::Ore));
        assert!(tile.is_city());
    }

    #[test]
    fn clearing_a_tile_field_sets_it_back_to_nothing() {
        let mut tile = Tile::EMPTY;
        tile.set_owner(Some(CivId(1)));
        tile.set_city(true);

        tile.set_owner(None);
        tile.set_city(false);

        assert_eq!(tile, Tile::EMPTY);
    }

    #[test]
    fn a_zeroed_map_is_an_empty_map() {
        // A brand-new zero-copy account is all zero bytes; it must read as an empty map.
        let zeroed: Map = Zeroable::zeroed();

        assert_eq!(zeroed, Map::empty());
    }

    #[test]
    fn garbage_bytes_read_as_empty_instead_of_crashing() {
        // Account data is untrusted. Bytes that aren't a valid owner/resource mean "nothing".
        let garbage: Tile = bytemuck::cast([200u8, 9, 0b1111_1110]);

        assert_eq!(garbage.owner(), None);
        assert_eq!(garbage.deposit(), None);
        assert!(!garbage.is_city());
    }

    #[test]
    fn a_tile_is_three_bytes_and_the_map_is_768() {
        // The on-chain Map account's size depends on this. On SBF each function also gets only a
        // 4 KB stack frame, so the map must stay small. Rethink the layout before changing this.
        assert_eq!(std::mem::size_of::<Tile>(), 3);
        assert_eq!(std::mem::size_of::<Map>(), 768);
    }

    #[test]
    fn clear_empties_every_tile() {
        let mut map = Map::empty();
        map.tile_mut(TileCoordinate { x: 2, y: 2 }).set_city(true);

        map.clear();

        assert_eq!(map, Map::empty());
    }

    #[test]
    fn changing_one_tile_changes_the_fingerprint() {
        let empty = Map::empty();
        let mut changed = Map::empty();

        changed
            .tile_mut(TileCoordinate { x: 4, y: 9 })
            .set_deposit(Some(Resource::Gold));

        assert_ne!(empty.fingerprint(), changed.fingerprint());
    }
}
