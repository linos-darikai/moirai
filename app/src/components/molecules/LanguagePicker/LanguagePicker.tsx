// LanguagePicker molecule: a compact dropdown of languages, each named in its own language.

import type { ReactElement } from "react";
import { Select, VisuallyHidden } from "../../atoms";
import type { SelectOption } from "../../atoms";
import { Wrapper } from "./LanguagePicker.styles";

type LanguagePickerProps = {
  /** Accessible label, e.g. "Language". */
  label: string;
  value: string;
  /** Each option labelled in its own language ("Español (draft translation)"). */
  options: readonly SelectOption[];
  onChange: (value: string) => void;
};

const PICKER_ID = "language-picker";

/** Switches the app's language. */
export function LanguagePicker({ label, value, options, onChange }: LanguagePickerProps): ReactElement {
  return (
    <Wrapper>
      <VisuallyHidden htmlFor={PICKER_ID}>{label}</VisuallyHidden>
      <Select id={PICKER_ID} value={value} options={options} onChange={onChange} />
    </Wrapper>
  );
}
