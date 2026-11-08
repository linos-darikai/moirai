// StatusChip atom: a rounded pill for a state, like "Revealed" or "Not committed".

import type { ReactElement, ReactNode } from "react";
import { StyledStatusChip } from "./StatusChip.styles";
import type { ChipTone } from "./StatusChip.styles";

type StatusChipProps = {
  children: ReactNode;
  /** positive = green, pending = amber, neutral = grey, negative = red. */
  tone: ChipTone;
};

/** A coloured state label. */
export function StatusChip({ children, tone }: StatusChipProps): ReactElement {
  return <StyledStatusChip $tone={tone}>{children}</StyledStatusChip>;
}
