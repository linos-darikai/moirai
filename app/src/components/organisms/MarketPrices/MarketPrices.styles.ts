import styled, { css } from "styled-components";

export const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
`;

export const Row = styled.div<{ $look: "rows" | "cards" }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  ${({ theme, $look }) =>
    $look === "rows"
      ? css`
          padding: ${theme.space(2)} 0;
          border-top: 1px solid ${theme.colors.border};
        `
      : css`
          min-height: ${theme.sizes.control};
          padding: 0 ${theme.space(3)};
          border-radius: ${theme.radii.xl};
          background: ${theme.colors.surface};
        `}
`;

export const Name = styled.span`
  flex: 1;
`;

export const Price = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
`;

export const Change = styled.span<{ $isUp: boolean }>`
  min-width: 56px;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $isUp }) => ($isUp ? theme.colors.successText : theme.colors.dangerText)};
`;
