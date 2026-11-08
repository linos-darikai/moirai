import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { LobbyPage } from "./LobbyPage";

function renderLobby() {
  return renderWithProviders(
    <Routes>
      <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
    </Routes>,
    { route: "/lobby/A41F" },
  );
}

describe("LobbyPage", () => {
  it("shows the lobby with an open seat for the player", async () => {
    renderLobby();

    expect(await screen.findByRole("heading", { level: 1, name: "Lobby #A41F" })).toBeInTheDocument();
    expect(screen.getByText("Open seat")).toBeInTheDocument();
  });

  it("walks through join, commit and reveal", async () => {
    renderLobby();

    await userEvent.click(await screen.findByRole("button", { name: "Join and pay 0.5 SOL" }));
    await userEvent.click(screen.getByRole("button", { name: "Commit policy hash" }));
    expect(screen.getByText("Your commitment")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reveal policy" }));

    expect(screen.getByRole("link", { name: "Match started · watch live" })).toHaveAttribute("href", "/match/9C21");
  });
});
