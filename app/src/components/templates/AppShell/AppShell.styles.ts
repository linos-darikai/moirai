import styled from "styled-components";

export const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
`;

export const Banner = styled.p`
  margin: 0;
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)} 0`};
  text-align: center;
  /* A handwritten note in highlighter, not a coloured strip. */
  font-family: ${({ theme }) => theme.fonts.hand};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: ${({ theme }) => theme.lineHeights.snug};
  color: ${({ theme }) => theme.colors.highlight};
`;

export const Main = styled.main`
  flex: 1;
`;

export const Footer = styled.footer`
  width: 100%;
  max-width: ${({ theme }) => theme.sizes.pageNarrow};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(4)} ${theme.space(8)}`};
  border-top: ${({ theme }) => theme.borderWidths.thin} dashed ${({ theme }) => theme.colors.border};
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  ${({ theme }) => theme.media.desktop} {
    padding: ${({ theme }) => `${theme.space(5)} ${theme.space(8)} ${theme.space(8)}`};
  }
`;
