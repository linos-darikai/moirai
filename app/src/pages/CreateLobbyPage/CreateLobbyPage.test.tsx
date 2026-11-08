import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { CreateLobbyPage } from "./CreateLobbyPage";

describe("CreateLobbyPage", () => {
  it("updates the summary as the rules change", async () => {
    renderWithProviders(<CreateLobbyPage />);
    const summary = screen.getByRole("complementary", { name: "Lobby summary" });

    await userEvent.click(screen.getByRole("button", { name: /Wealth/ }));
    await userEvent.clear(screen.getByLabelText("Entry fee per player"));
    await userEvent.type(screen.getByLabelText("Entry fee per player"), "1");

    expect(summary).toHaveTextContent("Wealth");
    expect(summary).toHaveTextContent("Prize pool when full4 SOL");
  });
});
