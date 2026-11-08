// Select atom: a dropdown. Pair it with a <label> (see the Field molecule).

import type { ChangeEvent, ReactElement } from "react";
import { StyledSelect } from "./Select.styles";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  id: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
};

/** A controlled dropdown. */
export function Select({ id, value, options, onChange }: SelectProps): ReactElement {
  return (
    <StyledSelect
      id={id}
      value={value}
      onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </StyledSelect>
  );
}
