// Turns a ColorToken (a civ, player avatar, resource or named colour) into the theme's hex value.
// Used by every styles file that draws a coloured mark.

import type { DefaultTheme } from "styled-components";
import type { ColorToken } from "../types/colors";

/** The theme colour for a token. */
export function resolveColor(theme: DefaultTheme, color: ColorToken): string {
  if ("civ" in color) return theme.civColors[color.civ];
  if ("metric" in color) return theme.metricColors[color.metric];
  if ("avatar" in color) {
    return theme.avatarColors[color.avatar % theme.avatarColors.length] ?? theme.colors.accent;
  }
  if ("resource" in color) return theme.resourceColors[color.resource];
  if (color.token === "success") return theme.colors.success;
  if (color.token === "empty") return theme.colors.border;
  return theme.colors.accent;
}
