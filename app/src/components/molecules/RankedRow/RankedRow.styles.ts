import styled, { css } from "styled-components";

export const Row = styled.li<{ $look: "plain" | "boxed"; $isHighlighted: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  ${({ theme, $look, $isHighlighted }) =>
    $look === "boxed" &&
    css`
      min-height: ${theme.sizes.touchTarget};
      justify-content: center;
      padding: 0 ${theme.space(3)};
      border-radius: ${theme.radii.xl};
      background: ${theme.colors.surface};
      border: ${theme.borderWidths.sketch} solid ${$isHighlighted ? theme.colors.accent : theme.colors.border};
    `}
`;

export const Main = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
`;

export const Rank = styled.span`
  width: 20px;
  font-family: ${({ theme }) => theme.fonts.mono};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Name = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;
