// StatCard molecule: a labelled big number with an optional note ("Elo 1,684, +24 last match").

import type { ReactElement } from "react";
import { Surface, Text } from "../../atoms";
import type { TextTone } from "../../atoms";

type StatCardProps = {
  label: string;
  value: string;
  note?: string;
  noteTone?: TextTone;
  /** raised = smaller card used inside another card. */
  tone?: "default" | "raised";
};

/** A single headline statistic. */
export function StatCard({ label, value, note, noteTone = "muted", tone = "default" }: StatCardProps): ReactElement {
  return (
    <Surface tone={tone} padding={tone === "raised" ? "sm" : "md"}>
      <div>
        <Text size="sm" tone="muted">
          {label}
        </Text>
        <Text size={tone === "raised" ? "xxl" : "h2"} weight="bold" isDisplay>
          {value}
        </Text>
        {note !== undefined && (
          <Text size="sm" tone={noteTone}>
            {note}
          </Text>
        )}
      </div>
    </Surface>
  );
}
