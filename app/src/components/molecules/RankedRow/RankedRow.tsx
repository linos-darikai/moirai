// RankedRow molecule: "1  ■ iron-turtle   74 tiles" — one entry of a standings or top-players
// list, with an optional second line and an optional progress bar.

import type { ReactElement, ReactNode } from "react";
import { ProgressBar, Swatch, Text } from "../../atoms";
import type { SwatchColor, SwatchSize } from "../../atoms";
import { Main, Name, Rank, Row } from "./RankedRow.styles";

type RankedRowProps = {
  /** Shown before the swatch; omit for unranked lists. */
  rank?: number;
  color: SwatchColor;
  swatchSize?: SwatchSize;
  name: ReactNode;
  /** Second line under the name, e.g. the wallet. */
  detail?: string;
  value: string;
  /** Draws a bar under the row (value / max). */
  bar?: { value: number; max: number };
  /** boxed = its own raised card with a border; plain = a list row. */
  look?: "plain" | "boxed";
  isHighlighted?: boolean;
};

/** One ranked entry. */
export function RankedRow({
  rank,
  color,
  swatchSize = "sm",
  name,
  detail,
  value,
  bar,
  look = "plain",
  isHighlighted = false,
}: RankedRowProps): ReactElement {
  return (
    <Row $look={look} $isHighlighted={isHighlighted}>
      <Main>
        {rank !== undefined && <Rank>{rank}</Rank>}
        <Swatch color={color} size={swatchSize} />
        <Name>
          <Text as="span" weight="medium">
            {name}
          </Text>
          {detail !== undefined && (
            <Text as="span" size="xs" tone="muted" isMono>
              {detail}
            </Text>
          )}
        </Name>
        <Text as="span" weight="bold" isDisplay>
          {value}
        </Text>
      </Main>
      {bar !== undefined && <ProgressBar value={bar.value} max={bar.max} color={color} />}
    </Row>
  );
}
