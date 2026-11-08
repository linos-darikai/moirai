import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { LeaderboardPage } from "./LeaderboardPage";

describe("LeaderboardPage", () => {
  it("shows the podium and every ranked player", async () => {
    renderWithProviders(<LeaderboardPage />);

    await screen.findByText("long-winter");

    expect(screen.getAllByRole("row")).toHaveLength(11);
    expect(screen.getByRole("region", { name: "Top three" })).toHaveTextContent("#1iron-turtle");
  });

  it("filters the rankings and says when nothing matches", async () => {
    renderWithProviders(<LeaderboardPage />);
    const search = await screen.findByLabelText("Find a player or bot");

    await userEvent.type(search, "moth");
    expect(screen.getAllByRole("row")).toHaveLength(2);

    await userEvent.type(search, "zzz");
    expect(screen.getByText("No player or bot matches “mothzzz”.")).toBeInTheDocument();
  });
});
