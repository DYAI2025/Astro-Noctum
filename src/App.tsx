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
import { shouldShowFloatingWidget } from "./lib/floating-widget-gate";
import { AppRoutes } from "./router";
import { bootstrapExperience } from "./services/experience";
import { saveDisplayName } from "./services/supabase";
import type { OnboardingBirthData } from "./components/BirthForm";
import { BrandedLoader } from "./components/BrandedLoader";
import { usePremium } from "./hooks/usePremium";
import { useUpgradeCheckout } from "./hooks/useUpgradeCheckout";
import { isFeatureEnabled } from "./lib/feature-flags";
import type { BootstrapResponse, SignatureDeltaResponse } from "./lib/schemas/experience";
import { Volume2, VolumeX, Settings, Moon, Sun, Home, Lock } from "lucide-react";
import { IconSparkles as Sparkles, IconOrbit as OrbitIcon } from "./components/animated-icons";
import { SettingsMenu } from "./components/navigation/SettingsMenu";
import { AgentsPopup } from "./components/navigation/AgentsPopup";
import { StaticLegalLinks } from "./components/StaticLegalLinks";
import { computeCenterLinks, MOBILE_NAV_ITEM_CLASS } from "./lib/navigation";
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
      return saved as 'form' | 'encounter' | 'signature' | 'done';
    }
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
          {/* Agent Floating Widget — lives OUTSIDE the router, survives
              navigation. Gated by route + premium status (Phase D2): premium
              users see it everywhere, free users only on /signatur. */}
          {hasCompleteProfile && (
            <FloatingWidgetGate
              userId={user.id}
              isPremium={premium.isPremium}
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
  const [agentsPopupOpen, setAgentsPopupOpen] = useState(false);

  // Important fix #5: close settings + agents popup on route change
  useEffect(() => {
    setSettingsOpen(false);
    setAgentsPopupOpen(false);
  }, [location.pathname]);

  // Centralised upgrade-to-premium client owner — analytics + 6-key error
  // disambiguation + re-entry guard. Same hook the dashboard's
  // <UpgradeButton/> uses; the nav-lock surface is too small for visible
  // error copy, so we let `error` track silently for analytics only.
  const upgrade = useUpgradeCheckout();

  const isSignaturRoute = location.pathname === "/signatur";
  const isOnboardingRoute = location.pathname === "/onboarding";

  const isDashboardActive = location.pathname === "/";
  const showAtlas = isFeatureEnabled("atlas_v1");
  const centerLinks = computeCenterLinks(location.pathname, t, showAtlas);

  const navItemClass = () =>
    `min-h-[44px] flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] border-b-2 border-transparent text-ink/60 hover:text-gold-deep transition-all duration-300 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/60`;

  const mobileNavItemClass = MOBILE_NAV_ITEM_CLASS;

  const themeToggleLabel = planetariumMode ? t("nav.themeToggleSolar") : t("nav.themeTogglePlanetarium");
  const ThemeIcon = planetariumMode ? Sun : Moon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: siteVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
      className={`morning-bg min-h-screen font-sans selection:bg-gold-deep/20 flex flex-col ${planetariumMode ? "planetarium text-slate-100" : "text-ink"}`}
    >
      {/* ── Top Nav (Desktop) — 3 zones per DEC-navigation-shell v2 ───── */}
      {!isOnboardingRoute && (
      <header className="hidden md:flex fixed top-0 w-full h-20 items-center justify-between px-12 z-50 morning-header">
        {/* Left zone — wordmark → Dashboard (disabled on current route) */}
        {isDashboardActive ? (
          <span
            className="font-serif text-xl tracking-widest text-gold-deep select-none pointer-events-none"
            aria-current="page"
            aria-disabled="true"
            aria-label={t("nav.dashboard")}
          >
            Bazodiac
          </span>
        ) : (
          <Link
            to="/"
            className="font-serif text-xl tracking-widest text-gold-deep cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/60 rounded-sm"
            aria-label={t("nav.dashboard")}
          >
            Bazodiac
          </Link>
        )}

        {/* Center zone — contextual primary-view links (show only non-current) */}
        <nav className="flex space-x-10 text-[10px] uppercase tracking-[0.3em]" aria-label="Main navigation">
          {centerLinks.map((link) => {
            if (link.premiumOnly && !isPremium) {
              return (
                <button
                  key={link.to}
                  onClick={upgrade.startUpgradeCheckout}
                  disabled={upgrade.isLoading}
                  className={`${navItemClass()} opacity-40 cursor-pointer disabled:cursor-wait`}
                  title={t("nav.atlasPremium")}
                >
                  <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                  {link.label}
                </button>
              );
            }
            return (
              <Link key={link.to} to={link.to} className={navItemClass()}>
                {link.to === "/signatur" && <OrbitIcon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right zone — symbol-only utilities: audio, agents, theme, settings */}
        <div className="flex items-center gap-4">
          {/* Audio toggle (desktop-only per DEC) */}
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

          {/* Astro-Agents — popup with Levi tile */}
          <div className="relative">
            <button
              onClick={() => { setAgentsPopupOpen((o) => !o); setSettingsOpen(false); }}
              aria-expanded={agentsPopupOpen}
              aria-haspopup="menu"
              className={`relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md transition-all ${
                agentsPopupOpen
                  ? "text-gold-deep bg-gold-deep/08 border border-gold-deep/20"
                  : isPremium
                    ? "text-ink/40 hover:text-gold-deep border border-transparent"
                    : "text-ink/20 border border-transparent"
              }`}
              aria-label={t("nav.astroAgents")}
              title={t("nav.astroAgents")}
            >
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              {agentActive && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              )}
            </button>

            {agentsPopupOpen && (
              <AgentsPopup
                position="desktop"
                isPremium={isPremium}
                lang={lang}
                t={t}
                onStopAudio={ambiente.pause}
                onClose={() => setAgentsPopupOpen(false)}
              />
            )}
          </div>

          {/* Theme toggle — Moon/Sun reflecting current mode */}
          <button
            onClick={togglePlanetarium}
            aria-pressed={planetariumMode ? "true" : "false"}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-ink/40 hover:text-gold-deep transition-colors"
          >
            <ThemeIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => { setSettingsOpen((o) => !o); setAgentsPopupOpen(false); }}
              aria-expanded={settingsOpen}
              aria-haspopup="menu"
              aria-label={t("nav.settings")}
              title={t("nav.settings")}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md transition-all ${
                settingsOpen
                  ? "text-gold-deep bg-gold-deep/08 border border-gold-deep/20"
                  : "text-ink/40 hover:text-gold-deep hover:bg-gold-deep/08 border border-transparent"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
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
                onClose={() => setSettingsOpen(false)}
                isPremium={isPremium}
              />
            )}
          </div>
        </div>
      </header>
      )}

      {/* ── Mobile Top Bar — wordmark (left zone per DEC v2) ──────────── */}
      {!isOnboardingRoute && (
      <div className="md:hidden fixed top-0 w-full h-12 flex items-center px-4 z-50 morning-header">
        {isDashboardActive ? (
          <span
            className="font-serif text-lg tracking-widest text-gold-deep select-none pointer-events-none"
            aria-current="page"
            aria-disabled="true"
            aria-label={t("nav.dashboard")}
          >
            Bazodiac
          </span>
        ) : (
          <Link
            to="/"
            className="font-serif text-lg tracking-widest text-gold-deep cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep/60 rounded-sm"
            aria-label={t("nav.dashboard")}
          >
            Bazodiac
          </Link>
        )}
      </div>
      )}

      {/* ── Main content (routed) ──────────────────────────────────────── */}
      <main
        className={
          isSignaturRoute
            ? "flex-grow pt-16 md:pt-24 pb-28 md:pb-20 relative z-10 w-full"
            : "flex-grow pt-16 md:pt-32 pb-28 md:pb-20 relative z-10 container mx-auto px-3 sm:px-4 flex flex-col items-center justify-center"
        }
      >
        {error && (
          <div className="w-full max-w-md mb-8 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        <AppRoutes hasCompleteProfile={hasCompleteProfile} onboardingProps={onboardingProps} />
      </main>

      {/* ── Bottom Nav (Mobile) — 3 zones per DEC-navigation-shell v2 ── */}
      {!isOnboardingRoute && (
      <nav className="md:hidden fixed bottom-0 w-full bg-white/70 backdrop-blur-xl border-t border-gold-deep/15 flex items-center justify-around z-50 h-16 px-2" aria-label="Main navigation">
        {/* Center-zone contextual primary-view links */}
        {centerLinks.map((link) => {
          const icon = link.to === "/signatur"
            ? <OrbitIcon className="w-5 h-5" aria-hidden="true" />
            : link.to === "/atlas"
              ? <Lock className="w-4 h-4" aria-hidden="true" />
              : <Home className="w-5 h-5" aria-hidden="true" />;

          if (link.premiumOnly && !isPremium) {
            return (
              <button
                key={link.to}
                onClick={upgrade.startUpgradeCheckout}
                disabled={upgrade.isLoading}
                className={`${mobileNavItemClass(false)} opacity-40 disabled:cursor-wait`}
                title={t("nav.atlasPremium")}
              >
                {icon}
                <span className="text-[9px] uppercase tracking-tight leading-none">{link.label}</span>
              </button>
            );
          }
          return (
            <Link key={link.to} to={link.to} className={mobileNavItemClass(false)}>
              {icon}
              <span className="text-[9px] uppercase tracking-tight leading-none">{link.label}</span>
            </Link>
          );
        })}

        {/* Right zone — Astro-Agents popup */}
        <div className="relative">
          <button
            onClick={() => { setAgentsPopupOpen((o) => !o); setSettingsOpen(false); }}
            aria-expanded={agentsPopupOpen}
            aria-haspopup="menu"
            className={mobileNavItemClass(agentsPopupOpen || agentActive)}
            aria-label={t("nav.astroAgents")}
            title={t("nav.astroAgents")}
          >
            <span className="relative inline-flex">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              {agentActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              )}
            </span>
          </button>

          {agentsPopupOpen && (
            <AgentsPopup
              position="mobile"
              isPremium={isPremium}
              lang={lang}
              t={t}
              onStopAudio={ambiente.pause}
              onClose={() => setAgentsPopupOpen(false)}
            />
          )}
        </div>

        {/* Right zone — theme toggle (Moon/Sun) */}
        <button
          onClick={togglePlanetarium}
          aria-pressed={planetariumMode ? "true" : "false"}
          aria-label={themeToggleLabel}
          title={themeToggleLabel}
          className={mobileNavItemClass(planetariumMode)}
        >
          <ThemeIcon className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Right zone — Settings */}
        <div className="relative">
          <button
            onClick={() => { setSettingsOpen((o) => !o); setAgentsPopupOpen(false); }}
            aria-expanded={settingsOpen}
            aria-haspopup="menu"
            className={mobileNavItemClass(settingsOpen)}
            aria-label={t("nav.settings")}
            title={t("nav.settings")}
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
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
              onClose={() => setSettingsOpen(false)}
              isPremium={isPremium}
            />
          )}
        </div>
      </nav>
      )}

      {/* ── Static Legal Links (footer) ────────────────────────────────── */}
      {!isOnboardingRoute && <StaticLegalLinks />}
    </motion.div>
  );
}

// ─── Floating Widget Gate ──────────────────────────────────────────────
// Tiny route-aware wrapper around <AgentFloatingWidget/>. Lives inside
// <BrowserRouter> so it can read location.pathname via useLocation().
// Phase D2 single-CTA invariant: free users only see the widget on
// /signatur; on /, the dashboard's bottom upgrade card is the sole CTA.
interface FloatingWidgetGateProps {
  userId: string;
  isPremium: boolean;
  onStopAudio: () => void;
  onResumeAudio: () => void;
}

function FloatingWidgetGate({ userId, isPremium, onStopAudio, onResumeAudio }: FloatingWidgetGateProps) {
  const location = useLocation();
  if (!shouldShowFloatingWidget(isPremium, location.pathname)) return null;
  return (
    <AgentFloatingWidget
      userId={userId}
      isPremium={isPremium}
      onStopAudio={onStopAudio}
      onResumeAudio={onResumeAudio}
    />
  );
}
