import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { VisuallyHidden } from "./VisuallyHidden";

describe("VisuallyHidden", () => {
  it("still labels its input for screen readers", () => {
    renderWithProviders(
      <>
        <VisuallyHidden htmlFor="find">Find a player</VisuallyHidden>
        <input id="find" />
      </>,
    );

    expect(screen.getByLabelText("Find a player")).toBeInTheDocument();
  });
});
