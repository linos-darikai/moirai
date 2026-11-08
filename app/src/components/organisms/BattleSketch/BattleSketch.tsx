// BattleSketch organism: the animated drawing on the home page. A green infantry triangle leaves
// your territory, crosses the map, knocks out a red siege tower and wins a tile, on a 6 s loop.
// Purely decorative storytelling; the role="img" label tells screen readers what it shows.
// Colours come from the theme (passed as SVG attributes, since SVG strokes can't read CSS props).

import type { ReactElement } from "react";
import { useTheme } from "styled-components";
import { useI18nContext } from "../../../i18n";
import * as paths from "./battleSketchPaths";
import { Canvas, Note } from "./BattleSketch.styles";

/** The home page's battle drawing. */
export function BattleSketch(): ReactElement {
  const { LL } = useI18nContext();
  const theme = useTheme();
  const you = theme.civColors[0];
  const enemy = theme.colors.danger;
  const pen = theme.colors.text;

  return (
    <Canvas viewBox="0 0 520 430" role="img" aria-label={LL.lobbies.sketch.label()}>
      <path d={paths.GRID} stroke={theme.colors.surfaceRaised} strokeWidth="1.5" />

      {/* Step 1: the two territories with their capitals and a deposit each */}
      <path d={paths.YOUR_TERRITORY} fill={you} fillOpacity="0.08" stroke={you} strokeOpacity="0.55" strokeWidth="2" />
      <path d={paths.ENEMY_TERRITORY} fill={enemy} fillOpacity="0.07" stroke={enemy} strokeOpacity="0.5" strokeWidth="2" />
      <g className="capital">
        <path d={paths.YOUR_CITY_CIRCLE} fill="none" stroke={you} strokeWidth="3" strokeLinecap="round" />
        <path d={paths.YOUR_CITY_SPIRAL} fill="none" stroke={pen} strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d={paths.ENEMY_CITY_CIRCLE} fill="none" stroke={enemy} strokeWidth="3" strokeLinecap="round" />
      <path d={paths.ENEMY_CITY_SPIRAL} fill="none" stroke={pen} strokeWidth="2" strokeLinecap="round" />
      <path d={paths.FOOD_DEPOSIT} fill="none" stroke={theme.resourceColors.food} strokeWidth="3" strokeLinecap="round" />
      <path d={paths.GOLD_DEPOSIT} fill="none" stroke={theme.resourceColors.gold} strokeWidth="3" strokeLinecap="round" />

      {/* Step 2: the march, the tower, and what happens when they meet */}
      <path className="trail" d={paths.MARCH_TRAIL} fill="none" stroke={pen} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 10" />
      <g className="tower">
        <path d={paths.TOWER_BODY} fill={enemy} fillOpacity="0.18" stroke={enemy} strokeWidth="3" strokeLinejoin="round" />
        <path d={paths.TOWER_BATTLEMENTS} fill="none" stroke={enemy} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={paths.TOWER_HATCHING} stroke={enemy} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      </g>
      <path className="cross" d={paths.DEFEAT_CROSS} fill="none" stroke={theme.colors.markerRed} strokeWidth="5" strokeLinecap="round" />
      <g className="burst">
        <path d={paths.IMPACT_BURST} fill="none" stroke={theme.colors.highlight} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="infantry">
        <path d={paths.INFANTRY_OUTLINE} fill={you} fillOpacity="0.12" stroke={you} strokeWidth="3.5" strokeLinejoin="round" />
        <path d={paths.INFANTRY_SECOND_PASS} fill="none" stroke={you} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        <path d={paths.INFANTRY_HATCHING} fill="none" stroke={you} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      </g>

      {/* Step 3: handwritten notes */}
      <Note x="22" y="214" fill={pen} $size="note">
        {LL.lobbies.sketch.yourBot()}
      </Note>
      <path d={paths.NOTE_ARROW} fill="none" stroke={pen} strokeWidth="2" strokeLinecap="round" />
      <Note x="396" y="226" fill={enemy} $size="note">
        {LL.lobbies.sketch.tower()}
      </Note>
      <Note className="tile-won" x="306" y="182" fill={theme.colors.highlight} $size="big">
        {LL.lobbies.sketch.tileWon()}
      </Note>
      <Note x="22" y="414" fill={theme.colors.textMuted} $size="note">
        {LL.lobbies.sketch.caption()}
      </Note>
    </Canvas>
  );
}
