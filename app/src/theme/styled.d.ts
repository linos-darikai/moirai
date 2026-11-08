// Tells TypeScript that styled-components' `props.theme` is our AppTheme, so every token is typed
// and autocompleted in styles files.

import "styled-components";
import type { AppTheme } from "./theme";

declare module "styled-components" {
  // An interface that only extends AppTheme: this is how styled-components asks to be typed.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
