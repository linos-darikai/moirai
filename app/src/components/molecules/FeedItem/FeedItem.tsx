// FeedItem molecule: one line of a turn feed, "t37 ▌ red-raider took 2 tiles from ...".

import type { ReactElement } from "react";
import type { SwatchColor } from "../../atoms";
import { Bar, Line, Turn, Words } from "./FeedItem.styles";

type FeedItemProps = {
  /** Short turn label, e.g. "t37". Omit on compact lists. */
  turnLabel?: string;
  /** Colour of the civ (or event) the line is about. */
  color: SwatchColor;
  text: string;
  /** boxed = its own card (mobile, design kit); plain = a list row. */
  look?: "plain" | "boxed";
};

/** One event in a feed. */
export function FeedItem({ turnLabel, color, text, look = "plain" }: FeedItemProps): ReactElement {
  return (
    <Line $look={look}>
      {turnLabel !== undefined && <Turn>{turnLabel}</Turn>}
      <Bar aria-hidden="true" $color={color} />
      <Words>{text}</Words>
    </Line>
  );
}
