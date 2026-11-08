import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { SketchLobbyRow } from "./SketchLobbyRow";

const TEXT = {
  metricLabel: "territory",
  feeText: "0.5 SOL",
  seatsText: "3 of 4 seats taken",
  closesText: "closes in 14 min",
  joinLabel: "join →",
  joinAccessibleLabel: "Join lobby #A41F",
};

function renderRow() {
  return renderWithProviders(
    <ul>
      <SketchLobbyRow id="#A41F" metric="territory" joinedCount={3} seatCount={4} lobbyPath="/lobby/A41F" text={TEXT} />
    </ul>,
  );
}

describe("SketchLobbyRow", () => {
  it("describes the seats in words instead of the circles", () => {
    renderRow();

    const seats = screen.getByRole("img", { name: "3 of 4 seats taken" });

    expect(seats.querySelectorAll("svg")).toHaveLength(4);
  });

  it("links to the lobby with a full accessible name", () => {
    renderRow();

    const link = screen.getByRole("link", { name: "Join lobby #A41F" });

    expect(link).toHaveAttribute("href", "/lobby/A41F");
  });
});
