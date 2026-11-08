import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { UnitShape } from "./UnitShape";

describe("UnitShape", () => {
  it("renders a decorative shape", () => {
    const { container } = renderWithProviders(<UnitShape kind="elite" civ={0} />);

    expect(container.querySelector("span")).toHaveAttribute("aria-hidden", "true");
  });
});
