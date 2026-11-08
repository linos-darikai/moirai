import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { RankedRow } from "./RankedRow";

describe("RankedRow", () => {
  it("shows rank, name, detail and value", () => {
    renderWithProviders(
      <ol>
        <RankedRow rank={1} color={{ civ: 0 }} name="iron-turtle" detail="7xKq…3fPa" value="1,684" />
      </ol>,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent("1iron-turtle7xKq…3fPa1,684");
  });
});
