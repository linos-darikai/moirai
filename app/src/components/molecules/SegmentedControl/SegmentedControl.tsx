// SegmentedControl molecule: a group of toggle buttons where exactly one is on. Used for view
// switches (YAML / Rules), periods, speeds, tokens and the lobby metric filter (pill shape).

import type { ReactElement } from "react";
import { Group, Segment } from "./SegmentedControl.styles";

export type SegmentOption<Value extends string | number> = { value: Value; label: string };

type SegmentedControlProps<Value extends string | number> = {
  /** Accessible name of the group, e.g. "View" or "Filter by win metric". */
  label: string;
  options: readonly SegmentOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  /** segmented = joined buttons in a tray; pills = separate rounded buttons. */
  shape?: "segmented" | "pills";
  /** Stretch the buttons to fill the width (mobile tabs, token picker). */
  isFullWidth?: boolean;
};

/**
 * One-of-many toggle buttons. `<Value extends string | number>` is a generic: the same component
 * works for string values ("week") and number values (2), and TypeScript checks each use.
 */
export function SegmentedControl<Value extends string | number>({
  label,
  options,
  value,
  onChange,
  shape = "segmented",
  isFullWidth = false,
}: SegmentedControlProps<Value>): ReactElement {
  return (
    <Group role="group" aria-label={label} $shape={shape} $isFullWidth={isFullWidth}>
      {options.map((option) => {
        const isOn = option.value === value;
        return (
          <Segment
            key={String(option.value)}
            type="button"
            aria-pressed={isOn}
            onClick={() => onChange(option.value)}
            $isOn={isOn}
            $shape={shape}
            $isFullWidth={isFullWidth}
          >
            {option.label}
          </Segment>
        );
      })}
    </Group>
  );
}
