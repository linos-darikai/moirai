import styled from "styled-components";

export const HeaderRow = styled.header`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(4)};
`;

export const Podium = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: ${({ theme }) => theme.space(4)};
  align-items: end;
`;

/** Taller card for higher places (index 0 = 1st). */
const PODIUM_HEIGHT = ["260px", "236px", "220px"] as const;

export const PodiumCard = styled.article<{ $place: number }>`
  min-height: ${({ $place }) => PODIUM_HEIGHT[$place] ?? "220px"};
  padding: ${({ theme }) => theme.space(6)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3.5)};
  border-radius: ${({ theme }) => theme.radii.podium};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme, $place }) => ($place === 0 ? theme.colors.warningBorder : theme.colors.border)};

  a {
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }
`;

export const PodiumTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const RankNumber = styled.span<{ $place: number }>`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSizes.h1};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, $place }) => theme.medalColors[$place] ?? theme.colors.text};
`;

export const Search = styled.div`
  position: relative;
  min-width: 260px;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: ${({ theme }) => theme.space(3)};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  input {
    padding-left: ${({ theme }) => theme.space(9)};
  }
`;

export const BotCell = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2.5)};

  a {
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }
`;

export const RateCell = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};

  & > div {
    width: 64px;
  }
`;
