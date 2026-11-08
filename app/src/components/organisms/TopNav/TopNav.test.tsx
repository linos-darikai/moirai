import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { TopNav } from "./TopNav";

describe("TopNav", () => {
  it("links every main page and marks the current one", () => {
    renderWithProviders(<TopNav />, { route: "/leaderboard" });

    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(nav).toHaveTextContent("LobbiesPoliciesSimulatorMatchesLeaderboardRules");
    expect(screen.getByRole("link", { name: "Leaderboard" })).toHaveAttribute("aria-current", "page");
  });

  it("offers to connect a wallet and to switch language", () => {
    renderWithProviders(<TopNav />);

    expect(screen.getByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toHaveValue("en");
  });
});
