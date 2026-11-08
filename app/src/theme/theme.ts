// The theme object handed to styled-components. Every styled component reads design values from
// `props.theme` (typed in styled.d.ts), which is this object.

import {
  avatarColors,
  breakpoints,
  civColors,
  colors,
  fontSizes,
  fontWeights,
  fonts,
  lineHeights,
  medalColors,
  metricColors,
  radii,
  resourceColors,
  sizes,
  space,
  syntaxColors,
  zIndices,
} from "./tokens";

export const theme = {
  colors,
  resourceColors,
  civColors,
  avatarColors,
  metricColors,
  syntaxColors,
  medalColors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  radii,
  space,
  sizes,
  breakpoints,
  zIndices,
  /** Media query prefixes, used as `${theme.media.desktop} { ... }`. */
  media: {
    tablet: `@media (min-width: ${breakpoints.tablet})`,
    desktop: `@media (min-width: ${breakpoints.desktop})`,
    belowDesktop: `@media (max-width: calc(${breakpoints.desktop} - 1px))`,
  },
} as const;

/** The type of the theme, used to type `props.theme` everywhere. */
export type AppTheme = typeof theme;
