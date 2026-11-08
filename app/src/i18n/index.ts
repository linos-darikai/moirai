// Barrel for i18n. Components use `useI18nContext()` and call text like functions:
//   const { LL } = useI18nContext();
//   LL.lobbies.home.title();             // plain text
//   LL.lobbies.lobby.action.join({ fee }) // text with a typed parameter
export { AppI18nProvider } from "./AppI18nProvider";
export { useI18nContext } from "./i18n-react.js";
export type { Locales, TranslationFunctions } from "./i18n-types.js";
export { LANGUAGE_INFO, SUPPORTED_LANGUAGES, rememberLanguage } from "./setup";
