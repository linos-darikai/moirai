import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { SketchMark } from "./SketchMark";

describe("SketchMark", () => {
  it("draws a deposit as one decorative pencil circle", () => {
    const { container } = renderWithProviders(<SketchMark kind="deposit" tone={{ resource: "gold" }} />);

    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg?.querySelectorAll("path")).toHaveLength(1);
  });

  it("draws a city as a circle with a spiral inside", () => {
    const { container } = renderWithProviders(<SketchMark kind="city" tone={{ civ: 2 }} />);

    expect(container.querySelector(".spiral")).not.toBeNull();
  });

  it("fills a taken seat and leaves an open seat empty", () => {
    const taken = renderWithProviders(<SketchMark kind="seatTaken" tone="chalk" />);
    const open = renderWithProviders(<SketchMark kind="seatOpen" tone="chalk" />);

    const takenFill = taken.container.querySelector("path")?.getAttribute("fill");
    const openFill = open.container.querySelector("path")?.getAttribute("fill");

    expect(takenFill).toBe("currentColor");
    expect(openFill).toBe("none");
  });
});
