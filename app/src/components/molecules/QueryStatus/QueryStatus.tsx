// QueryStatus molecule: the loading and error messages every data-driven section shows
// (CLAUDE.md section 8, "Loading, empty and error states").

import type { ReactElement } from "react";
import { Message } from "./QueryStatus.styles";

type QueryStatusProps = {
  /** "loading" is announced politely; "error" interrupts (role=alert); "empty" is plain text. */
  kind: "loading" | "error" | "empty";
  text: string;
};

/** A short status line for a section whose data isn't ready (or failed, or is empty). */
export function QueryStatus({ kind, text }: QueryStatusProps): ReactElement {
  if (kind === "error") {
    return (
      <Message role="alert" $kind={kind}>
        {text}
      </Message>
    );
  }
  return (
    <Message role={kind === "loading" ? "status" : undefined} $kind={kind}>
      {text}
    </Message>
  );
}
