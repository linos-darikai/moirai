// Provides the theme and global styles to everything inside it.

import type { ReactElement, ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { GlobalStyle } from "./GlobalStyle";
import { theme } from "./theme";

type AppThemeProviderProps = {
  children: ReactNode;
};

/** Wraps the app (and tests) with the Moirai theme and global styles. */
export function AppThemeProvider({ children }: AppThemeProviderProps): ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}
