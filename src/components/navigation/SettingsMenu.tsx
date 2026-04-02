import { useEffect } from "react";
import { LogOut, ExternalLink } from "lucide-react";
import { ManageSubscription } from "../ManageSubscription";
import { usePremium } from "../../hooks/usePremium";

interface SettingsMenuProps {
  /** "desktop" renders dropdown below the button; "mobile" renders above */
  position: "desktop" | "mobile";
  user: { email?: string };
  lang: "de" | "en";
  setLang: (l: "de" | "en") => void;
  planetariumMode: boolean;
  togglePlanetarium: () => void;
  signOut: () => void;
  t: (key: string) => string;
  onOpenLegal: (s: "terms" | "privacy") => void;
  onClose: () => void;
}

export function SettingsMenu({
  position,
  user,
  lang,
  setLang,
  planetariumMode,
  togglePlanetarium,
  signOut,
  t,
  onOpenLegal,
  onClose,
}: SettingsMenuProps) {
  const { isPremium } = usePremium();

  // Minor fix #7: Escape key closes the dropdown
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const panelClass =
    position === "desktop"
      ? "absolute right-0 top-full mt-2 w-56 bg-[#00050A]/95 backdrop-blur-xl border border-[#D4AF37]/15 rounded-xl shadow-2xl z-50 py-2"
      : // Minor fix #8: max-w prevents overflow on 320px screens
        "absolute bottom-full right-0 mb-2 w-64 max-w-[calc(100vw-2rem)] bg-[#00050A]/95 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl shadow-2xl z-50 py-2";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div role="menu" className={panelClass}>
        {/* User profile */}
        <div className="px-4 py-2 border-b border-[#D4AF37]/10 mb-1">
          <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/40 mb-0.5">
            {t("nav.settingsProfile")}
          </p>
          <p className="text-xs text-white/50 truncate">{user.email}</p>
        </div>

        {/* Language toggle */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-white/50">
            {lang === "de" ? "Sprache" : "Language"}
          </span>
          <div
            className="lang-toggle"
            role="group"
            aria-label={lang === "de" ? "Sprachauswahl" : "Language selection"}
          >
            <button
              className={lang === "de" ? "active" : ""}
              onClick={() => setLang("de")}
              aria-pressed={lang === "de" ? "true" : "false"}
            >
              DE
            </button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en" ? "true" : "false"}
            >
              EN
            </button>
          </div>
        </div>

        {/* Dark / Bright mode */}
        <button
          role="menuitem"
          onClick={() => { togglePlanetarium(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors flex items-center justify-between"
        >
          <span>
            {planetariumMode ? t("nav.settingsBrightMode") : t("nav.settingsDarkMode")}
          </span>
          <span className="text-[10px] text-[#D4AF37]/40">
            {planetariumMode ? "●" : "○"}
          </span>
        </button>

        {/* Important fix #4: only render subscription section + its dividers for premium users */}
        {isPremium && (
          <>
            <div className="border-t border-[#D4AF37]/10 my-1" />
            <div className="px-4 py-1">
              <ManageSubscription className="block w-full text-left text-sm text-white/60 hover:text-white py-1.5 transition-colors" />
            </div>
          </>
        )}

        <div className="border-t border-[#D4AF37]/10 my-1" />

        {/* AGB */}
        <button
          role="menuitem"
          onClick={() => { onOpenLegal("terms"); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors"
        >
          {t("nav.settingsAgb")}
        </button>

        {/* Datenschutz */}
        <button
          role="menuitem"
          onClick={() => { onOpenLegal("privacy"); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors"
        >
          {t("nav.settingsPrivacy")}
        </button>

        {/* sky.bazodiac.space */}
        <a
          role="menuitem"
          href="https://sky.bazodiac.space"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center justify-between w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors"
        >
          {t("nav.settingsSky")}
          <ExternalLink className="w-3 h-3 text-white/30" aria-hidden="true" />
        </a>

        <div className="border-t border-[#D4AF37]/10 my-1" />

        {/* Logout */}
        <button
          role="menuitem"
          onClick={() => { signOut(); onClose(); }}
          className="w-full px-4 py-2.5 text-left text-sm text-white/60 hover:text-white hover:bg-[#D4AF37]/08 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          {t("nav.signOut")}
        </button>
      </div>
    </>
  );
}
