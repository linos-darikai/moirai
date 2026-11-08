// SeatCard molecule: one seat in a lobby: the bot, its wallet, its join/commit/reveal chips and
// its policy hash.

import type { ReactElement } from "react";
import { StatusChip, Swatch, Text } from "../../atoms";
import type { ChipTone, SwatchColor } from "../../atoms";
import { Chips, Header, Identity } from "./SeatCard.styles";

export type SeatChip = { label: string; tone: ChipTone };

type SeatCardProps = {
  name: string;
  /** Wallet, or a "waiting" message for an open seat. */
  subtitle: string;
  color: SwatchColor;
  chips: readonly SeatChip[];
  /** "hash 9f3c…e1a7" or "no hash yet"; empty for an open seat. */
  hashText: string;
  /** Accent border, used for the player's own seat. */
  isHighlighted?: boolean;
};

/** A lobby seat. */
export function SeatCard({ name, subtitle, color, chips, hashText, isHighlighted = false }: SeatCardProps): ReactElement {
  return (
    <Identity as="article" $isHighlighted={isHighlighted}>
      <Header>
        <Swatch color={color} size="lg" />
        <div>
          <Text weight="semibold">{name}</Text>
          <Text size="xs" tone="muted" isMono>
            {subtitle}
          </Text>
        </div>
      </Header>
      <Chips>
        {chips.map((chip) => (
          <StatusChip key={chip.label} tone={chip.tone}>
            {chip.label}
          </StatusChip>
        ))}
      </Chips>
      <Text size="xs" tone="muted" isMono>
        {hashText}
      </Text>
    </Identity>
  );
}
