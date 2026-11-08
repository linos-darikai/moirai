import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { Button } from "./Button";

describe("Button", () => {
  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Join</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Join" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders a link when given a path", () => {
    renderWithProviders(<Button to="/editor">Write a policy</Button>);

    const link = screen.getByRole("link", { name: "Write a policy" });

    expect(link).toHaveAttribute("href", "/editor");
  });

  it("does nothing when disabled", async () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick} isDisabled>Join</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Join" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
