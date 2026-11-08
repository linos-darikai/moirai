// Lobby page ("/lobby/:lobbyId"): the seats, the locked rules, on-chain activity and the player's
// join → commit → reveal steps. Design artboard "Lobby: join, commit, reveal".
// SAMPLE: the step button advances locally; Phase 2 sends join_match + commit_policy (one
// transaction, see docs/decisions/0002) and reveal_policy.

import { useState } from "react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router";
import { Button, Heading, MetricBadge, Select, StatusChip, Surface, Text } from "../../components/atoms";
import { Breadcrumb, Field, PanelHeader, QueryStatus, SeatCard, StatCard, StepList } from "../../components/molecules";
import type { SeatChip } from "../../components/molecules";
import { DataTable } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { useLobby } from "../../hooks";
import { useI18nContext } from "../../i18n";
import type { TranslationFunctions } from "../../i18n";
import { SAMPLE_DRAFTS } from "../../data/policies";
import { SAMPLE_LIVE_MATCH_ID, idFromUrl, matchPath, paths } from "../../routes/paths";
import type { EntryStep, LobbyActivity, LobbySeat } from "../../types/game";
import { ENTRY_STEPS } from "../../types/game";
import { HeaderRow, SeatGrid, Stats } from "./LobbyPage.styles";

const YOUR_BOT = "iron-turtle";
const YOUR_WALLET = "7xKq…3fPa";
const YOUR_HASH = "9f3c…e1a7";

/** The player's seat once they have done `stepsDone` steps (0 = not joined yet). */
function yourSeat(seat: LobbySeat, stepsDone: number): LobbySeat {
  return {
    ...seat,
    bot: stepsDone >= 1 ? YOUR_BOT : null,
    wallet: stepsDone >= 1 ? YOUR_WALLET : null,
    hasJoined: stepsDone >= 1,
    hasCommitted: stepsDone >= 2,
    hasRevealed: stepsDone >= 3,
    policyHash: stepsDone >= 2 ? YOUR_HASH : null,
  };
}

/** Status chips for a seat. */
function seatChips(seat: LobbySeat, LL: TranslationFunctions): SeatChip[] {
  if (!seat.hasJoined) return [{ label: LL.status.empty(), tone: "neutral" }];
  return [
    { label: LL.status.joined(), tone: "positive" },
    seat.hasCommitted ? { label: LL.status.committed(), tone: "positive" } : { label: LL.status.notCommitted(), tone: "pending" },
    seat.hasRevealed ? { label: LL.status.revealed(), tone: "positive" } : { label: LL.status.hidden(), tone: "neutral" },
  ];
}

/** One activity row as text. */
function activityText(entry: LobbyActivity, fee: string, LL: TranslationFunctions): string {
  const bot = entry.bot ?? "";
  switch (entry.kind) {
    case "created":
      return LL.lobbies.lobby.activity.created({ wallet: entry.wallet ?? "", fee });
    case "joinedCommitted":
      return LL.lobbies.lobby.activity.joinedCommitted({ bot });
    case "youJoined":
      return LL.lobbies.lobby.activity.youJoined({ bot, fee });
    case "youCommitted":
      return LL.lobbies.lobby.activity.youCommitted({ bot });
    case "allRevealed":
      return LL.lobbies.lobby.activity.allRevealed();
  }
}

/** Route screen for "/lobby/:lobbyId". */
export function LobbyPage(): ReactElement {
  const { LL } = useI18nContext();
  const { lobbyId } = useParams();
  const lobby = useLobby(idFromUrl(lobbyId));
  const [stepsDone, setStepsDone] = useState(0);
  const [policyId, setPolicyId] = useState(SAMPLE_DRAFTS[0]?.id ?? "");

  if (lobby.isPending) return <PageContainer><QueryStatus kind="loading" text={LL.states.loading()} /></PageContainer>;
  if (lobby.isError) return <PageContainer><QueryStatus kind="error" text={LL.states.error({ message: lobby.error.message })} /></PageContainer>;

  const detail = lobby.data;
  const fee = LL.sol({ amount: detail.entryFeeSol });
  const phaseKey = (["waiting", "commit", "reveal", "starting"] as const)[stepsDone] ?? "starting";
  const currentStep: EntryStep = ENTRY_STEPS[stepsDone] ?? "play";
  const seats = detail.seats.map((seat) => (seat.isYou ? yourSeat(seat, stepsDone) : { ...seat, hasRevealed: stepsDone >= 3 }));
  const vaultSol = detail.poolSol + (stepsDone >= 1 ? detail.entryFeeSol : 0);

  const activity: LobbyActivity[] = [...detail.activity];
  if (stepsDone >= 1) activity.push({ time: "12:14", kind: "youJoined", bot: YOUR_BOT, wallet: null, transaction: "4Kp8…zA1e" });
  if (stepsDone >= 2) activity.push({ time: "12:15", kind: "youCommitted", bot: YOUR_BOT, wallet: null, transaction: "6Nd2…Vr4m" });
  if (stepsDone >= 3) activity.push({ time: "12:22", kind: "allRevealed", bot: null, wallet: null, transaction: "9Lw3…Hc5b" });

  const steps = ENTRY_STEPS.map((step, index) => {
    const title = LL.lobbies.lobby.steps[step].title();
    return {
      id: step,
      title,
      body:
        step === "join"
          ? LL.lobbies.lobby.steps.join.body({ fee })
          : step === "play"
            ? LL.lobbies.lobby.steps.play.body({ turns: detail.turns })
            : LL.lobbies.lobby.steps[step].body(),
      state: index < stepsDone ? ("done" as const) : index === stepsDone ? ("current" as const) : ("upcoming" as const),
      doneLabel: LL.lobbies.lobby.stepDone({ step: title }),
    };
  });
  const helper = {
    join: LL.lobbies.lobby.helper.join(),
    commit: LL.lobbies.lobby.helper.commit(),
    reveal: LL.lobbies.lobby.helper.reveal({ count: detail.seatCount }),
    play: LL.lobbies.lobby.helper.starting(),
  }[currentStep];
  const actionLabel =
    currentStep === "join" ? LL.lobbies.lobby.action.join({ fee }) : currentStep === "commit" ? LL.lobbies.lobby.action.commit() : LL.lobbies.lobby.action.reveal();

  return (
    <PageContainer>
      <Breadcrumb label={LL.breadcrumb()} items={[{ label: LL.nav.lobbies(), to: paths.home }, { label: detail.id }]} />
      <HeaderRow>
        <div>
          <MetricBadge metric={detail.metric} label={LL.metric[detail.metric]()} />{" "}
          <StatusChip tone="pending">{LL.lobbies.lobby.phase[phaseKey]()}</StatusChip>
          <Heading level={1}>{LL.lobbies.lobby.title({ id: detail.id })}</Heading>
          <Text tone="muted">
            {LL.lobbies.lobby.subtitle({ turns: detail.turns, fee, payout: LL.payout[detail.payout]() })}{" "}
            <Text as="span" isMono>{detail.creatorWallet}</Text>
          </Text>
        </div>
        <Stats>
          <StatCard
            label={stepsDone < 2 ? LL.lobbies.lobby.joinClosesIn() : LL.lobbies.lobby.revealClosesIn()}
            value={stepsDone < 2 ? detail.joinDeadline : detail.revealDeadline}
          />
          <StatCard label={LL.lobbies.lobby.vault()} value={LL.sol({ amount: vaultSol })} />
        </Stats>
      </HeaderRow>

      <Columns
        sideSize="md"
        main={
          <>
            <Surface as="section" labelledBy="seats">
              <PanelHeader title={LL.lobbies.lobby.players()} id="seats" />
              <SeatGrid>
                {seats.map((seat) => (
                  <SeatCard
                    key={seat.civIndex}
                    name={seat.bot === null ? LL.lobbies.lobby.openSeat() : seat.isYou ? LL.you({ name: seat.bot }) : seat.bot}
                    subtitle={seat.wallet ?? LL.lobbies.lobby.waitingForPlayer()}
                    color={seat.bot === null ? { token: "empty" } : { civ: seat.civIndex }}
                    chips={seatChips(seat, LL)}
                    hashText={seat.policyHash === null ? (seat.hasJoined ? LL.lobbies.lobby.noHash() : "") : LL.lobbies.lobby.hash({ hash: seat.policyHash })}
                    isHighlighted={seat.isYou}
                  />
                ))}
              </SeatGrid>
            </Surface>
            <Surface as="section" labelledBy="rules">
              <PanelHeader title={LL.lobbies.lobby.rulesTitle()} id="rules" />
              <ul>
                <li><Text tone="soft">{LL.lobbies.lobby.rules.winner({ turns: detail.turns })}</Text></li>
                <li><Text tone="soft">{LL.lobbies.lobby.rules.refund()}</Text></li>
                <li><Text tone="soft">{LL.lobbies.lobby.rules.forfeit()}</Text></li>
                <li><Text tone="soft">{LL.lobbies.lobby.rules.seed()}</Text></li>
              </ul>
            </Surface>
            <Surface as="section" labelledBy="activity">
              <PanelHeader title={LL.lobbies.lobby.activityTitle()} id="activity" />
              <DataTable<LobbyActivity>
                rows={[...activity].reverse()}
                rowKey={(row) => row.transaction}
                columns={[
                  { key: "time", header: LL.lobbies.lobby.activityTime(), render: (row) => <Text as="span" tone="muted">{row.time}</Text> },
                  { key: "event", header: LL.lobbies.lobby.activityEvent(), render: (row) => activityText(row, fee, LL) },
                  {
                    key: "tx",
                    header: LL.lobbies.lobby.activityTx(),
                    render: (row) => (
                      <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noreferrer">
                        <Text as="span" isMono size="md">{row.transaction}</Text>
                      </a>
                    ),
                  },
                ]}
              />
            </Surface>
          </>
        }
        end={
          <Surface as="aside" tone="highlight" labelledBy="your-entry">
            <Heading level={2} id="your-entry">{LL.lobbies.lobby.entryTitle()}</Heading>
            <StepList look="progress" steps={steps} />
            <Field label={LL.lobbies.lobby.policy()} htmlFor="entry-policy">
              <Select
                id="entry-policy"
                value={policyId}
                onChange={setPolicyId}
                options={SAMPLE_DRAFTS.map((draft) => ({ value: draft.id, label: draft.name }))}
              />
            </Field>
            <Link to={paths.editor}>{LL.lobbies.lobby.editPolicy()}</Link>
            {stepsDone >= 2 && (
              <Surface tone="inset" padding="md">
                <Text size="sm" tone="muted">{LL.lobbies.lobby.commitment()}</Text>
                <Text size="sm" isMono>sha256 {YOUR_HASH}</Text>
                <Text size="sm" tone="muted">{LL.lobbies.lobby.commitmentHint()}</Text>
              </Surface>
            )}
            {stepsDone < 3 ? (
              <Button size="lg" isFullWidth onClick={() => setStepsDone(stepsDone + 1)}>
                {actionLabel}
              </Button>
            ) : (
              <Button to={matchPath(SAMPLE_LIVE_MATCH_ID)} variant="success" size="lg" isFullWidth>
                {LL.lobbies.lobby.started()}
              </Button>
            )}
            <Text size="sm" tone="muted" as="p">
              {helper}
            </Text>
          </Surface>
        }
      />
    </PageContainer>
  );
}
