// Which colour token a coloured mark (swatch, bar, feed line) uses. Components pass one of these
// instead of a hex value, so every colour still comes from the theme.

import type { CivIndex, ResourceKind, WinMetric } from "./game";

export type ColorToken =
  | { civ: CivIndex }
  | { metric: WinMetric }
  | { avatar: number }
  | { resource: ResourceKind }
  | { token: "accent" | "success" | "empty" };
