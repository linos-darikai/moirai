import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ProfilePage } from "./ProfilePage";

describe("ProfilePage", () => {
  it("shows the player's stats and match history", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/profile/:wallet" element={<ProfilePage />} />
      </Routes>,
      { route: "/profile/7xKqF00000000000000000003fPa" },
    );

    expect(await screen.findByRole("heading", { level: 1, name: "iron-turtle" })).toBeInTheDocument();
    expect(screen.getByText("Playing since October 2026 · Rank #1 all time")).toBeInTheDocument();
    expect(screen.getAllByText("1st of 4")).toHaveLength(3);
    expect(screen.getByRole("img", { name: /Elo went from 1,452 to 1,684/ })).toBeInTheDocument();
  });
});
