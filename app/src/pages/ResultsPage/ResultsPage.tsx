// Results page ("/match/:matchId/results"): the winner, final standings with payouts and Elo, where
// the pool went and the settlement transactions. Design artboard "Results and payout".

import type { ReactElement } from "react";
import { Link, useParams } from "react-router";
import { Button, Heading, Surface, Swatch, Text } from "../../components/atoms";
import { KeyValueList, QueryStatus } from "../../components/molecules";
import { DataTable, MapBoard } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { useBoardAtTurn, useFormatters, useMatchResults } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { civNamesFrom } from "../../model/civNames";
import { signedNumber } from "../../model/format";
import { idFromUrl, paths, replayPath } from "../../routes/paths";
import type { ResultRow } from "../../types/game";
import { BoardCaption, HeroActions, PoolBar, PoolSegment, TxList } from "./ResultsPage.styles";

const TOTAL_TILES = 256;

/** Route screen for "/match/:matchId/results". */
export function ResultsPage(): ReactElement {
  const { LL } = useI18nContext();
  const format = useFormatters();
  const { matchId } = useParams();
  const results = useMatchResults(idFromUrl(matchId));
  const board = useBoardAtTurn(results.data?.seedHex ?? "", results.data?.turns ?? 60);

  if (results.isPending) return <PageContainer><QueryStatus kind="loading" text={LL.states.loading()} /></PageContainer>;
  if (results.isError) return <PageContainer><QueryStatus kind="error" text={LL.states.error({ message: results.error.message })} /></PageContainer>;

  const detail = results.data;
  const winner = detail.rows[0];
  const civNames = civNamesFrom(detail.rows);
  const winnerShare = detail.poolSol === 0 ? 0 : ((winner?.payoutSol ?? 0) / detail.poolSol) * 100;
  const displayName = (row: ResultRow): string => (row.isYou ? LL.you({ name: row.bot }) : row.bot);

  return (
    <PageContainer>
      <Columns
        align="stretch"
        sideSize="lg"
        main={
          <Surface tone="win" padding="xl">
            <Heading level={2} size="eyebrow">{LL.matches.results.eyebrow({ id: detail.id, metric: LL.metric[detail.metric]() })}</Heading>
            <Heading level={1} size="hero">{LL.matches.results.wins({ name: winner?.bot ?? "" })}</Heading>
            <Text size="lg" tone="soft">
              {LL.matches.results.summaryStart({ tiles: winner?.tiles ?? 0, total: TOTAL_TILES, turns: detail.turns })}{" "}
              <strong>{format.sol(winner?.payoutSol ?? 0)}</strong> {LL.matches.results.summaryMiddle()}{" "}
              <Text as="span" isMono>{winner?.wallet}</Text>.
            </Text>
            <HeroActions>
              <Button to={replayPath(detail.id)}>{LL.matches.results.watchReplay()}</Button>
              <Button to={paths.createLobby} variant="secondary">{LL.matches.results.rematch()}</Button>
              <Button variant="secondary" onClick={() => void navigator.clipboard?.writeText(window.location.href)}>
                {LL.matches.results.share()}
              </Button>
            </HeroActions>
          </Surface>
        }
        end={
          <div>
            <MapBoard board={board.board} isPending={board.isPending} error={board.error} turn={detail.turns} civNames={civNames} />
            <BoardCaption>{LL.matches.results.finalBoard({ turn: detail.turns })}</BoardCaption>
          </div>
        }
      />

      <Surface as="section" labelledBy="final-standings">
        <Heading level={2} id="final-standings">{LL.matches.results.standings()}</Heading>
        <DataTable<ResultRow>
          minWidth={760}
          density="comfortable"
          rows={detail.rows}
          rowKey={(row) => String(row.civIndex)}
          columns={[
            { key: "place", header: LL.matches.results.place(), render: (row) => <Text as="span" size="lg" weight="bold" isDisplay>{LL.matches.results.placeValue({ place: row.place })}</Text> },
            {
              key: "civ",
              header: LL.matches.results.civ(),
              render: (row) => (
                <span>
                  <Swatch color={{ civ: row.civIndex }} /> <Text as="strong" weight="semibold">{displayName(row)}</Text>
                  <Text size="xs" tone="muted" isMono>{row.wallet}</Text>
                </span>
              ),
            },
            { key: "tiles", header: LL.matches.results.tiles(), render: (row) => <Text as="span" weight="semibold">{row.tiles}</Text> },
            { key: "army", header: LL.matches.results.army(), render: (row) => row.army },
            { key: "payout", header: LL.matches.results.payout(), render: (row) => <Text as="span" weight="semibold">{format.sol(row.payoutSol)}</Text> },
            {
              key: "elo",
              header: LL.matches.results.elo(),
              render: (row) => (
                <span>
                  <Text as="span" weight="semibold" tone={row.eloChange >= 0 ? "success" : "danger"}>{signedNumber(row.eloChange)}</Text>{" "}
                  <Text as="span" tone="muted">{LL.matches.results.eloChange({ elo: row.eloAfter })}</Text>
                </span>
              ),
            },
            { key: "policy", header: LL.matches.results.policy(), render: (row) => <Link to={paths.editor}><Text as="span" isMono size="sm">{row.policyHash}</Text></Link> },
          ]}
        />
        <Text size="sm" tone="muted">{LL.matches.results.revealedNote()}</Text>
      </Surface>

      <Columns
        sideSize="fluid"
        main={
          <Surface as="section" labelledBy="pool">
            <Heading level={2} id="pool">{LL.matches.results.pool()}</Heading>
            <PoolBar aria-hidden="true">
              <PoolSegment $percent={winnerShare} $tone="winner" />
              <PoolSegment $percent={100 - winnerShare} $tone="crank" />
            </PoolBar>
            <KeyValueList
              rows={[
                { key: "fees", label: LL.matches.results.poolFees(), value: format.sol(detail.poolSol) },
                { key: "winner", label: <><Swatch color={{ civ: winner?.civIndex ?? 0 }} />{LL.matches.results.poolWinner()}</>, value: format.sol(winner?.payoutSol ?? 0) },
                { key: "crank", label: <><Swatch color={{ token: "accent" }} />{LL.matches.results.poolCrank({ turns: detail.turns })}</>, value: format.sol(detail.crankRewardsSol) },
                { key: "rent", label: LL.matches.results.poolRent(), value: format.sol(detail.rentReturnedSol) },
              ]}
            />
          </Surface>
        }
        end={
          <Surface as="section" labelledBy="settlement">
            <Heading level={2} id="settlement">{LL.matches.results.settlement()}</Heading>
            <TxList>
              <li><span>{LL.matches.results.txCommitted()}</span><Text as="span" isMono size="md">{detail.transactions.committed}</Text></li>
              <li><span>{LL.matches.results.txSettle()}</span><Text as="span" isMono size="md">{detail.transactions.settled}</Text></li>
              <li><span>{LL.matches.results.txClosed()}</span><Text as="span" isMono size="md">{detail.transactions.closed}</Text></li>
            </TxList>
            <Text size="sm" tone="muted">{LL.matches.results.txCount()}</Text>
          </Surface>
        }
      />
    </PageContainer>
  );
}
