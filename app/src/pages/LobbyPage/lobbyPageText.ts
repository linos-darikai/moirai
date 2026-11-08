// What the Lobby page says for each lobby step: the phase chip, the progress steps, the action
// button and the helper text under it. Kept apart from LobbyPage.tsx so the page is only layout.

import type { TranslationFunctions } from "../../i18n";
import type { LobbyActionRequest } from "../../hooks";
import type { LobbyStep } from "../../model/lobbyFromMatch";
import { MATCH_TURNS } from "../../model/lobbyFromMatch";
import type { MatchAccountView } from "../../types/chain";
import { ENTRY_STEPS } from "../../types/game";

/** The phase shown in the chip next to the title. */
export type LobbyPhase = "waiting" | "commit" | "reveal" | "starting" | "seed" | "playing" | "finished";

export function lobbyPhase(match: MatchAccountView | null): LobbyPhase {
  if (match === null || match.status === "settled" || match.status === "cancelled") return "finished";
  if (match.status === "running") return "playing";
  if (match.status === "seedRequested") return "seed";
  if (match.players.length < match.maxPlayers) return "waiting";
  if (!match.committed.every(Boolean)) return "commit";
  if (!match.revealed.every(Boolean)) return "reveal";
  return "starting";
}

/** The join → commit → reveal → play progress for the connected wallet. */
export function entrySteps(match: MatchAccountView, wallet: string | null, fee: string, LL: TranslationFunctions) {
  const seat = wallet === null ? -1 : match.players.indexOf(wallet);
  const doneCount =
    seat < 0
      ? 0
      : 1 + (match.committed[seat] === true ? 1 : 0) + (match.revealed[seat] === true ? 1 : 0) + (match.status === "running" ? 1 : 0);
  const text = LL.lobbies.lobby.steps;
  return ENTRY_STEPS.map((step, index) => {
    const title = text[step].title();
    const body =
      step === "join" ? text.join.body({ fee }) : step === "play" ? text.play.body({ turns: MATCH_TURNS }) : text[step].body();
    const state = index < doneCount ? ("done" as const) : index === doneCount ? ("current" as const) : ("upcoming" as const);
    return { id: step, title, body, state, doneLabel: LL.lobbies.lobby.stepDone({ step: title }) };
  });
}

/** The button for a step: its label and the action it sends (null = no button, just a message). */
export type StepButton = { label: string; request: LobbyActionRequest["kind"] | "connect" } | null;

export function stepButton(step: LobbyStep, match: MatchAccountView, fee: string, LL: TranslationFunctions): StepButton {
  const action = LL.lobbies.lobby.action;
  switch (step) {
    case "connect":
      return { label: action.connect(), request: "connect" };
    case "join":
      return { label: action.join({ fee }), request: "join" };
    case "commit":
      return { label: action.commit(), request: "commit" };
    case "reveal":
      return { label: action.reveal(), request: "reveal" };
    case "start":
      return { label: action.start(), request: "start" };
    case "retrySeed":
      return { label: action.retrySeed(), request: "retrySeed" };
    case "play":
      return { label: action.play({ turn: match.turn, total: MATCH_TURNS }), request: "play" };
    case "settle":
      return { label: action.settle(), request: "settle" };
    case "cancel":
      return { label: action.cancel(), request: "cancel" };
    default:
      return null;
  }
}

/** The sentence under the button. */
export function stepHelper(step: LobbyStep, match: MatchAccountView, LL: TranslationFunctions): string {
  const lobby = LL.lobbies.lobby;
  switch (step) {
    case "connect":
    case "join":
      return lobby.helper.join();
    case "commit":
      return lobby.helper.commit();
    case "reveal":
      return lobby.helper.reveal({ count: match.maxPlayers });
    case "start":
    case "retrySeed":
    case "play":
    case "settle":
    case "cancel":
      return lobby.helperAnyone[step]();
    case "waitForPlayers":
    case "waitForCommits":
    case "waitForReveals":
    case "waitForSeed":
    case "watch":
      return lobby.wait[step]();
    case "closed":
      return lobby.closed();
  }
}
