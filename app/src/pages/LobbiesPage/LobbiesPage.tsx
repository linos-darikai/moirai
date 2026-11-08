// Lobbies page (home, "/"): the pitch, how a match works, open lobbies with a win-metric filter,
// matches being played now and the top players. Design artboard "Lobbies (home)".

import { useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Button, Heading, Surface, Text } from "../../components/atoms";
import { LobbyCard, PanelHeader, QueryStatus, RankedRow, SegmentedControl, StepList } from "../../components/molecules";
import { Columns, PageContainer } from "../../components/templates";
import { useFormatters, useLiveMatches, useLobbies, useTopPlayers } from "../../hooks";
import { useI18nContext } from "../../i18n";
import type { TranslationFunctions } from "../../i18n";
import { lobbyPath, matchPath, paths } from "../../routes/paths";
import type { LobbySummary, WinMetric } from "../../types/game";
import { WIN_METRICS } from "../../types/game";
import { Eyebrow, Hero, HeroActions, LiveItem, LiveLeader, LiveList, LobbyGrid, TopList } from "./LobbiesPage.styles";

const TOP_PLAYER_COUNT = 5;
const HOW_IT_WORKS = ["write", "join", "play", "settle"] as const;

/** The translated text a lobby card shows. */
function lobbyCardText(lobby: LobbySummary, LL: TranslationFunctions) {
  const isFree = lobby.entryFeeSol === 0;
  return {
    metricLabel: LL.metric[lobby.metric](),
    feeText: isFree ? LL.lobbies.card.free() : LL.sol({ amount: lobby.entryFeeSol }),
    poolText: LL.lobbies.card.entry({ pool: lobby.poolSol === 0 ? LL.lobbies.card.noPrize() : LL.sol({ amount: lobby.poolSol }) }),
    turnsLabel: LL.lobbies.card.turns(),
    payoutLabel: LL.lobbies.card.payout(),
    payoutText: LL.payout[lobby.payout](),
    seatsLabel: LL.lobbies.card.seats(),
    seatsText: LL.lobbies.card.seatsTaken({ joined: lobby.joinedCount, total: lobby.seatCount }),
    closesLabel: LL.lobbies.card.joinCloses(),
    closesText: LL.lobbies.create.inDuration({ minutes: lobby.closesInMinutes }),
    viewLabel: LL.lobbies.card.viewLobby({ id: lobby.id }),
  };
}

/** Route screen for "/". */
export function LobbiesPage(): ReactElement {
  const { LL } = useI18nContext();
  const format = useFormatters();
  const [metricFilter, setMetricFilter] = useState<WinMetric | "all">("all");
  const lobbies = useLobbies(metricFilter);
  const liveMatches = useLiveMatches();
  const topPlayers = useTopPlayers(TOP_PLAYER_COUNT);

  const filterOptions = [
    { value: "all" as const, label: LL.lobbies.home.filterAll() },
    ...WIN_METRICS.map((metric) => ({ value: metric, label: LL.metric[metric]() })),
  ];

  return (
    <PageContainer gap="xl">
      <Columns
        align="stretch"
        sideSize="fluid"
        main={
          <Hero>
            <Eyebrow>{LL.lobbies.home.eyebrow()}</Eyebrow>
            <Heading level={1} size="display">
              {LL.lobbies.home.titleLine1()}
              <br />
              {LL.lobbies.home.titleLine2()}
            </Heading>
            <Text size="lg" tone="muted">
              {LL.lobbies.home.intro()}
            </Text>
            <HeroActions>
              <Button to={paths.createLobby}>{LL.lobbies.home.createLobby()}</Button>
              <Button to={paths.editor} variant="secondary">
                {LL.lobbies.home.writePolicy()}
              </Button>
            </HeroActions>
          </Hero>
        }
        end={
          <Surface as="aside" labelledBy="how-it-works">
            <Heading level={2} size="card" id="how-it-works">
              {LL.lobbies.home.howItWorks()}
            </Heading>
            <StepList
              steps={HOW_IT_WORKS.map((step) => ({
                id: step,
                title: LL.lobbies.home.steps[step].title(),
                body: LL.lobbies.home.steps[step].body(),
                state: "upcoming",
              }))}
            />
          </Surface>
        }
      />

      <section aria-labelledby="open-lobbies">
        <PanelHeader
          title={LL.lobbies.home.openLobbies()}
          id="open-lobbies"
          size="h2"
          aside={
            <SegmentedControl
              label={LL.lobbies.home.filterLabel()}
              shape="pills"
              options={filterOptions}
              value={metricFilter}
              onChange={setMetricFilter}
            />
          }
        />
        <Text tone="muted">{LL.lobbies.home.openLobbiesIntro()}</Text>
        {lobbies.isPending && <QueryStatus kind="loading" text={LL.states.loading()} />}
        {lobbies.isError && <QueryStatus kind="error" text={LL.states.error({ message: lobbies.error.message })} />}
        {lobbies.data !== undefined && lobbies.data.length === 0 && (
          <QueryStatus kind="empty" text={LL.lobbies.home.noLobbies()} />
        )}
        {lobbies.data !== undefined && lobbies.data.length === 0 && (
          <Link to={paths.createLobby}>{LL.lobbies.home.createOne()}</Link>
        )}
        <LobbyGrid>
          {lobbies.data?.map((lobby) => (
            <LobbyCard
              key={lobby.id}
              id={lobby.id}
              metric={lobby.metric}
              turns={lobby.turns}
              joinedCount={lobby.joinedCount}
              seatCount={lobby.seatCount}
              lobbyPath={lobbyPath(lobby.id)}
              text={lobbyCardText(lobby, LL)}
            />
          ))}
        </LobbyGrid>
      </section>

      <Columns
        sideSize="fluid"
        main={
          <Surface as="section" labelledBy="live-now">
            <PanelHeader
              title={LL.lobbies.home.liveNow()}
              id="live-now"
              aside={
                <Text as="span" size="sm" tone="muted">
                  {LL.lobbies.home.liveCount({ count: liveMatches.data?.length ?? 0 })}
                </Text>
              }
            />
            {liveMatches.isPending && <QueryStatus kind="loading" text={LL.states.loading()} />}
            <LiveList>
              {liveMatches.data?.map((match) => (
                <LiveItem key={match.id}>
                  <Text as="span" size="sm" tone="muted" isMono>
                    {match.id}
                  </Text>
                  <LiveLeader>
                    <Text as="span" weight="medium">
                      {LL.lobbies.home.leads({ bot: match.leaderBot, metric: LL.metric[match.metric]() })}
                    </Text>
                  </LiveLeader>
                  <Text as="span" size="md" tone="muted">
                    {LL.turnOf({ turn: match.turn, total: match.totalTurns })}
                  </Text>
                  <Button to={matchPath(match.id)} variant="secondary" size="sm">
                    {LL.lobbies.home.watch()}
                  </Button>
                </LiveItem>
              ))}
            </LiveList>
          </Surface>
        }
        end={
          <Surface as="section" labelledBy="top-players">
            <PanelHeader
              title={LL.lobbies.home.topPlayers()}
              id="top-players"
              aside={<Link to={paths.leaderboard}>{LL.lobbies.home.fullLeaderboard()}</Link>}
            />
            {topPlayers.isPending && <QueryStatus kind="loading" text={LL.states.loading()} />}
            <TopList>
              {topPlayers.data?.map((player) => (
                <RankedRow
                  key={player.wallet}
                  rank={player.rank}
                  color={{ avatar: player.colorIndex }}
                  swatchSize="md"
                  name={player.bot}
                  detail={player.wallet}
                  value={format.integer(player.elo)}
                />
              ))}
            </TopList>
          </Surface>
        }
      />
    </PageContainer>
  );
}
