import styled from "styled-components";

/** sm = 240-300 px side column, md = 300-380, lg = 340-420 (summaries), fluid = no max. */
export type RegionSize = "sm" | "md" | "lg" | "fluid";

const sideBasis: Record<RegionSize, { basis: string; max: string }> = {
  sm: { basis: "240px", max: "300px" },
  md: { basis: "300px", max: "380px" },
  lg: { basis: "340px", max: "420px" },
  fluid: { basis: "320px", max: "none" },
};

export const Row = styled.div<{ $align: "start" | "stretch" }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(6)};
  align-items: ${({ $align }) => ($align === "start" ? "flex-start" : "stretch")};
`;

export const Region = styled.div<{ $role: "main" | "side"; $size: RegionSize; $mainMaxWidth?: "map" | "none" }>`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  flex: ${({ $role, $size }) => ($role === "main" ? "999 1 520px" : `1 1 ${sideBasis[$size].basis}`)};
  max-width: ${({ $role, $size, $mainMaxWidth }) => {
    if ($role === "side") return sideBasis[$size].max;
    return $mainMaxWidth === "map" ? "660px" : "none";
  }};
`;
