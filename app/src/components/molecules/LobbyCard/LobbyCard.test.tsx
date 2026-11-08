import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { LobbyCard } from "./LobbyCard";

describe("LobbyCard", () => {
  it("shows the fee, seats and a link to the lobby", () => {
    renderWithProviders(
      <LobbyCard
        id="#A41F"
        metric="territory"
        turns={60}
        joinedCount={3}
        seatCount={4}
        lobbyPath="/lobby/A41F"
        text={{
          metricLabel: "Territory",
          feeText: "0.5 SOL",
          poolText: "entry · pool 1.5 SOL",
          turnsLabel: "Turns",
          payoutLabel: "Payout",
          payoutText: "Winner takes all",
          seatsLabel: "Seats",
          seatsText: "3 / 4",
          closesLabel: "Join closes",
          closesText: "14 minutes",
          viewLabel: "View lobby #A41F",
        }}
      />,
    );

    expect(screen.getByText("0.5 SOL")).toBeInTheDocument();
    expect(screen.getByText("3 / 4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View lobby #A41F" })).toHaveAttribute("href", "/lobby/A41F");
  });
});
