import styled, { css } from "styled-components";
import type { DefaultTheme } from "styled-components";

/** segmented = joined buttons in a tray; pills = separate rounded buttons; hand = handwritten
 *  buttons in a chalk-outlined box (the home page's language switch). */
export type SegmentShape = "segmented" | "pills" | "hand";

type ShapeStyle = (theme: DefaultTheme) => ReturnType<typeof css>;

const groupStyles: Record<SegmentShape, ShapeStyle> = {
  segmented: (theme) => css`
    gap: 0;
    padding: ${theme.space(1)};
    border-radius: ${theme.radii.lg};
    background: ${theme.colors.inset};
    border: ${theme.borderWidths.sketch} solid ${theme.colors.border};
  `,
  pills: (theme) => css`
    gap: ${theme.space(2)};
  `,
  hand: (theme) => css`
    gap: ${theme.space(1.5)};
    padding: ${theme.space(1)};
    border-radius: ${theme.radii.lg};
    border: ${theme.borderWidths.pen} solid ${theme.colors.sketchLine};
  `,
};

/** How a segment looks when it is off. */
const segmentStyles: Record<SegmentShape, ShapeStyle> = {
  segmented: (theme) => css`
    min-height: 36px;
    font-size: ${theme.fontSizes.md};
    font-weight: ${theme.fontWeights.semibold};
    background: transparent;
    border: 0;
    border-radius: ${theme.radii.md};
  `,
  pills: (theme) => css`
    min-height: 40px;
    font-size: ${theme.fontSizes.md};
    font-weight: ${theme.fontWeights.medium};
    background: ${theme.colors.surface};
    border: ${theme.borderWidths.sketch} solid ${theme.colors.borderStrong};
    border-radius: ${theme.radii.pill};
  `,
  hand: (theme) => css`
    min-height: 40px;
    min-width: 48px;
    font-family: ${theme.fonts.hand};
    font-size: ${theme.fontSizes.handPanel};
    font-weight: ${theme.fontWeights.bold};
    background: transparent;
    border: 0;
    border-radius: ${theme.radii.md};
  `,
};

/** How a segment looks when it is on. The hand shape fills with chalk white instead of blue. */
const onStyles: Record<SegmentShape, ShapeStyle> = {
  segmented: (theme) => css`
    background: ${theme.colors.accent};
    color: ${theme.colors.onAccent};
  `,
  pills: (theme) => css`
    background: ${theme.colors.accent};
    border-color: ${theme.colors.accent};
    color: ${theme.colors.onAccent};
  `,
  hand: (theme) => css`
    background: ${theme.colors.sketchLine};
    color: ${theme.colors.bg};
  `,
};

export const Group = styled.div<{ $shape: SegmentShape; $isFullWidth: boolean }>`
  display: ${({ $isFullWidth }) => ($isFullWidth ? "flex" : "inline-flex")};
  flex-wrap: wrap;
  ${({ theme, $shape }) => groupStyles[$shape](theme)}
`;

export const Segment = styled.button<{ $isOn: boolean; $shape: SegmentShape; $isFullWidth: boolean }>`
  flex: ${({ $isFullWidth }) => ($isFullWidth ? "1" : "0 0 auto")};
  min-width: 44px;
  padding: 0 ${({ theme }) => theme.space(4)};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  ${({ theme, $shape }) => segmentStyles[$shape](theme)}
  ${({ theme, $shape, $isOn }) => $isOn && onStyles[$shape](theme)}
`;
