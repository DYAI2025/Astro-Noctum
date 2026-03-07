"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useTranslations } from "@/components/i18n/TranslationProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const t = useTranslations();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--theme-pill-border)] bg-[var(--theme-pill-surface)] text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-pill-text)] hover:shadow-lg transition-all"
      aria-label="Toggle Theme"
    >
      {isLight ? <Sun size={16} /> : <Moon size={16} />}
      <span>{isLight ? t("theme.light") : t("theme.dark")}</span>
    </button>
  );
}
