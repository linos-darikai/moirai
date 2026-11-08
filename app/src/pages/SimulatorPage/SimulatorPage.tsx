// Simulator page ("/simulator"): pick a policy, opponents and a seed, and civ-core plays the whole
// match in the browser (WASM): the same rules and the same result as the program on chain. Scrub
// through the turns, see the standings, territory over time and how often each of your rules
// acted. Design artboard "Local simulator".

import { useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Button, Heading, Input, Select, Slider, Surface, Swatch, Text } from "../../components/atoms";
import { BarChart, Field, QueryStatus, RankedRow } from "../../components/molecules";
import { MapBoard } from "../../components/organisms";
import { Columns, PageContainer } from "../../components/templates";
import { useEngineDescription, usePolicyDrafts, useSimulation } from "../../hooks";
import type { SimulationRequest } from "../../hooks";
import { useI18nContext } from "../../i18n";
import { SAMPLE_SEED_HEX } from "../../data/matches";
import { SAMPLE_OPPONENTS, TEMPLATE_YAML } from "../../data/policies";
import { boardFromTiles } from "../../model/board";
import { checkPolicy } from "../../model/policyCheck";
import { paths } from "../../routes/paths";
import type { CivIndex } from "../../types/game";
import type { SimulationResult } from "../../types/map";
import { EngineBadge, HeaderRow, OpponentRow, Panels } from "./SimulatorPage.styles";

const TOTAL_TURNS = 60;
const CHART_TURNS = [10, 20, 30, 40, 50, 60] as const;

/** The civs in a simulation: you (civ 0), then the opponents that are switched on. */
type SimulatedSeat = { civ: CivIndex; name: string };

/** Route screen for "/simulator". */
export function SimulatorPage(): ReactElement {
  const { LL } = useI18nContext();
  const engine = useEngineDescription();
  const policies = usePolicyDrafts();
  const [policyId, setPolicyId] = useState(policies.current.id);
  const [seedText, setSeedText] = useState(`0x${SAMPLE_SEED_HEX.slice(0, 8)}`);
  const [enabledOpponents, setEnabledOpponents] = useState<Record<string, boolean>>({});
  const [turn, setTurn] = useState(TOTAL_TURNS);

  // Step 1: what to play. Changing the setup only takes effect when "Run" is pressed.
  const yourDraft = policies.drafts.find((draft) => draft.id === policyId) ?? policies.current;
  const opponents = SAMPLE_OPPONENTS.filter((opponent) => enabledOpponents[opponent.id] !== false);
  const requestFromSetup = (): SimulationRequest => ({
    seedHex: seedText,
    botsYaml: [yourDraft.yaml, ...opponents.map((opponent) => TEMPLATE_YAML[opponent.template])],
  });
  const [request, setRequest] = useState<SimulationRequest>(requestFromSetup);
  // Who played in the last run (names for civ 1, 2, ...), remembered with the request.
  const [opponentNames, setOpponentNames] = useState<string[]>(() => opponents.map((opponent) => opponent.id));
  const [yourName, setYourName] = useState(yourDraft.name);
  const seats: SimulatedSeat[] = [
    { civ: 0, name: LL.you({ name: yourName }) },
    ...opponentNames.map((name, index) => ({ civ: (index + 1) as CivIndex, name })),
  ];
  const run = (): void => {
    setRequest(requestFromSetup());
    setOpponentNames(opponents.map((opponent) => opponent.id));
    setYourName(yourDraft.name);
    setTurn(TOTAL_TURNS);
  };

  // Step 2: the match, played by civ-core in the browser.
  const simulation = useSimulation(request);
  const result = simulation.data;
  const lastTurn = result === undefined ? TOTAL_TURNS : result.turns.length - 1;
  const shownTurn = Math.min(turn, lastTurn);
  const snapshot = result?.turns[shownTurn];
  const board = snapshot === undefined ? null : boardFromTiles(snapshot.tiles);
  const civNames = Object.fromEntries(seats.map((seat) => [seat.civ, seat.name])) as Record<CivIndex, string>;

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
              <Select id="sim-policy" value={yourDraft.id} onChange={setPolicyId} options={policies.drafts.map((draft) => ({ value: draft.id, label: draft.name }))} />
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
              <Input id="sim-seed" value={seedText} onChange={setSeedText} isMono describedBy="sim-seed-hint" isInvalid={simulation.isError} />
            </Field>
            <Button isFullWidth onClick={run} isDisabled={simulation.isFetching}>{LL.policies.simulator.run({ turns: TOTAL_TURNS })}</Button>
            <Button isFullWidth variant="secondary" isDisabled>{LL.policies.simulator.runMany()}</Button>
          </Surface>
        }
        main={
          <Panels>
            <div>
              <Heading level={2} size="card" id="board">{LL.policies.simulator.board({ turn: shownTurn })}</Heading>
              <MapBoard board={board} isPending={simulation.isPending} error={simulation.error} turn={shownTurn} civNames={civNames} />
              <Field
                label={LL.policies.simulator.scrub()}
                htmlFor="sim-turn"
                labelAside={<Text as="span" isMono size="md">{LL.policies.simulator.scrubValue({ turn: shownTurn, total: lastTurn })}</Text>}
              >
                <Slider id="sim-turn" value={shownTurn} min={0} max={lastTurn} onChange={setTurn} />
              </Field>
              {result !== undefined && <Text size="xs" tone="muted">{LL.policies.simulator.realNote({ fingerprint: result.fingerprint })}</Text>}
            </div>
            <SimulationPanels result={result} shownTurn={shownTurn} seats={seats} yourYaml={request.botsYaml[0] ?? ""} />
          </Panels>
        }
      />
    </PageContainer>
  );
}

type SimulationPanelsProps = {
  result: SimulationResult | undefined;
  shownTurn: number;
  seats: SimulatedSeat[];
  /** Your policy's YAML, to name the rules in "What your rules did". */
  yourYaml: string;
};

/** Standings, territory over time and what your rules did, all from the simulated match. */
function SimulationPanels({ result, shownTurn, seats, yourYaml }: SimulationPanelsProps): ReactElement {
  const { LL } = useI18nContext();
  if (result === undefined) return <QueryStatus kind="loading" text={LL.policies.simulator.running()} />;

  const civs = result.turns[shownTurn]?.civs ?? [];
  const standings = [...seats].sort((a, b) => (civs[b.civ]?.tiles ?? 0) - (civs[a.civ]?.tiles ?? 0));
  const chartPoints = CHART_TURNS.filter((chartTurn) => chartTurn < result.turns.length);
  const finalCivs = result.turns.at(-1)?.civs ?? [];
  const chartMax = Math.max(1, ...result.turns.flatMap((point) => point.civs.map((civ) => civ.tiles)));
  const rules = checkPolicy(yourYaml).rules;

  return (
    <div>
      <Surface as="section" labelledBy="standings" padding="md">
        <Heading level={2} size="card" id="standings">{LL.policies.simulator.standings()}</Heading>
        <ol>
          {standings.map((seat, index) => (
            <RankedRow key={seat.civ} rank={index + 1} color={{ civ: seat.civ }} name={seat.name} value={LL.tiles({ count: civs[seat.civ]?.tiles ?? 0 })} />
          ))}
        </ol>
      </Surface>
      <Surface as="section" labelledBy="territory-chart" padding="md">
        <Heading level={2} size="card" id="territory-chart">{LL.policies.simulator.territoryOverTime()}</Heading>
        <BarChart
          label={LL.policies.simulator.chartLabel({
            summary: seats.map((seat) => LL.policies.simulator.chartCiv({ name: seat.name, count: finalCivs[seat.civ]?.tiles ?? 0 })).join(", "),
          })}
          max={chartMax}
          groups={chartPoints.map((chartTurn) => ({
            key: String(chartTurn),
            axisLabel: LL.matches.live.turnShort({ turn: chartTurn }),
            bars: seats.map((seat) => ({ value: result.turns[chartTurn]?.civs[seat.civ]?.tiles ?? 0, color: { civ: seat.civ } })),
          }))}
        />
      </Surface>
      <Surface as="section" labelledBy="rules-did" padding="md">
        <Heading level={2} size="card" id="rules-did">{LL.policies.simulator.rulesDid()}</Heading>
        <ul>
          {rules.map((rule, index) => {
            const count = result.yourRuleCounts[index] ?? 0;
            const action = rule.action ?? "";
            return (
              <li key={rule.number}>
                <Text size="md" tone="soft">
                  {count > 0
                    ? LL.policies.simulator.ruleFired({ rule: rule.number, action, count })
                    : LL.policies.simulator.ruleNeverFired({ rule: rule.number, action })}
                </Text>
              </li>
            );
          })}
        </ul>
        <Link to={paths.editor}>{LL.policies.simulator.backToEditor()}</Link>
      </Surface>
    </div>
  );
}
