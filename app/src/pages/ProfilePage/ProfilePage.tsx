// Profile page ("/profile/:wallet"): a player's stats, Elo trend, policies and match history.
// Design artboard "Player profile".

import { useState } from "react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router";
import { Button, Heading, Icon, StatusChip, Surface, Swatch, Text, VisuallyHidden } from "../../components/atoms";
import { BarChart, QueryStatus, StatCard } from "../../components/molecules";
import { DataTable } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { useFormatters, useProfile } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { initialsFor, shortenAddress, signedNumber } from "../../model/format";
import { SAMPLE_FINISHED_MATCH_ID, paths, replayPath } from "../../routes/paths";
import type { MatchHistoryEntry } from "../../types/game";
import { CopyButton, HeaderRow, Identity, PolicyCard, PolicyTop, RentCard, StatGrid } from "./ProfilePage.styles";

const ELO_CHART_MIN = 1400;
const ELO_CHART_MAX = 1700;

/** Route screen for "/profile/:wallet". */
export function ProfilePage(): ReactElement {
  const { LL } = useI18nContext();
  const format = useFormatters();
  const { wallet = "" } = useParams();
  const profile = useProfile(shortenAddress(decodeURIComponent(wallet)));
  const [isCopied, setIsCopied] = useState(false);

  if (profile.isPending) return <PageContainer><QueryStatus kind="loading" text={LL.states.loading()} /></PageContainer>;
  if (profile.isError) return <PageContainer><QueryStatus kind="error" text={LL.states.error({ message: profile.error.message })} /></PageContainer>;

  const player = profile.data;
  const losses = player.matches - player.wins;
  const eloLosses = player.eloHistory.filter((elo, index) => index > 0 && elo < (player.eloHistory[index - 1] ?? elo)).length;
  const firstElo = player.eloHistory[0] ?? player.elo;

  const copyWallet = (): void => {
    void navigator.clipboard?.writeText(decodeURIComponent(wallet)).then(() => setIsCopied(true));
  };

  return (
    <PageContainer>
      <HeaderRow>
        <Swatch color={{ avatar: player.colorIndex }} size="profile">{initialsFor(player.bot)}</Swatch>
        <Identity>
          <Heading level={1} size="h2">{player.bot}</Heading>
          <div>
            <Text as="span" tone="muted" isMono>{player.wallet}</Text>
            <CopyButton type="button" aria-label={isCopied ? LL.copied() : LL.copyAddress()} onClick={copyWallet}>
              <Icon name={isCopied ? "check" : "copy"} size={16} />
            </CopyButton>
            <Text as="span" tone="muted">{LL.players.profile.since({ month: format.month(player.playingSince), rank: player.rank })}</Text>
          </div>
        </Identity>
        <Button to={paths.createLobby}>{LL.players.profile.challenge()}</Button>
      </HeaderRow>

      <StatGrid aria-label={LL.players.profile.stats()}>
        <StatCard label={LL.players.profile.elo()} value={format.integer(player.elo)} note={LL.players.profile.eloNote({ change: signedNumber(player.lastEloChange) })} noteTone={player.lastEloChange >= 0 ? "success" : "danger"} />
        <StatCard label={LL.players.profile.played()} value={String(player.matches)} note={LL.players.profile.playedNote({ wins: player.wins, losses })} />
        <StatCard
          label={LL.players.profile.winRate()}
          value={format.percent(player.winRate)}
          note={LL.players.profile.winRateNote({ metric: LL.metric[player.bestMetric](), rate: player.bestMetricWinRate })}
        />
        <StatCard label={LL.players.profile.winnings()} value={format.sol(player.winningsSol)} note={LL.players.profile.winningsNote()} />
      </StatGrid>

      <Columns
        sideSize="lg"
        main={
          <Surface as="section" labelledBy="elo-chart">
            <Heading level={2} id="elo-chart">{LL.players.profile.eloChart({ count: player.eloHistory.length })}</Heading>
            <BarChart
              height="md"
              min={ELO_CHART_MIN}
              max={ELO_CHART_MAX}
              label={LL.players.profile.eloChartLabel({ first: firstElo, last: player.elo, count: player.eloHistory.length, losses: eloLosses })}
              groups={player.eloHistory.map((elo, index) => ({
                key: String(index),
                bars: [{ value: elo, color: index > 0 && elo < (player.eloHistory[index - 1] ?? elo) ? { resource: "ore" } : { civ: 0 } }],
              }))}
            />
            <Text size="xs" tone="muted">
              {LL.players.profile.eloStart({ count: player.eloHistory.length, elo: firstElo })} · {LL.players.profile.eloLatest({ elo: player.elo })}
            </Text>
          </Surface>
        }
        end={
          <Surface as="section" labelledBy="policies">
            <Heading level={2} id="policies">{LL.players.profile.policies()}</Heading>
            {player.policies.map((policy) => (
              <PolicyCard key={policy.name}>
                <PolicyTop>
                  <Text as="span" weight="semibold">{policy.name}</Text>
                  <StatusChip tone={policy.isDraft ? "pending" : "neutral"}>{policy.isDraft ? LL.status.draft() : LL.status.public()}</StatusChip>
                </PolicyTop>
                <Text size="xs" tone="muted" isMono>{policy.hash === null ? LL.players.profile.notCommitted() : `sha256 ${policy.hash}`}</Text>
                <Text size="sm" tone="muted">
                  {policy.isDraft ? LL.status.draft() : LL.players.profile.policyRecord({ matches: policy.matches, wins: policy.wins })}
                </Text>
              </PolicyCard>
            ))}
            <RentCard>
              <Text weight="semibold">
                {LL.players.profile.rentTitle()} <Text as="span" size="xs" tone="warning" weight="semibold">{LL.players.profile.rentLater()}</Text>
              </Text>
              <Text size="sm" tone="muted">{LL.players.profile.rentBody()}</Text>
            </RentCard>
          </Surface>
        }
      />

      <Surface as="section" labelledBy="history">
        <Heading level={2} id="history">{LL.players.profile.history()}</Heading>
        <DataTable<MatchHistoryEntry>
          minWidth={760}
          rows={player.history}
          rowKey={(row) => row.matchId}
          columns={[
            { key: "match", header: LL.players.profile.match(), render: (row) => <Text as="span" isMono>{row.matchId}</Text> },
            { key: "metric", header: LL.players.profile.metric(), render: (row) => LL.metric[row.metric]() },
            {
              key: "result",
              header: LL.players.profile.result(),
              render: (row) => (
                <StatusChip tone={row.place === 1 ? "positive" : row.place === row.playerCount ? "negative" : "neutral"}>
                  {LL.players.profile.resultValue({ place: row.place, total: row.playerCount })}
                </StatusChip>
              ),
            },
            { key: "elo", header: LL.players.profile.eloCol(), render: (row) => <Text as="span" weight="semibold" tone={row.eloChange >= 0 ? "success" : "danger"}>{signedNumber(row.eloChange)}</Text> },
            { key: "payout", header: LL.players.profile.payout(), render: (row) => format.sol(row.payoutSol) },
            { key: "policy", header: LL.players.profile.policy(), render: (row) => <Text as="span" tone="muted">{row.policyVersion}</Text> },
            {
              key: "replay",
              header: <VisuallyHidden>{LL.players.profile.actions()}</VisuallyHidden>,
              isEnd: true,
              render: (row) => <Link to={replayPath(row.matchId === "#9B4E" ? row.matchId : SAMPLE_FINISHED_MATCH_ID)}>{LL.players.profile.replay()}</Link>,
            },
          ]}
        />
      </Surface>
    </PageContainer>
  );
}
