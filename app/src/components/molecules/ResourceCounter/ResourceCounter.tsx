// ResourceCounter molecule: a resource dot and amount, e.g. "● 62 food".

import type { ReactElement } from "react";
import type { ResourceKind } from "../../../types/game";
import { Swatch } from "../../atoms";
import { Pill } from "./ResourceCounter.styles";

type ResourceCounterProps = {
  resource: ResourceKind;
  /** The translated amount, e.g. "62 food". */
  label: string;
};

/** One resource amount in a small pill. */
export function ResourceCounter({ resource, label }: ResourceCounterProps): ReactElement {
  return (
    <Pill>
      <Swatch color={{ resource }} size="xs" shape="round" />
      {label}
    </Pill>
  );
}
