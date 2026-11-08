import { screen } from "@testing-library/react";
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

    const joinTerritory = await screen.findByRole("link", { name: "Join lobby #Terr" });

    expect(joinTerritory).toHaveAttribute("href", `/lobby/${TERRITORY.address}`);
    expect(screen.getByRole("link", { name: "Join lobby #Conq" })).toBeInTheDocument();
    expect(screen.getByText("2 open right now")).toBeInTheDocument();
  });

  it("offers to start a lobby when none are open", async () => {
    chain.fetchOpenMatches.mockResolvedValue([]);

    renderWithProviders(<LobbiesPage />);

    const startOne = await screen.findByRole("link", { name: "start one" });

    expect(startOne).toHaveAttribute("href", "/lobby/new");
  });

  it("sends the Play button to the create-lobby page", () => {
    renderWithProviders(<LobbiesPage />);

    const play = screen.getByRole("link", { name: "Play" });

    expect(play).toHaveAttribute("href", "/lobby/new");
  });

  it("states the real rule limits in the rules panel", () => {
    renderWithProviders(<LobbiesPage />);

    const rules = screen.getByRole("region", { name: "the rules" });

    expect(rules).toHaveTextContent("up to 16");
    expect(rules).toHaveTextContent("120 turns run on chain");
  });
});
