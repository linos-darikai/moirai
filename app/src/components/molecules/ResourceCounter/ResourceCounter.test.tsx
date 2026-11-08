import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { ResourceCounter } from "./ResourceCounter";

describe("ResourceCounter", () => {
  it("shows the amount", () => {
    renderWithProviders(<ResourceCounter resource="food" label="62 food" />);

    expect(screen.getByText("62 food")).toBeInTheDocument();
  });
});
