// SketchMark atom: small hand-drawn marks used on map tiles, in legends and in lobby rows: a pencil
// circle for a resource deposit, a spiral inside a circle for a city, and filled or empty circles
// for lobby seats. Decorative (aria-hidden); the map's
// text summary describes the tiles for screen readers.

import type { ReactElement } from "react";
import { StyledSketchMark } from "./SketchMark.styles";
import type { SketchMarkTone } from "./SketchMark.styles";

/** deposit = open pencil circle, city = circle with a spiral, citySite = dashed circle,
 *  seatTaken / seatOpen = a filled or empty circle for one lobby seat. */
export type SketchMarkKind = "deposit" | "city" | "citySite" | "seatTaken" | "seatOpen";

type SketchMarkProps = {
  kind: SketchMarkKind;
  /** Which theme colour to draw in (a resource, a civ, or muted). */
  tone: SketchMarkTone;
};

/** An open circle drawn in one stroke, overlapping where the pen started. */
const PENCIL_CIRCLE = "M10.4 3.4C14.8 3.2 17 6.6 16.7 10.3C16.4 14.6 13 16.9 9.5 16.7C5.6 16.5 3.2 13.3 3.4 9.7C3.6 5.9 6.6 3.5 11.2 3.9";
const CITY_CIRCLE = "M10 2.6C14.4 2.3 17.6 5.6 17.4 10.1C17.2 14.7 13.7 17.6 9.7 17.4C5.4 17.2 2.5 13.9 2.7 9.8C2.9 5.6 6 2.8 10.8 3.1";
const CITY_SPIRAL = "M10 10C11.4 9.1 12.3 11.1 10.6 12C8.3 13.1 7.1 9.8 9.1 8.2C11.8 6.2 14.5 8.9 13.9 11.9C13.1 15.1 8.8 15.7 6.8 13.2C4.6 10.4 6.2 5.9 10.2 5.6";

/** One hand-drawn mark, filling its parent. */
export function SketchMark({ kind, tone }: SketchMarkProps): ReactElement {
  if (kind === "deposit") {
    return (
      <StyledSketchMark viewBox="0 0 20 20" aria-hidden="true" $tone={tone}>
        <path d={PENCIL_CIRCLE} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      </StyledSketchMark>
    );
  }
  if (kind === "seatTaken" || kind === "seatOpen") {
    return (
      <StyledSketchMark viewBox="0 0 20 20" aria-hidden="true" $tone={tone}>
        <path d={PENCIL_CIRCLE} fill={kind === "seatTaken" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </StyledSketchMark>
    );
  }
  if (kind === "citySite") {
    return (
      <StyledSketchMark viewBox="0 0 20 20" aria-hidden="true" $tone={tone}>
        <path d={CITY_CIRCLE} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2.4 2.4" />
      </StyledSketchMark>
    );
  }
  return (
    <StyledSketchMark viewBox="0 0 20 20" aria-hidden="true" $tone={tone}>
      <path d={CITY_CIRCLE} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="spiral" d={CITY_SPIRAL} fill="none" strokeWidth="1.5" strokeLinecap="round" />
    </StyledSketchMark>
  );
}
