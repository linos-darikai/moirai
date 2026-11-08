import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { LanguagePicker } from "./LanguagePicker";

describe("LanguagePicker", () => {
  it("reports the chosen language", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <LanguagePicker
        label="Language"
        value="en"
        options={[
          { value: "en", label: "English" },
          { value: "fr", label: "Français" },
        ]}
        onChange={onChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Language"), "fr");

    expect(onChange).toHaveBeenCalledWith("fr");
  });
});
