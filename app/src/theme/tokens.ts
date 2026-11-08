// Design tokens: every colour, size and font the app uses. Values come from the "Moirai design
// kit" artboard (claude.ai design canvas "Moirai: app UI designs"). Components read these through
// `props.theme`; they never hard-code colours or pixel values.

/** Base palette. Names say what a colour is for, not what it looks like. */
export const colors = {
  bg: "#0B0D12",
  surface: "#141822",
  surfaceRaised: "#1B2030",
  inset: "#0F131C",
  border: "#262D3D",
  borderStrong: "#343C50",
  navBorder: "#232937",
  text: "#EEF0F5",
  textSoft: "#C9CFDC",
  textFeed: "#D5DAE5",
  textMuted: "#A3ACBF",
  textSubtle: "#6F7890",
  accent: "#8FA8FF",
  accentHover: "#B7C6FF",
  onAccent: "#0B0D12",
  disabledBg: "#262D3D",
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
  neutralChipBg: "#1F2433",
  mapEmpty: "#161B27",
  actionBg: "#12302B",
  actionText: "#7BE3D3",
  winBg: "#12302B",
  winBorder: "#23574F",
  winTextSoft: "#C2EEE6",
  winButtonBorder: "#3F7D73",
  verifyBg: "#10261C",
  verifyBorder: "#23573D",
  verifyText: "#A9D9C0",
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
  plain: "#EEF0F5",
  key: "#8FA8FF",
  number: "#F2C14E",
  call: "#7BE3D3",
  keyword: "#C7B0FF",
  operator: "#FFB37A",
  punctuation: "#6F7890",
} as const;

/** Podium medal colours for ranks 1, 2 and 3. */
export const medalColors = ["#F2C14E", "#C9CFDC", "#E0A070"] as const;

/** Font stacks. Display = headings and numbers, body = text, mono = hashes, addresses, code. */
export const fonts = {
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

/** Corner radii in px. */
export const radii = {
  xs: "3px",
  sm: "6px",
  md: "8px",
  lg: "10px",
  xl: "12px",
  xxl: "14px",
  card: "16px",
  podium: "18px",
  hero: "20px",
  pill: "999px",
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

/** Alpha used to tint tiles owned by a civ (0x42 is about 26% opacity). */
export const OWNED_TILE_ALPHA = "42";
