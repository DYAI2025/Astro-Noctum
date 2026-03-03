import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Language, translations } from "../i18n/translations";

// ── Types ──────────────────────────────────────────────────────────────────

interface LanguageContextType {
  /** Current active language */
  lang: Language;
  /** Switch language (persisted to localStorage + URL search param) */
  setLang: (lang: Language) => void;
  /** Translate a dot-separated key, e.g. t("dashboard.western.sectionTitle") */
  t: (key: string) => string;
}

// ── Storage key ───────────────────────────────────────────────────────────

const LANG_STORAGE_KEY = "bazodiac_lang";

// ── Helpers ───────────────────────────────────────────────────────────────

function readInitialLang(): Language {
  // 1. URL search param takes precedence: ?lang=de | ?lang=en
  try {
    const urlParam = new URLSearchParams(window.location.search).get("lang");
    if (urlParam === "de" || urlParam === "en") return urlParam;
  } catch {
    // SSR / unsupported env — ignore
  }

  // 2. Persisted localStorage
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "de" || stored === "en") return stored;
  } catch {
    // Private mode / quota exceeded — ignore
  }

  // 3. Browser language hint
  try {
    const browserLang = navigator.language?.slice(0, 2).toLowerCase();
    if (browserLang === "de") return "de";
  } catch {
    // ignore
  }

  return "en";
}

function deepGet(obj: any, keyPath: string): string {
  const parts = keyPath.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return keyPath;
    current = current[part];
  }
  return typeof current === "string" ? current : keyPath;
}

// ── Context ───────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readInitialLang);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
    // Update URL param without page reload (history state)
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", newLang);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string): string => deepGet(translations[lang], key),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() must be called inside a <LanguageProvider>.");
  }
  return ctx;
}
