import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "yaml", label: "YAML" },
  { value: "rules", label: "Rules" },
] as const;

describe("SegmentedControl", () => {
  it("marks the current option as pressed", () => {
    renderWithProviders(<SegmentedControl label="View" options={options} value="yaml" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "YAML" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Rules" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports the option the player picks", async () => {
    const onChange = vi.fn();
    renderWithProviders(<SegmentedControl label="View" options={options} value="yaml" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Rules" }));

    expect(onChange).toHaveBeenCalledWith("rules");
  });
});
