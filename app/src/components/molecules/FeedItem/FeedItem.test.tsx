import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { FeedItem } from "./FeedItem";

describe("FeedItem", () => {
  it("shows the turn and the event text", () => {
    renderWithProviders(
      <ul>
        <FeedItem turnLabel="t37" color={{ civ: 1 }} text="red-raider took 2 tiles." />
      </ul>,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent("t37red-raider took 2 tiles.");
  });
});
