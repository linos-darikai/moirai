// App entry point: sets up the providers (theme, translations, data cache, Solana wallet) and
// mounts the router into the #root element in index.html.

// Must stay the first import: Anchor needs a global Buffer before its modules load.
import "./lib/solana/bufferPolyfill";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { AppI18nProvider } from "./i18n";
import { SolanaProvider } from "./lib/solana";
import { router } from "./routes/router";
import { AppThemeProvider } from "./theme";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("index.html is missing the #root element");
}

// One cache for all chain, engine and sample-data reads (TanStack Query).
const queryClient = new QueryClient();

createRoot(rootElement).render(
  <StrictMode>
    <AppThemeProvider>
      <AppI18nProvider>
        <QueryClientProvider client={queryClient}>
          <SolanaProvider>
            <RouterProvider router={router} />
          </SolanaProvider>
        </QueryClientProvider>
      </AppI18nProvider>
    </AppThemeProvider>
  </StrictMode>,
);
