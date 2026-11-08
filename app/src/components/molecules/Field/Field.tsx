// Field molecule: a label, its control and an optional hint, stacked.

import type { ReactElement, ReactNode } from "react";
import { FieldLabel, Hint, LabelRow, Stack } from "./Field.styles";

type FieldProps = {
  label: string;
  /** id of the control the label names. */
  htmlFor: string;
  children: ReactNode;
  /** Small text under the control. Give the control `describedBy={hintId}` to link them. */
  hint?: string;
  hintId?: string;
  /** Shown at the right of the label (e.g. the slider's current value). */
  labelAside?: ReactNode;
};

/** A labelled form control. */
export function Field({ label, htmlFor, children, hint, hintId, labelAside }: FieldProps): ReactElement {
  return (
    <Stack>
      <LabelRow>
        <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
        {labelAside}
      </LabelRow>
      {children}
      {hint !== undefined && <Hint id={hintId}>{hint}</Hint>}
    </Stack>
  );
}
