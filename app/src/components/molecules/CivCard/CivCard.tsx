// CivCard molecule: one civilisation in a live match (rank, tiles, resources, units, army).

import type { ReactElement } from "react";
import type { CivIndex, ResourceKind, UnitKind } from "../../../types/game";
import { RESOURCE_KINDS, UNIT_KINDS } from "../../../types/game";
import { Swatch, Text, UnitShape } from "../../atoms";
import { ResourceCounter } from "../ResourceCounter";
import { Card, Header, Resources, UnitCount, Units } from "./CivCard.styles";

type CivCardProps = {
  rank: number;
  civIndex: CivIndex;
  name: string;
  /** "74 tiles". */
  tilesText: string;
  /** "62 food" etc., per resource. */
  resourceText: Record<ResourceKind, string>;
  units: Record<UnitKind, number>;
  /** Accessible names of the unit kinds, e.g. "Infantry". */
  unitLabels: Record<UnitKind, string>;
  /** "army 31". */
  armyText: string;
  isYou: boolean;
};

/** A civ's standing, stock and army. */
export function CivCard({
  rank,
  civIndex,
  name,
  tilesText,
  resourceText,
  units,
  unitLabels,
  armyText,
  isYou,
}: CivCardProps): ReactElement {
  return (
    <Card $isYou={isYou}>
      <Header>
        <Text as="span" tone="muted" isMono>
          {rank}
        </Text>
        <Swatch color={{ civ: civIndex }} size="sm" />
        <Text as="strong" weight="semibold">
          {name}
        </Text>
        <Text as="span" weight="bold" isDisplay>
          {tilesText}
        </Text>
      </Header>
      <Resources>
        {RESOURCE_KINDS.map((resource) => (
          <ResourceCounter key={resource} resource={resource} label={resourceText[resource]} />
        ))}
      </Resources>
      <Units>
        {UNIT_KINDS.map((kind) => (
          <UnitCount key={kind} title={unitLabels[kind]}>
            <UnitShape kind={kind} civ={civIndex} size={kind === "siege" ? 12 : 10} />
            <span aria-label={`${unitLabels[kind]} ${units[kind]}`}>{units[kind]}</span>
          </UnitCount>
        ))}
        <Text as="span" size="sm" tone="muted">
          {armyText}
        </Text>
      </Units>
    </Card>
  );
}
