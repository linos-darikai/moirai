// Map logic: turns civ-core's raw map bytes into tiles, and typed seed text into seed bytes.
// The byte meanings must match `Tile` in crates/civ-core/src/map.rs exactly (3 bytes per tile:
// owner, deposit, flags).

import type { CivIndex, ResourceKind } from "../types/game";
import type { MapTile } from "../types/map";

/** Tiles per row and per column. */
export const MAP_SIZE = 16;
export const TILE_COUNT = MAP_SIZE * MAP_SIZE;
const BYTES_PER_TILE = 3;
const CITY_FLAG = 0b0000_0001;
const SEED_LENGTH_BYTES = 32;

/** Turns a deposit byte into a resource (0 = none; matches `Resource::to_byte` in civ-core). */
function depositFromByte(byte: number): ResourceKind | null {
  if (byte === 1) return "food";
  if (byte === 2) return "ore";
  if (byte === 3) return "gold";
  return null;
}

/** Turns an owner byte into a civ (0 = nobody, 1..4 = civ 0..3). */
function ownerFromByte(byte: number): CivIndex | null {
  if (byte >= 1 && byte <= 4) {
    return (byte - 1) as CivIndex;
  }
  return null;
}

/** Decodes civ-core's 768 map bytes into 256 tiles, row by row. */
export function decodeMapBytes(bytes: Uint8Array): MapTile[] {
  if (bytes.length !== TILE_COUNT * BYTES_PER_TILE) {
    throw new Error(`expected ${TILE_COUNT * BYTES_PER_TILE} map bytes, got ${bytes.length}`);
  }
  const tiles: MapTile[] = [];
  for (let index = 0; index < TILE_COUNT; index++) {
    const offset = index * BYTES_PER_TILE;
    tiles.push({
      x: index % MAP_SIZE,
      y: Math.floor(index / MAP_SIZE),
      owner: ownerFromByte(bytes[offset] ?? 0),
      deposit: depositFromByte(bytes[offset + 1] ?? 0),
      isCity: ((bytes[offset + 2] ?? 0) & CITY_FLAG) !== 0,
    });
  }
  return tiles;
}

/**
 * Turns typed seed text into the 32 seed bytes civ-core needs. Hex characters are read as bytes
 * (an optional "0x" is ignored) and repeated to fill 32 bytes, so a short seed like "0x9f3c" works.
 * Returns null if the text is empty or has anything that isn't hex.
 */
export function seedBytesFromHex(seedText: string): Uint8Array | null {
  const hex = seedText.trim().toLowerCase().replace(/^0x/, "");
  if (hex.length === 0 || !/^[0-9a-f]+$/.test(hex)) {
    return null;
  }
  const evenHex = hex.length % 2 === 0 ? hex : `${hex}0`;
  const parsed: number[] = [];
  for (let i = 0; i < evenHex.length && parsed.length < SEED_LENGTH_BYTES; i += 2) {
    parsed.push(Number.parseInt(evenHex.slice(i, i + 2), 16));
  }
  const seed = new Uint8Array(SEED_LENGTH_BYTES);
  for (let i = 0; i < SEED_LENGTH_BYTES; i++) {
    seed[i] = parsed[i % parsed.length] ?? 0;
  }
  return seed;
}
