import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { QueryStatus } from "./QueryStatus";

describe("QueryStatus", () => {
  it("announces loading politely and errors as alerts", () => {
    renderWithProviders(
      <>
        <QueryStatus kind="loading" text="Loading…" />
        <QueryStatus kind="error" text="Something went wrong" />
      </>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
