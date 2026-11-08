// ChoiceCard molecule: a big selectable option with a title and description (win metric,
// payout, policy in the editor list).

import type { ReactElement } from "react";
import { Swatch } from "../../atoms";
import type { SwatchColor } from "../../atoms";
import { Body, Card, Title } from "./ChoiceCard.styles";

type ChoiceCardProps = {
  title: string;
  body: string;
  isSelected: boolean;
  onSelect: () => void;
  /** Optional colour marker before the title (e.g. the metric colour). */
  swatch?: SwatchColor;
  /** pressed = toggle in a group (aria-pressed); current = item in a list (aria-current). */
  role?: "pressed" | "current";
};

/** A card-sized button that can be selected. */
export function ChoiceCard({ title, body, isSelected, onSelect, swatch, role = "pressed" }: ChoiceCardProps): ReactElement {
  return (
    <Card
      type="button"
      onClick={onSelect}
      aria-pressed={role === "pressed" ? isSelected : undefined}
      aria-current={role === "current" && isSelected ? "true" : undefined}
      $isSelected={isSelected}
    >
      <Title>
        {swatch !== undefined && <Swatch color={swatch} size="sm" />}
        {title}
      </Title>
      <Body>{body}</Body>
    </Card>
  );
}
