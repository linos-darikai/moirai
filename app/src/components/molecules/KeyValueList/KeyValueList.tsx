// KeyValueList molecule: label/value pairs as a definition list ("Entry fee · 0.5 SOL").

import type { ReactElement, ReactNode } from "react";
import { List, Row, Term, Value } from "./KeyValueList.styles";

export type KeyValueRow = {
  key: string;
  label: ReactNode;
  value: ReactNode;
};

type KeyValueListProps = {
  rows: readonly KeyValueRow[];
  /** rows = label left, value right; grid = small label above value, in columns. */
  layout?: "rows" | "grid";
  /** Number of columns for the grid layout. */
  columns?: number;
  /** verify = the green "verified against the chain" colours. */
  tone?: "default" | "verify";
};

/** Labelled values. */
export function KeyValueList({ rows, layout = "rows", columns = 2, tone = "default" }: KeyValueListProps): ReactElement {
  return (
    <List $layout={layout} $columns={columns}>
      {rows.map((row) => (
        <Row key={row.key} $layout={layout}>
          <Term $tone={tone}>{row.label}</Term>
          <Value $layout={layout}>{row.value}</Value>
        </Row>
      ))}
    </List>
  );
}
