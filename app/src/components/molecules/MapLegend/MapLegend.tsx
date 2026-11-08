// MapLegend molecule: explains the map board's marks (deposit dots, city squares, contested
// outlines).

import type { ReactElement } from "react";
import { Swatch } from "../../atoms";
import { CityMark, ContestedMark, Item, List } from "./MapLegend.styles";

type MapLegendProps = {
  /** Accessible name of the list, e.g. "Map legend". */
  label: string;
  foodLabel: string;
  oreLabel: string;
  goldLabel: string;
  cityLabel: string;
  contestedLabel: string;
};

/** What each mark on the map means. */
export function MapLegend({ label, foodLabel, oreLabel, goldLabel, cityLabel, contestedLabel }: MapLegendProps): ReactElement {
  return (
    <List aria-label={label}>
      <Item>
        <Swatch color={{ resource: "food" }} size="xs" shape="round" />
        {foodLabel}
      </Item>
      <Item>
        <Swatch color={{ resource: "ore" }} size="xs" shape="round" />
        {oreLabel}
      </Item>
      <Item>
        <Swatch color={{ resource: "gold" }} size="xs" shape="round" />
        {goldLabel}
      </Item>
      <Item>
        <CityMark aria-hidden="true" />
        {cityLabel}
      </Item>
      <Item>
        <ContestedMark aria-hidden="true" />
        {contestedLabel}
      </Item>
    </List>
  );
}
