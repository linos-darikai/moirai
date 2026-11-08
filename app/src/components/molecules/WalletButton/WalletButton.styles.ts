import { Link } from "react-router";
import styled, { css } from "styled-components";

const pill = css`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  min-height: ${({ theme }) => theme.sizes.touchTarget};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
`;

export const ConnectButton = styled.button`
  ${pill}
  padding: 0 ${({ theme }) => theme.space(4)};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;

export const ProfilePill = styled(Link)`
  ${pill}
  padding: 0 ${({ theme }) => `${theme.space(3.5)} 0 ${theme.space(1.5)}`};
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: ${({ theme }) => theme.colors.accent};
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
