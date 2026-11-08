// Slider atom: a range input (turn scrubbers, number of turns). Pair it with a <label>.

import type { ChangeEvent, ReactElement } from "react";
import { StyledSlider } from "./Slider.styles";

type SliderProps = {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
};

/** A controlled range slider. */
export function Slider({ id, value, min, max, step = 1, onChange }: SliderProps): ReactElement {
  return (
    <StyledSlider
      id={id}
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))}
    />
  );
}
