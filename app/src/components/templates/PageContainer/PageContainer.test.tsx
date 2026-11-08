import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { PageContainer } from "./PageContainer";

describe("PageContainer", () => {
  it("renders its sections", () => {
    renderWithProviders(<PageContainer width="wide">sections</PageContainer>);

    expect(screen.getByText("sections")).toBeInTheDocument();
  });
});
