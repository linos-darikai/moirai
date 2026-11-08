import styled from "styled-components";

export const MatchHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => `${theme.space(4)} ${theme.space(6)}`};
  padding: ${({ theme }) => `${theme.space(4)} ${theme.space(5)}`};
  border-radius: ${({ theme }) => theme.radii.card};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.sketchLine};
`;

export const LiveStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.successText};

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.success};
  }
`;

export const Progress = styled.div`
  flex: 1 1 260px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1.5)};
`;

export const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};

  span {
    padding: ${({ theme }) => `${theme.space(1.5)} ${theme.space(3)}`};
    border-radius: ${({ theme }) => theme.radii.lg};
    border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.sketchLine};
    font-family: ${({ theme }) => theme.fonts.hand};
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }
`;

/** Shown from desktop width up (the three-column layout). */
export const DesktopOnly = styled.div`
  display: none;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};

  ${({ theme }) => theme.media.desktop} {
    display: flex;
  }
`;

/** Shown on phones and small tablets only (the tabbed layout under the map). */
export const MobileOnly = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2.5)};
  margin-top: ${({ theme }) => theme.space(3)};

  ${({ theme }) => theme.media.desktop} {
    display: none;
  }
`;

export const TabPanel = styled.div`
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(2)};
  }
`;
