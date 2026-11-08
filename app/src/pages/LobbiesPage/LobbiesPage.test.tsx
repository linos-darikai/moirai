import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { LobbiesPage } from "./LobbiesPage";

describe("LobbiesPage", () => {
  it("lists the open lobbies", async () => {
    renderWithProviders(<LobbiesPage />);

    expect(await screen.findByRole("link", { name: "View lobby #A41F" })).toHaveAttribute("href", "/lobby/A41F");
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("filters lobbies by win metric", async () => {
    renderWithProviders(<LobbiesPage />);
    await screen.findByRole("link", { name: "View lobby #A41F" });

    await userEvent.click(screen.getByRole("button", { name: "Conquest" }));

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "View lobby #C3D2" })).toBeInTheDocument();
  });
});
