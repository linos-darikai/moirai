import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { CivCard } from "./CivCard";

describe("CivCard", () => {
  it("shows tiles, resources and readable unit counts", () => {
    renderWithProviders(
      <CivCard
        rank={1}
        civIndex={0}
        name="iron-turtle (you)"
        tilesText="74 tiles"
        resourceText={{ food: "62 food", ore: "41 ore", gold: "18 gold" }}
        units={{ infantry: 4, guard: 9, siege: 2, elite: 1 }}
        unitLabels={{ infantry: "Infantry", guard: "Guard", siege: "Siege", elite: "Elite" }}
        armyText="army 31"
        isYou
      />,
    );

    expect(screen.getByText("74 tiles")).toBeInTheDocument();
    expect(screen.getByText("41 ore")).toBeInTheDocument();
    expect(screen.getByLabelText("Guard 9")).toBeInTheDocument();
  });
});
