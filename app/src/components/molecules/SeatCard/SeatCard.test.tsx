import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { SeatCard } from "./SeatCard";

describe("SeatCard", () => {
  it("shows the bot, its status chips and its hash", () => {
    renderWithProviders(
      <SeatCard
        name="red-raider"
        subtitle="Gw4N…c81Q"
        color={{ civ: 1 }}
        chips={[
          { label: "Joined", tone: "positive" },
          { label: "Committed", tone: "positive" },
        ]}
        hashText="hash 41aa…07c2"
      />,
    );

    const seat = screen.getByRole("article");

    expect(seat).toHaveTextContent("red-raider");
    expect(seat).toHaveTextContent("Committed");
    expect(seat).toHaveTextContent("hash 41aa…07c2");
  });
});
