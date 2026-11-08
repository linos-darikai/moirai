import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { SketchbookFrame } from "./SketchbookFrame";

describe("SketchbookFrame", () => {
  it("shows the page content and the side tab", () => {
    renderWithProviders(<SketchbookFrame sideTab={<a href="/leaderboard">leaderboard</a>}>page body</SketchbookFrame>);

    const body = screen.getByText("page body");

    expect(body).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "leaderboard" })).toBeInTheDocument();
  });
});
