import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { PolicyCodeEditor } from "./PolicyCodeEditor";

describe("PolicyCodeEditor", () => {
  it("is a labelled text box that reports edits", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <PolicyCodeEditor id="yaml" label="Policy YAML" fileName="policy.yaml" value="rules:" onChange={onChange} warningLines={[]} />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Policy YAML" }), { target: { value: "rules:\n" } });

    expect(onChange).toHaveBeenCalledWith("rules:\n");
  });

  it("numbers every line of the coloured copy", () => {
    const { container } = renderWithProviders(
      <PolicyCodeEditor id="yaml" label="Policy YAML" fileName="policy.yaml" value={"a\nb\nc"} onChange={vi.fn()} warningLines={[2]} />,
    );

    expect(container.querySelector("[aria-hidden='true']")?.textContent).toContain("3c");
  });
});
