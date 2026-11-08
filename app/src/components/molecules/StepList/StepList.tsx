// StepList molecule: numbered steps, e.g. "How a match works" or the join → commit → reveal
// progress, with done / current / upcoming states.

import type { ReactElement } from "react";
import { Icon } from "../../atoms";
import { Body, Item, List, Marker, Title, Words } from "./StepList.styles";

export type StepState = "done" | "current" | "upcoming";

export type Step = {
  id: string;
  title: string;
  body: string;
  /** "upcoming" for a plain numbered list. */
  state: StepState;
  /** Screen-reader text for a finished step, e.g. "Done: Join". */
  doneLabel?: string;
};

type StepListProps = {
  steps: readonly Step[];
  /** compact = smaller markers, highlighted current row (the entry panel). */
  look?: "plain" | "progress";
};

/** An ordered list of steps with a number or a check mark. */
export function StepList({ steps, look = "plain" }: StepListProps): ReactElement {
  return (
    <List $look={look}>
      {steps.map((step, index) => (
        <Item key={step.id} $state={step.state} $look={look} aria-current={step.state === "current" ? "step" : undefined}>
          <Marker $state={step.state} $look={look} aria-label={step.state === "done" ? step.doneLabel : undefined}>
            {step.state === "done" ? <Icon name="check" size={14} /> : index + 1}
          </Marker>
          <Words>
            <Title>{step.title}</Title>
            <Body>{step.body}</Body>
          </Words>
        </Item>
      ))}
    </List>
  );
}
