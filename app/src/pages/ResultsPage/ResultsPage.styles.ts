import styled from "styled-components";

export const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(3)};
  padding-top: ${({ theme }) => theme.space(1.5)};

  a:not(:first-child),
  button {
    border-color: ${({ theme }) => theme.colors.winButtonBorder};
  }
`;

export const BoardCaption = styled.p`
  margin: ${({ theme }) => theme.space(2)} 0 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const PoolBar = styled.div`
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
`;

export const PoolSegment = styled.span<{ $percent: number; $tone: "winner" | "crank" }>`
  width: ${({ $percent }) => $percent}%;
  background: ${({ theme, $tone }) => ($tone === "winner" ? theme.civColors[0] : theme.colors.accent)};
`;

export const TxList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2.5)};
  font-size: ${({ theme }) => theme.fontSizes.md};

  li {
    display: flex;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space(3)};
  }
`;
