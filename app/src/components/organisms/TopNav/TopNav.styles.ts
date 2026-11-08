import { Link, NavLink } from "react-router";
import styled from "styled-components";

export const Bar = styled.header`
  min-height: ${({ theme }) => theme.sizes.navHeight};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => `${theme.space(3)} ${theme.space(7)}`};
  background: ${({ theme }) => theme.colors.bg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.navBorder};

  ${({ theme }) => theme.media.desktop} {
    padding: ${({ theme }) => `${theme.space(3)} ${theme.space(8)}`};
  }
`;

export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  min-height: ${({ theme }) => theme.sizes.touchTarget};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  .thread-food {
    color: ${({ theme }) => theme.resourceColors.food};
  }
  .thread-gold {
    color: ${({ theme }) => theme.resourceColors.gold};
  }
  .thread-ore {
    color: ${({ theme }) => theme.resourceColors.ore};
  }
`;

export const BrandName = styled.span`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.xxl};
`;

/** Hidden on phones, where MobileNav shows the same links at the bottom. */
export const NavLinks = styled.nav`
  display: none;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};

  ${({ theme }) => theme.media.desktop} {
    display: flex;
  }
`;

export const NavItem = styled(NavLink)`
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.space(3.5)};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  /* NavLink sets aria-current="page" on the active link. */
  &[aria-current="page"] {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surfaceRaised};
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  margin-left: auto;
`;

export const NetworkBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 32px;
  padding: 0 ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  background: ${({ theme }) => theme.colors.warningBg};
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
`;
