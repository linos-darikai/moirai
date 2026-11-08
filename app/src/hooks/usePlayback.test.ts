import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MS_PER_TURN, usePlayback } from "./usePlayback";

describe("usePlayback", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("plays on its own from turn 0 and stops at the last turn", () => {
    const { result } = renderHook(() => usePlayback(3));

    act(() => vi.advanceTimersByTime(MS_PER_TURN * 2));
    const midway = result.current.turn;
    act(() => vi.advanceTimersByTime(MS_PER_TURN * 10));

    expect(midway).toBe(2);
    expect(result.current.turn).toBe(3);
    expect(result.current.isPlaying).toBe(false);
  });

  it("keeps playing from wherever the timeline is dragged", () => {
    const { result } = renderHook(() => usePlayback(100));

    act(() => result.current.seek(50));
    act(() => vi.advanceTimersByTime(MS_PER_TURN));

    expect(result.current.turn).toBe(51);
    expect(result.current.isPlaying).toBe(true);
  });

  it("pauses, plays faster, and starts again from 0 when played at the end", () => {
    const { result } = renderHook(() => usePlayback(4));

    act(() => result.current.togglePlay());
    act(() => vi.advanceTimersByTime(MS_PER_TURN * 3));
    const whilePaused = result.current.turn;
    act(() => result.current.setSpeed(4));
    act(() => result.current.togglePlay());
    act(() => vi.advanceTimersByTime(MS_PER_TURN));
    const afterOneSlot = result.current.turn;
    act(() => vi.advanceTimersByTime(MS_PER_TURN * 5));
    act(() => result.current.togglePlay());

    expect(whilePaused).toBe(0);
    expect(afterOneSlot).toBe(4); // 4× speed: four turns in the time of one
    expect(result.current.turn).toBe(0);
    expect(result.current.isPlaying).toBe(true);
  });
});
