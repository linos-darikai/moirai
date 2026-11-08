import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("places each slot in the frame", () => {
    renderWithProviders(
      <AppShell header={<header>top</header>} banner="sample data" footer="devnet only">
        page
      </AppShell>,
    );

    expect(screen.getByRole("main")).toHaveTextContent("page");
    expect(screen.getByRole("note")).toHaveTextContent("sample data");
    expect(screen.getByRole("contentinfo")).toHaveTextContent("devnet only");
  });
});
