// TurnFeed organism: what happened in recent turns, as translated sentences. Events are data
// (types/game FeedEvent); this turns each into text in the player's language.

import type { ReactElement } from "react";
import { useI18nContext } from "../../../i18n";
import type { TranslationFunctions } from "../../../i18n";
import type { CivIndex, FeedEvent } from "../../../types/game";
import { FeedItem } from "../../molecules";
import { List } from "./TurnFeed.styles";

type TurnFeedProps = {
  events: readonly FeedEvent[];
  civNames: Readonly<Record<CivIndex, string>>;
  /** Show the "t37" turn labels (the compact mobile feed hides them). */
  showTurns?: boolean;
  look?: "plain" | "boxed";
};

/** One feed event as a sentence in the current language. */
function describeEvent(event: FeedEvent, civNames: Readonly<Record<CivIndex, string>>, LL: TranslationFunctions): string {
  const civ = civNames[event.civIndex];
  switch (event.kind) {
    case "attack":
      return LL.matches.feed.attack({ attacker: civ, defender: civNames[event.defender], x: event.x, y: event.y, count: event.tiles });
    case "claimDeposit":
      return LL.matches.feed.claimDeposit({ civ, resource: LL.resource[event.resource]().toLowerCase(), x: event.x, y: event.y });
    case "sell":
      return LL.matches.feed.sell({
        civ,
        count: event.amount,
        resource: LL.resource[event.resource]().toLowerCase(),
        percent: Math.abs(event.priceChange),
      });
    case "buildElite":
      return LL.matches.feed.buildElite({ civ });
    case "buildGuards":
      return LL.matches.feed.buildGuards({ civ, count: event.count, side: LL.matches.feed.side[event.side]() });
    case "lowFood":
      return LL.matches.feed.lowFood({ civ, rule: event.rule, count: event.workers });
  }
}

/** A list of recent events, newest first. */
export function TurnFeed({ events, civNames, showTurns = true, look = "plain" }: TurnFeedProps): ReactElement {
  const { LL } = useI18nContext();
  return (
    <List aria-live="polite">
      {events.map((event, index) => (
        <FeedItem
          key={`${event.turn}-${index}`}
          turnLabel={showTurns ? LL.matches.live.turnShort({ turn: event.turn }) : undefined}
          color={{ civ: event.civIndex }}
          text={describeEvent(event, civNames, LL)}
          look={look}
        />
      ))}
    </List>
  );
}
