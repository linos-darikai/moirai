import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { ChoiceCard } from "./ChoiceCard";

describe("ChoiceCard", () => {
  it("reports selection and shows its pressed state", async () => {
    const onSelect = vi.fn();
    renderWithProviders(<ChoiceCard title="Wealth" body="Most value" isSelected={false} onSelect={onSelect} />);

    const card = screen.getByRole("button", { name: /Wealth/ });
    await userEvent.click(card);

    expect(card).toHaveAttribute("aria-pressed", "false");
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
