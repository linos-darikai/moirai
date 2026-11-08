import styled from "styled-components";

export type PageWidth = "narrow" | "medium" | "wide";
export type PageGap = "md" | "lg" | "xl";

const widthToken = { narrow: "pageNarrow", medium: "pageMedium", wide: "pageWide" } as const;
const gapSteps: Record<PageGap, number> = { md: 5, lg: 7, xl: 12 };

export const Container = styled.div<{ $width: PageWidth; $gap: PageGap }>`
  width: 100%;
  max-width: ${({ theme, $width }) => theme.sizes[widthToken[$width]]};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.space(6)} ${theme.space(4)} ${theme.space(12)}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $gap }) => theme.space(gapSteps[$gap])};

  ${({ theme }) => theme.media.desktop} {
    padding: ${({ theme }) => `${theme.space(8)} ${theme.space(8)} ${theme.space(16)}`};
  }
`;
