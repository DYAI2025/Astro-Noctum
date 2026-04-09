import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Link, useLocation } from "react-router-dom";
import { Splash } from "./components/Splash";
import { AuthGate } from "./components/AuthGate";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";
import { useAmbientePlayer } from "./hooks/useAmbientePlayer";
import { useAstroProfile } from "./hooks/useAstroProfile";
import { trackEvent } from "./lib/analytics";
import { usePlanetarium } from "./contexts/PlanetariumContext";
import { FusionRingProvider } from "./contexts/FusionRingContext";
import { AppLayoutProvider } from "./contexts/AppLayoutContext";
import { AgentProvider, useAgent } from "./contexts/AgentContext";
import { AgentFloatingWidget } from "./components/AgentFloatingWidget";
import { AppRoutes } from "./router";
import { bootstrapExperience } from "./services/experience";
import { saveDisplayName } from "./services/supabase";
import type { OnboardingBirthData } from "./components/BirthForm";
import { BrandedLoader } from "./components/BrandedLoader";
import { usePremium } from "./hooks/usePremium";
import { isFeatureEnabled } from "./lib/feature-flags";
import type { BootstrapResponse, SignatureDeltaResponse } from "./lib/schemas/experience";
import { Volume2, VolumeX, Settings, X } from "lucide-react";
import { IconSparkles as Sparkles, IconTelescope as TelescopeIcon, IconOrbit as OrbitIcon } from "./components/animated-icons";
import { SettingsMenu } from "./components/navigation/SettingsMenu";
import { LEGAL_CONTENT } from "./components/LegalFooter";
import { DebugPanel, useDebugPanel } from "./debug";
import { useElementTheme } from "./hooks/useElementTheme";

import type { ApiData } from "./types/bafe";

const EMPTY_API_DATA: ApiData = {
  bazi: { day_master: "", zodiac_sign: "" },
  western: { houses: {} },
  wuxing: { elements: {}, dominant_element: "" },
};

/**
 * Returns true when the bootstrap response contains fallback/synthetic soulprint data.
 * Used to show a non-blocking hint in SignatureReveal.
 */
export function isBootstrapFallback(seed: string): boolean {
  return seed.startsWith('fallback:');
}

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { planetariumMode, togglePlanetarium } = usePlanetarium();

  const [showSplash, setShowSplash] = useState(true);
  const [siteVisible, setSiteVisible] = useState(false);
  
  // -- ONBOARDING PERSISTENCE --
  const [bootstrapData, setBootstrapData] = useState<BootstrapResponse | null>(() => {
    try {
      const saved = localStorage.getItem('bazodiac_onboarding_data');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [onboardingPhase, setOnboardingPhase] = useState<'form' | 'encounter' | 'signature' | 'done'>(() => {
    const saved = localStorage.getItem('bazodiac_onboarding_phase');
    if (saved && ['form', 'encounter', 'signature', 'done'].includes(saved)) {
      return saved as any;
    }
    if (isFeatureEnabled('cosmic_encounter_v1')) return 'encounter';
    return 'form';
  });

  const [bootstrapFailed, setBootstrapFailed] = useState(false);
  
  // Tracks whether the user has submitted the birth form this session.
  // Restored from phase to survive refresh.
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(() => {
    const savedPhase = localStorage.getItem('bazodiac_onboarding_phase');
    return savedPhase !== null && savedPhase !== 'form' && savedPhase !== 'done';
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem('bazodiac_onboarding_phase', onboardingPhase);
  }, [onboardingPhase]);

  useEffect(() => {
    if (bootstrapData) {
      localStorage.setItem('bazodiac_onboarding_data', JSON.stringify(bootstrapData));
    } else {
      localStorage.removeItem('bazodiac_onboarding_data');
    }
  }, [bootstrapData]);

  // Reset onboarding persistence on logout
  useEffect(() => {
    if (!user && !authLoading) {
      localStorage.removeItem('bazodiac_onboarding_phase');
      localStorage.removeItem('bazodiac_onboarding_data');
    }
  }, [user, authLoading]);

  // Returning users (already logged in from prior session) skip Splash entirely
  const isReturningUser = !authLoading && user !== null;

  useEffect(() => {
    if (isReturningUser) {
      setShowSplash(false);
      setSiteVisible(true);
    }
  }, [isReturningUser]);

  const ambiente = useAmbientePlayer();

  // Premium status from Supabase profiles table
  // Must be called before any conditional returns (Rules of Hooks)
  const premium = usePremium();
  // Must stay above any conditional returns to keep hook order stable.
  const { isOpen: debugPanelOpen, close: closeDebugPanel } = useDebugPanel();

  const {
    profileState,
    apiData,
    apiIssues,
    interpretation,
    tileTexts,
    birthDateStr,
    isFirstReading,
    isLoading,
    error,
    persistError,
    handleSubmit,
    handleRegenerate,
    handleReset,
  } = useAstroProfile(user, lang);

  // ── Wu-Xing element theming ─────────────────────────────────────────
  // Applies element accent color + motion physics to CSS vars on :root.
  useElementTheme(apiData?.wuxing?.dominant_element ?? '');

  // ── Handle ?upgrade=success redirect from Stripe ────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      // Clean the URL so it doesn't persist on refresh
      trackEvent('payment_completed');
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleEnter = () => {
    setShowSplash(false);
    setTimeout(() => setSiteVisible(true), 100);
    ambiente.start();
  };

  // ── Onboarding submit: coordinate BAFE flow with bootstrap ──────────
  const handleOnboardingSubmit = async (formData: OnboardingBirthData) => {
    setHasStartedOnboarding(true);

    // Persist display_name to profiles (DB-only, never forwarded to FuFirE — DEC-display-name-db-only)
    if (user && formData.displayName) {
      // Fire-and-forget — a name-save failure must not block birth data submission
      saveDisplayName(user.id, formData.displayName).catch((e) =>
        console.warn('[onboarding] display_name save failed — continuing:', e)
      );
    }

    // If the signature onboarding feature is disabled, keep the existing
    // behavior: immediately start the BAFE flow and return.
    if (!isFeatureEnabled('signature_onboarding_v1')) {
      setOnboardingPhase('done'); // Skip straight to dashboard
      handleSubmit(formData);
      return;
    }

    // With the feature enabled, first run bootstrap so that onboardingPhase
    // is updated deterministically before the BAFE flow can complete.
    try {
      // Parse date and time from the ISO string (BirthForm sends "YYYY-MM-DDThh:mm:ss")
      const [datePart, timePart] = formData.date.split('T');
      const birth = {
        date: datePart,
        time: timePart?.slice(0, 5) || '12:00',
        tz: formData.tz || 'Europe/Berlin',
        lat: formData.lat,
        lon: formData.lon,
      };
      const data = await bootstrapExperience(birth);
      setBootstrapData(data);
      if (isBootstrapFallback(data.signature_blueprint?.seed ?? '') || data.soulprint_saved === false) {
        setBootstrapFailed(true);
      }
      // In encounter mode, CosmicEncounter handles its own phase transitions internally.
      // Only transition to 'signature' for the legacy (non-encounter) flow.
      if (onboardingPhase !== 'encounter') {
        setOnboardingPhase('signature');
      }
    } catch (err) {
      console.error('[onboarding] Bootstrap failed:', err);
      setBootstrapFailed(true);
      // Fallback: always show a reveal, even if Experience is down.
      setBootstrapData({
        profile: {
          sun_sign: '—',
          moon_sign: '—',
          ascendant_sign: '—',
          day_master: '—',
          harmony_index: 0.5,
        },
        soulprint_sectors: Array(12).fill(0.5),
        narratives: {
          core_summary: 'Loading core pattern...',
          context_summary: 'Establishing generational context...',
          integration_summary: 'Synchronizing signatur...',
        },
        signature_blueprint: { seed: `fallback:${Date.now()}` },
        meta: { engine_version: 'fallback' },
      });
      if (onboardingPhase !== 'encounter') {
        setOnboardingPhase('signature');
      }
    }

    // Start the existing BAFE flow after bootstrap has either succeeded
    // or failed, avoiding a race between profile completion and phase.
    handleSubmit(formData);
  };

  const handleSignatureComplete = (_delta: SignatureDeltaResponse | null) => {
    setOnboardingPhase('done');
  };

  const handleEncounterComplete = (_delta: SignatureDeltaResponse | null) => {
    setOnboardingPhase('done');
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  // ── Splash ────────────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <AnimatePresence>
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[200]"
        >
          <Splash onEnter={handleEnter} onLanguageSelect={setLang} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Auth loading ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen morning-bg flex items-center justify-center">
        <BrandedLoader />
      </div>
    );
  }

  // ── Auth gate — show login/register ───────────────────────────────────
  if (!user) {
    return <AuthGate />;
  }

  // ── Profile loading — wait for Supabase fetch ─────────────────────────
  if (profileState === "loading" || profileState === "idle") {
    return (
      <div className="min-h-screen morning-bg flex flex-col items-center justify-center">
        <BrandedLoader
          message={lang === "de" ? "Lade dein kosmisches Profil…" : "Loading your cosmic profile…"}
        />
      </div>
    );
  }

  // ── Determine what to show ────────────────────────────────────────────
  const profileDataReady = profileState === "found" && Boolean(apiData) && Boolean(interpretation);
  // Returning users (never submitted birth form this session) go straight to
  // the dashboard. New users mid-onboarding must complete the signature reveal
  // phase first — even if BAFE already finished in the background.
  const hasCompleteProfile = profileDataReady && (!hasStartedOnboarding || onboardingPhase === 'done');

  // ── Levi upgrade handler (shared across all pages) ──────────────────
  const handleLeviUpgrade = async () => {
    try {
      const res = await (await import("@/src/lib/authedFetch")).authedFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { /* ignore */ }
  };

  return (
    <BrowserRouter>
      <AgentProvider>
      <FusionRingProvider apiResults={apiData} userId={user.id}>
        <AppLayoutProvider value={{
          interpretation: interpretation!,
          tileTexts,
          apiData: apiData || EMPTY_API_DATA,
          userId: user.id,
          birthDate: birthDateStr,
          onReset: handleReset,
          onRegenerate: handleRegenerate,
          isLoading,
          apiIssues,
          onStopAudio: ambiente.pause,
          onResumeAudio: ambiente.resume,
          isFirstReading,
        }}>
          {/* Agent Floating Widget — lives OUTSIDE the router, survives navigation */}
          {hasCompleteProfile && (
            <AgentFloatingWidget
              userId={user.id}
              isPremium={premium.isPremium}
              onUpgrade={handleLeviUpgrade}
              onStopAudio={ambiente.pause}
              onResumeAudio={ambiente.resume}
            />
          )}
          <AppShell
            user={user}
            lang={lang}
            setLang={setLang}
            t={t}
            siteVisible={siteVisible}
            planetariumMode={planetariumMode}
            togglePlanetarium={togglePlanetarium}
            ambiente={ambiente}
            signOut={signOut}
            error={error}
            hasCompleteProfile={hasCompleteProfile}
            isPremium={premium.isPremium}
            onboardingProps={{
              hasCompleteProfile,
              onboardingPhase,
              bootstrapData,
              bootstrapFailed,
              apiData,
              isLoading,
              error,
              persistError,
              onSubmitBirth: handleOnboardingSubmit,
              onSignatureComplete: handleSignatureComplete,
              onEncounterComplete: handleEncounterComplete,
              ambientePause: ambiente.pause,
              ambienteResume: ambiente.resume,
            }}
          />
        </AppLayoutProvider>
      </FusionRingProvider>

      {/* Debug Panel — Development only (Strg+D / Cmd+D to toggle) */}
      <DebugPanel isOpen={debugPanelOpen} onClose={closeDebugPanel} />
      </AgentProvider>
    </BrowserRouter>
  );
}

// ─── App Shell (inside BrowserRouter) ──────────────────────────────────
// Extracted so useLocation() works (must be inside <BrowserRouter>).

interface AppShellProps {
  user: { email?: string };
  lang: "de" | "en";
  setLang: (l: "de" | "en") => void;
  t: (key: string) => string;
  siteVisible: boolean;
  planetariumMode: boolean;
  togglePlanetarium: () => void;
  ambiente: { playing: boolean; volume: number; setVolume: (v: number) => void; toggle: () => void; pause: () => void; resume: () => void };
  signOut: () => void;
  error: string | null;
  hasCompleteProfile: boolean;
  isPremium: boolean;
  onboardingProps: import("./pages/OnboardingPage").OnboardingPageProps;
}

function AppShell({ user, lang, setLang, t, siteVisible, planetariumMode, togglePlanetarium, ambiente, signOut, error, hasCompleteProfile, isPremium, onboardingProps }: AppShellProps) {
  const location = useLocation();
  const { activeAgent, agentStates, setWidgetExpanded } = useAgent();
  const agentActive = activeAgent !== null && agentStates[activeAgent]?.active;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<null | "terms" | "privacy">(null);

  // Important fix #5: close settings + legal on route change
  useEffect(() => {
    setSettingsOpen(false);
    setLegalSection(null);
  }, [location.pathname]);

  const isSignaturRoute = location.pathname === "/signatur";
  const isOnboardingRoute = location.pathname === "/onboarding";

  const navItemClass = (active: boolean) =>
    `min-h-[44px] flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] border-b-2 transition-all duration-300 ${
      active ? "text-gold-deep border-current" : "text-ink/60 hover:text-gold-deep border-transparent"
    }`;

  const mobileNavItemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[48px] p-1 rounded-lg active:bg-gold-deep/10 transition-colors ${
      active ? "text-gold-deep" : "text-ink/40"
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: siteVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
      className={`morning-bg min-h-screen font-sans selection:bg-gold-deep/20 flex flex-col ${planetariumMode ? "planetarium text-slate-100" : "text-ink"}`}
    >
      {/* ── Top Nav (Desktop) — 3 primary items + Settings ───────────── */}
      {!isOnboardingRoute && (
      <header className="hidden md:flex fixed top-0 w-full h-20 items-center justify-between px-12 z-50 morning-header">
        <Link
          to="/"
          className="font-serif text-xl tracking-widest text-gold-deep cursor-pointer select-none"
        >
          Bazodiac
        </Link>

        {/* 3 primary nav items per DEC-navigation-shell */}
        <nav className="flex space-x-10 text-[10px] uppercase tracking-[0.3em]" aria-label="Main navigation">
          <button
            onClick={() => setWidgetExpanded(true)}
            className={navItemClass(agentActive)}
            aria-label={t("nav.astroAgents")}
          >
            <span className="relative inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              {agentActive && (
                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              )}
            </span>
            {t("nav.astroAgents")}
          </button>

          <button
            onClick={togglePlanetarium}
            aria-pressed={planetariumMode ? "true" : "false"}
            className={navItemClass(planetariumMode)}
            aria-label={t("nav.planetarium")}
          >
            <TelescopeIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t("nav.planetarium")}
          </button>

          <Link
            to="/signatur"
            className={navItemClass(location.pathname === "/signatur" || location.pathname === "/fu-ring")}
          >
            <OrbitIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {t("nav.signatur")}
          </Link>
        </nav>

        {/* Right side: audio + settings */}
        <div className="flex items-center gap-4">
          {/* Audio toggle */}
          <div className="flex items-center gap-2 group/audio">
            <button
              onClick={ambiente.toggle}
              className="text-ink/40 hover:text-gold-deep transition-colors"
              title={ambiente.playing ? t("nav.pauseAudioTitle") : t("nav.playAudioTitle")}
              aria-label={ambiente.playing ? t("nav.pauseAudioTitle") : t("nav.playAudioTitle")}
            >
              {ambiente.playing && ambiente.volume > 0 ? (
                <Volume2 className="w-4 h-4 text-gold-deep" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
            <input
              type="range" min="0" max="1" step="0.01"
              value={ambiente.volume}
              onChange={(e) => ambiente.setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gold-deep/20 rounded-full appearance-none cursor-pointer accent-[#8B6914] opacity-0 group-hover/audio:opacity-100 transition-opacity"
              title="Lautstärke"
            />
          </div>

          <div className="w-px h-4 bg-gold-deep/20" />

          {/* Settings button */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              aria-expanded={settingsOpen}
              aria-haspopup="menu"
              aria-label={t("nav.settings")}
              className={`flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] transition-all rounded-md px-2 py-1 min-h-[44px] ${
                settingsOpen
                  ? "text-gold-deep bg-gold-deep/08 border border-gold-deep/20"
                  : "text-ink/40 hover:text-gold-deep hover:bg-gold-deep/08 border border-transparent"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">{t("nav.settings")}</span>
            </button>

            {settingsOpen && (
              <SettingsMenu
                position="desktop"
                user={user}
                lang={lang}
                setLang={setLang}
                planetariumMode={planetariumMode}
                togglePlanetarium={togglePlanetarium}
                signOut={signOut}
                t={t}
                onOpenLegal={(s) => setLegalSection((prev) => (prev === s ? null : s))}
                onClose={() => setSettingsOpen(false)}
                isPremium={isPremium}
              />
            )}
          </div>
        </div>
      </header>
      )}

      {/* ── Legal modal ───────────────────────────────────────────────── */}
      {legalSection && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setLegalSection(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="relative max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-2xl border border-[#D4AF37]/15 bg-[#00050A]/95 backdrop-blur p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/60 font-semibold">
                {LEGAL_CONTENT[legalSection][lang].title}
              </h4>
              <button
                onClick={() => setLegalSection(null)}
                className="text-white/30 hover:text-white/60 transition-colors ml-4 shrink-0"
                aria-label={t("legal.closeAriaLabel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-white/40 leading-relaxed whitespace-pre-line">
              {LEGAL_CONTENT[legalSection][lang].body}
            </div>
          </div>
        </div>
      )}

      {/* ── Main content (routed) ──────────────────────────────────────── */}
      <main
        className={
          isSignaturRoute
            ? "flex-grow pt-4 md:pt-24 pb-28 md:pb-20 relative z-10 w-full"
            : "flex-grow pt-4 md:pt-32 pb-28 md:pb-20 relative z-10 container mx-auto px-3 sm:px-4 flex flex-col items-center justify-center"
        }
      >
        {error && (
          <div className="w-full max-w-md mb-8 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        <AppRoutes hasCompleteProfile={hasCompleteProfile} onboardingProps={onboardingProps} />
      </main>

      {/* ── Bottom Nav (Mobile) — 3 primary items + Settings ─────────── */}
      {!isOnboardingRoute && (
      <nav className="md:hidden fixed bottom-0 w-full bg-white/70 backdrop-blur-xl border-t border-gold-deep/15 flex items-center justify-around z-50 h-16 px-2">
        {/* Astro-Agents */}
        <button
          onClick={() => setWidgetExpanded(true)}
          className={mobileNavItemClass(agentActive)}
          aria-label={t("nav.astroAgents")}
        >
          <span className="relative inline-flex">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            {agentActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            )}
          </span>
          <span className="text-[9px] uppercase tracking-tight leading-none">{t("nav.astroAgents")}</span>
        </button>

        {/* Planetarium */}
        <button
          onClick={togglePlanetarium}
          aria-pressed={planetariumMode ? "true" : "false"}
          className={mobileNavItemClass(planetariumMode)}
        >
          <TelescopeIcon className="w-5 h-5" aria-hidden="true" />
          <span className="text-[9px] uppercase tracking-tight leading-none">{t("nav.planetarium")}</span>
        </button>

        {/* Signatur */}
        <Link
          to="/signatur"
          className={mobileNavItemClass(location.pathname === "/signatur" || location.pathname === "/fu-ring")}
        >
          <OrbitIcon className="w-5 h-5" aria-hidden="true" />
          <span className="text-[9px] uppercase tracking-tight leading-none">{t("nav.signatur")}</span>
        </Link>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            aria-haspopup="menu"
            className={mobileNavItemClass(settingsOpen)}
            aria-label={t("nav.settings")}
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
            <span className="text-[9px] uppercase tracking-tight leading-none">{t("nav.settings")}</span>
          </button>

          {settingsOpen && (
            <SettingsMenu
              position="mobile"
              user={user}
              lang={lang}
              setLang={setLang}
              planetariumMode={planetariumMode}
              togglePlanetarium={togglePlanetarium}
              signOut={signOut}
              t={t}
              onOpenLegal={(s) => setLegalSection((prev) => (prev === s ? null : s))}
              onClose={() => setSettingsOpen(false)}
              isPremium={isPremium}
            />
          )}
        </div>
      </nav>
      )}
    </motion.div>
  );
}
