import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { ConnectionCheckPage } from "./ConnectionCheckPage";

vi.mock("../../lib/engine", () => ({
  getEngineDescription: () => Promise.resolve("civ-core 0.1.0: game rules ready"),
}));

describe("ConnectionCheckPage", () => {
  it("asks for a wallet before showing the program controls", () => {
    renderWithProviders(<ConnectionCheckPage />);

    expect(screen.getByText(/Connect a wallet \(set to devnet\)/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /counter/i })).not.toBeInTheDocument();
  });

  it("shows the description returned by the WASM engine", async () => {
    renderWithProviders(<ConnectionCheckPage />);

    expect(await screen.findByText("civ-core 0.1.0: game rules ready")).toBeInTheDocument();
  });
});
