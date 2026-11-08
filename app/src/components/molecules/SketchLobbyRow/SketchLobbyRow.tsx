// SketchLobbyRow molecule: one open lobby as a single handwritten line in the home page's
// "lobbies" panel: id, win metric, fee, seat circles, join deadline and a "join →" link.

import type { ReactElement } from "react";
import type { WinMetric } from "../../../types/game";
import { SketchMark, Text } from "../../atoms";
import { Closes, Fee, JoinLink, Metric, Row, SeatSlot, Seats } from "./SketchLobbyRow.styles";

/** Everything the row shows, already translated and formatted. */
export type SketchLobbyRowText = {
  metricLabel: string;
  feeText: string;
  /** Read out instead of the seat circles, e.g. "3 of 4 seats taken". */
  seatsText: string;
  /** "closes in 14 min". */
  closesText: string;
  joinLabel: string;
  /** Full link name for screen readers, e.g. "Join lobby #A41F". */
  joinAccessibleLabel: string;
};

type SketchLobbyRowProps = {
  /** Short id shown in mono, e.g. "#A41F". */
  id: string;
  metric: WinMetric;
  joinedCount: number;
  seatCount: number;
  lobbyPath: string;
  text: SketchLobbyRowText;
};

/** One lobby line, rendered as an <li>, so put it inside a <ul>. */
export function SketchLobbyRow({ id, metric, joinedCount, seatCount, lobbyPath, text }: SketchLobbyRowProps): ReactElement {
  const seats = Array.from({ length: seatCount }, (_, index) => index < joinedCount);
  return (
    <Row>
      <Text as="span" size="sm" tone="muted" isMono>
        {id}
      </Text>
      <Metric $metric={metric}>{text.metricLabel}</Metric>
      <Fee>{text.feeText}</Fee>
      <Seats role="img" aria-label={text.seatsText}>
        {seats.map((isTaken, index) => (
          <SeatSlot key={index}>
            <SketchMark kind={isTaken ? "seatTaken" : "seatOpen"} tone="chalk" />
          </SeatSlot>
        ))}
      </Seats>
      <Closes>{text.closesText}</Closes>
      <JoinLink to={lobbyPath} aria-label={text.joinAccessibleLabel}>
        {text.joinLabel}
      </JoinLink>
    </Row>
  );
}
