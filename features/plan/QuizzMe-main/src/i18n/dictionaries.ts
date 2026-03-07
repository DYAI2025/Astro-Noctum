import { defaultLocale, Locale, normalizeLocale } from "./config";

const dictionaries: Record<Locale, () => Promise<Record<string, string>>> = {
  en: () => import("./locales/en.json").then((m) => m.default),
  de: () => import("./locales/de.json").then((m) => m.default),
};

export async function getDictionary(locale: string | undefined): Promise<{
  locale: Locale;
  strings: Record<string, string>;
}> {
  const normalized = normalizeLocale(locale);
  const strings = await dictionaries[normalized]();
  return { locale: normalized, strings };
}

export function translate(
  key: string,
  strings: Record<string, string>,
  fallback?: string
): string {
  return strings[key] ?? fallback ?? key;
}

export function getRoutePrefix(locale: string | undefined): string {
  const normalized = normalizeLocale(locale);
  if (normalized === defaultLocale) return "";
  return `/${normalized}`;
}
