// Lobbies page (home, "/"): the hand-drawn sketchbook front page. A big handwritten title, an
// animated battle sketch, the Play button, open lobbies read from devnet, the rules in four lines,
// the four sample strategies and a language switch. Design artboard "Home (hand-drawn)".
// It has no top bar: the vertical "leaderboard" tab and the links inside lead to the other pages.

import type { ReactElement } from "react";
import { Link } from "react-router";
import { Heading, LogoMark, Surface, UnitShape } from "../../components/atoms";
import { QueryStatus, SegmentedControl, SketchLobbyRow, WalletButton } from "../../components/molecules";
import { BattleSketch } from "../../components/organisms";
import { SketchbookFrame } from "../../components/templates";
import { useLanguage, useLobbies, useWalletButton } from "../../hooks";
import { SUPPORTED_LANGUAGES, useI18nContext } from "../../i18n";
import type { Locales, TranslationFunctions } from "../../i18n";
import { TOTAL_TURNS } from "../../lib/solana";
import { MAX_RULES_PER_POLICY } from "../../model/policyCheck";
import { lobbyPath, paths } from "../../routes/paths";
import type { CivIndex, LobbySummary, UnitKind } from "../../types/game";
import {
  Columns,
  DevnetNote,
  Footer,
  FooterNote,
  Header,
  HandLabel,
  LeaderboardTab,
  LobbyList,
  PanelGrid,
  PanelTop,
  PlayArrow,
  PlayButton,
  PlayHint,
  PlayRow,
  RuleList,
  RuleNumber,
  StrategyBody,
  StrategyLink,
  StrategyList,
  StrategyName,
  StrategyShape,
  Tagline,
  TitleBlock,
  WideCell,
} from "./LobbiesPage.styles";

/** At most this many lobbies fit the hand-drawn panel; the rest are one click away in the lobby. */
const LOBBIES_SHOWN = 5;
const RULE_STEPS = ["write", "join", "play", "settle"] as const;

/** Each sample strategy, drawn as the unit that sums it up, in a civ colour (as in the design). */
const STRATEGIES: readonly { id: "turtle" | "raider" | "trader" | "expander"; unit: UnitKind; civ: CivIndex }[] = [
  { id: "turtle", unit: "guard", civ: 0 },
  { id: "raider", unit: "infantry", civ: 1 },
  { id: "trader", unit: "elite", civ: 2 },
  { id: "expander", unit: "siege", civ: 3 },
];

/** The translated text one lobby row shows. */
function lobbyRowText(lobby: LobbySummary, LL: TranslationFunctions) {
  return {
    metricLabel: LL.metric[lobby.metric]().toLowerCase(),
    feeText: lobby.entryFeeSol === 0 ? LL.lobbies.home.row.free() : LL.sol({ amount: lobby.entryFeeSol }),
    seatsText: LL.lobbies.home.row.seats({ joined: lobby.joinedCount, total: lobby.seatCount }),
    closesText: LL.lobbies.home.row.closes({ minutes: lobby.closesInMinutes }),
    joinLabel: LL.lobbies.home.row.join(),
    joinAccessibleLabel: LL.lobbies.home.row.joinLabel({ id: lobby.label }),
  };
}

/** Route screen for "/". */
export function LobbiesPage(): ReactElement {
  const { LL } = useI18nContext();
  const { language, setLanguage } = useLanguage();
  const walletButton = useWalletButton();
  const lobbies = useLobbies("all");

  const languageOptions = SUPPORTED_LANGUAGES.map((code) => ({ value: code, label: code.toUpperCase() }));

  return (
    <SketchbookFrame
      sideTab={
        <LeaderboardTab to={paths.leaderboard}>
          <span>{LL.lobbies.home.leaderboardTab()}</span>
          <PlayArrow viewBox="0 0 26 26" aria-hidden="true">
            <path d="M4 13C10 12 16 13 22 13M22 13L15 6M22 13L15 20" />
          </PlayArrow>
        </LeaderboardTab>
      }
    >
      {/* Step 1: header (network note, title, wallet) */}
      <Header>
        <DevnetNote>{LL.lobbies.home.devnetNote()}</DevnetNote>
        <TitleBlock>
          <Heading level={1} size="display">
            {LL.appName()} <LogoMark size="large" />
          </Heading>
          <Tagline>{LL.lobbies.home.tagline()}</Tagline>
        </TitleBlock>
        <WalletButton {...walletButton} />
      </Header>

      <Columns>
        <BattleSketch />

        <PanelGrid>
          {/* Step 2: the call to action */}
          <WideCell>
            <PlayRow>
              <PlayButton to={paths.createLobby}>{LL.lobbies.home.play()}</PlayButton>
              <PlayHint>
                <svg width="96" height="34" viewBox="0 0 96 34" fill="none" aria-hidden="true">
                  <path d="M92 22C68 14 40 12 12 18M12 18L22 9M12 18L23 26" />
                </svg>
                {LL.lobbies.home.playHint()}
              </PlayHint>
            </PlayRow>
          </WideCell>

          {/* Step 3: open lobbies from devnet */}
          <WideCell>
            <Surface as="section" tone="sketch" padding="md" labelledBy="lobbies-heading">
              <PanelTop>
                <Heading level={2} size="h2" id="lobbies-heading">
                  {LL.lobbies.home.lobbies()}
                </Heading>
                {lobbies.data !== undefined && (
                  <HandLabel>{LL.lobbies.home.openCount({ count: lobbies.data.length })}</HandLabel>
                )}
              </PanelTop>
              <OpenLobbies lobbies={lobbies.data} isPending={lobbies.isPending} error={lobbies.error} />
            </Surface>
          </WideCell>

          {/* Step 4: the rules in four lines */}
          <Surface as="section" tone="sketch" padding="md" labelledBy="rules-heading">
            <Heading level={2} size="h2" id="rules-heading">
              {LL.lobbies.home.rules()}
            </Heading>
            <RuleList>
              {RULE_STEPS.map((step, index) => (
                <li key={step}>
                  <RuleNumber>{index + 1}.</RuleNumber>
                  <span>{LL.lobbies.home.ruleSteps[step]({ max: MAX_RULES_PER_POLICY, turns: TOTAL_TURNS })}</span>
                </li>
              ))}
            </RuleList>
            <Link to={paths.rules}>{LL.lobbies.home.allRules()}</Link>
          </Surface>

          {/* Step 5: the four sample strategies, each opening the policy editor */}
          <Surface as="section" tone="sketch" padding="md" labelledBy="strategies-heading">
            <Heading level={2} size="h2" id="strategies-heading">
              {LL.lobbies.home.strategies()}
            </Heading>
            <StrategyList>
              {STRATEGIES.map((strategy) => (
                <li key={strategy.id}>
                  <StrategyLink to={paths.editor}>
                    <StrategyShape>
                      <UnitShape kind={strategy.unit} civ={strategy.civ} size={30} />
                    </StrategyShape>
                    <span>
                      <StrategyName>{LL.lobbies.home.strategy[strategy.id].name()}</StrategyName>
                      <StrategyBody>{LL.lobbies.home.strategy[strategy.id].body()}</StrategyBody>
                    </span>
                  </StrategyLink>
                </li>
              ))}
            </StrategyList>
          </Surface>
        </PanelGrid>
      </Columns>

      {/* Step 6: language and the devnet disclaimer */}
      <Footer>
        <HandLabel as="div">
          {LL.lobbies.home.language()}{" "}
          <SegmentedControl
            label={LL.language.label()}
            shape="hand"
            options={languageOptions}
            value={language}
            onChange={(value) => setLanguage(value as Locales)}
          />
        </HandLabel>
        <FooterNote>{LL.footer.devnetOnly()}</FooterNote>
      </Footer>
    </SketchbookFrame>
  );
}

type OpenLobbiesProps = {
  lobbies: LobbySummary[] | undefined;
  isPending: boolean;
  error: Error | null;
};

/** The lobby rows, or the loading, error or empty state. */
function OpenLobbies({ lobbies, isPending, error }: OpenLobbiesProps): ReactElement {
  const { LL } = useI18nContext();
  if (error !== null) {
    return <QueryStatus kind="error" text={LL.states.error({ message: error.message })} />;
  }
  if (isPending || lobbies === undefined) {
    return <QueryStatus kind="loading" text={LL.states.loading()} />;
  }
  if (lobbies.length === 0) {
    return (
      <HandLabel>
        {LL.lobbies.home.noLobbies()} <Link to={paths.createLobby}>{LL.lobbies.home.createOne()}</Link>
      </HandLabel>
    );
  }
  return (
    <LobbyList>
      {lobbies.slice(0, LOBBIES_SHOWN).map((lobby) => (
        <SketchLobbyRow
          key={lobby.id}
          id={lobby.label}
          metric={lobby.metric}
          joinedCount={lobby.joinedCount}
          seatCount={lobby.seatCount}
          lobbyPath={lobbyPath(lobby.id)}
          text={lobbyRowText(lobby, LL)}
        />
      ))}
    </LobbyList>
  );
}
