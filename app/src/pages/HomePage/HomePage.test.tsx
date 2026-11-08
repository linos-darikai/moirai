import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows the game title as the main heading", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent("moirai");
  });
});
