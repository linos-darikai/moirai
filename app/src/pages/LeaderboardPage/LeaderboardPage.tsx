// Leaderboard page ("/leaderboard"): the podium, then all rankings with a search box.
// Design artboard "Leaderboard".

import { useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Heading, Icon, Input, ProgressBar, Surface, Swatch, Text, VisuallyHidden } from "../../components/atoms";
import { KeyValueList, PanelHeader, QueryStatus, SegmentedControl } from "../../components/molecules";
import { DataTable } from "../../components/organisms";
import { PageContainer } from "../../components/templates";
import { useFormatters, useLeaderboard } from "../../hooks";
import type { LeaderboardPeriod } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { profilePath } from "../../routes/paths";
import type { PlayerRanking } from "../../types/game";
import { BotCell, HeaderRow, Podium, PodiumCard, PodiumTop, RankNumber, RateCell, Search } from "./LeaderboardPage.styles";

/** Podium order: 2nd, 1st, 3rd (the winner in the middle, tallest). */
const PODIUM_ORDER = [1, 0, 2] as const;

/** Route screen for "/leaderboard". */
export function LeaderboardPage(): ReactElement {
  const { LL } = useI18nContext();
  const format = useFormatters();
  const [period, setPeriod] = useState<LeaderboardPeriod>("allTime");
  const [query, setQuery] = useState("");
  const rankings = useLeaderboard(period);

  const all = rankings.data ?? [];
  const search = query.trim().toLowerCase();
  const filtered = search === "" ? all : all.filter((row) => row.bot.includes(search) || row.wallet.toLowerCase().includes(search));

  return (
    <PageContainer>
      <HeaderRow>
        <div>
          <Heading level={1}>{LL.players.leaderboard.title()}</Heading>
          <Text tone="muted">{LL.players.leaderboard.intro()}</Text>
        </div>
        <SegmentedControl
          label={LL.players.leaderboard.period()}
          options={[
            { value: "week" as const, label: LL.players.leaderboard.week() },
            { value: "month" as const, label: LL.players.leaderboard.month() },
            { value: "allTime" as const, label: LL.players.leaderboard.allTime() },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </HeaderRow>

      {rankings.isPending && <QueryStatus kind="loading" text={LL.states.loading()} />}
      {rankings.isError && <QueryStatus kind="error" text={LL.states.error({ message: rankings.error.message })} />}

      <Podium aria-label={LL.players.leaderboard.topThree()}>
        {PODIUM_ORDER.map((index) => {
          const player = all[index];
          if (player === undefined) return null;
          return (
            <PodiumCard key={player.wallet} $place={index}>
              <PodiumTop>
                <RankNumber $place={index}>{LL.players.leaderboard.rankLabel({ rank: player.rank })}</RankNumber>
                <Swatch color={{ avatar: player.colorIndex }} size="xl" />
              </PodiumTop>
              <div>
                <Link to={profilePath(player.wallet)}>
                  <Text as="span" size="xxl" weight="bold" isDisplay>{player.bot}</Text>
                </Link>
                <Text size="sm" tone="muted" isMono>{player.wallet}</Text>
              </div>
              <KeyValueList
                layout="grid"
                columns={3}
                rows={[
                  { key: "elo", label: LL.players.leaderboard.elo(), value: <Text as="span" size="lg" weight="bold" isDisplay>{format.integer(player.elo)}</Text> },
                  { key: "wins", label: LL.players.leaderboard.wins(), value: <Text as="span" size="lg" weight="bold" isDisplay>{Math.round(player.matches * player.winRate)}</Text> },
                  { key: "won", label: LL.players.leaderboard.won(), value: <Text as="span" size="lg" weight="bold" isDisplay>{format.sol(player.winningsSol)}</Text> },
                ]}
              />
            </PodiumCard>
          );
        })}
      </Podium>

      <Surface as="section" labelledBy="rankings">
        <PanelHeader
          title={LL.players.leaderboard.rankings()}
          id="rankings"
          aside={
            <Search>
              <Icon name="search" size={16} />
              <VisuallyHidden htmlFor="find-player">{LL.players.leaderboard.find()}</VisuallyHidden>
              <Input id="find-player" type="search" value={query} onChange={setQuery} placeholder={LL.players.leaderboard.find()} />
            </Search>
          }
        />
        {filtered.length === 0 && all.length > 0 ? (
          <QueryStatus kind="empty" text={LL.players.leaderboard.noMatch({ query })} />
        ) : (
          <DataTable<PlayerRanking>
            minWidth={820}
            rows={filtered}
            rowKey={(row) => row.wallet}
            isRowHighlighted={(row) => row.rank === 1}
            columns={[
              { key: "rank", header: LL.players.leaderboard.rank(), render: (row) => <Text as="span" tone="muted" isMono>{row.rank}</Text> },
              {
                key: "bot",
                header: LL.players.leaderboard.bot(),
                render: (row) => (
                  <BotCell>
                    <Swatch color={{ avatar: row.colorIndex }} size="md" />
                    <span>
                      <Link to={profilePath(row.wallet)}><Text as="span" weight="semibold">{row.bot}</Text></Link>
                      <Text size="xs" tone="muted" isMono>{row.wallet}</Text>
                    </span>
                  </BotCell>
                ),
              },
              { key: "elo", header: LL.players.leaderboard.elo(), render: (row) => <Text as="span" weight="bold" isDisplay>{format.integer(row.elo)}</Text> },
              { key: "matches", header: LL.players.leaderboard.matches(), render: (row) => row.matches },
              {
                key: "rate",
                header: LL.players.leaderboard.winRate(),
                render: (row) => (
                  <RateCell>
                    <ProgressBar value={row.winRate} max={1} />
                    {format.percent(row.winRate)}
                  </RateCell>
                ),
              },
              { key: "won", header: LL.players.leaderboard.winnings(), render: (row) => <Text as="span" weight="semibold">{format.sol(row.winningsSol)}</Text> },
              { key: "hash", header: LL.players.leaderboard.bestPolicy(), render: (row) => <Text as="span" size="sm" tone="muted" isMono>{row.bestPolicyHash}</Text> },
            ]}
          />
        )}
        <Text size="sm" tone="muted">{LL.players.leaderboard.note()}</Text>
      </Surface>
    </PageContainer>
  );
}
