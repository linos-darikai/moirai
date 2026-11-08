import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Breadcrumb } from "./Breadcrumb";

describe("Breadcrumb", () => {
  it("links to parents and marks the current page", () => {
    renderWithProviders(
      <Breadcrumb label="Breadcrumb" items={[{ label: "Lobbies", to: "/" }, { label: "#A41F" }]} />,
    );

    expect(screen.getByRole("link", { name: "Lobbies" })).toHaveAttribute("href", "/");
    expect(screen.getByText("#A41F")).toHaveAttribute("aria-current", "page");
  });
});
