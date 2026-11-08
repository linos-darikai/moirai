import styled from "styled-components";

export const Scroll = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table<{ $minWidth: number }>`
  width: 100%;
  min-width: ${({ $minWidth }) => $minWidth}px;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const HeaderCell = styled.th<{ $isEnd: boolean }>`
  padding: ${({ theme }) => `${theme.space(2.5)} ${theme.space(2)}`};
  text-align: ${({ $isEnd }) => ($isEnd ? "right" : "left")};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Row = styled.tr<{ $isHighlighted: boolean }>`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, $isHighlighted }) => ($isHighlighted ? theme.colors.surfaceRaised : "transparent")};
`;

export const Cell = styled.td<{ $isEnd: boolean; $density: "compact" | "comfortable" }>`
  padding: ${({ theme, $density }) => `${theme.space($density === "compact" ? 3 : 3.5)} ${theme.space(2)}`};
  text-align: ${({ $isEnd }) => ($isEnd ? "right" : "left")};
  vertical-align: middle;
`;
