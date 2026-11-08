import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Text } from "./Text";

describe("Text", () => {
  it("renders its content as the requested element", () => {
    renderWithProviders(<Text as="strong">74 tiles</Text>);

    expect(screen.getByText("74 tiles").tagName).toBe("STRONG");
  });
});
