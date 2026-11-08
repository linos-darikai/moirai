// PanelHeader molecule: a panel's title with something on the right (a link, a status, a toggle).

import type { ReactElement, ReactNode } from "react";
import { Heading } from "../../atoms";
import type { HeadingSize } from "../../atoms";
import { Row } from "./PanelHeader.styles";

type PanelHeaderProps = {
  title: string;
  /** id so the panel can be aria-labelledby this heading. */
  id?: string;
  level?: 2 | 3;
  size?: HeadingSize;
  /** Content shown at the right of the title. */
  aside?: ReactNode;
};

/** A title row for a panel. */
export function PanelHeader({ title, id, level = 2, size, aside }: PanelHeaderProps): ReactElement {
  return (
    <Row>
      <Heading level={level} id={id} size={size ?? (level === 2 ? "h3" : "card")}>
        {title}
      </Heading>
      {aside}
    </Row>
  );
}
