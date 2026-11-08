// DataTable organism: a real <table> that scrolls sideways inside its box on narrow screens.
// Used for on-chain activity, final standings, rankings and match history.

import type { ReactElement, ReactNode } from "react";
import { Cell, HeaderCell, Row, Scroll, Table } from "./DataTable.styles";

export type DataColumn<RowData> = {
  key: string;
  /** Column title; may be visually hidden text for an actions column. */
  header: ReactNode;
  render: (row: RowData) => ReactNode;
  /** Right-align (numbers, row actions). */
  isEnd?: boolean;
};

type DataTableProps<RowData> = {
  columns: readonly DataColumn<RowData>[];
  rows: readonly RowData[];
  rowKey: (row: RowData) => string;
  /** Minimum width before the table scrolls sideways, in px. */
  minWidth?: number;
  /** Highlight a row (e.g. the leader). */
  isRowHighlighted?: (row: RowData) => boolean;
  /** Bigger row padding for tables with large text. */
  density?: "compact" | "comfortable";
};

/**
 * A data table. `<RowData>` is a generic: each table says what one row is (a ranking, a log
 * entry...) and TypeScript checks every column's `render` gets that type.
 */
export function DataTable<RowData>({
  columns,
  rows,
  rowKey,
  minWidth = 560,
  isRowHighlighted,
  density = "compact",
}: DataTableProps<RowData>): ReactElement {
  return (
    <Scroll>
      <Table $minWidth={minWidth}>
        <thead>
          <tr>
            {columns.map((column) => (
              <HeaderCell key={column.key} scope="col" $isEnd={column.isEnd === true}>
                {column.header}
              </HeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row key={rowKey(row)} $isHighlighted={isRowHighlighted?.(row) === true}>
              {columns.map((column) => (
                <Cell key={column.key} $isEnd={column.isEnd === true} $density={density}>
                  {column.render(row)}
                </Cell>
              ))}
            </Row>
          ))}
        </tbody>
      </Table>
    </Scroll>
  );
}
