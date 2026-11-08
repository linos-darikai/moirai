// ReplayTimeline organism: play/pause, step, speed, a turn scrubber, and diamond markers for the
// match's key moments (click one to jump there).

import type { ReactElement } from "react";
import { useI18nContext } from "../../../i18n";
import type { ReplayMoment } from "../../../types/game";
import { Icon, Slider, Text, VisuallyHidden } from "../../atoms";
import { SegmentedControl } from "../../molecules";
import { REPLAY_SPEEDS } from "./ReplayTimeline.constants";
import type { ReplaySpeed } from "./ReplayTimeline.constants";
import { Controls, Diamond, Marker, PlayButton, StepButton, Ticks, Track } from "./ReplayTimeline.styles";


type ReplayTimelineProps = {
  turn: number;
  totalTurns: number;
  moments: readonly ReplayMoment[];
  /** The moment shown as "key moment" (outlined marker). */
  currentMoment: ReplayMoment | null;
  isPlaying: boolean;
  speed: ReplaySpeed;
  /** A short line next to the controls, e.g. where the turns came from. */
  caption: string;
  onTurnChange: (turn: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: ReplaySpeed) => void;
};

/** Playback controls and the turn timeline. */
export function ReplayTimeline({
  turn,
  totalTurns,
  moments,
  currentMoment,
  isPlaying,
  speed,
  caption,
  onTurnChange,
  onTogglePlay,
  onSpeedChange,
}: ReplayTimelineProps): ReactElement {
  const { LL } = useI18nContext();
  const quarterTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(fraction * totalTurns));

  return (
    <>
      <Controls>
        <StepButton type="button" aria-label={LL.matches.replay.previous()} onClick={() => onTurnChange(Math.max(0, turn - 1))}>
          <Icon name="chevronLeft" />
        </StepButton>
        <PlayButton type="button" aria-label={isPlaying ? LL.matches.replay.pause() : LL.matches.replay.play()} onClick={onTogglePlay}>
          <Icon name={isPlaying ? "pause" : "play"} size={20} />
        </PlayButton>
        <StepButton type="button" aria-label={LL.matches.replay.next()} onClick={() => onTurnChange(Math.min(totalTurns, turn + 1))}>
          <Icon name="chevronRight" />
        </StepButton>
        <SegmentedControl
          label={LL.matches.replay.speed()}
          options={REPLAY_SPEEDS.map((value) => ({ value, label: LL.matches.replay.speedValue({ speed: value }) }))}
          value={speed}
          onChange={onSpeedChange}
        />
        <Text as="span" size="md" tone="muted">
          {caption}
        </Text>
      </Controls>
      <Track>
        <VisuallyHidden htmlFor="replay-turn">{LL.matches.replay.turn()}</VisuallyHidden>
        <Slider id="replay-turn" value={turn} min={0} max={totalTurns} onChange={onTurnChange} />
        {moments.map((moment) => (
          <Marker
            key={moment.id}
            type="button"
            $leftPercent={(moment.turn / totalTurns) * 100}
            aria-label={LL.matches.replay.jump({ turn: moment.turn, label: LL.matches.replay.moments[moment.id].title() })}
            onClick={() => onTurnChange(moment.turn)}
          >
            <Diamond $tone={moment.tone} $isCurrent={currentMoment?.id === moment.id} />
          </Marker>
        ))}
      </Track>
      <Ticks aria-hidden="true">
        {quarterTicks.map((tick) => (
          <span key={tick}>{LL.matches.live.turnShort({ turn: tick })}</span>
        ))}
      </Ticks>
    </>
  );
}
