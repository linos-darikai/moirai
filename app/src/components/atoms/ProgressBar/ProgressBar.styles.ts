import styled from "styled-components";
import type { DefaultTheme } from "styled-components";
import type { SwatchColor } from "../Swatch";

function fillColor(theme: DefaultTheme, color: SwatchColor): string {
  if ("civ" in color) return theme.civColors[color.civ];
  if ("avatar" in color) return theme.avatarColors[color.avatar % theme.avatarColors.length] ?? theme.colors.accent;
  if ("resource" in color) return theme.resourceColors[color.resource];
  return color.token === "success" ? theme.colors.success : theme.colors.accent;
}

export const Track = styled.div<{ $height: "thin" | "regular" }>`
  width: 100%;
  height: ${({ $height }) => ($height === "thin" ? "6px" : "8px")};
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme }) => theme.colors.border};
  overflow: hidden;
`;

export const Fill = styled.div<{ $percent: number; $color: SwatchColor }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${({ theme, $color }) => fillColor(theme, $color)};
`;
