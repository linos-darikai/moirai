import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { RouteErrorPage } from "./RouteErrorPage";

describe("RouteErrorPage", () => {
  it("offers a way back to the lobbies", () => {
    renderWithProviders(<RouteErrorPage />);

    expect(screen.getByRole("link", { name: "Back to lobbies" })).toHaveAttribute("href", "/");
  });
});
