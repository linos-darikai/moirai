import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Input } from "./Input";

describe("Input", () => {
  it("reports each typed character", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <>
        <label htmlFor="seed">Seed</label>
        <Input id="seed" value="" onChange={onChange} />
      </>,
    );

    await userEvent.type(screen.getByLabelText("Seed"), "9f");

    expect(onChange).toHaveBeenCalledWith("9");
    expect(onChange).toHaveBeenCalledWith("f");
  });
});
