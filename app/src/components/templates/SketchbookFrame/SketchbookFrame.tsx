// SketchbookFrame template: the home page's layout. The whole page sits inside one big hand-drawn
// frame, with a narrow tab beside it (the vertical "leaderboard" link). Layout only, no data.

import type { ReactElement, ReactNode } from "react";
import { Frame, Page, Tab } from "./SketchbookFrame.styles";

type SketchbookFrameProps = {
  /** Everything inside the big frame. */
  children: ReactNode;
  /** The narrow tab to the right of the frame (below it on phones). */
  sideTab: ReactNode;
};

/** A page drawn as one sketchbook spread with a side tab. */
export function SketchbookFrame({ children, sideTab }: SketchbookFrameProps): ReactElement {
  return (
    <Page>
      <Frame>{children}</Frame>
      <Tab>{sideTab}</Tab>
    </Page>
  );
}
