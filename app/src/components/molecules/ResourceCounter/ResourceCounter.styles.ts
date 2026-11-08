import styled from "styled-components";

export const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(2)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
`;
