// Replay page ("/match/:matchId/replay"): scrub or play a finished match turn by turn, with key
// moments and the "verified against the chain" panel. Design artboard "Replay and verify".
// SAMPLE: the state hash and transaction per turn are placeholders until replay re-runs real turns.

import type { ReactElement } from "react";
import { useParams } from "react-router";
import { Button, Heading, Icon, Surface, Text } from "../../components/atoms";
import { Breadcrumb, KeyValueList, QueryStatus, RankedRow } from "../../components/molecules";
import { MapBoard, ReplayTimeline } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { useBoardAtTurn, useMatchResults, usePlayback, useReplayMoments } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { civNamesFrom } from "../../model/civNames";
import { idFromUrl, resultsPath } from "../../routes/paths";
import type { CivIndex, ReplayMoment } from "../../types/game";
import { HeaderRow, HeaderActions, VerifyTitle } from "./ReplayPage.styles";

const TOTAL_TURNS = 60;
const CIVS: readonly CivIndex[] = [0, 1, 2, 3];

/** The latest moment at or before `turn`. */
function momentAt(moments: readonly ReplayMoment[], turn: number): ReplayMoment | null {
  let latest: ReplayMoment | null = moments[0] ?? null;
  for (const moment of moments) {
    if (moment.turn <= turn) latest = moment;
  }
  return latest;
}

/** PLACEHOLDER state hash per turn until replay re-runs civ-core turns. */
function placeholderStateHash(turn: number): string {
  const hex = (Math.imul(turn + 1, 2654435761) >>> 0).toString(16).padStart(8, "0");
  return `0x${hex.slice(0, 4)}…${hex.slice(4)}`;
}

/** Route screen for "/match/:matchId/replay". */
export function ReplayPage(): ReactElement {
  const { LL } = useI18nContext();
  const { matchId } = useParams();
  const id = idFromUrl(matchId);
  const results = useMatchResults(id);
  const moments = useReplayMoments(id);
  // Plays like a video from turn 0; the timeline can be dragged while it plays.
  const playback = usePlayback(TOTAL_TURNS, { restartKey: id });
  const turn = playback.turn;
  const board = useBoardAtTurn(results.data?.seedHex ?? "", turn);

  if (results.isPending || moments.isPending) return <PageContainer><QueryStatus kind="loading" text={LL.states.loading()} /></PageContainer>;
  if (results.isError) return <PageContainer><QueryStatus kind="error" text={LL.states.error({ message: results.error.message })} /></PageContainer>;

  const detail = results.data;
  const civNames = civNamesFrom(detail.rows);
  const allMoments = moments.data ?? [];
  const moment = momentAt(allMoments, turn);
  const standings = board.board === null ? [] : [...CIVS].sort((a, b) => (board.board?.tilesByCiv[b] ?? 0) - (board.board?.tilesByCiv[a] ?? 0));
  const maxTiles = board.board === null ? 1 : Math.max(1, ...CIVS.map((civ) => board.board?.tilesByCiv[civ] ?? 0));


  return (
    <PageContainer width="wide" gap="md">
      <HeaderRow>
        <div>
          <Breadcrumb
            label={LL.breadcrumb()}
            items={[{ label: LL.matches.replay.breadcrumb({ id: detail.id }), to: resultsPath(detail.id) }, { label: LL.matches.replay.crumbReplay() }]}
          />
          <Heading level={1} size="h2">{LL.matches.replay.title({ turn, total: TOTAL_TURNS })}</Heading>
        </div>
        <HeaderActions>
          <Button variant="subtle" size="sm" onClick={() => void navigator.clipboard?.writeText(window.location.href)}>
            {LL.matches.replay.copyLink({ turn })}
          </Button>
          <Button variant="subtle" size="sm" isDisabled>{LL.matches.replay.exportVideo()}</Button>
        </HeaderActions>
      </HeaderRow>

      <Surface as="section" ariaLabel={LL.matches.replay.timeline()} padding="md">
        <ReplayTimeline
          turn={turn}
          totalTurns={TOTAL_TURNS}
          moments={allMoments}
          currentMoment={moment}
          isPlaying={playback.isPlaying}
          speed={playback.speed}
          caption={LL.matches.replay.rebuilt({ total: TOTAL_TURNS })}
          onTurnChange={playback.seek}
          onTogglePlay={playback.togglePlay}
          onSpeedChange={playback.setSpeed}
        />
      </Surface>

      <Columns
        sideSize="fluid"
        mainMaxWidth="map"
        main={<MapBoard board={board.board} isPending={board.isPending} error={board.error} turn={turn} civNames={civNames} />}
        end={
          <>
            {moment !== null && (
              <Surface as="section" labelledBy="moment" padding="md">
                <Heading level={2} size="eyebrow" id="moment">{LL.matches.replay.moment({ turn })}</Heading>
                <Text size="xl" weight="bold" isDisplay>{LL.matches.replay.moments[moment.id].title()}</Text>
                <Text size="md" tone="muted">{LL.matches.replay.moments[moment.id].why()}</Text>
              </Surface>
            )}
            <Surface as="section" labelledBy="replay-standings" padding="md">
              <Heading level={2} size="card" id="replay-standings">{LL.matches.replay.standings({ turn })}</Heading>
              <ol>
                {standings.map((civ) => (
                  <RankedRow key={civ} color={{ civ }} name={civNames[civ]} value={String(board.board?.tilesByCiv[civ] ?? 0)} bar={{ value: board.board?.tilesByCiv[civ] ?? 0, max: maxTiles }} />
                ))}
              </ol>
            </Surface>
            <Surface as="section" tone="verify" labelledBy="verify" padding="md">
              <VerifyTitle id="verify">
                <Icon name="checkCircle" size={20} />
                {LL.matches.replay.verified()}
              </VerifyTitle>
              <KeyValueList
                tone="verify"
                rows={[
                  { key: "seed", label: LL.matches.replay.seed(), value: <Text as="span" isMono size="md">0x{detail.seedHex.slice(0, 4)}…{detail.seedHex.slice(-4)}</Text> },
                  { key: "revealed", label: LL.matches.replay.revealed(), value: LL.matches.replay.revealedValue({ count: 4, total: 4 }) },
                  { key: "state", label: LL.matches.replay.stateHash({ turn }), value: <Text as="span" isMono size="md">{placeholderStateHash(turn)} ✓</Text> },
                  { key: "tx", label: LL.matches.replay.turnTx(), value: <Text as="span" isMono size="md">{detail.transactions.settled}</Text> },
                ]}
              />
              <Text size="sm" tone="muted">{LL.matches.replay.verifyNote()}</Text>
            </Surface>
          </>
        }
      />
    </PageContainer>
  );
}
