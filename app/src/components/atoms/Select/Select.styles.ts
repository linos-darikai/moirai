import styled from "styled-components";

export const StyledSelect = styled.select`
  width: 100%;
  min-height: ${({ theme }) => theme.sizes.control};
  padding: 0 ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.sketchLine};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => `calc(${theme.fontSizes.base} * ${theme.handScale})`};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;
