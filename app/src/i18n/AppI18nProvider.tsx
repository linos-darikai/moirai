// Provides translations to the app: `const { LL } = useI18nContext()` then `LL.lobbies.home.title()`.

import type { ReactElement, ReactNode } from "react";
import TypesafeI18n from "./i18n-react.js";
import type { Locales } from "./i18n-types.js";
import { detectInitialLanguage } from "./setup";

type AppI18nProviderProps = {
  children: ReactNode;
  /** Force a language (tests); otherwise the saved or browser language is used. */
  language?: Locales;
};

/** Wraps the app with the typesafe-i18n context in the starting language. */
export function AppI18nProvider({ children, language }: AppI18nProviderProps): ReactElement {
  const startLanguage: Locales = language ?? detectInitialLanguage();
  return <TypesafeI18n locale={startLanguage}>{children}</TypesafeI18n>;
}
