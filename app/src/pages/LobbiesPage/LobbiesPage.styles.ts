import styled from "styled-components";

export const Hero = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${({ theme }) => theme.space(5)};
  height: 100%;
`;

export const Eyebrow = styled.span`
  align-self: flex-start;
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(3)};
  padding-top: ${({ theme }) => theme.space(2)};
`;

export const LobbyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: ${({ theme }) => theme.space(4)};
  margin-top: ${({ theme }) => theme.space(5)};
`;

export const LiveList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
`;

export const LiveItem = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => `${theme.space(3.5)} ${theme.space(4)}`};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surfaceRaised};
`;

/** The "x leads" text takes the free space in a live-match row. */
export const LiveLeader = styled.span`
  flex: 1 1 200px;
  min-width: 0;
`;

export const TopList = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2.5)};
`;
