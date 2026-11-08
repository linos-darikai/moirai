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
  /* A dashed pencil line under the bar, like the dividers inside the home page's panels. */
  border-bottom: ${({ theme }) => theme.borderWidths.sketch} dashed ${({ theme }) => theme.colors.navBorder};

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
`;

export const BrandName = styled.span`
  font-family: ${({ theme }) => theme.fonts.hand};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.handBrand};
  line-height: 1;
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
  padding: 0 ${({ theme }) => theme.space(3)};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.handPanel};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  /* NavLink sets aria-current="page" on the active link: underline it with the highlighter. */
  &[aria-current="page"] {
    color: ${({ theme }) => theme.colors.text};
    text-decoration: underline wavy ${({ theme }) => theme.colors.highlight};
    text-decoration-thickness: ${({ theme }) => theme.borderWidths.sketch};
    text-underline-offset: ${({ theme }) => theme.space(1.5)};
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
  /* Written in highlighter, like "devnet · test SOL only" on the home page. */
  color: ${({ theme }) => theme.colors.highlight};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;
