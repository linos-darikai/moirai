import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Columns } from "./Columns";

describe("Columns", () => {
  it("renders start, main and end in reading order", () => {
    renderWithProviders(<Columns start={<p>civs</p>} main={<p>map</p>} end={<p>feed</p>} />);

    const texts = screen.getAllByRole("paragraph").map((element) => element.textContent);

    expect(texts).toEqual(["civs", "map", "feed"]);
  });
});
