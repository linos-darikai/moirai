import styled from "styled-components";

export const Identity = styled.div<{ $isHighlighted: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 132px;
  padding: ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  border: 1px solid ${({ theme, $isHighlighted }) => ($isHighlighted ? theme.colors.accent : theme.colors.border)};
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-width: 0;
`;

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1.5)};
`;
