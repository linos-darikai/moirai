// Simulator page ("/simulator"): pick a policy, opponents and a seed, and watch the board in the
// browser. The map (deposits, cities) is civ-core's real map for the seed, generated in WASM.
// Territory growth is a PREVIEW until civ-core's turn function exists. Design artboard
// "Local simulator".

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Button, Heading, Input, Select, Slider, Surface, Swatch, Text } from "../../components/atoms";
import { BarChart, Field, QueryStatus, RankedRow } from "../../components/molecules";
import { MapBoard } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { useBoardAtTurn, useEngineDescription, usePolicyDrafts, useStartingMap } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { SAMPLE_SEED_HEX } from "../../data/matches";
import { SAMPLE_OPPONENTS } from "../../data/policies";
import { previewBoardAtTurn } from "../../model/territoryPreview";
import { paths } from "../../routes/paths";
import type { CivIndex } from "../../types/game";
import { EngineBadge, HeaderRow, OpponentRow, Panels } from "./SimulatorPage.styles";

const TOTAL_TURNS = 60;
const CHART_TURNS = [10, 20, 30, 40, 50, 60] as const;
const CIVS: readonly CivIndex[] = [0, 1, 2, 3];

/** Route screen for "/simulator". */
export function SimulatorPage(): ReactElement {
  const { LL } = useI18nContext();
  const engine = useEngineDescription();
  const policies = usePolicyDrafts();
  const [policyId, setPolicyId] = useState(policies.current.id);
  const [seedText, setSeedText] = useState(`0x${SAMPLE_SEED_HEX.slice(0, 8)}`);
  const [turn, setTurn] = useState(TOTAL_TURNS);
  const [enabledOpponents, setEnabledOpponents] = useState<Record<string, boolean>>({});

  const board = useBoardAtTurn(seedText, turn);
  const startingMap = useStartingMap(seedText, 4);
  const yourName = policies.drafts.find((draft) => draft.id === policyId)?.name ?? policies.current.name;
  const civNames: Record<CivIndex, string> = { 0: LL.you({ name: yourName }), 1: "red-raider", 2: "silk-trader", 3: "wide-expander" };

  // Territory at each chart turn, from the same preview the board uses.
  const chart = useMemo(() => {
    if (startingMap.data === undefined) return null;
    const tiles = startingMap.data;
    return CHART_TURNS.map((chartTurn) => ({ turn: chartTurn, tilesByCiv: previewBoardAtTurn(tiles, chartTurn, false).tilesByCiv }));
  }, [startingMap.data]);
  const finalTiles = chart?.at(-1)?.tilesByCiv;
  const chartMax = finalTiles === undefined ? 1 : Math.max(1, ...CIVS.map((civ) => finalTiles[civ]));

  const standings = board.board === null ? [] : [...CIVS].sort((a, b) => (board.board?.tilesByCiv[b] ?? 0) - (board.board?.tilesByCiv[a] ?? 0));

  return (
    <PageContainer width="medium">
      <HeaderRow>
        <div>
          <Heading level={1} size="h2">{LL.policies.simulator.title()}</Heading>
          <Text tone="muted">{LL.policies.simulator.intro()}</Text>
        </div>
        <EngineBadge>{LL.policies.simulator.engineBadge({ version: engine.data ?? "civ-core" })}</EngineBadge>
      </HeaderRow>

      <Columns
        sideSize="md"
        start={
          <Surface as="aside" labelledBy="setup" padding="md">
            <Heading level={2} size="card" id="setup">{LL.policies.simulator.setup()}</Heading>
            <Field label={LL.policies.simulator.yourPolicy()} htmlFor="sim-policy">
              <Select id="sim-policy" value={policyId} onChange={setPolicyId} options={policies.drafts.map((draft) => ({ value: draft.id, label: draft.name }))} />
            </Field>
            <fieldset>
              <legend>{LL.policies.simulator.opponents()}</legend>
              {SAMPLE_OPPONENTS.map((opponent) => (
                <OpponentRow key={opponent.id}>
                  <input
                    type="checkbox"
                    checked={enabledOpponents[opponent.id] !== false}
                    onChange={(event) => setEnabledOpponents({ ...enabledOpponents, [opponent.id]: event.target.checked })}
                  />
                  <Swatch color={{ civ: opponent.civIndex }} />
                  <span>{opponent.id}</span>
                  <Text as="span" size="sm" tone="muted">{LL.policies.simulator.style[opponent.style]()}</Text>
                </OpponentRow>
              ))}
            </fieldset>
            <Field label={LL.policies.simulator.seed()} htmlFor="sim-seed" hint={LL.policies.simulator.seedHint()} hintId="sim-seed-hint">
              <Input id="sim-seed" value={seedText} onChange={setSeedText} isMono describedBy="sim-seed-hint" isInvalid={board.error !== null} />
            </Field>
            <Button isFullWidth onClick={() => setTurn(TOTAL_TURNS)}>{LL.policies.simulator.run({ turns: TOTAL_TURNS })}</Button>
            <Button isFullWidth variant="secondary" isDisabled>{LL.policies.simulator.runMany()}</Button>
          </Surface>
        }
        main={
          <Panels>
            <div>
              <Heading level={2} size="card" id="board">{LL.policies.simulator.board({ turn })}</Heading>
              <MapBoard board={board.board} isPending={board.isPending} error={board.error} turn={turn} civNames={civNames} />
              <Field
                label={LL.policies.simulator.scrub()}
                htmlFor="sim-turn"
                labelAside={<Text as="span" isMono size="md">{LL.policies.simulator.scrubValue({ turn, total: TOTAL_TURNS })}</Text>}
              >
                <Slider id="sim-turn" value={turn} min={0} max={TOTAL_TURNS} onChange={setTurn} />
              </Field>
              <Text size="xs" tone="muted">{LL.map.previewNote()}</Text>
            </div>
            <div>
              <Surface as="section" labelledBy="standings" padding="md">
                <Heading level={2} size="card" id="standings">{LL.policies.simulator.standings()}</Heading>
                <ol>
                  {standings.map((civ, index) => (
                    <RankedRow key={civ} rank={index + 1} color={{ civ }} name={civNames[civ]} value={LL.tiles({ count: board.board?.tilesByCiv[civ] ?? 0 })} />
                  ))}
                </ol>
              </Surface>
              <Surface as="section" labelledBy="territory-chart" padding="md">
                <Heading level={2} size="card" id="territory-chart">{LL.policies.simulator.territoryOverTime()}</Heading>
                {chart === null ? (
                  <QueryStatus kind="loading" text={LL.states.loading()} />
                ) : (
                  <BarChart
                    label={LL.policies.simulator.chartLabel({
                      summary: CIVS.map((civ) => LL.policies.simulator.chartCiv({ name: civNames[civ], count: finalTiles?.[civ] ?? 0 })).join(", "),
                    })}
                    max={chartMax}
                    groups={chart.map((point) => ({
                      key: String(point.turn),
                      axisLabel: LL.matches.live.turnShort({ turn: point.turn }),
                      bars: CIVS.map((civ) => ({ value: point.tilesByCiv[civ], color: { civ } })),
                    }))}
                  />
                )}
              </Surface>
              <Surface as="section" labelledBy="rules-did" padding="md">
                <Heading level={2} size="card" id="rules-did">{LL.policies.simulator.rulesDid()}</Heading>
                <ul>
                  <li><Text size="md" tone="soft">{LL.policies.simulator.ruleFired({ rule: 6, action: "claim_tile", count: 41 })}</Text></li>
                  <li><Text size="md" tone="soft">{LL.policies.simulator.ruleFired({ rule: 3, action: "build(guard)", count: 9 })}</Text></li>
                  <li><Text size="md" tone="soft">{LL.policies.simulator.ruleNeverFired({ rule: 7, action: "build(infantry)" })}</Text></li>
                </ul>
                <Link to={paths.editor}>{LL.policies.simulator.backToEditor()}</Link>
              </Surface>
            </div>
          </Panels>
        }
      />
    </PageContainer>
  );
}
