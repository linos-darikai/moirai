// Video-style playback of a match's turns: plays on its own from the first turn, can be paused,
// stepped and sped up, and the timeline can be dragged while it plays (it keeps playing from
// where you drop it). Used by the replay and the simulator.

import { useCallback, useEffect, useState } from "react";
import type { ReplaySpeed } from "../components/organisms";

/** How long one turn stays on screen at 1× speed. */
export const MS_PER_TURN = 650;

/** The playback state and controls. */
export type Playback = {
  turn: number;
  isPlaying: boolean;
  speed: ReplaySpeed;
  /** Jump to a turn (from the timeline or a step button); playing continues from there. */
  seek: (turn: number) => void;
  /** Play or pause; pressing play at the end starts again from turn 0. */
  togglePlay: () => void;
  setSpeed: (speed: ReplaySpeed) => void;
};

type PlaybackOptions = {
  /** Start playing as soon as there is something to play (default true). */
  autoPlay?: boolean;
  /** When this value changes (a new match was loaded), playback starts again from turn 0. */
  restartKey?: string;
};

/** Plays turns 0..lastTurn like a video. */
export function usePlayback(lastTurn: number, { autoPlay = true, restartKey = "" }: PlaybackOptions = {}): Playback {
  const [turn, setTurn] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);

  // A new match: back to the start, playing again if autoplay is on. Checked while rendering
  // (React's pattern for "reset state when a value changes"), so there's no extra render.
  const [playingKey, setPlayingKey] = useState(restartKey);
  if (playingKey !== restartKey) {
    setPlayingKey(restartKey);
    setTurn(0);
    setIsPlaying(autoPlay);
  }

  // While playing, show the next turn every MS_PER_TURN / speed, and stop at the last turn.
  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setTurn((current) => {
        if (current >= lastTurn) {
          setIsPlaying(false);
          return lastTurn;
        }
        return current + 1;
      });
    }, MS_PER_TURN / speed);
    return () => window.clearInterval(timer);
  }, [isPlaying, speed, lastTurn]);

  const seek = useCallback((target: number) => setTurn(Math.max(0, Math.min(lastTurn, target))), [lastTurn]);
  const togglePlay = useCallback(() => {
    setIsPlaying((playing) => {
      if (!playing && turn >= lastTurn) setTurn(0);
      return !playing;
    });
  }, [turn, lastTurn]);

  return { turn: Math.min(turn, lastTurn), isPlaying, speed, seek, togglePlay, setSpeed };
}
