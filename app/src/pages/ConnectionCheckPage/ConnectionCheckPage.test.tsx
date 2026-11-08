import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConnectionCheckPage } from "./ConnectionCheckPage";

// Replace the data hooks and the wallet button so the page renders without a wallet or network.
vi.mock("../../hooks", () => ({
  useWalletStatus: () => ({ isConnected: false, address: null }),
  useCounter: () => ({ isPending: false, isError: false, data: undefined }),
  useCounterAction: () => ({ isPending: false, isError: false, data: undefined, mutate: vi.fn() }),
  useEngineDescription: () => ({
    isPending: false,
    isError: false,
    data: "civ-core 0.1.0: game rules ready",
  }),
}));
vi.mock("../../components/molecules", () => ({
  WalletButton: () => <button type="button">Select Wallet</button>,
}));

describe("ConnectionCheckPage", () => {
  it("asks for a wallet before showing the program controls", () => {
    render(<ConnectionCheckPage />);

    const prompt = screen.getByText(/connect a wallet/i);

    expect(prompt).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /counter/i })).not.toBeInTheDocument();
  });

  it("shows the description returned by the WASM engine", () => {
    render(<ConnectionCheckPage />);

    const engineOutput = screen.getByText("civ-core 0.1.0: game rules ready");

    expect(engineOutput).toBeInTheDocument();
  });
});
