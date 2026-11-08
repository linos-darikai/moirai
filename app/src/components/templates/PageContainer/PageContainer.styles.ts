import styled from "styled-components";

export type PageWidth = "narrow" | "medium" | "wide";
export type PageGap = "md" | "lg" | "xl";

const widthToken = { narrow: "pageNarrow", medium: "pageMedium", wide: "pageWide" } as const;
const gapSteps: Record<PageGap, number> = { md: 5, lg: 7, xl: 12 };

export const Container = styled.div<{ $width: PageWidth; $gap: PageGap }>`
  /* Each page is one sketchbook page: a big chalk frame, like the home page's. */
  width: calc(100% - ${({ theme }) => theme.space(4)});
  max-width: ${({ theme, $width }) => theme.sizes[widthToken[$width]]};
  margin: ${({ theme }) => `${theme.space(4)} auto ${theme.space(10)}`};
  padding: ${({ theme }) => `${theme.space(6)} ${theme.space(4)} ${theme.space(10)}`};
  border: ${({ theme }) => theme.borderWidths.pen} solid ${({ theme }) => theme.colors.sketchLine};
  border-radius: ${({ theme }) => theme.radii.sketchPage};
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $gap }) => theme.space(gapSteps[$gap])};

  ${({ theme }) => theme.media.desktop} {
    width: calc(100% - ${({ theme }) => theme.space(12)});
    margin: ${({ theme }) => `${theme.space(7)} auto ${theme.space(10)}`};
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(10)} ${theme.space(12)}`};
  }
`;
