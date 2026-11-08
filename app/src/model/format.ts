// Small display helpers that aren't language-specific (language-specific formatting lives in the
// i18n formatters).

/** Shortens a wallet address or hash for display: "7xKqF…3fPa". Short values are left as-is. */
export function shortenAddress(value: string, visible = 4): string {
  if (value.length <= visible * 2 + 1) return value;
  return `${value.slice(0, visible)}…${value.slice(-visible)}`;
}

/** Two-letter avatar initials from a bot name ("iron-turtle" → "IT") or an address. */
export function initialsFor(name: string): string {
  const parts = name.split(/[-_\s]+/).filter((part) => part.length > 0);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return `${first}${second}`.toUpperCase();
}

/** A hex hash grouped in 4s and shortened: "9f3c 41d0 77ab … e1a7". */
export function groupHash(hex: string): string {
  if (hex.length < 16) return hex;
  const groups = hex.slice(0, 12).match(/.{1,4}/g) ?? [];
  return `${groups.join(" ")} … ${hex.slice(-4)}`;
}

/** Signed number for Elo changes: +24, −9 (with a real minus sign). */
export function signedNumber(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}
