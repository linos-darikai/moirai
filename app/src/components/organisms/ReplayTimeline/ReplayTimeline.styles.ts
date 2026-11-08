import styled from "styled-components";
import { resolveColor } from "../../../theme/resolveColor";
import type { ReplayMoment } from "../../../types/game";

export const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};

  & > :last-child {
    margin-left: auto;
  }
`;

export const StepButton = styled.button`
  width: ${({ theme }) => theme.sizes.touchTarget};
  height: ${({ theme }) => theme.sizes.touchTarget};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

export const PlayButton = styled.button`
  width: ${({ theme }) => theme.sizes.controlLarge};
  height: ${({ theme }) => theme.sizes.controlLarge};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.onAccent};
  cursor: pointer;
`;

export const Track = styled.div`
  position: relative;
  padding: ${({ theme }) => `${theme.space(4.5)} 0 ${theme.space(1.5)}`};
`;

export const Marker = styled.button<{ $leftPercent: number }>`
  position: absolute;
  top: -6px;
  left: ${({ $leftPercent }) => $leftPercent}%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  cursor: pointer;
`;

/** A moment's tone: a resource, a civ, or "success" for the final turn. */
function toneColor(tone: ReplayMoment["tone"]) {
  if (tone === "success") return { token: "success" } as const;
  if (typeof tone === "number") return { civ: tone } as const;
  return { resource: tone } as const;
}

export const Diamond = styled.span<{ $tone: ReplayMoment["tone"]; $isCurrent: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.radii.xs};
  transform: rotate(45deg);
  background: ${({ theme, $tone }) => resolveColor(theme, toneColor($tone))};
  outline: ${({ theme, $isCurrent }) => ($isCurrent ? `2px solid ${theme.colors.text}` : "none")};
  outline-offset: 2px;
`;

export const Ticks = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
