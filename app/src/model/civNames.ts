// Civ display names by seat, used by the map's screen-reader summary and the turn feed.

import type { CivIndex } from "../types/game";

/** Names for seats that have no bot (shouldn't show in practice). */
const FALLBACK_NAMES: Record<CivIndex, string> = { 0: "civ 1", 1: "civ 2", 2: "civ 3", 3: "civ 4" };

/** Maps each seat to its bot's name. */
export function civNamesFrom(civs: readonly { civIndex: CivIndex; bot: string }[]): Record<CivIndex, string> {
  const names: Record<CivIndex, string> = { ...FALLBACK_NAMES };
  for (const civ of civs) {
    names[civ.civIndex] = civ.bot;
  }
  return names;
}
