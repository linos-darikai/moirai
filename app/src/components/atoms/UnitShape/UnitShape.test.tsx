import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { UnitShape } from "./UnitShape";

describe("UnitShape", () => {
  it("renders a decorative hand-drawn shape", () => {
    const { container } = renderWithProviders(<UnitShape kind="elite" civ={0} />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
