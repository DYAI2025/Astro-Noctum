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
import { AppRoutes } from "./router";
import { bootstrapExperience } from "./services/experience";
import { isFeatureEnabled } from "./lib/feature-flags";
import type { BootstrapResponse, SignatureDeltaResponse } from "./lib/schemas/experience";
import { Volume2, VolumeX, LogOut, LayoutGrid, Telescope, CircleDot } from "lucide-react";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { planetariumMode, togglePlanetarium } = usePlanetarium();

  const [showSplash, setShowSplash] = useState(true);
  const [siteVisible, setSiteVisible] = useState(false);
  const [bootstrapData, setBootstrapData] = useState<BootstrapResponse | null>(null);
  const [onboardingPhase, setOnboardingPhase] = useState<'form' | 'encounter' | 'signature' | 'done'>(() => {
    if (isFeatureEnabled('cosmic_encounter_v1')) return 'encounter';
    return 'form';
  });
  // Tracks whether the user has submitted the birth form this session.
  // Returning users never set this — it distinguishes "new user mid-onboarding"
  // from "returning user with existing profile".
  const [hasStartedOnboarding, setHasStartedOnboarding] = useState(false);

  // Returning users (already logged in from prior session) skip Splash entirely
  const isReturningUser = !authLoading && user !== null;

  useEffect(() => {
    if (isReturningUser) {
      setShowSplash(false);
      setSiteVisible(true);
    }
  }, [isReturningUser]);

  const ambiente = useAmbientePlayer();

  const {
    profileState,
    apiData,
    apiIssues,
    interpretation,
    tileTexts,
    houseTexts,
    birthDateStr,
    isFirstReading,
    isLoading,
    error,
    handleSubmit,
    handleRegenerate,
    handleReset,
  } = useAstroProfile(user, lang);

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
  const handleOnboardingSubmit = async (formData: { date: string; tz: string; lon: number; lat: number }) => {
    setHasStartedOnboarding(true);

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
      // In encounter mode, CosmicEncounter handles its own phase transitions internally.
      // Only transition to 'signature' for the legacy (non-encounter) flow.
      if (onboardingPhase !== 'encounter') {
        setOnboardingPhase('signature');
      }
    } catch (err) {
      console.error('[onboarding] Bootstrap failed:', err);
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
        <div className="w-1 h-1 bg-gold-deep rounded-full animate-ping" />
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
      <div className="min-h-screen morning-bg flex flex-col items-center justify-center gap-6">
        <div className="w-1 h-1 bg-gold-deep rounded-full animate-ping" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold-deep/50 font-mono">
          {lang === "de" ? "Lade dein kosmisches Profil…" : "Loading your cosmic profile…"}
        </p>
      </div>
    );
  }

  // ── Determine what to show ────────────────────────────────────────────
  const profileDataReady = profileState === "found" && Boolean(apiData) && Boolean(interpretation);
  // Returning users (never submitted birth form this session) go straight to
  // the dashboard. New users mid-onboarding must complete the signature reveal
  // phase first — even if BAFE already finished in the background.
  const hasCompleteProfile = profileDataReady && (!hasStartedOnboarding || onboardingPhase === 'done');

  // Authenticated app with routing
  return (
    <BrowserRouter>
      <FusionRingProvider apiResults={apiData} userId={user.id}>
        <AppLayoutProvider value={{
          interpretation: interpretation!,
          tileTexts,
          houseTexts,
          apiData,
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
            onboardingProps={{
              hasCompleteProfile,
              onboardingPhase,
              bootstrapData,
              apiData,
              isLoading,
              error,
              onSubmitBirth: handleOnboardingSubmit,
              onSignatureComplete: handleSignatureComplete,
              onEncounterComplete: handleEncounterComplete,
              ambientePause: ambiente.pause,
              ambienteResume: ambiente.resume,
            }}
          />
        </AppLayoutProvider>
      </FusionRingProvider>
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
  onboardingProps: import("./pages/OnboardingPage").OnboardingPageProps;
}

function AppShell({ user, lang, setLang, t, siteVisible, planetariumMode, togglePlanetarium, ambiente, signOut, error, hasCompleteProfile, onboardingProps }: AppShellProps) {
  const location = useLocation();

  const isSignaturRoute = location.pathname === "/signatur";
  const isOnboardingRoute = location.pathname === "/onboarding";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: siteVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
      className={`morning-bg min-h-screen font-sans selection:bg-gold-deep/20 flex flex-col ${planetariumMode ? "planetarium text-slate-100" : "text-ink"}`}
    >
      {/* ── Top Nav (Desktop) ────────────────────────────────────────── */}
      {!isOnboardingRoute && (
      <header className="hidden md:flex fixed top-0 w-full h-20 items-center justify-between px-12 z-50 morning-header">
        <Link
          to="/"
          className="font-serif text-xl tracking-widest text-gold-deep cursor-pointer select-none"
        >
          Bazodiac
        </Link>

        <nav className="flex space-x-12 text-[10px] uppercase tracking-[0.3em]">
          <Link to="/" className={`transition-colors ${location.pathname === "/" ? "text-gold-deep" : "text-ink/60 hover:text-gold-deep"}`}>
            {t("nav.atlas")}
          </Link>
          <Link to="/signatur" className={`transition-colors ${location.pathname === "/signatur" ? "text-gold-deep" : "text-ink/60 hover:text-gold-deep"}`}>
            {t("nav.signatur")}
          </Link>
          <a href="https://sky.bazodiac.space" target="_blank" rel="noopener noreferrer" className={`transition-colors ${location.pathname === "/" ? "text-gold-deep" : "text-ink/60 hover:text-gold-deep"}`}>
            {t("nav.sky")}
          </a>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            if (location.pathname !== "/") {
              window.location.href = "/";
            } else {
              document.querySelector('[data-levi-widget]')?.scrollIntoView({ behavior: 'smooth' });
            }
          }} className={`transition-colors ${location.pathname === "/" ? "text-gold-deep" : "text-ink/60 hover:text-gold-deep"}`}>
            {t("nav.levi")}
          </a>
          <Link to="/wissen/faq-bazi-wuxing" className={`transition-colors ${location.pathname.startsWith("/wissen") ? "text-gold-deep" : "text-ink/60 hover:text-gold-deep"}`}>
            {t("nav.faq")}
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          {/* Language toggle */}
          <div className="lang-toggle" role="group" aria-label="Language selection">
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

          <div className="w-px h-4 bg-gold-deep/20" />

          {/* Planetarium toggle */}
          <button
            onClick={togglePlanetarium}
            aria-pressed={planetariumMode ? "true" : "false"}
            aria-label={planetariumMode ? "Exit Planetarium Mode" : "Enter Planetarium Mode"}
            className={`flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] transition-all rounded-md px-2 py-1 ${
              planetariumMode
                ? "planetarium-toggle-active bg-gold/10 border border-gold/30"
                : "text-ink/40 hover:text-gold-deep hover:bg-gold-deep/08 border border-transparent"
            }`}
          >
            <Telescope className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Planetarium</span>
          </button>

          <div className="w-px h-4 bg-gold-deep/20" />

          {/* Audio toggle & Volume Slider */}
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
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambiente.volume}
              onChange={(e) => ambiente.setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gold-deep/20 rounded-full appearance-none cursor-pointer accent-[#8B6914] opacity-0 group-hover/audio:opacity-100 transition-opacity"
              title="Lautstärke"
            />
          </div>

          <div className="w-px h-4 bg-gold-deep/20" />

          {/* User + sign-out */}
          <span className="text-[9px] text-ink/35 tracking-wider max-w-[120px] truncate">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-full border border-gold-deep/25 flex items-center justify-center hover:bg-gold-deep/10 hover:border-gold-deep/45 transition-colors"
            title={t("nav.signOut")}
            aria-label={t("nav.signOut")}
          >
            <LogOut className="w-3 h-3 text-gold-deep/70" aria-hidden="true" />
          </button>
        </div>
      </header>
      )}

      {/* ── Main content (routed) ──────────────────────────────────────── */}
      <main
        className={
          isSignaturRoute
            ? "flex-grow pt-6 md:pt-24 pb-24 md:pb-20 relative z-10 w-full"
            : "flex-grow pt-6 md:pt-32 pb-24 md:pb-20 relative z-10 container mx-auto px-4 flex flex-col items-center justify-center"
        }
      >
        {error && (
          <div className="w-full max-w-md mb-8 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        <AppRoutes hasCompleteProfile={hasCompleteProfile} onboardingProps={onboardingProps} />
      </main>

      {/* ── Bottom Nav (Mobile) ───────────────────────────────────────── */}
      {!isOnboardingRoute && (
      <nav className="md:hidden fixed bottom-0 w-full bg-white/70 backdrop-blur-xl border-t border-gold-deep/15 flex items-center justify-around z-50 h-16">
        <div className="lang-toggle" role="group" aria-label="Sprache">
          <button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")} aria-pressed={lang === "de" ? "true" : "false"}>DE</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en" ? "true" : "false"}>EN</button>
        </div>

        <Link to="/" className={`flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-gold/50 rounded ${location.pathname === "/" ? "text-gold-deep" : "text-ink/40"}`}>
          <LayoutGrid className="w-5 h-5" aria-hidden="true" />
          <span className="text-[8px] uppercase tracking-tighter">{t("nav.atlas")}</span>
        </Link>

        <Link to="/signatur" className={`flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-gold/50 rounded ${location.pathname === "/signatur" ? "text-gold-deep" : "text-ink/40"}`}>
          <CircleDot className="w-5 h-5" aria-hidden="true" />
          <span className="text-[8px] uppercase tracking-tighter">{t("nav.signatur")}</span>
        </Link>

        <a href="https://sky.bazodiac.space" target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-gold/50 rounded ${location.pathname === "/signatur" ? "text-gold-deep" : "text-ink/40"}`}>
          <Telescope className="w-5 h-5" aria-hidden="true" />
          <span className="text-[8px] uppercase tracking-tighter">{t("nav.sky")}</span>
        </a>

        <Link to="/wissen/faq-bazi-wuxing" className={`flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-gold/50 rounded ${location.pathname.startsWith("/wissen") ? "text-gold-deep" : "text-ink/40"}`}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          <span className="text-[8px] uppercase tracking-tighter">{t("nav.faq")}</span>
        </Link>
      </nav>
      )}
    </motion.div>
  );
}
