import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { TurnFeed } from "./TurnFeed";

const civNames = { 0: "iron-turtle", 1: "red-raider", 2: "silk-trader", 3: "wide-expander" } as const;

describe("TurnFeed", () => {
  it("turns events into translated sentences", () => {
    renderWithProviders(
      <TurnFeed
        civNames={civNames}
        events={[
          { turn: 37, civIndex: 1, kind: "attack", defender: 3, x: 9, y: 6, tiles: 2 },
          { turn: 36, civIndex: 2, kind: "sell", resource: "gold", amount: 10, priceChange: -0.04 },
        ]}
      />,
    );

    expect(screen.getByText("red-raider attacked wide-expander at (9, 6). 2 tiles changed hands.")).toBeInTheDocument();
    expect(screen.getByText("silk-trader sold 10 gold. Its price fell 4%.")).toBeInTheDocument();
  });
});
