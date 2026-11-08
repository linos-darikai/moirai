// LogoMark atom: Moirai's logo, three wavy threads (the three Fates) in the resource colours:
// food blue, gold, ore red. Small in the top bar, large next to the home page title.

import type { ReactElement } from "react";
import { StyledLogoMark } from "./LogoMark.styles";

type LogoMarkProps = {
  /** small = 28 px (top bar), large = 92 px wide (home page title). */
  size: "small" | "large";
};

/** The three-threads logo. Decorative: always sits next to the word "Moirai". */
export function LogoMark({ size }: LogoMarkProps): ReactElement {
  if (size === "small") {
    return (
      <StyledLogoMark width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path className="food" d="M3 8c4-4 8 4 11 0s7-4 11 0" strokeWidth="2.2" strokeLinecap="round" />
        <path className="gold" d="M3 14c4-4 8 4 11 0s7-4 11 0" strokeWidth="2.2" strokeLinecap="round" />
        <path className="ore" d="M3 20c4-4 8 4 11 0s7-4 11 0" strokeWidth="2.2" strokeLinecap="round" />
      </StyledLogoMark>
    );
  }
  return (
    <StyledLogoMark width="92" height="78" viewBox="0 0 92 78" fill="none" aria-hidden="true">
      <path className="food" d="M6 18C20 4 32 30 46 16S70 4 86 15" strokeWidth="4" strokeLinecap="round" />
      <path className="gold" d="M8 40C22 27 33 52 47 38S72 27 87 37" strokeWidth="4" strokeLinecap="round" />
      <path className="ore" d="M7 62C21 49 33 74 47 60S71 49 86 60" strokeWidth="4" strokeLinecap="round" />
    </StyledLogoMark>
  );
}
