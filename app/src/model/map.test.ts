import { describe, expect, it } from "vitest";
import { decodeMapBytes, seedBytesFromHex, TILE_COUNT } from "./map";

describe("decodeMapBytes", () => {
  it("reads owner, deposit and city exactly like civ-core stores them", () => {
    const bytes = new Uint8Array(TILE_COUNT * 3);
    bytes.set([2, 3, 1], 0); // tile (0,0): civ 1, gold, city
    bytes.set([0, 1, 0], 3 * 17); // tile (1,1): nobody, food

    const tiles = decodeMapBytes(bytes);

    expect(tiles[0]).toEqual({ x: 0, y: 0, owner: 1, deposit: "gold", isCity: true });
    expect(tiles[17]).toEqual({ x: 1, y: 1, owner: null, deposit: "food", isCity: false });
  });

  it("rejects the wrong number of bytes", () => {
    expect(() => decodeMapBytes(new Uint8Array(10))).toThrow(/768/);
  });
});

describe("seedBytesFromHex", () => {
  it("repeats a short seed to fill 32 bytes", () => {
    const seed = seedBytesFromHex("0x9f3c");

    expect(seed?.length).toBe(32);
    expect(Array.from(seed?.slice(0, 4) ?? [])).toEqual([0x9f, 0x3c, 0x9f, 0x3c]);
  });

  it("returns null for text that isn't hex", () => {
    expect(seedBytesFromHex("not a seed")).toBeNull();
    expect(seedBytesFromHex("")).toBeNull();
  });
});
