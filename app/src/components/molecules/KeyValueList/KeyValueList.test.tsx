import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { KeyValueList } from "./KeyValueList";

describe("KeyValueList", () => {
  it("renders each term with its value", () => {
    renderWithProviders(<KeyValueList rows={[{ key: "fee", label: "Entry fee", value: "0.5 SOL" }]} />);

    expect(screen.getByRole("term")).toHaveTextContent("Entry fee");
    expect(screen.getByRole("definition")).toHaveTextContent("0.5 SOL");
  });
});
