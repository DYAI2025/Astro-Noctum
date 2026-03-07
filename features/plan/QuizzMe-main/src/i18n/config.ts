export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";

export function normalizeLocale(locale: string | undefined | null): Locale {
  if (!locale) return defaultLocale;
  const lower = locale.toLowerCase();
  return locales.includes(lower as Locale) ? (lower as Locale) : defaultLocale;
}
