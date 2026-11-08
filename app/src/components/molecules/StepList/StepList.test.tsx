import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { StepList } from "./StepList";

describe("StepList", () => {
  it("numbers steps and marks the current one", () => {
    renderWithProviders(
      <StepList
        look="progress"
        steps={[
          { id: "join", title: "Join", body: "Pay the fee", state: "done", doneLabel: "Done: Join" },
          { id: "commit", title: "Commit", body: "Post the hash", state: "current" },
        ]}
      />,
    );

    expect(screen.getByLabelText("Done: Join")).toBeInTheDocument();
    expect(screen.getByText("Commit").closest("li")).toHaveAttribute("aria-current", "step");
  });
});
