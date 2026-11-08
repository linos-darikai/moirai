import styled from "styled-components";

export const StyledSelect = styled.select`
  width: 100%;
  min-height: ${({ theme }) => theme.sizes.control};
  padding: 0 ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.inset};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: ${({ theme }) => theme.fontSizes.base};
`;
