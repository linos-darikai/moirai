import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { ReplayTimeline } from "./ReplayTimeline";

const moments = [{ turn: 21, id: "firstBattle", tone: "ore" }] as const;

function renderTimeline(onTurnChange = vi.fn(), onTogglePlay = vi.fn()) {
  renderWithProviders(
    <ReplayTimeline
      turn={20}
      totalTurns={60}
      moments={moments}
      currentMoment={null}
      isPlaying={false}
      speed={1}
      onTurnChange={onTurnChange}
      onTogglePlay={onTogglePlay}
      onSpeedChange={vi.fn()}
    />,
  );
  return { onTurnChange, onTogglePlay };
}

describe("ReplayTimeline", () => {
  it("steps forward and jumps to a key moment", async () => {
    const { onTurnChange } = renderTimeline();

    await userEvent.click(screen.getByRole("button", { name: "Next turn" }));
    await userEvent.click(screen.getByRole("button", { name: "Jump to turn 21: First battle on the north border" }));

    expect(onTurnChange).toHaveBeenNthCalledWith(1, 21);
    expect(onTurnChange).toHaveBeenNthCalledWith(2, 21);
  });

  it("toggles playback", async () => {
    const { onTogglePlay } = renderTimeline();

    await userEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(onTogglePlay).toHaveBeenCalledOnce();
  });
});
