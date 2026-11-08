import styled, { css } from "styled-components";

type Layout = "rows" | "grid";

export const List = styled.dl<{ $layout: Layout; $columns: number }>`
  margin: 0;
  ${({ theme, $layout, $columns }) =>
    $layout === "grid"
      ? css`
          display: grid;
          grid-template-columns: repeat(${$columns}, minmax(0, 1fr));
          gap: ${theme.space(2.5)} ${theme.space(4)};
        `
      : css`
          display: flex;
          flex-direction: column;
          gap: ${theme.space(3)};
        `}
`;

export const Row = styled.div<{ $layout: Layout }>`
  ${({ theme, $layout }) =>
    $layout === "rows" &&
    css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: ${theme.space(3)};
    `}
`;

export const Term = styled.dt<{ $tone: "default" | "verify" }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme, $tone }) => ($tone === "verify" ? theme.colors.verifyText : theme.colors.textMuted)};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const Value = styled.dd<{ $layout: Layout }>`
  margin: 0;
  font-weight: ${({ theme, $layout }) => ($layout === "rows" ? theme.fontWeights.semibold : theme.fontWeights.medium)};
  text-align: ${({ $layout }) => ($layout === "rows" ? "right" : "left")};
  overflow-wrap: anywhere;
`;
