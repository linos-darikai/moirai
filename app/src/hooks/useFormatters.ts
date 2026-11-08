// Locale-aware number formatting for values shown outside a sentence (Elo, tile counts, SOL).
// Inside sentences, use the i18n formatters ({amount:number|sol}) instead.

import { useMemo } from "react";
import { useI18nContext } from "../i18n";

export type Formatters = {
  /** 1684 → "1,684" (en), "1 684" (fr), "1.684" (es). */
  integer: (value: number) => string;
  /** 1.97 → "1.97 SOL". */
  sol: (value: number) => string;
  /** 0.58 → "58%". */
  percent: (value: number) => string;
  /** 1.25 → "1.25" (en), "1,25" (es, fr); always at least 2 decimals unless `digits` says otherwise. */
  decimal: (value: number, digits?: number) => string;
  /** A month from an ISO date: "2026-10-01" → "October 2026". */
  month: (isoDate: string) => string;
};

/** Number formatters for the current language. */
export function useFormatters(): Formatters {
  const { locale, LL } = useI18nContext();
  return useMemo(() => {
    const integerFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const percentFormat = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
    const monthFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
    return {
      integer: (value) => integerFormat.format(value),
      sol: (value) => LL.sol({ amount: value }),
      percent: (value) => percentFormat.format(value),
      decimal: (value, digits = 2) =>
        new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value),
      month: (isoDate) => monthFormat.format(new Date(`${isoDate}T00:00:00Z`)),
    };
  }, [locale, LL]);
}
