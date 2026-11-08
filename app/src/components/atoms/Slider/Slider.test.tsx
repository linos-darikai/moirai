import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("reports the new value as a number", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <>
        <label htmlFor="turn">Turn</label>
        <Slider id="turn" value={10} min={0} max={60} onChange={onChange} />
      </>,
    );

    fireEvent.change(screen.getByLabelText("Turn"), { target: { value: "44" } });

    expect(onChange).toHaveBeenCalledWith(44);
  });
});
