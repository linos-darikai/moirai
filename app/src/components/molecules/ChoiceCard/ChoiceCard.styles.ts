import styled from "styled-components";

export const Card = styled.button<{ $isSelected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1.5)};
  width: 100%;
  padding: ${({ theme }) => theme.space(4)};
  text-align: left;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radii.xl};
  border: 2px solid ${({ theme, $isSelected }) => ($isSelected ? theme.colors.accent : theme.colors.border)};
  background: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.surfaceRaised : theme.colors.inset)};
`;

export const Title = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Body = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;
