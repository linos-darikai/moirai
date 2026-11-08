import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { WalletButton } from "./WalletButton";

const baseProps = {
  balanceText: "4.82 SOL",
  initials: "7X",
  profilePath: "/profile/abc",
  connectLabel: "Connect wallet",
  profileLabel: "Your profile, wallet 7xKq…3fPa, 4.82 SOL",
};

describe("WalletButton", () => {
  it("asks to connect when no wallet is connected", async () => {
    const onConnect = vi.fn();
    renderWithProviders(<WalletButton {...baseProps} address={null} onConnect={onConnect} />);

    await userEvent.click(screen.getByRole("button", { name: "Connect wallet" }));

    expect(onConnect).toHaveBeenCalledOnce();
  });

  it("links to the profile with address and balance once connected", () => {
    renderWithProviders(<WalletButton {...baseProps} address="7xKq…3fPa" onConnect={vi.fn()} />);

    const link = screen.getByRole("link", { name: baseProps.profileLabel });

    expect(link).toHaveAttribute("href", "/profile/abc");
    expect(link).toHaveTextContent("4.82 SOL");
  });
});
