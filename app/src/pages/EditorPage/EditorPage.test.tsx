import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CompiledPolicy } from "../../types/policy";
import { renderWithProviders } from "../../test/renderWithProviders";
import { EditorPage } from "./EditorPage";

// The page asks civ-core's compiler (WASM) for problems. The engine doesn't load in jsdom, so the
// page falls back to the quick TypeScript reader unless a test gives it a compiler answer here.
const compilerAnswer = vi.hoisted(() => ({ current: null as CompiledPolicy | null }));
vi.mock("../../lib/engine", () => ({
  compilePolicyDraft: () =>
    compilerAnswer.current === null ? Promise.reject(new Error("no engine in jsdom")) : Promise.resolve(compilerAnswer.current),
}));

describe("EditorPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    compilerAnswer.current = null;
  });

  it("shows the compiler's problems once it has checked the draft", async () => {
    compilerAnswer.current = {
      isValid: false,
      problems: [{ line: 4, code: "badArguments", detail: "sell" }],
    };

    renderWithProviders(<EditorPage />);

    expect(await screen.findByText("Line 4: Wrong arguments for sell(…). See the reference for what it takes.")).toBeInTheDocument();
  });

  it("shows the compiled size once the draft compiles", async () => {
    compilerAnswer.current = { isValid: true, bytes: new Uint8Array(65) };

    renderWithProviders(<EditorPage />);

    expect(await screen.findByText("65 bytes")).toBeInTheDocument();
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

    expect(screen.getByText("assign_workers(food)")).toBeInTheDocument();
  });
});
