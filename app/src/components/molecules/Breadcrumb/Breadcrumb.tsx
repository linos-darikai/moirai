// Breadcrumb molecule: "Lobbies / #A41F" trail back to parent pages.

import { Fragment } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Trail } from "./Breadcrumb.styles";

export type BreadcrumbItem = {
  label: string;
  /** Path for every crumb except the current page. */
  to?: string;
};

type BreadcrumbProps = {
  /** Accessible name of the navigation, e.g. "Breadcrumb". */
  label: string;
  items: readonly BreadcrumbItem[];
};

/** Links back up the page hierarchy; the last item is the current page. */
export function Breadcrumb({ label, items }: BreadcrumbProps): ReactElement {
  return (
    <Trail aria-label={label}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <span aria-hidden="true"> / </span>}
          {item.to === undefined ? <span aria-current="page">{item.label}</span> : <Link to={item.to}>{item.label}</Link>}
        </Fragment>
      ))}
    </Trail>
  );
}
