import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { LogoMark } from "./LogoMark";

describe("LogoMark", () => {
  it("draws three decorative threads", () => {
    const { container } = renderWithProviders(<LogoMark size="large" />);

    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelectorAll("path")).toHaveLength(3);
  });
});
