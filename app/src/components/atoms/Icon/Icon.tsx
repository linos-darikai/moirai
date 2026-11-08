// Icon atom: the app's inline stroke icons (from the design). Decorative by default; give the
// surrounding button an aria-label when the icon is the only content.

import type { ReactElement } from "react";
import { StyledSvg } from "./Icon.styles";

export type IconName =
  | "plus"
  | "chevronLeft"
  | "chevronRight"
  | "play"
  | "pause"
  | "copy"
  | "search"
  | "warning"
  | "check"
  | "checkCircle"
  | "grid"
  | "code"
  | "playCircle"
  | "bars";

type IconProps = {
  name: IconName;
  size?: number;
};

/** The SVG paths for each icon, drawn on a 20 x 20 grid with currentColor. */
function IconPaths({ name }: { name: IconName }): ReactElement {
  switch (name) {
    case "plus":
      return <path d="M10 4v12M4 10h12" />;
    case "chevronLeft":
      return <path d="M12 5L7 10l5 5" />;
    case "chevronRight":
      return <path d="M8 5l5 5-5 5" />;
    case "play":
      return <path d="M6 4l10 6-10 6V4z" fill="currentColor" stroke="none" />;
    case "pause":
      return (
        <>
          <rect x="5" y="4" width="3.5" height="12" rx="1" fill="currentColor" stroke="none" />
          <rect x="11.5" y="4" width="3.5" height="12" rx="1" fill="currentColor" stroke="none" />
        </>
      );
    case "copy":
      return (
        <>
          <rect x="6" y="6" width="10" height="10" rx="2" />
          <path d="M13 6V4.5A1.5 1.5 0 0011.5 3h-7A1.5 1.5 0 003 4.5v7A1.5 1.5 0 004.5 13H6" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13 13l4 4" />
        </>
      );
    case "warning":
      return (
        <>
          <path d="M10 2.5l8 14h-16l8-14z" />
          <path d="M10 8v3.5M10 14h.01" />
        </>
      );
    case "check":
      return <path d="M4.5 10.5l3.5 3.5 7.5-8" />;
    case "checkCircle":
      return (
        <>
          <circle cx="10" cy="10" r="8" />
          <path d="M6.5 10.2l2.3 2.3 4.7-5" />
        </>
      );
    case "grid":
      return (
        <>
          <rect x="3" y="3" width="6" height="6" rx="1.5" />
          <rect x="11" y="3" width="6" height="6" rx="1.5" />
          <rect x="3" y="11" width="6" height="6" rx="1.5" />
          <rect x="11" y="11" width="6" height="6" rx="1.5" />
        </>
      );
    case "code":
      return <path d="M7 5.5l-4 4.5 4 4.5M13 5.5l4 4.5-4 4.5" />;
    case "playCircle":
      return (
        <>
          <circle cx="10" cy="10" r="7.5" />
          <path d="M8.5 7l4.5 3-4.5 3V7z" fill="currentColor" stroke="none" />
        </>
      );
    case "bars":
      return <path d="M5 17v-7M10 17V4M15 17v-5" />;
  }
}

/** One icon, sized in px and coloured by the surrounding text. */
export function Icon({ name, size = 18 }: IconProps): ReactElement {
  return (
    <StyledSvg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <IconPaths name={name} />
    </StyledSvg>
  );
}
