// Rules page ("/rules"): how the game works, for players. Every number comes from
// src/data/rules.ts (which mirrors civ-core), and all text from the `rules` translations.
// Source of the rules: docs/decisions/0006-game-rules-v2.md.

import type { ReactElement } from "react";
import { Link } from "react-router";
import { Heading, Text, UnitShape } from "../../components/atoms";
import { DataTable } from "../../components/organisms";
import { PageContainer } from "../../components/templates";
import { useFormatters } from "../../hooks";
import { useI18nContext } from "../../i18n";
import type { TranslationFunctions } from "../../i18n";
import { GAME_RULES, RULES_UNIT_KINDS, borderRadius, growthThreshold } from "../../data/rules";
import type { RulesUnitKind, UnitRule } from "../../data/rules";
import { paths } from "../../routes/paths";
import type { ResourceAmounts } from "../../types/game";
import { RESOURCE_KINDS, WIN_METRICS } from "../../types/game";
import { Contents, Section, Steps, UnitName } from "./RulesPage.styles";

const SECTIONS = ["goal", "map", "cities", "economy", "units", "warfare", "turn", "winning", "policy"] as const;
const TURN_STEPS = ["count", "produce", "grow", "decide", "resolve", "upkeep", "eliminate"] as const;
const CITY_SIZES = [1, 2, 3, 4, 5] as const;

/** "10 food + 10 gold" from a cost, skipping zero amounts. */
function costText(cost: ResourceAmounts, LL: TranslationFunctions): string {
  return RESOURCE_KINDS.filter((resource) => cost[resource] > 0)
    .map((resource) => LL.resourceAmount[resource]({ count: cost[resource] }))
    .join(" + ");
}

/** A unit's display name (settlers aren't a fighting unit kind, so they have their own key). */
function unitName(kind: RulesUnitKind, LL: TranslationFunctions): string {
  return kind === "settler" ? LL.rules.units.settler() : LL.unit[kind]();
}

/** Route screen for "/rules". */
export function RulesPage(): ReactElement {
  const { LL } = useI18nContext();
  const format = useFormatters();
  const rules = GAME_RULES;
  const text = LL.rules;
  const bonus = format.decimal(rules.battle.strongBonusPercent / 100, 1);

  const strongAgainstText = (unit: UnitRule): string => {
    if (unit.strongAgainst.length === 0) return text.units.none();
    return unit.strongAgainst
      .map((target) => {
        if (target === "walls") return text.units.walls();
        if (target === "all") return text.units.all({ bonus: format.decimal(rules.battle.eliteBonusPercent / 100, 2) });
        return LL.unit[target]();
      })
      .join(", ");
  };

  return (
    <PageContainer gap="md">
      <header>
        <Heading level={1}>{text.title()}</Heading>
        <Text size="lg" tone="muted">{text.intro()}</Text>
      </header>

      <Contents aria-label={text.contents()}>
        {SECTIONS.map((section) => (
          <a key={section} href={`#rules-${section}`}>
            {text[section].title()}
          </a>
        ))}
      </Contents>

      <Section id="rules-goal">
        <Heading level={2}>{text.goal.title()}</Heading>
        <Text>{text.goal.body({ min: rules.minCivs, max: rules.maxCivs, size: rules.mapSize, turns: rules.totalTurns })}</Text>
      </Section>

      <Section id="rules-map">
        <Heading level={2}>{text.map.title()}</Heading>
        <Text>{text.map.mirrored()}</Text>
        <Text>{text.map.deposits({ percent: rules.depositChancePercent })}</Text>
        <Text>{text.map.sites({ count: rules.citySitesPerQuarter, distance: rules.minSiteDistance })}</Text>
      </Section>

      <Section id="rules-cities">
        <Heading level={2}>{text.cities.title()}</Heading>
        <Text>{text.cities.capital({ max: rules.maxCities })}</Text>
        <Text>{text.cities.radius()}</Text>
        <Text>{text.cities.growth({ max: rules.maxCitySize })}</Text>
        <Text>{text.cities.lock()}</Text>
        <Text>{text.cities.settlers()}</Text>
        <Heading level={3}>{text.cities.growthTable()}</Heading>
        <DataTable<number>
          minWidth={320}
          rows={CITY_SIZES}
          rowKey={(size) => String(size)}
          columns={[
            { key: "size", header: text.cities.size(), render: (size) => size },
            { key: "reach", header: text.cities.reach(), render: (size) => borderRadius(size) },
            {
              key: "points",
              header: text.cities.pointsToGrow(),
              render: (size) => (size === rules.maxCitySize ? text.cities.maxSize() : format.integer(growthThreshold(size))),
            },
          ]}
        />
      </Section>

      <Section id="rules-economy">
        <Heading level={2}>{text.economy.title()}</Heading>
        <Text>{text.economy.deposits({ amount: rules.depositYield })}</Text>
        <Text>{text.economy.cityIncome({ ...rules.cityIncomePerSize })}</Text>
        <Text>{text.economy.upkeep()}</Text>
        <Text>{text.economy.claim({ food: rules.claimTileCost.food, gold: rules.claimTileCost.gold })}</Text>
        <Text>
          {text.economy.market({
            min: rules.market.minPricePercent,
            max: rules.market.maxPricePercent,
            spread: rules.market.spreadPercent,
          })}
        </Text>
        <Text>
          {text.economy.basePrices({
            food: format.decimal(rules.market.basePrice.food),
            ore: format.decimal(rules.market.basePrice.ore),
            gold: format.decimal(rules.market.basePrice.gold),
          })}
        </Text>
      </Section>

      <Section id="rules-units">
        <Heading level={2}>{text.units.title()}</Heading>
        <Text>{text.units.intro({ bonus })}</Text>
        <DataTable<RulesUnitKind>
          minWidth={640}
          rows={RULES_UNIT_KINDS}
          rowKey={(kind) => kind}
          columns={[
            {
              key: "unit",
              header: text.units.unit(),
              render: (kind) => (
                <UnitName>
                  {kind !== "settler" && <UnitShape kind={kind} civ={0} size={14} />}
                  {unitName(kind, LL)}
                </UnitName>
              ),
            },
            { key: "attack", header: text.units.attack(), render: (kind) => rules.units[kind].attack },
            { key: "defence", header: text.units.defence(), render: (kind) => rules.units[kind].defence },
            { key: "cost", header: text.units.cost(), render: (kind) => costText(rules.units[kind].cost, LL) },
            { key: "upkeep", header: text.units.upkeep(), render: (kind) => rules.units[kind].upkeep },
            { key: "strong", header: text.units.strongAgainst(), render: (kind) => strongAgainstText(rules.units[kind]) },
          ]}
        />
        <Text size="md" tone="muted">{text.units.eliteCap()}</Text>
      </Section>

      <Section id="rules-warfare">
        <Heading level={2}>{text.warfare.title()}</Heading>
        <Text>{text.warfare.attack()}</Text>
        <Text>{text.warfare.defenders()}</Text>
        <Text>
          {text.warfare.strength({
            walls: rules.battle.wallsPerSize,
            capital: rules.battle.capitalWallBonusPercent,
            siege: format.decimal(rules.battle.siegeWallBonusPercent / 100, 1),
            roll: rules.battle.rollPercent,
          })}
        </Text>
        <Text>{text.warfare.win()}</Text>
        <Text>{text.warfare.plunder()}</Text>
        <Text>{text.warfare.lose()}</Text>
        <Text>{text.warfare.capital()}</Text>
        <Text>{text.warfare.elimination()}</Text>
      </Section>

      <Section id="rules-turn">
        <Heading level={2}>{text.turn.title()}</Heading>
        <Steps>
          {TURN_STEPS.map((step) => (
            <li key={step}>
              <Text as="span">
                {step === "decide" ? text.turn.steps.decide({ count: rules.policy.maxActiveRules }) : text.turn.steps[step]()}
              </Text>
            </li>
          ))}
        </Steps>
      </Section>

      <Section id="rules-winning">
        <Heading level={2}>{text.winning.title()}</Heading>
        <DataTable<(typeof WIN_METRICS)[number]>
          minWidth={480}
          rows={WIN_METRICS}
          rowKey={(metric) => metric}
          columns={[
            { key: "metric", header: text.winning.metric(), render: (metric) => <Text as="strong" weight="semibold">{LL.metric[metric]()}</Text> },
            {
              key: "winner",
              header: text.winning.winner(),
              render: (metric) =>
                metric === "score"
                  ? text.winning.score({ tiles: rules.score.tileWeight, wealth: rules.score.wealthDivisor })
                  : text.winning[metric](),
            },
          ]}
        />
      </Section>

      <Section id="rules-policy">
        <Heading level={2}>{text.policy.title()}</Heading>
        <Text>{text.policy.body({ max: rules.policy.maxRules, active: rules.policy.maxActiveRules })}</Text>
        <Link to={paths.editor}>{text.policy.edit()}</Link>
      </Section>
    </PageContainer>
  );
}
