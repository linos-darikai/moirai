import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { openMatch } from "../../test/matchFixtures";
import { renderWithProviders } from "../../test/renderWithProviders";
import { LobbiesPage } from "./LobbiesPage";

// The page reads open lobbies from the chain; tests give it these instead.
const chain = vi.hoisted(() => ({ fetchOpenMatches: vi.fn() }));
vi.mock("../../lib/solana", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/solana")>()),
  fetchOpenMatches: chain.fetchOpenMatches,
}));

const TERRITORY = openMatch({ address: "TerrAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" });
const CONQUEST = openMatch({ address: "ConqBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", winMetric: "conquest" });

describe("LobbiesPage", () => {
  beforeEach(() => {
    chain.fetchOpenMatches.mockResolvedValue([TERRITORY, CONQUEST]);
  });

  it("lists the open lobbies on chain, each linking to its match address", async () => {
    renderWithProviders(<LobbiesPage />);

    expect(await screen.findByRole("link", { name: "View lobby #Terr" })).toHaveAttribute("href", `/lobby/${TERRITORY.address}`);
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("filters lobbies by win metric", async () => {
    renderWithProviders(<LobbiesPage />);
    await screen.findByRole("link", { name: "View lobby #Terr" });

    await userEvent.click(screen.getByRole("button", { name: "Conquest" }));

    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "View lobby #Conq" })).toBeInTheDocument();
  });

  it("says so when there are no open lobbies", async () => {
    chain.fetchOpenMatches.mockResolvedValue([]);

    renderWithProviders(<LobbiesPage />);

    expect(await screen.findByRole("link", { name: /create/i })).toBeInTheDocument();
  });
});
