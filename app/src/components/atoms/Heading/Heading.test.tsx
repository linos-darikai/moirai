import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Heading } from "./Heading";

describe("Heading", () => {
  it("renders the requested heading level", () => {
    renderWithProviders(<Heading level={2}>Open lobbies</Heading>);

    expect(screen.getByRole("heading", { level: 2, name: "Open lobbies" })).toBeInTheDocument();
  });
});
