import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchAccountView } from "../../types/chain";
import { WALLET_ALICE, WALLET_BOB, openMatch } from "../../test/matchFixtures";
import { renderWithProviders } from "../../test/renderWithProviders";
import { LobbyPage } from "./LobbyPage";

// The page reads one match from the chain and sends instructions through lib/solana; tests stub
// both, and connect a pretend wallet (Bob) so the player's steps are offered.
const chain = vi.hoisted(() => ({
  fetchMatch: vi.fn(),
  joinMatch: vi.fn(),
  startMatch: vi.fn(),
}));
vi.mock("../../lib/solana", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/solana")>()),
  fetchMatch: chain.fetchMatch,
  joinMatch: chain.joinMatch,
  startMatch: chain.startMatch,
}));
const wallet = vi.hoisted(() => ({ address: null as string | null }));
vi.mock("../../hooks/useWallet", () => ({
  useWalletStatus: () => ({ isConnected: wallet.address !== null, address: wallet.address }),
  useOpenWalletPicker: () => () => undefined,
  useWalletBalance: () => ({ data: undefined }),
}));
vi.mock("@solana/wallet-adapter-react", async (importOriginal) => {
  const original = await importOriginal<typeof import("@solana/wallet-adapter-react")>();
  const { PublicKey } = await import("@solana/web3.js");
  return {
    ...original,
    useAnchorWallet: () =>
      wallet.address === null
        ? undefined
        : { publicKey: new PublicKey(wallet.address), signTransaction: vi.fn(), signAllTransactions: vi.fn() },
  };
});

function renderLobby(match: MatchAccountView | null) {
  chain.fetchMatch.mockResolvedValue(match);
  const address = match?.address ?? openMatch().address;
  return renderWithProviders(
    <Routes>
      <Route path="/lobby/:lobbyId" element={<LobbyPage />} />
    </Routes>,
    { route: `/lobby/${address}` },
  );
}

describe("LobbyPage", () => {
  beforeEach(() => {
    wallet.address = null;
    vi.clearAllMocks();
  });

  it("shows the lobby from the chain with its open seats, and asks for a wallet", async () => {
    renderLobby(openMatch({ players: [WALLET_ALICE], committed: [false], revealed: [false] }));

    expect(await screen.findByRole("heading", { level: 1, name: "Lobby #9xQe" })).toBeInTheDocument();
    expect(screen.getAllByText("Open seat")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Connect a wallet" })).toBeInTheDocument();
  });

  it("joins the lobby with the connected wallet", async () => {
    wallet.address = WALLET_BOB;
    chain.joinMatch.mockResolvedValue("signature");
    renderLobby(openMatch({ players: [WALLET_ALICE], committed: [false], revealed: [false] }));

    await userEvent.click(await screen.findByRole("button", { name: "Join and pay 0.01 SOL" }));

    expect(chain.joinMatch).toHaveBeenCalledWith(expect.anything(), openMatch().address);
  });

  it("lets anyone start a full lobby once every policy is revealed", async () => {
    chain.startMatch.mockResolvedValue("signature");
    renderLobby(
      openMatch({
        players: [WALLET_ALICE, WALLET_BOB],
        committed: [true, true],
        revealed: [true, true],
        commitments: ["ab".repeat(32), "cd".repeat(32)],
      }),
    );
    wallet.address = WALLET_BOB;

    expect(await screen.findByRole("button", { name: "Start the match" })).toBeInTheDocument();
    expect(screen.getByText("hash abab…abab")).toBeInTheDocument();
  });

  it("shows the turn while the match is played", async () => {
    renderLobby(openMatch({ players: [WALLET_ALICE, WALLET_BOB], status: "running", turn: 12 }));

    expect(await screen.findByText("12 / 120")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play the turns (12 / 120)" })).toBeInTheDocument();
  });

  it("says the match is over once its accounts are closed", async () => {
    renderLobby(null);

    expect(await screen.findByText(/This match is over/)).toBeInTheDocument();
  });
});
