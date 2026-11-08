import styled from "styled-components";

export const StyledLogoMark = styled.svg`
  flex: 0 0 auto;

  .food {
    stroke: ${({ theme }) => theme.resourceColors.food};
  }
  .gold {
    stroke: ${({ theme }) => theme.resourceColors.gold};
  }
  .ore {
    stroke: ${({ theme }) => theme.resourceColors.ore};
  }
`;
