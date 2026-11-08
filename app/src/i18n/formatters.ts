// Locale-aware formatters used inside translations, e.g. "{amount:number|sol}". This file is ours
// (the typesafe-i18n generator only creates it once). Each formatter uses the browser's Intl API
// with the active locale, so "1,684" in English is "1 684" in French and "1.684" in Spanish.

import type { FormattersInitializer } from "typesafe-i18n";
import type { Formatters, Locales } from "./i18n-types.js";

/** Ordinal suffixes ("1st", "1.º", "1er") differ per language and aren't covered by Intl. */
const ordinalByLocale: Record<Locales, (value: number) => string> = {
  en: (value) => {
    const suffixes: Record<Intl.LDMLPluralRule, string> = {
      zero: "th",
      one: "st",
      two: "nd",
      few: "rd",
      many: "th",
      other: "th",
    };
    const rule = new Intl.PluralRules("en", { type: "ordinal" }).select(value);
    return `${value}${suffixes[rule]}`;
  },
  es: (value) => `${value}.º`,
  fr: (value) => (value === 1 ? "1er" : `${value}e`),
};

export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {
  const integerFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const solFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 4 });
  const percentFormat = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const minutesFormat = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "minute",
    unitDisplay: "long",
  });
  const hoursFormat = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "hour",
    unitDisplay: "long",
  });

  const formatters: Formatters = {
    /** A whole number with the locale's thousands separator. */
    integer: (value: number) => integerFormat.format(value),
    /** An amount of SOL, up to 4 decimals: "0.5 SOL". */
    sol: (value: number) => `${solFormat.format(value)} SOL`,
    /** A fraction as a percentage: 0.015 becomes "1.5%". */
    percent: (value: number) => percentFormat.format(value),
    /** A duration given in minutes: "30 minutes", or "6 hours" when it is whole hours. */
    minutes: (value: number) =>
      value >= 60 && value % 60 === 0 ? hoursFormat.format(value / 60) : minutesFormat.format(value),
    /** A place in a ranking: "1st", "2nd" (English), "1.º" (Spanish), "1er" (French). */
    ordinal: (value: number) => ordinalByLocale[locale](value),
  };

  return formatters;
};
