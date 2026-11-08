import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/renderWithProviders";
import { DataTable } from "./DataTable";

type Row = { bot: string; elo: number };

describe("DataTable", () => {
  it("renders headers and one row per entry", () => {
    renderWithProviders(
      <DataTable<Row>
        rowKey={(row) => row.bot}
        rows={[
          { bot: "iron-turtle", elo: 1684 },
          { bot: "silk-trader", elo: 1622 },
        ]}
        columns={[
          { key: "bot", header: "Bot", render: (row) => row.bot },
          { key: "elo", header: "Elo", render: (row) => row.elo, isEnd: true },
        ]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Elo" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(within(rows[1] as HTMLElement).getByText("iron-turtle")).toBeInTheDocument();
  });
});
