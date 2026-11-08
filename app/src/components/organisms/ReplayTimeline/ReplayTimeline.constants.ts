// Playback speeds the replay offers (half speed, 1x, 2x, 4x). In its own file so the component file only
// exports a component (keeps React fast refresh working).
export const REPLAY_SPEEDS = [0.5, 1, 2, 4] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];
