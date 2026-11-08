import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WalletButton } from "./WalletButton";

describe("WalletButton", () => {
  it("asks the player to select a wallet when none is connected", () => {
    render(
      <WalletProvider wallets={[]}>
        <WalletModalProvider>
          <WalletButton />
        </WalletModalProvider>
      </WalletProvider>,
    );

    const button = screen.getByRole("button", { name: /select wallet/i });

    expect(button).toBeInTheDocument();
  });
});
