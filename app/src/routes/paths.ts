// Route paths (PLAN.md section 8, plus the lobby and results pages from the design). Components
// use these constants and builders; they never write path strings by hand.

export const paths = {
  home: "/",
  createLobby: "/lobby/new",
  lobby: "/lobby/:lobbyId",
  editor: "/editor",
  simulator: "/simulator",
  match: "/match/:matchId",
  replay: "/match/:matchId/replay",
  results: "/match/:matchId/results",
  leaderboard: "/leaderboard",
  rules: "/rules",
  profile: "/profile/:wallet",
  /** Phase 0 only: wallet + deployed program + WASM connection check. */
  connectionCheck: "/dev/connection",
} as const;

/** Lobby and match ids are shown with a "#" ("#A41F"); URLs use them without it. */
function idForUrl(id: string): string {
  return encodeURIComponent(id.replace(/^#/, ""));
}

/** Turns an id from the URL back into its display form ("A41F" → "#A41F"). */
export function idFromUrl(urlId: string | undefined): string {
  return urlId === undefined ? "" : `#${decodeURIComponent(urlId)}`;
}

export const lobbyPath = (lobbyId: string): string => `/lobby/${idForUrl(lobbyId)}`;
export const matchPath = (matchId: string): string => `/match/${idForUrl(matchId)}`;
export const replayPath = (matchId: string): string => `/match/${idForUrl(matchId)}/replay`;
export const resultsPath = (matchId: string): string => `/match/${idForUrl(matchId)}/results`;
export const profilePath = (wallet: string): string => `/profile/${encodeURIComponent(wallet)}`;

/** Sample ids used by navigation until real matches exist. */
export const SAMPLE_LIVE_MATCH_ID = "#9C21";
export const SAMPLE_FINISHED_MATCH_ID = "#9B4E";
