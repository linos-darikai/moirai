import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Field } from "./Field";

describe("Field", () => {
  it("labels its control and shows the hint", () => {
    renderWithProviders(
      <Field label="Map seed" htmlFor="seed" hint="Hex only" hintId="seed-hint">
        <input id="seed" aria-describedby="seed-hint" />
      </Field>,
    );

    expect(screen.getByLabelText("Map seed")).toHaveAccessibleDescription("Hex only");
  });
});
