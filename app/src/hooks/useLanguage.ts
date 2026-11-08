// Language hook: the current language and a way to switch it (and remember the choice).

import { useCallback, useEffect } from "react";
import { rememberLanguage, useI18nContext } from "../i18n";
import type { Locales } from "../i18n";

export type LanguageControl = {
  language: Locales;
  setLanguage: (language: Locales) => void;
};

/** The active language, and a setter that also saves it and updates `<html lang>`. */
export function useLanguage(): LanguageControl {
  const { locale, setLocale } = useI18nContext();

  // Keep <html lang> in sync on first load too, for screen readers and spell checking.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLanguage = useCallback(
    (language: Locales) => {
      setLocale(language);
      rememberLanguage(language);
    },
    [setLocale],
  );

  return { language: locale, setLanguage };
}
