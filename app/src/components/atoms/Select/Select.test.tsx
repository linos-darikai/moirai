import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Select } from "./Select";

describe("Select", () => {
  it("reports the chosen option", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <>
        <label htmlFor="players">Players</label>
        <Select
          id="players"
          value="4"
          options={[
            { value: "4", label: "4 players" },
            { value: "2", label: "2 players" },
          ]}
          onChange={onChange}
        />
      </>,
    );

    await userEvent.selectOptions(screen.getByLabelText("Players"), "2");

    expect(onChange).toHaveBeenCalledWith("2");
  });
});
