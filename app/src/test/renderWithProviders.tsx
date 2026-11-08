// Test helper: renders a component inside every provider the app uses (theme, English
// translations, router, data cache, wallet), so tests see the same context as the real app.

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { AppI18nProvider } from "../i18n";
import { AppThemeProvider } from "../theme";

type Options = {
  /** Starting URL for the in-memory router. */
  route?: string;
};

/** Wraps `ui` in the app's providers; translations are always English in tests. */
export function renderWithProviders(ui: ReactElement, { route = "/" }: Options = {}): RenderResult {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function Providers({ children }: { children: ReactNode }): ReactElement {
    return (
      <AppThemeProvider>
        <AppI18nProvider language="en">
          <QueryClientProvider client={queryClient}>
            <ConnectionProvider endpoint="http://127.0.0.1:8899">
              <WalletProvider wallets={[]}>
                <WalletModalProvider>
                  <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
                </WalletModalProvider>
              </WalletProvider>
            </ConnectionProvider>
          </QueryClientProvider>
        </AppI18nProvider>
      </AppThemeProvider>
    );
  }

  return render(ui, { wrapper: Providers });
}
