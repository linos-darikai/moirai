import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Swatch } from "./Swatch";

describe("Swatch", () => {
  it("is hidden from screen readers because it only decorates a name", () => {
    const { container } = renderWithProviders(<Swatch color={{ civ: 2 }} />);

    expect(container.querySelector("span")).toHaveAttribute("aria-hidden", "true");
  });
});
