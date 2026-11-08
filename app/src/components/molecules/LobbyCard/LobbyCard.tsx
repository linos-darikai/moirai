// LobbyCard molecule: one open lobby on the home page (metric, fee, pool, turns, payout, seats,
// join deadline, and a link to the lobby).

import type { ReactElement } from "react";
import type { WinMetric } from "../../../types/game";
import { Button, MetricBadge, Swatch, Text } from "../../atoms";
import { KeyValueList } from "../KeyValueList";
import { Card, Fee, Seats, TopRow } from "./LobbyCard.styles";

/** Everything a lobby card shows, already translated and formatted. */
export type LobbyCardText = {
  metricLabel: string;
  feeText: string;
  /** "entry · pool 1.5 SOL". */
  poolText: string;
  turnsLabel: string;
  payoutLabel: string;
  payoutText: string;
  seatsLabel: string;
  seatsText: string;
  closesLabel: string;
  closesText: string;
  viewLabel: string;
};

type LobbyCardProps = {
  id: string;
  metric: WinMetric;
  turns: number;
  joinedCount: number;
  seatCount: number;
  lobbyPath: string;
  text: LobbyCardText;
};

/** A lobby summary card. */
export function LobbyCard({ id, metric, turns, joinedCount, seatCount, lobbyPath, text }: LobbyCardProps): ReactElement {
  const seats = Array.from({ length: seatCount }, (_, index) => index < joinedCount);
  return (
    <Card>
      <TopRow>
        <MetricBadge metric={metric} label={text.metricLabel} />
        <Text as="span" size="sm" tone="muted" isMono>
          {id}
        </Text>
      </TopRow>
      <Fee>
        <Text as="span" size="h2" weight="bold" isDisplay>
          {text.feeText}
        </Text>
        <Text as="span" size="md" tone="muted">
          {text.poolText}
        </Text>
      </Fee>
      <KeyValueList
        layout="grid"
        rows={[
          { key: "turns", label: text.turnsLabel, value: turns },
          { key: "payout", label: text.payoutLabel, value: text.payoutText },
          {
            key: "seats",
            label: text.seatsLabel,
            value: (
              <Seats>
                {seats.map((isTaken, index) => (
                  <Swatch key={index} color={isTaken ? { token: "accent" } : { token: "empty" }} size="sm" />
                ))}
                {text.seatsText}
              </Seats>
            ),
          },
          { key: "closes", label: text.closesLabel, value: text.closesText },
        ]}
      />
      <Button to={lobbyPath} variant="subtle" size="sm" isFullWidth ariaLabel={text.viewLabel}>
        {text.viewLabel}
      </Button>
    </Card>
  );
}
