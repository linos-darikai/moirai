// Live match page ("/match/:matchId"): civs, the map and the turn feed and market. On phones the
// civs/feed/market collapse into tabs under the map. Design artboards "Live match" and "Live match
// on a phone".

import { useState } from "react";
import type { ReactElement } from "react";
import { useParams } from "react-router";
import { Button, Heading, ProgressBar, Surface, Text } from "../../components/atoms";
import { CivCard, MapLegend, QueryStatus, RankedRow, SegmentedControl } from "../../components/molecules";
import { MapBoard, MarketPrices, TurnFeed } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { useBoardAtTurn, useMatch } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { civNamesFrom } from "../../model/civNames";
import { idFromUrl, replayPath } from "../../routes/paths";
import type { UnitKind } from "../../types/game";
import { DesktopOnly, LiveStatus, MatchHeader, MobileOnly, Pills, Progress, TabPanel } from "./MatchPage.styles";

type DetailTab = "standings" | "feed" | "market";

/** Route screen for "/match/:matchId". */
export function MatchPage(): ReactElement {
  const { LL } = useI18nContext();
  const { matchId } = useParams();
  const match = useMatch(idFromUrl(matchId));
  const [tab, setTab] = useState<DetailTab>("standings");
  const board = useBoardAtTurn(match.data?.seedHex ?? "", match.data?.turn ?? 0);

  if (match.isPending) return <PageContainer><QueryStatus kind="loading" text={LL.states.loading()} /></PageContainer>;
  if (match.isError) return <PageContainer><QueryStatus kind="error" text={LL.states.error({ message: match.error.message })} /></PageContainer>;

  const detail = match.data;
  const civNames = civNamesFrom(detail.civs);
  const displayName = (bot: string, isYou: boolean): string => (isYou ? LL.you({ name: bot }) : bot);
  const unitLabels: Record<UnitKind, string> = {
    infantry: LL.unit.infantry(),
    guard: LL.unit.guard(),
    siege: LL.unit.siege(),
    elite: LL.unit.elite(),
  };

  const civList = detail.civs.map((civ, index) => (
    <CivCard
      key={civ.civIndex}
      rank={index + 1}
      civIndex={civ.civIndex}
      name={displayName(civ.bot, civ.isYou)}
      tilesText={LL.tiles({ count: civ.tiles })}
      resourceText={{
        food: LL.resourceAmount.food({ count: civ.resources.food }),
        ore: LL.resourceAmount.ore({ count: civ.resources.ore }),
        gold: LL.resourceAmount.gold({ count: civ.resources.gold }),
      }}
      units={civ.units}
      unitLabels={unitLabels}
      armyText={LL.army({ count: civ.army })}
      isYou={civ.isYou}
    />
  ));

  return (
    <PageContainer width="wide" gap="md">
      <MatchHeader>
        <div>
          <LiveStatus>{LL.matches.live.status({ metric: LL.metric[detail.metric](), id: detail.id })}</LiveStatus>
          <Heading level={1} size="h2">{LL.turnOf({ turn: detail.turn, total: detail.totalTurns })}</Heading>
        </div>
        <Progress>
          <ProgressBar value={detail.turn} max={detail.totalTurns} label={LL.matches.live.progress()} height="regular" />
          <Text size="sm" tone="muted">
            {LL.matches.live.nextTurn({ wallet: detail.lastCrankWallet, reward: LL.sol({ amount: detail.lastCrankRewardSol }) })}
          </Text>
        </Progress>
        <Pills>
          <span>{LL.matches.live.rollup()}</span>
          <span>{LL.matches.live.pool({ amount: LL.sol({ amount: detail.poolSol }) })}</span>
        </Pills>
      </MatchHeader>

      <Columns
        sideSize="md"
        mainMaxWidth="map"
        start={
          <DesktopOnly as="section" aria-labelledby="civs">
            <Heading level={2} size="card" id="civs">{LL.matches.live.civs()}</Heading>
            {civList}
          </DesktopOnly>
        }
        main={
          <section aria-labelledby="map-heading">
            <Heading level={2} size="card" id="map-heading">{LL.matches.live.map()}</Heading>
            <MapBoard board={board.board} isPending={board.isPending} error={board.error} turn={detail.turn} civNames={civNames} />
            <MapLegend
              label={LL.map.legend()}
              foodLabel={LL.map.legendFood()}
              oreLabel={LL.map.legendOre()}
              goldLabel={LL.map.legendGold()}
              cityLabel={LL.map.legendCity()}
              citySiteLabel={LL.map.legendCitySite()}
              contestedLabel={LL.map.legendContested()}
            />
            <MobileOnly>
              <SegmentedControl
                label={LL.matches.live.details()}
                isFullWidth
                options={[
                  { value: "standings" as const, label: LL.matches.live.tabStandings() },
                  { value: "feed" as const, label: LL.matches.live.tabFeed() },
                  { value: "market" as const, label: LL.matches.live.tabMarket() },
                ]}
                value={tab}
                onChange={setTab}
              />
              <TabPanel>
                {tab === "standings" && (
                  <ol>
                    {detail.civs.map((civ, index) => (
                      <RankedRow
                        key={civ.civIndex}
                        look="boxed"
                        rank={index + 1}
                        color={{ civ: civ.civIndex }}
                        name={displayName(civ.bot, civ.isYou)}
                        value={String(civ.tiles)}
                        isHighlighted={civ.isYou}
                      />
                    ))}
                  </ol>
                )}
                {tab === "feed" && <TurnFeed events={detail.feed} civNames={civNames} showTurns={false} look="boxed" />}
                {tab === "market" && <MarketPrices prices={detail.market} look="cards" />}
              </TabPanel>
            </MobileOnly>
          </section>
        }
        end={
          <DesktopOnly>
            <Surface as="section" labelledBy="feed" padding="md">
              <Heading level={2} size="card" id="feed">{LL.matches.live.feed()}</Heading>
              <TurnFeed events={detail.feed} civNames={civNames} />
            </Surface>
            <Surface as="section" labelledBy="market" padding="md">
              <Heading level={2} size="card" id="market">{LL.matches.live.market()}</Heading>
              <MarketPrices prices={detail.market} />
              <Text size="xs" tone="muted">{LL.matches.live.marketNote()}</Text>
            </Surface>
            <Button to={replayPath(detail.id)} variant="secondary" isFullWidth>{LL.matches.live.rewind()}</Button>
          </DesktopOnly>
        }
      />
    </PageContainer>
  );
}
