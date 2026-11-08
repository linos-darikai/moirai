// Input atom: a single-line text field. Always pair it with a <label> (see the Field molecule).

import type { ChangeEvent, ReactElement } from "react";
import { StyledInput } from "./Input.styles";

type InputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "search";
  placeholder?: string;
  /** Monospace text (seeds, addresses). */
  isMono?: boolean;
  inputMode?: "text" | "decimal" | "numeric";
  /** Points at hint or error text that describes this field. */
  describedBy?: string;
  isInvalid?: boolean;
};

/** A controlled text field. */
export function Input({
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  isMono = false,
  inputMode,
  describedBy,
  isInvalid = false,
}: InputProps): ReactElement {
  return (
    <StyledInput
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      inputMode={inputMode}
      aria-describedby={describedBy}
      aria-invalid={isInvalid}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      $isMono={isMono}
    />
  );
}
