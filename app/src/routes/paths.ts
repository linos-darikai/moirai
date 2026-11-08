// Route path constants. Components import these instead of writing path strings by hand.
// The full route list is in PLAN.md section 8; routes are added here as their pages are built.

export const paths = {
  home: "/",
  /** Phase 0 only: wallet + deployed program + WASM connection check. */
  connectionCheck: "/dev/connection",
} as const;
