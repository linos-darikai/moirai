import styled from "styled-components";

/** Jump links to each section. */
export const Contents = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};

  a {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    padding: 0 ${({ theme }) => theme.space(3)};
    border-radius: ${({ theme }) => theme.radii.lg};
    border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.sketchLine};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.hand};
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    text-decoration: none;
  }

  a:hover {
    border-color: ${({ theme }) => theme.colors.highlight};
  }
`;

/** One rules section: a card with readable line length. */
export const Section = styled.section`
  scroll-margin-top: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(6)};
  border-radius: ${({ theme }) => theme.radii.sketchPanel};
  background: transparent;
  border: ${({ theme }) => theme.borderWidths.sketch} solid ${({ theme }) => theme.colors.sketchLine};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};

  & > p {
    max-width: 72ch;
    color: ${({ theme }) => theme.colors.textSoft};
  }
`;

export const Steps = styled.ol`
  margin: 0;
  padding-left: ${({ theme }) => theme.space(5)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textSoft};
`;

export const UnitName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;
