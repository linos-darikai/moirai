// Create lobby page ("/lobby/new"): pick the win metric, stakes, payout, length and deadlines,
// with a live summary. Design artboard "Create lobby".
// Submitting sends `create_match` to the civ program on devnet, then opens the new lobby.
// Entry fees are in SOL and every match is 60 turns in this version.

import { useState } from "react";
import { useNavigate } from "react-router";
import type { ReactElement } from "react";
import { Button, Heading, Input, Select, Surface, Text } from "../../components/atoms";
import { Breadcrumb, ChoiceCard, Field, KeyValueList, QueryStatus } from "../../components/molecules";
import { Columns, PageContainer } from "../../components/templates";
import { useCreateLobby, useOpenWalletPicker, useWalletStatus } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { MATCH_TURNS } from "../../model/lobbyFromMatch";
import { lobbyPath, paths } from "../../routes/paths";
import type { PayoutKind, WinMetric } from "../../types/game";
import { WIN_METRICS } from "../../types/game";
import { ChoiceGrid, FieldRow, Fieldset, Legend } from "./CreateLobbyPage.styles";

const CRANK_REWARD_FRACTION = 0.015;
const LAMPORTS_PER_SOL = 1_000_000_000;
const SECONDS_PER_MINUTE = 60;
const PLAYER_COUNTS = [4, 3, 2] as const;
const JOIN_DEADLINE_MINUTES = [30, 60, 360] as const;
const REVEAL_WINDOW_MINUTES = [10, 30] as const;

/** Route screen for "/lobby/new". */
export function CreateLobbyPage(): ReactElement {
  const { LL } = useI18nContext();
  const [metric, setMetric] = useState<WinMetric>("territory");
  const [feeText, setFeeText] = useState("0.01");
  const [payout, setPayout] = useState<Exclude<PayoutKind, "practice">>("winnerTakesAll");
  const [players, setPlayers] = useState("4");
  const [joinDeadline, setJoinDeadline] = useState("30");
  const [revealWindow, setRevealWindow] = useState("10");

  const fee = Number.parseFloat(feeText.replace(",", "."));
  const feeAmount = Number.isFinite(fee) && fee >= 0 ? fee : 0;
  const amountText = (amount: number): string => LL.sol({ amount });
  const createLobby = useCreateLobby();
  const wallet = useWalletStatus();
  const openWalletPicker = useOpenWalletPicker();
  const navigate = useNavigate();

  /** Sends create_match. Joining stays open for the chosen time; commits and reveals each get the
   * chosen window after that. */
  const submit = (): void => {
    if (!wallet.isConnected) return openWalletPicker();
    const joinAt = Math.floor(Date.now() / 1000) + Number(joinDeadline) * SECONDS_PER_MINUTE;
    const windowSeconds = Number(revealWindow) * SECONDS_PER_MINUTE;
    createLobby.mutate(
      {
        entryFeeLamports: Math.round(feeAmount * LAMPORTS_PER_SOL),
        maxPlayers: Number(players),
        winMetric: metric,
        payout,
        joinDeadline: joinAt,
        commitDeadline: joinAt + windowSeconds,
        revealDeadline: joinAt + 2 * windowSeconds,
      },
      { onSuccess: (address) => navigate(lobbyPath(address)) },
    );
  };
  const payoutName = payout === "topThree" ? LL.lobbies.create.payoutTop.name() : LL.lobbies.create.payoutAll.name();

  return (
    <PageContainer>
      <Breadcrumb label={LL.breadcrumb()} items={[{ label: LL.nav.lobbies(), to: paths.home }, { label: LL.lobbies.create.breadcrumb() }]} />
      <header>
        <Heading level={1}>{LL.lobbies.create.title()}</Heading>
        <Text tone="muted">{LL.lobbies.create.intro()}</Text>
      </header>

      <Columns
        sideSize="lg"
        main={
          <>
            <Fieldset>
              <Legend>{LL.lobbies.create.winMetric()}</Legend>
              <ChoiceGrid>
                {WIN_METRICS.map((option) => (
                  <ChoiceCard
                    key={option}
                    title={LL.metric[option]()}
                    body={LL.metricDescription[option]()}
                    swatch={{ metric: option }}
                    isSelected={metric === option}
                    onSelect={() => setMetric(option)}
                  />
                ))}
              </ChoiceGrid>
            </Fieldset>

            <Fieldset>
              <Legend>{LL.lobbies.create.stakes()}</Legend>
              <FieldRow>
                <Field label={LL.lobbies.create.entryFee()} htmlFor="entry-fee">
                  <Input id="entry-fee" value={feeText} onChange={setFeeText} inputMode="decimal" />
                </Field>
              </FieldRow>
              <Text weight="medium">{LL.lobbies.create.payout()}</Text>
              <ChoiceGrid>
                <ChoiceCard
                  title={LL.lobbies.create.payoutAll.name()}
                  body={LL.lobbies.create.payoutAll.body()}
                  isSelected={payout === "winnerTakesAll"}
                  onSelect={() => setPayout("winnerTakesAll")}
                />
                <ChoiceCard
                  title={LL.lobbies.create.payoutTop.name()}
                  body={LL.lobbies.create.payoutTop.body()}
                  isSelected={payout === "topThree"}
                  onSelect={() => setPayout("topThree")}
                />
              </ChoiceGrid>
            </Fieldset>

            <Fieldset>
              <Legend>{LL.lobbies.create.timing()}</Legend>
              <div>
                <Text weight="medium">{LL.lobbies.create.turns()}: {MATCH_TURNS}</Text>
                <Text size="sm" tone="muted">{LL.lobbies.create.turnsFixed()}</Text>
              </div>
              <FieldRow>
                <Field label={LL.lobbies.create.players()} htmlFor="players">
                  <Select
                    id="players"
                    value={players}
                    onChange={setPlayers}
                    options={PLAYER_COUNTS.map((count) => ({ value: String(count), label: LL.lobbies.create.playersOption({ count }) }))}
                  />
                </Field>
                <Field label={LL.lobbies.create.joinDeadline()} htmlFor="join-deadline">
                  <Select
                    id="join-deadline"
                    value={joinDeadline}
                    onChange={setJoinDeadline}
                    options={JOIN_DEADLINE_MINUTES.map((minutes) => ({
                      value: String(minutes),
                      label: LL.lobbies.create.inDuration({ minutes }),
                    }))}
                  />
                </Field>
                <Field label={LL.lobbies.create.revealWindow()} htmlFor="reveal-window">
                  <Select
                    id="reveal-window"
                    value={revealWindow}
                    onChange={setRevealWindow}
                    options={REVEAL_WINDOW_MINUTES.map((minutes) => ({
                      value: String(minutes),
                      label: LL.lobbies.create.afterFull({ minutes }),
                    }))}
                  />
                </Field>
              </FieldRow>
            </Fieldset>
          </>
        }
        end={
          <Surface as="aside" tone="highlight" ariaLabel={LL.lobbies.create.summaryLabel()}>
            <Heading level={2}>{LL.lobbies.create.summary()}</Heading>
            <KeyValueList
              rows={[
                { key: "metric", label: LL.lobbies.create.summaryMetric(), value: LL.metric[metric]() },
                { key: "fee", label: LL.lobbies.create.summaryFee(), value: amountText(feeAmount) },
                { key: "pool", label: LL.lobbies.create.summaryPool(), value: amountText(feeAmount * Number(players)) },
                { key: "payout", label: LL.lobbies.create.summaryPayout(), value: payoutName },
                { key: "crank", label: LL.lobbies.create.summaryCrank(), value: LL.lobbies.create.summaryCrankValue({ percent: CRANK_REWARD_FRACTION }) },
                { key: "turns", label: LL.lobbies.create.summaryTurns(), value: MATCH_TURNS },
              ]}
            />
            <Surface tone="inset" padding="md">
              <Text weight="semibold">{LL.lobbies.create.moneyTitle()}</Text>
              <Text size="md" tone="muted">
                {LL.lobbies.create.moneyBody()}
              </Text>
            </Surface>
            <Button size="lg" isFullWidth onClick={submit} isDisabled={createLobby.isPending}>
              {createLobby.isPending ? LL.lobbies.create.submitting() : LL.lobbies.create.submit()}
            </Button>
            {!wallet.isConnected && <Text size="sm" tone="muted">{LL.lobbies.create.needWallet()}</Text>}
            {createLobby.isError && (
              <QueryStatus kind="error" text={LL.lobbies.create.failed({ message: createLobby.error.message })} />
            )}
            <Text size="sm" tone="muted">
              {LL.lobbies.create.networkFee()}
            </Text>
          </Surface>
        }
      />
    </PageContainer>
  );
}
