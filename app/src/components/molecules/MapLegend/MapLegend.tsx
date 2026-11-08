// MapLegend molecule: explains the map board's hand-drawn marks (deposit circles, city spirals,
// contested outlines).

import type { ReactElement } from "react";
import { SketchMark } from "../../atoms";
import { ContestedMark, Item, List, MarkSlot } from "./MapLegend.styles";

type MapLegendProps = {
  /** Accessible name of the list, e.g. "Map legend". */
  label: string;
  foodLabel: string;
  oreLabel: string;
  goldLabel: string;
  cityLabel: string;
  citySiteLabel: string;
  contestedLabel: string;
};

/** What each mark on the map means. */
export function MapLegend({
  label,
  foodLabel,
  oreLabel,
  goldLabel,
  cityLabel,
  citySiteLabel,
  contestedLabel,
}: MapLegendProps): ReactElement {
  return (
    <List aria-label={label}>
      <Item>
        <MarkSlot>
          <SketchMark kind="deposit" tone={{ resource: "food" }} />
        </MarkSlot>
        {foodLabel}
      </Item>
      <Item>
        <MarkSlot>
          <SketchMark kind="deposit" tone={{ resource: "ore" }} />
        </MarkSlot>
        {oreLabel}
      </Item>
      <Item>
        <MarkSlot>
          <SketchMark kind="deposit" tone={{ resource: "gold" }} />
        </MarkSlot>
        {goldLabel}
      </Item>
      <Item>
        <MarkSlot>
          <SketchMark kind="city" tone="muted" />
        </MarkSlot>
        {cityLabel}
      </Item>
      <Item>
        <MarkSlot>
          <SketchMark kind="citySite" tone="muted" />
        </MarkSlot>
        {citySiteLabel}
      </Item>
      <Item>
        <ContestedMark aria-hidden="true" />
        {contestedLabel}
      </Item>
    </List>
  );
}
