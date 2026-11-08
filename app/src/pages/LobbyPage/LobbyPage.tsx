// Lobby page ("/lobby/:lobbyId"): one match on chain, by its Match address. Shows the seats and
// deadlines, and offers the connected wallet the next step: join, commit, reveal, or the steps
// anyone may take (start, play the turns, settle, cancel). Design artboard "Lobby: join, commit,
// reveal". Refreshes from the chain every few seconds.

import { useState } from "react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router";
import { Button, Heading, MetricBadge, Select, StatusChip, Surface, Text } from "../../components/atoms";
import { Breadcrumb, Field, PanelHeader, QueryStatus, SeatCard, StatCard, StepList } from "../../components/molecules";
import type { SeatChip } from "../../components/molecules";
import { Columns, PageContainer } from "../../components/templates";
import { useLobby, useLobbyAction, useNowSeconds, useOpenWalletPicker, usePolicyDrafts, useSavedCommitment, useWalletStatus } from "../../hooks";
import { useI18nContext } from "../../i18n";
import type { TranslationFunctions } from "../../i18n";
import { explorerUrl } from "../../lib/solana/config";
import { countdown, lobbyLabel, lobbySeatsFromMatch, MATCH_TURNS, nextLobbyStep } from "../../model/lobbyFromMatch";
import { shortenAddress } from "../../model/format";
import { paths } from "../../routes/paths";
import type { MatchAccountView } from "../../types/chain";
import type { LobbySeat } from "../../types/game";
import { HeaderRow, SeatGrid, Stats } from "./LobbyPage.styles";
import { entrySteps, lobbyPhase, stepButton, stepHelper } from "./lobbyPageText";

const LAMPORTS_PER_SOL = 1_000_000_000;

/** Status chips for a seat. */
function seatChips(seat: LobbySeat, LL: TranslationFunctions): SeatChip[] {
  if (!seat.hasJoined) return [{ label: LL.status.empty(), tone: "neutral" }];
  return [
    { label: LL.status.joined(), tone: "positive" },
    seat.hasCommitted ? { label: LL.status.committed(), tone: "positive" } : { label: LL.status.notCommitted(), tone: "pending" },
    seat.hasRevealed ? { label: LL.status.revealed(), tone: "positive" } : { label: LL.status.hidden(), tone: "neutral" },
  ];
}

/** The deadline that matters now, with its label. */
function currentDeadline(match: MatchAccountView, LL: TranslationFunctions): { label: string; seconds: number } {
  const lobby = LL.lobbies.lobby;
  if (match.players.length < match.maxPlayers) return { label: lobby.joinClosesIn(), seconds: match.joinDeadline };
  if (!match.committed.every(Boolean)) return { label: lobby.commitClosesIn(), seconds: match.commitDeadline };
  return { label: lobby.revealClosesIn(), seconds: match.revealDeadline };
}

/** Route screen for "/lobby/:lobbyId". */
export function LobbyPage(): ReactElement {
  const { LL } = useI18nContext();
  const address = useParams().lobbyId ?? "";
  const lobby = useLobby(address);
  const action = useLobbyAction(lobby.data ?? null);
  const wallet = useWalletStatus();
  const openWalletPicker = useOpenWalletPicker();
  const { drafts } = usePolicyDrafts();
  const [policyId, setPolicyId] = useState("");
  const now = useNowSeconds();
  const committedPolicy = useSavedCommitment(address, wallet.address);

  if (lobby.isPending) return <PageContainer><QueryStatus kind="loading" text={LL.states.loading()} /></PageContainer>;
  if (lobby.isError) return <PageContainer><QueryStatus kind="error" text={LL.states.error({ message: lobby.error.message })} /></PageContainer>;
  const match = lobby.data;
  if (match === null) return <PageContainer><QueryStatus kind="empty" text={LL.lobbies.lobby.closed()} /></PageContainer>;

  // Step 1: what the page shows.
  const label = lobbyLabel(match.address);
  const fee = LL.sol({ amount: match.entryFeeLamports / LAMPORTS_PER_SOL });
  const step = nextLobbyStep(match, wallet.address, now);
  const button = stepButton(step, match, fee, LL);
  const deadline = currentDeadline(match, LL);
  const seats = lobbySeatsFromMatch(match, wallet.address);
  const selectedPolicy = drafts.find((draft) => draft.id === policyId) ?? drafts[0];

  // Step 2: what the button does.
  const onAction = (): void => {
    if (button === null) return;
    if (button.request === "connect") return openWalletPicker();
    if (button.request === "commit") {
      if (selectedPolicy === undefined) return;
      action.mutate({ kind: "commit", policyName: selectedPolicy.name, policyYaml: selectedPolicy.yaml });
      return;
    }
    action.mutate({ kind: button.request });
  };

  return (
    <PageContainer>
      <Breadcrumb label={LL.breadcrumb()} items={[{ label: LL.nav.lobbies(), to: paths.home }, { label }]} />
      <HeaderRow>
        <div>
          <MetricBadge metric={match.winMetric} label={LL.metric[match.winMetric]()} />{" "}
          <StatusChip tone="pending">{LL.lobbies.lobby.phase[lobbyPhase(match)]()}</StatusChip>
          <Heading level={1}>{LL.lobbies.lobby.title({ id: label })}</Heading>
          <Text tone="muted">
            {LL.lobbies.lobby.subtitle({ turns: MATCH_TURNS, fee, payout: LL.payout[match.payout]() })}{" "}
            <Text as="span" isMono>{shortenAddress(match.creator)}</Text>
          </Text>
          <a href={explorerUrl("address", match.address)} target="_blank" rel="noreferrer">{LL.lobbies.lobby.explorer()}</a>
        </div>
        <Stats>
          {match.status === "running" ? (
            <StatCard label={LL.lobbies.lobby.turn()} value={LL.lobbies.lobby.turnValue({ turn: match.turn, total: MATCH_TURNS })} />
          ) : (
            <StatCard label={deadline.label} value={countdown(deadline.seconds, now)} />
          )}
          <StatCard label={LL.lobbies.lobby.vault()} value={LL.sol({ amount: match.vaultLamports / LAMPORTS_PER_SOL })} />
        </Stats>
      </HeaderRow>

      <Columns
        sideSize="md"
        main={
          <>
            <Surface as="section" labelledBy="seats">
              <PanelHeader title={LL.lobbies.lobby.players()} id="seats" />
              <SeatGrid>
                {seats.map((seat, index) => (
                  <SeatCard
                    key={index}
                    name={seat.bot === null ? LL.lobbies.lobby.openSeat() : seat.isYou ? LL.you({ name: seat.bot }) : seat.bot}
                    subtitle={seat.wallet === null ? LL.lobbies.lobby.waitingForPlayer() : shortenAddress(seat.wallet)}
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
                <li><Text tone="soft">{LL.metricDescription[match.winMetric]()}</Text></li>
                <li><Text tone="soft">{LL.lobbies.lobby.rules.refund()}</Text></li>
                <li><Text tone="soft">{LL.lobbies.lobby.rules.forfeit()}</Text></li>
                <li><Text tone="soft">{LL.lobbies.lobby.rules.seed()}</Text></li>
              </ul>
            </Surface>
          </>
        }
        end={
          <Surface as="aside" tone="highlight" labelledBy="your-entry">
            <Heading level={2} id="your-entry">{LL.lobbies.lobby.entryTitle()}</Heading>
            <StepList look="progress" steps={entrySteps(match, wallet.address, fee, LL)} />
            {step === "commit" && drafts.length > 0 && (
              <Field label={LL.lobbies.lobby.policy()} htmlFor="entry-policy">
                <Select
                  id="entry-policy"
                  value={selectedPolicy?.id ?? ""}
                  onChange={setPolicyId}
                  options={drafts.map((draft) => ({ value: draft.id, label: draft.name }))}
                />
              </Field>
            )}
            {step === "commit" && drafts.length === 0 && <Text tone="muted">{LL.lobbies.lobby.noDrafts()}</Text>}
            <Link to={paths.editor}>{LL.lobbies.lobby.editPolicy()}</Link>
            {committedPolicy !== null && (
              <Surface tone="inset" padding="md">
                <Text size="sm" tone="muted">{LL.lobbies.lobby.commitment()}</Text>
                <Text size="sm">{LL.lobbies.lobby.committedPolicy({ name: committedPolicy })}</Text>
                <Text size="sm" tone="muted">{LL.lobbies.lobby.commitmentHint()}</Text>
              </Surface>
            )}
            {button !== null && (
              <Button size="lg" isFullWidth onClick={onAction} isDisabled={action.isPending}>
                {button.label}
              </Button>
            )}
            <Text size="sm" tone="muted" as="p">
              {action.isPending ? LL.lobbies.lobby.working() : stepHelper(step, match, LL)}
            </Text>
            {action.isError && <QueryStatus kind="error" text={LL.lobbies.lobby.failed({ message: action.error.message })} />}
          </Surface>
        }
      />
    </PageContainer>
  );
}
