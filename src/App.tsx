import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrowserRouter, Link, useLocation } from "react-router-dom";
import { BirthForm } from "./components/BirthForm";
import { Splash } from "./components/Splash";
import { AuthGate } from "./components/AuthGate";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";
import { calculateAll, BirthData, ApiIssue } from "./services/api";
import { generateInterpretation } from "./services/gemini";
import {
  upsertAstroProfile,
  insertBirthData,
  insertNatalChart,
  fetchAstroProfile,
} from "./services/supabase";
import type { ApiData } from "./types/bafe";
import type { TileTexts, HouseTexts } from "./types/interpretation";
import { useAmbientePlayer } from "./hooks/useAmbientePlayer";
import { trackEvent } from "./lib/analytics";
import { usePlanetarium } from "./contexts/PlanetariumContext";
import { FusionRingProvider } from "./contexts/FusionRingContext";
import { AppLayoutProvider } from "./contexts/AppLayoutContext";
import { AppRoutes } from "./router";
import { Volume2, VolumeX, LogOut, LayoutGrid, Telescope, CircleDot } from "lucide-react";

// ─── Profile loading states ──────────────────────────────────────────
type ProfileState =
  | "idle"           // no user logged in
  | "loading"        // fetching from Supabase
  | "found"          // profile loaded → show Dashboard
  | "not-found"      // no profile → show Onboarding (BirthForm)
  | "error";         // fetch failed → show Onboarding as fallback

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { planetariumMode, togglePlanetarium } = usePlanetarium();

  const [showSplash, setShowSplash] = useState(true);
  const [siteVisible, setSiteVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile state machine
  const [profileState, setProfileState] = useState<ProfileState>("idle");
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [apiIssues, setApiIssues] = useState<ApiIssue[]>([]);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [tileTexts, setTileTexts] = useState<TileTexts>({});
  const [houseTexts, setHouseTexts] = useState<HouseTexts>({});
  const [error, setError] = useState<string | null>(null);
  const [birthDateStr, setBirthDateStr] = useState<string | null>(null);
  const [isFirstReading, setIsFirstReading] = useState(false);

  const profileFetchedForRef = useRef<string | null>(null);
  const ambiente = useAmbientePlayer();

  // ── Handle ?upgrade=success redirect from Stripe ────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      // Clean the URL so it doesn't persist on refresh
      trackEvent('payment_completed');
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // PROFILE LOADING — runs once when user logs in
  // ═══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!user) {
      // Logged out → reset everything
      setProfileState("idle");
      setApiData(null);
      setInterpretation(null);
      setTileTexts({});
      setHouseTexts({});
      setBirthDateStr(null);
      setApiIssues([]);
      setError(null);
      setIsFirstReading(false);
      profileFetchedForRef.current = null;
      return;
    }

    // Already fetched for this user? Don't re-fetch.
    if (profileFetchedForRef.current === user.id) return;
    profileFetchedForRef.current = user.id;

    setProfileState("loading");

    fetchAstroProfile(user.id)
      .then(async (profile) => {
        if (profile?.astro_json) {
          const json = profile.astro_json as any;

          // Reconstruct apiData from stored JSON
          // Support both old format { bafe: {…}, interpretation } and new flat format
          const bazi    = json.bazi    ?? json.bafe?.bazi;
          const western = json.western ?? json.bafe?.western;
          const fusion  = json.fusion  ?? json.bafe?.fusion;
          const wuxing  = json.wuxing  ?? json.bafe?.wuxing;
          const tst     = json.tst     ?? json.bafe?.tst;

          setApiData({ bazi, western, fusion, wuxing, tst });

          // Retrieve stored interpretation
          const storedInterpretation =
            json.interpretation ?? json.bafe?.interpretation ?? null;

          // If interpretation is missing (e.g. Gemini was down when profile was created),
          // generate it now so the Dashboard can show.
          if (!storedInterpretation) {
            let regenerated: string;
            try {
              const aiResult = await generateInterpretation(
                { bazi, western, fusion, wuxing, tst },
                lang,
              );
              regenerated = aiResult.interpretation;
              setTileTexts(aiResult.tiles || {});
              setHouseTexts(aiResult.houses || {});
            } catch {
              regenerated =
                lang === "de"
                  ? "Dein kosmisches Profil wird geladen…"
                  : "Loading your cosmic profile…";
              // tiles/houses remain empty — catch path has no AI result
            }
            setInterpretation(regenerated);
          } else {
            // Restore stored tiles/houses with type guards (JSONB may be malformed)
            const rawTiles = json.tiles;
            setTileTexts(rawTiles && typeof rawTiles === 'object' && !Array.isArray(rawTiles)
              ? (rawTiles as TileTexts)
              : {});
            const rawHouses = json.houses;
            setHouseTexts(rawHouses && typeof rawHouses === 'object' && !Array.isArray(rawHouses)
              ? (rawHouses as HouseTexts)
              : {});
            setInterpretation(storedInterpretation);
          }

          // Birth date
          if (profile.birth_date) {
            const time = profile.birth_time || "12:00";
            setBirthDateStr(`${profile.birth_date}T${time}:00`);
          }

          setProfileState("found");
        } else {
          // No profile yet — user needs to go through onboarding
          setProfileState("not-found");
        }
      })
      .catch((err) => {
        console.error("Profile load failed:", err);
        setProfileState("error"); // fallback: show onboarding
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════════════
  // ONBOARDING SUBMIT — only runs once per user lifetime
  // ═══════════════════════════════════════════════════════════════════════
  const handleSubmit = async (data: BirthData) => {
    if (!user) return;

    // Double-check: if user already has a profile, don't create another
    if (profileState === "found") return;

    setIsLoading(true);
    setError(null);
    trackEvent('reading_started');
    try {
      const results = await calculateAll(data);
      setApiData(results);
      setApiIssues(results.issues);
      setBirthDateStr(data.date);

      const aiResult = await generateInterpretation(results, lang);
      setInterpretation(aiResult.interpretation);
      setTileTexts(aiResult.tiles || {});
      setHouseTexts(aiResult.houses || {});
      trackEvent('reading_completed');

      // Persist to Supabase (all three functions check for duplicates internally)
      try {
        await Promise.all([
          upsertAstroProfile(user.id, data, results, aiResult.interpretation, aiResult.tiles || {}, aiResult.houses || {}),
          insertBirthData(user.id, data),
          insertNatalChart(user.id, results),
        ]);
      } catch (persistErr) {
        console.warn("Supabase persist failed:", persistErr);
        // Non-fatal: user can still see their Dashboard
      }

      setIsFirstReading(true);
      setProfileState("found");
    } catch (err: unknown) {
      console.error("API Error:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(msg || t("form.errorCalc"));
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // REGENERATE INTERPRETATION (re-run AI on existing data)
  // ═══════════════════════════════════════════════════════════════════════
  const handleRegenerate = async () => {
    if (!apiData) return;
    setIsLoading(true);
    setError(null);
    try {
      const aiResult = await generateInterpretation(apiData, lang);
      setInterpretation(aiResult.interpretation);
      setTileTexts(aiResult.tiles || {});
      setHouseTexts(aiResult.houses || {});
    } catch (err: unknown) {
      console.error("AI Generation Error:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(msg || t("form.errorRegen"));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset is BLOCKED for users with a persisted profile.
  // A person has only one birthday — no re-onboarding.
  const handleReset = () => {
    if (profileState === "found") return; // immutable
    setApiData(null);
    setInterpretation(null);
    setTileTexts({});
    setHouseTexts({});
    setError(null);
    setApiIssues([]);
  };

  const handleEnter = () => {
    setShowSplash(false);
    setTimeout(() => setSiteVisible(true), 100);
    ambiente.start();
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
        <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
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
        <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#8B6914]/50 font-mono">
          {lang === "de" ? "Lade dein kosmisches Profil…" : "Loading your cosmic profile…"}
        </p>
      </div>
    );
  }

  // ── Determine what to show ────────────────────────────────────────────
  const hasCompleteProfile = profileState === "found" && apiData && interpretation;
  const showOnboarding = !hasCompleteProfile;

  // ── Main app ──────────────────────────────────────────────────────────

  // Onboarding (no routing needed)
  if (showOnboarding) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: siteVisible ? 1 : 0 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        className={`morning-bg min-h-screen font-sans selection:bg-[#8B6914]/20 flex flex-col ${planetariumMode ? "planetarium text-slate-100" : "text-[#1E2A3A]"}`}
      >
        <main className="flex-grow pt-24 md:pt-32 pb-24 md:pb-20 relative z-10 container mx-auto px-4 flex flex-col items-center justify-center">
          {error && (
            <div className="w-full max-w-md mb-8 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          <BirthForm onSubmit={handleSubmit} isLoading={isLoading} />
        </main>
      </motion.div>
    );
  }

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
}

function AppShell({ user, lang, setLang, t, siteVisible, planetariumMode, togglePlanetarium, ambiente, signOut, error }: AppShellProps) {
  const location = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: siteVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
      className={`morning-bg min-h-screen font-sans selection:bg-[#8B6914]/20 flex flex-col ${planetariumMode ? "planetarium text-slate-100" : "text-[#1E2A3A]"}`}
    >
      {/* ── Top Nav (Desktop) ────────────────────────────────────────── */}
      <header className="hidden md:flex fixed top-0 w-full h-20 items-center justify-between px-12 z-50 morning-header">
        <Link
          to="/"
          className="font-serif text-xl tracking-widest text-[#8B6914] cursor-pointer select-none"
        >
          Bazodiac
        </Link>

        <nav className="flex space-x-12 text-[10px] uppercase tracking-[0.3em]">
          <Link to="/" className={`transition-colors ${location.pathname === "/" ? "text-[#8B6914]" : "text-[#1E2A3A]/60 hover:text-[#8B6914]"}`}>
            {t("nav.atlas")}
          </Link>
          <Link to="/fu-ring" className={`transition-colors ${location.pathname === "/fu-ring" ? "text-[#8B6914]" : "text-[#1E2A3A]/60 hover:text-[#8B6914]"}`}>
            Fu-Ring
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          {/* Language toggle */}
          <div className="lang-toggle" role="group" aria-label="Language selection">
            <button
              className={lang === "de" ? "active" : ""}
              onClick={() => setLang("de")}
              aria-pressed={lang === "de"}
            >
              DE
            </button>
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>

          <div className="w-[1px] h-4 bg-[#8B6914]/20" />

          {/* Planetarium toggle */}
          <button
            onClick={togglePlanetarium}
            aria-pressed={planetariumMode}
            aria-label={planetariumMode ? "Exit Planetarium Mode" : "Enter Planetarium Mode"}
            className={`flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] transition-all rounded-md px-2 py-1 ${
              planetariumMode
                ? "planetarium-toggle-active bg-[#D4AF37]/10 border border-[#D4AF37]/30"
                : "text-[#1E2A3A]/40 hover:text-[#8B6914] hover:bg-[#8B6914]/08 border border-transparent"
            }`}
          >
            <Telescope className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Planetarium</span>
          </button>

          <div className="w-[1px] h-4 bg-[#8B6914]/20" />

          {/* Audio toggle & Volume Slider */}
          <div className="flex items-center gap-2 group/audio">
            <button
              onClick={ambiente.toggle}
              className="text-[#1E2A3A]/40 hover:text-[#8B6914] transition-colors"
              title={ambiente.playing ? t("nav.pauseAudioTitle") : t("nav.playAudioTitle")}
              aria-label={ambiente.playing ? t("nav.pauseAudioTitle") : t("nav.playAudioTitle")}
            >
              {ambiente.playing && ambiente.volume > 0 ? (
                <Volume2 className="w-4 h-4 text-[#8B6914]" aria-hidden="true" />
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
              className="w-16 h-1 bg-[#8B6914]/20 rounded-full appearance-none cursor-pointer accent-[#8B6914] opacity-0 group-hover/audio:opacity-100 transition-opacity"
              title="Lautstärke"
            />
          </div>

          <div className="w-[1px] h-4 bg-[#8B6914]/20" />

          {/* User + sign-out */}
          <span className="text-[9px] text-[#1E2A3A]/35 tracking-wider max-w-[120px] truncate">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-full border border-[#8B6914]/25 flex items-center justify-center hover:bg-[#8B6914]/10 hover:border-[#8B6914]/45 transition-colors"
            title={t("nav.signOut")}
            aria-label={t("nav.signOut")}
          >
            <LogOut className="w-3 h-3 text-[#8B6914]/70" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* ── Main content (routed) ──────────────────────────────────────── */}
      <main className="flex-grow pt-6 md:pt-32 pb-24 md:pb-20 relative z-10 container mx-auto px-4 flex flex-col items-center justify-center">
        {error && (
          <div className="w-full max-w-md mb-8 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
        <AppRoutes />
      </main>

      {/* ── Bottom Nav (Mobile) ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/70 backdrop-blur-xl border-t border-[#8B6914]/15 flex items-center justify-around z-50 h-16">
        <div className="lang-toggle" role="group" aria-label="Sprache">
          <button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")} aria-pressed={lang === "de"}>DE</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-pressed={lang === "en"}>EN</button>
        </div>

        <Link to="/" className={`flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-gold/50 rounded ${location.pathname === "/" ? "text-[#8B6914]" : "text-[#1E2A3A]/40"}`}>
          <LayoutGrid className="w-5 h-5" aria-hidden="true" />
          <span className="text-[8px] uppercase tracking-tighter">{t("nav.atlas")}</span>
        </Link>

        <Link to="/fu-ring" className={`flex flex-col items-center gap-1 focus-visible:ring-2 focus-visible:ring-gold/50 rounded ${location.pathname === "/fu-ring" ? "text-[#8B6914]" : "text-[#1E2A3A]/40"}`}>
          <CircleDot className="w-5 h-5" aria-hidden="true" />
          <span className="text-[8px] uppercase tracking-tighter">Fu-Ring</span>
        </Link>

        <button
          onClick={togglePlanetarium}
          aria-pressed={planetariumMode}
          aria-label="Planetarium"
          className={planetariumMode ? "text-[#D4AF37]" : "text-[#1E2A3A]/40"}
        >
          <Telescope className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={ambiente.toggle}
            aria-label={ambiente.playing ? t("nav.pauseAudioTitle") : t("nav.playAudioTitle")}
            className="text-[#1E2A3A]/40 hover:text-[#8B6914] transition-colors"
          >
            {ambiente.playing && ambiente.volume > 0 ? (
              <Volume2 className="w-5 h-5 text-[#8B6914]" aria-hidden="true" />
            ) : (
              <VolumeX className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ambiente.volume}
            onChange={(e) => ambiente.setVolume(parseFloat(e.target.value))}
            className="w-10 h-1 bg-[#8B6914]/20 rounded-full appearance-none cursor-pointer accent-[#8B6914]"
          />
        </div>
      </nav>
    </motion.div>
  );
}
