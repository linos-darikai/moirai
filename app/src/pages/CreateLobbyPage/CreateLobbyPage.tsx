// Create lobby page ("/lobby/new"): pick the win metric, stakes, payout, length and deadlines,
// with a live summary. Design artboard "Create lobby".
// SAMPLE: submitting goes to the sample lobby; Phase 2 sends `create_match` instead.

import { useState } from "react";
import type { ReactElement } from "react";
import { Button, Heading, Input, Select, Slider, Surface, Text } from "../../components/atoms";
import { Breadcrumb, ChoiceCard, Field, KeyValueList, SegmentedControl } from "../../components/molecules";
import { Columns, PageContainer } from "../../components/templates";
import { useI18nContext } from "../../i18n";
import { SAMPLE_LOBBIES } from "../../data/lobbies";
import { lobbyPath, paths } from "../../routes/paths";
import type { PayoutKind, WinMetric } from "../../types/game";
import { WIN_METRICS } from "../../types/game";
import { ChoiceGrid, FieldRow, Fieldset, Legend } from "./CreateLobbyPage.styles";

type Token = "SOL" | "USDC";
const CRANK_REWARD_FRACTION = 0.015;
const PLAYER_COUNTS = [4, 3, 2] as const;
const JOIN_DEADLINE_MINUTES = [30, 60, 360] as const;
const REVEAL_WINDOW_MINUTES = [10, 30] as const;

/** Route screen for "/lobby/new". */
export function CreateLobbyPage(): ReactElement {
  const { LL } = useI18nContext();
  const [metric, setMetric] = useState<WinMetric>("territory");
  const [token, setToken] = useState<Token>("SOL");
  const [feeText, setFeeText] = useState("0.5");
  const [payout, setPayout] = useState<PayoutKind>("winnerTakesAll");
  const [turns, setTurns] = useState(60);
  const [players, setPlayers] = useState("4");
  const [joinDeadline, setJoinDeadline] = useState("30");
  const [revealWindow, setRevealWindow] = useState("10");

  const fee = Number.parseFloat(feeText.replace(",", "."));
  const feeAmount = Number.isFinite(fee) && fee >= 0 ? fee : 0;
  const amountText = (amount: number): string => (token === "SOL" ? LL.sol({ amount }) : `${amount} USDC`);
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
                <div>
                  <Text weight="medium">{LL.lobbies.create.token()}</Text>
                  <SegmentedControl
                    label={LL.lobbies.create.token()}
                    isFullWidth
                    options={[
                      { value: "SOL" as const, label: "SOL" },
                      { value: "USDC" as const, label: "USDC" },
                    ]}
                    value={token}
                    onChange={setToken}
                  />
                </div>
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
              <Field
                label={LL.lobbies.create.turns()}
                htmlFor="turns"
                hint={LL.lobbies.create.turnsHint()}
                labelAside={<Text as="span" isMono>{turns}</Text>}
              >
                <Slider id="turns" value={turns} min={20} max={100} step={10} onChange={setTurns} />
              </Field>
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
                { key: "turns", label: LL.lobbies.create.summaryTurns(), value: turns },
              ]}
            />
            <Surface tone="inset" padding="md">
              <Text weight="semibold">{LL.lobbies.create.moneyTitle()}</Text>
              <Text size="md" tone="muted">
                {LL.lobbies.create.moneyBody()}
              </Text>
            </Surface>
            <Button to={lobbyPath(SAMPLE_LOBBIES[0]?.id ?? "#A41F")} size="lg" isFullWidth>
              {LL.lobbies.create.submit({ amount: amountText(feeAmount) })}
            </Button>
            <Text size="sm" tone="muted">
              {LL.lobbies.create.networkFee()}
            </Text>
          </Surface>
        }
      />
    </PageContainer>
  );
}
