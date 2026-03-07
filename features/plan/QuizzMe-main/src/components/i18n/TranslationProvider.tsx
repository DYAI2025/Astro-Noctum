"use client";

import React, { createContext, useContext, useMemo } from "react";
import { Locale } from "@/i18n/config";
import { translate } from "@/i18n/dictionaries";

type TranslationContextValue = {
  locale: Locale;
  strings: Record<string, string>;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({
  locale,
  strings,
  children,
}: TranslationContextValue & { children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, strings }), [locale, strings]);
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslations() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error("useTranslations must be used within a TranslationProvider");
  }

  return (key: string, fallback?: string) => translate(key, ctx.strings, fallback);
}
