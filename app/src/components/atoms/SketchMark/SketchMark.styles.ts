import styled from "styled-components";
import type { DefaultTheme } from "styled-components";
import type { CivIndex, ResourceKind } from "../../../types/game";

/** The colour a mark is drawn in: a resource, a civ (by index), muted grey or chalk white. */
export type SketchMarkTone = { resource: ResourceKind } | { civ: CivIndex } | "muted" | "chalk";

function toneColor(theme: DefaultTheme, tone: SketchMarkTone): string {
  if (tone === "muted") return theme.colors.textMuted;
  if (tone === "chalk") return theme.colors.sketchLine;
  if ("resource" in tone) return theme.resourceColors[tone.resource];
  return theme.civColors[tone.civ];
}

export const StyledSketchMark = styled.svg<{ $tone: SketchMarkTone }>`
  display: block;
  width: 100%;
  height: 100%;
  color: ${({ theme, $tone }) => toneColor(theme, $tone)};

  /* The city spiral is always chalk white, whatever the circle's colour. */
  .spiral {
    stroke: ${({ theme }) => theme.colors.text};
  }
`;
