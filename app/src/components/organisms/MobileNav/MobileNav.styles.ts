import { NavLink } from "react-router";
import styled from "styled-components";

export const Bar = styled.nav`
  position: sticky;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndices.nav};
  display: flex;
  padding: ${({ theme }) => `${theme.space(1.5)} ${theme.space(2)} ${theme.space(3.5)}`};
  border-top: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.inset};

  ${({ theme }) => theme.media.desktop} {
    display: none;
  }
`;

export const Tab = styled(NavLink)`
  flex: 1;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;

  &[aria-current="page"] {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`;
