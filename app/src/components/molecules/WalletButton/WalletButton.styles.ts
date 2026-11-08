import { Link } from "react-router";
import styled, { css } from "styled-components";

const pill = css`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  min-height: ${({ theme }) => theme.sizes.touchTarget};
  border-radius: ${({ theme }) => theme.radii.xl};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.sketchLine};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
`;

export const ConnectButton = styled.button`
  ${pill}
  padding: 0 ${({ theme }) => theme.space(4)};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.handPanel};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.highlight};
  }
`;

export const ProfilePill = styled(Link)`
  ${pill}
  padding: 0 ${({ theme }) => `${theme.space(3.5)} 0 ${theme.space(1.5)}`};
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.highlight};
  }
`;

export const Details = styled.span`
  display: flex;
  flex-direction: column;
  line-height: ${({ theme }) => theme.lineHeights.snug};
`;

export const Address = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Balance = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
