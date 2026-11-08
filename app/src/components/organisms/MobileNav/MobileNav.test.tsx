import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { MobileNav } from "./MobileNav";

describe("MobileNav", () => {
  it("has the four phone tabs and marks the current page", () => {
    renderWithProviders(<MobileNav />, { route: "/editor" });

    // The test window is desktop-sized, where this bar is hidden by design, so include hidden links.
    expect(screen.getAllByRole("link", { hidden: true })).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Policies", hidden: true })).toHaveAttribute("aria-current", "page");
  });
});
