import { Link } from "react-router";
import styled from "styled-components";

export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
`;

/** Handwritten text in a panel or footer (counts, empty states, the "lang" label). */
export const HandLabel = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DevnetNote = styled(HandLabel)`
  font-size: ${({ theme }) => theme.fontSizes.handPanel};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.highlight};
`;

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  /* The title and its logo sit side by side. */
  h1 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.space(4.5)};
  }
`;

export const Tagline = styled.p`
  margin: ${({ theme }) => theme.space(0.5)} 0 0;
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** The battle sketch and the panels: side by side when there is room, stacked on phones. */
export const Columns = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: ${({ theme }) => theme.space(7)};

  & > * {
    flex: 1 1 440px;
    min-width: 0;
  }
`;

export const PanelGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(5.5)};
  align-content: start;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

/** A grid cell spanning both columns. */
export const WideCell = styled.div`
  grid-column: 1 / -1;
`;

export const PlayRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => `${theme.space(2)} ${theme.space(5)}`};
`;

/** The big hand-drawn "Play" oval. */
export const PlayButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 220px;
  min-height: 92px;
  padding: 0 ${({ theme }) => theme.space(9)};
  border: ${({ theme }) => theme.borderWidths.marker} solid ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radii.playButton};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.handPlay};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1;
  text-decoration: none;
  transition: background 120ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surfaceRaised};
  }
`;

/** The red marker arrow and note pointing at the Play button. */
export const PlayHint = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.h3};
  color: ${({ theme }) => theme.colors.markerRedText};

  path {
    stroke: ${({ theme }) => theme.colors.markerRed};
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const PanelTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(2)};
`;

export const LobbyList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

export const RuleList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1.5)};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  line-height: ${({ theme }) => theme.lineHeights.snug};

  li {
    display: flex;
    gap: ${({ theme }) => theme.space(2.5)};
  }
`;

export const RuleNumber = styled.span`
  color: ${({ theme }) => theme.colors.highlight};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const StrategyList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(0.5)};
`;

export const StrategyLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-height: ${({ theme }) => theme.sizes.touchTarget};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.accentHover};
  }

  & > span:last-child {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }
`;

export const StrategyShape = styled.span`
  flex: 0 0 auto;
`;

export const StrategyName = styled.span`
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.handPanel};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const StrategyBody = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Footer = styled.footer`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;

export const FooterNote = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** The tall tab beside the frame; its label runs top to bottom on wide screens. */
export const LeaderboardTab = styled(Link)`
  flex: 1;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2.5)};
  border: ${({ theme }) => theme.borderWidths.pen} solid ${({ theme }) => theme.colors.sketchLine};
  border-radius: ${({ theme }) => theme.radii.sketchPanel};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.handBrand};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surfaceRaised};
  }

  ${({ theme }) => theme.media.desktop} {
    flex-direction: column;
    min-height: 280px;
    align-self: flex-start;

    span {
      writing-mode: vertical-rl;
      letter-spacing: 0.04em;
    }
  }
`;

export const PlayArrow = styled.svg`
  width: 26px;
  height: 26px;
  fill: none;

  path {
    stroke: ${({ theme }) => theme.colors.highlight};
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
