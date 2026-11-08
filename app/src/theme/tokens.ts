// Design tokens: every colour, size and font the app uses. Values come from the "Moirai sketchbook
// kit" artboard (claude.ai design canvas "Moirai: app UI designs", hand-drawn version): pure black
// paper, chalk-white lines, Caveat handwriting for titles and slightly uneven "sketched" corners.
// Components read these through `props.theme`; they never hard-code colours or pixel values.

/** Base palette. Names say what a colour is for, not what it looks like. */
export const colors = {
  bg: "#000000",
  surface: "#0B0B0B",
  surfaceRaised: "#161616",
  inset: "#070707",
  border: "#3A3A3A",
  borderStrong: "#5A5A5A",
  navBorder: "#2E2E2E",
  text: "#F4F4F0",
  textSoft: "#D8D8D8",
  textFeed: "#D8D8D8",
  textMuted: "#B5B5B5",
  textSubtle: "#8A8A8A",
  accent: "#5B9BFF",
  accentHover: "#8DBBFF",
  onAccent: "#000000",
  disabledBg: "#2E2E2E",
  disabledText: "#8A93A8",
  success: "#44D68F",
  successText: "#7BE3AE",
  successBg: "#163626",
  warning: "#F2C14E",
  warningText: "#F5D88A",
  warningBg: "#241D0C",
  warningBorder: "#5C4A1E",
  warningLine: "#2A2210",
  danger: "#FF7A66",
  dangerText: "#FF9C8F",
  dangerBg: "#3A1A16",
  neutralChipBg: "#1C1C1C",
  actionBg: "#12302B",
  actionText: "#7BE3D3",
  winBg: "#12302B",
  winBorder: "#23574F",
  winTextSoft: "#C2EEE6",
  winButtonBorder: "#3F7D73",
  verifyBg: "#10261C",
  verifyBorder: "#23573D",
  verifyText: "#A9D9C0",
  /** Chalk-white pen line: the hand-drawn borders on the home page and around the map. */
  sketchLine: "#E8E8E2",
  /** Faint grid line between map tiles. */
  mapGridLine: "#1C1C1C",
  /** Highlighter yellow: numbered steps, "devnet" note, contested tiles, "+1 tile!". */
  highlight: "#F5C542",
  /** Red marker pen: the arrow and note next to the Play button on the home page. */
  markerRed: "#FF453A",
  markerRedText: "#FF6B60",
} as const;

/** Resource colours: Food = blue, Ore = red, Gold = gold (CLAUDE.md section 8). */
export const resourceColors = {
  food: "#5AA9FF",
  ore: "#FF7A66",
  gold: "#F2C14E",
} as const;

/** One colour per civ, by join order (civ 0..3). */
export const civColors = ["#34D1BF", "#FF9F43", "#B794FF", "#FF7EB6"] as const;

/** Player avatar colours on the leaderboard (the 4 civ colours first, then 6 more). */
export const avatarColors = [
  "#34D1BF",
  "#FF9F43",
  "#B794FF",
  "#FF7EB6",
  "#F2C14E",
  "#5AA9FF",
  "#7BE3AE",
  "#FF7A66",
  "#C7B0FF",
  "#9BD1FF",
] as const;

/** Colour of each win metric's badge. */
export const metricColors = {
  territory: "#34D1BF",
  wealth: "#F2C14E",
  conquest: "#FF7A66",
  score: "#B794FF",
} as const;

/** Policy YAML syntax highlighting. */
export const syntaxColors = {
  plain: "#F4F4F0",
  key: "#5B9BFF",
  number: "#F2C14E",
  call: "#7BE3D3",
  keyword: "#C7B0FF",
  operator: "#FFB37A",
  punctuation: "#8A8A8A",
} as const;

/** Podium medal colours for ranks 1, 2 and 3. */
export const medalColors = ["#F2C14E", "#D8D8D8", "#E0A070"] as const;

/** Font stacks. Hand = handwritten page and section titles, display = numbers and names,
 *  body = text, mono = hashes, addresses, code. */
export const fonts = {
  hand: "'Caveat', 'Comic Sans MS', cursive",
  display: "'Space Grotesk', Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

/** Font sizes in px (type scale from the design kit). */
export const fontSizes = {
  xs: "12px",
  sm: "13px",
  md: "14px",
  base: "15px",
  lg: "18px",
  xl: "20px",
  xxl: "22px",
  h3: "26px",
  h2: "28px",
  h1: "40px",
  hero: "52px",
  display: "56px",
  /** Handwritten sizes (Caveat looks smaller than Inter at the same px, so these run larger). */
  handPanel: "24px",
  handBrand: "34px",
  handSection: "27px",
  handTitle: "38px",
  handPage: "54px",
  handPlay: "64px",
  handWin: "70px",
  handHero: "104px",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeights = {
  tight: 1.05,
  snug: 1.2,
  base: 1.5,
  code: 1.75,
} as const;

/**
 * Corner radii. Most are "sketched": four slightly different corners (CSS lets each corner have
 * its own horizontal / vertical radius), so boxes look drawn by hand instead of machine-perfect.
 */
export const radii = {
  xs: "3px",
  sm: "6px",
  md: "10px 3px 12px 4px / 4px 12px 3px 10px",
  lg: "12px 4px 14px 6px / 6px 14px 4px 12px",
  xl: "14px 6px 16px 8px / 8px 16px 6px 14px",
  xxl: "16px 8px 18px 10px / 10px 18px 8px 16px",
  card: "18px 10px 20px 12px / 12px 20px 10px 18px",
  podium: "20px 12px 22px 14px / 14px 22px 12px 20px",
  hero: "22px 14px 24px 16px / 16px 24px 14px 22px",
  board: "22px 8px 26px 10px / 10px 26px 8px 22px",
  sketchPanel: "26px 10px 30px 12px / 12px 30px 10px 26px",
  sketchPage: "34px 12px 40px 14px / 14px 40px 12px 34px",
  playButton: "120px 60px 110px 70px / 60px 90px 50px 80px",
  tile: "3px 5px 2px 4px",
  pill: "999px",
} as const;

/** Line widths. Sketched panels use a slightly heavier pen than plain dividers. */
export const borderWidths = {
  thin: "1px",
  sketch: "1.5px",
  pen: "2px",
  marker: "3px",
} as const;

/** Spacing in multiples of 4 px: `space(4)` is "16px". */
export function space(steps: number): string {
  return `${steps * 4}px`;
}

/** Fixed component sizes in px. */
export const sizes = {
  touchTarget: "44px",
  control: "48px",
  controlLarge: "52px",
  navHeight: "72px",
  pageNarrow: "1280px",
  pageMedium: "1360px",
  pageWide: "1440px",
} as const;

/** Screen widths where layouts change (min-width media queries). */
export const breakpoints = {
  tablet: "640px",
  desktop: "900px",
} as const;

export const zIndices = {
  nav: 10,
  overlay: 20,
} as const;

/** Adds a 2-digit hex alpha to a #RRGGBB colour, e.g. a civ colour at 26% for owned map tiles. */
export function withAlpha(hexColor: string, alphaHex: string): string {
  return `${hexColor}${alphaHex}`;
}

/** Alpha used to tint tiles owned by a civ (0x30 is about 19% opacity, light like a pencil wash). */
export const OWNED_TILE_ALPHA = "30";
