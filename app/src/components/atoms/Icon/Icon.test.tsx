import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders a decorative svg", () => {
    const { container } = renderWithProviders(<Icon name="play" />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
