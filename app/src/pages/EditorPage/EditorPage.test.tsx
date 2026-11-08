import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { EditorPage } from "./EditorPage";

describe("EditorPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the draft and warns about the shadowed rule", () => {
    renderWithProviders(<EditorPage />);

    expect((screen.getByRole("textbox", { name: "Policy YAML" }) as HTMLTextAreaElement).value).toContain("name: iron-turtle");
    expect(screen.getByText(/rule 7 rarely runs/)).toBeInTheDocument();
  });

  it("flags an unknown action as the player types", () => {
    renderWithProviders(<EditorPage />);

    fireEvent.change(screen.getByRole("textbox", { name: "Policy YAML" }), {
      target: { value: "rules:\n  - if: always\n    do: teleport(home)\n" },
    });

    expect(screen.getByText("Line 3: “teleport” isn't a known action.")).toBeInTheDocument();
  });

  it("switches to the rules view", async () => {
    renderWithProviders(<EditorPage />);

    await userEvent.click(screen.getByRole("button", { name: "Rules" }));

    expect(screen.getByText("assign_workers(farm, 3)")).toBeInTheDocument();
  });
});
