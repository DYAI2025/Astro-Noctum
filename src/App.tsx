import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BirthForm } from "./components/BirthForm";
import { Dashboard } from "./components/Dashboard";
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
import { useAmbientePlayer } from "./hooks/useAmbientePlayer";
import { usePlanetarium } from "./contexts/PlanetariumContext";
import { Volume2, VolumeX, LogOut, LayoutGrid, Telescope } from "lucide-react";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { planetariumMode, togglePlanetarium } = usePlanetarium();

  const [showSplash, setShowSplash] = useState(true);
  const [siteVisible, setSiteVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [apiIssues, setApiIssues] = useState<ApiIssue[]>([]);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPersistedProfile, setHasPersistedProfile] = useState(false);
  const [birthDateStr, setBirthDateStr] = useState<string | null>(null);

  const profileFetchedForRef = useRef<string | null>(null);
  const ambiente = useAmbientePlayer();

  // ── T-001: Load existing astro profile on login ──────────────────────
  useEffect(() => {
    if (!user || apiData) return;
    if (profileFetchedForRef.current === user.id) return;
    profileFetchedForRef.current = user.id;

    setProfileLoading(true);
    fetchAstroProfile(user.id)
      .then((profile) => {
        if (profile?.astro_json) {
          const json = profile.astro_json as any;
          setApiData({
            bazi:    json.bafe?.bazi    ?? json.bazi,
            western: json.bafe?.western ?? json.western,
            fusion:  json.bafe?.fusion  ?? json.fusion,
            wuxing:  json.bafe?.wuxing  ?? json.wuxing,
            tst:     json.bafe?.tst     ?? json.tst,
            issues: [],
          });
          setInterpretation(json.bafe?.interpretation ?? json.interpretation ?? null);
          setHasPersistedProfile(true);
          if (profile.birth_date) {
            const time = profile.birth_time || "12:00";
            setBirthDateStr(`${profile.birth_date}T${time}:00`);
          }
        }
      })
      .catch((err) => console.warn("Profile load failed:", err))
      .finally(() => setProfileLoading(false));
  }, [user, apiData]);

  const handleEnter = () => {
    setShowSplash(false);
    setTimeout(() => setSiteVisible(true), 100);
    ambiente.start();
  };

  const handleSubmit = async (data: BirthData) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await calculateAll(data);
      setApiData(results);
      setApiIssues(results.issues);
      setBirthDateStr(data.date);

      const aiInterpretation = await generateInterpretation(results, lang);
      setInterpretation(aiInterpretation);

      if (user && !hasPersistedProfile) {
        try {
          await Promise.all([
            upsertAstroProfile(user.id, data, results, aiInterpretation),
            insertBirthData(user.id, data),
            insertNatalChart(user.id, results),
          ]);
          setHasPersistedProfile(true);
        } catch (persistErr) {
          console.warn("Supabase persist failed:", persistErr);
        }
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setError(
        err.message ||
          "An error occurred while calculating your chart. Please check your inputs and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!apiData) return;
    setIsLoading(true);
    setError(null);
    try {
      const aiInterpretation = await generateInterpretation(apiData, lang);
      setInterpretation(aiInterpretation);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(err.message || "An error occurred while regenerating your interpretation.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── T-002: Block reset when user has a persisted astro profile ─────
  const handleReset = () => {
    if (hasPersistedProfile) return;
    setApiData(null);
    setInterpretation(null);
    setError(null);
    setApiIssues([]);
  };

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

  // ── Loading states ────────────────────────────────────────────────────
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen morning-bg flex items-center justify-center">
        <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
      </div>
    );
  }

  // ── Auth gate ─────────────────────────────────────────────────────────
  if (!user) {
    return <AuthGate />;
  }

  // ── Main app — morning theme ──────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: siteVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
      className={`morning-bg min-h-screen font-sans selection:bg-[#8B6914]/20 flex flex-col ${planetariumMode ? "planetarium text-slate-100" : "text-[#1E2A3A]"}`}
    >
      {/* ── Top Nav (Desktop) ────────────────────────────────────────── */}
      <header className="hidden md:flex fixed top-0 w-full h-20 items-center justify-between px-12 z-50 morning-header">
        {/* Logo */}
        <div
          className="font-serif text-xl tracking-widest text-[#8B6914] cursor-pointer select-none"
          onClick={handleReset}
        >
          Bazodiac
        </div>

        {/* Nav links */}
        <nav className="flex space-x-12 text-[10px] uppercase tracking-[0.3em]">
          <a href="#" className="text-[#1E2A3A]/60 hover:text-[#8B6914] transition-colors active">
            {t("nav.atlas")}
          </a>
        </nav>

        {/* Controls */}
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

          {/* Planetarium toggle — FR-P01 */}
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

          {/* Audio toggle */}
          <button
            onClick={ambiente.toggle}
            className="text-[#1E2A3A]/40 hover:text-[#8B6914] transition-colors"
            title={ambiente.playing ? t("nav.pauseAudioTitle") : t("nav.playAudioTitle")}
          >
            {ambiente.playing ? (
              <Volume2 className="w-4 h-4 text-[#8B6914]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <div className="w-[1px] h-4 bg-[#8B6914]/20" />

          {/* User + sign-out */}
          <span className="text-[9px] text-[#1E2A3A]/35 tracking-wider max-w-[120px] truncate">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-full border border-[#8B6914]/25 flex items-center justify-center hover:bg-[#8B6914]/10 hover:border-[#8B6914]/45 transition-all"
            title={t("nav.signOut")}
          >
            <LogOut className="w-3 h-3 text-[#8B6914]/70" />
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-grow pt-24 md:pt-32 pb-24 md:pb-20 relative z-10 container mx-auto px-4 flex flex-col items-center justify-center">
        {error && (
          <div className="w-full max-w-md mb-8 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {!apiData || !interpretation ? (
          <BirthForm onSubmit={handleSubmit} isLoading={isLoading} />
        ) : (
          <Dashboard
            interpretation={interpretation}
            apiData={apiData}
            userId={user.id}
            birthDate={birthDateStr}
            onReset={handleReset}
            onRegenerate={handleRegenerate}
            isLoading={isLoading}
            apiIssues={apiIssues}
            onStopAudio={ambiente.pause}
            onResumeAudio={ambiente.resume}
          />
        )}
      </main>

      {/* ── Bottom Nav (Mobile) ───────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white/70 backdrop-blur-xl border-t border-[#8B6914]/15 flex items-center justify-around z-50 h-16">
        {/* Language toggle — mobile */}
        <div className="lang-toggle" role="group">
          <button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")}>DE</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
        </div>

        <a
          href="#"
          className="flex flex-col items-center gap-1 text-[#8B6914]"
          onClick={handleReset}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[8px] uppercase tracking-tighter">{t("nav.atlas")}</span>
        </a>

        {/* Planetarium mobile */}
        <button
          onClick={togglePlanetarium}
          aria-pressed={planetariumMode}
          aria-label="Planetarium"
          className={planetariumMode ? "text-[#D4AF37]" : "text-[#1E2A3A]/40"}
        >
          <Telescope className="w-5 h-5" />
        </button>

        <button
          onClick={ambiente.toggle}
          className="text-[#1E2A3A]/40 hover:text-[#8B6914] transition-colors"
        >
          {ambiente.playing ? <Volume2 className="w-5 h-5 text-[#8B6914]" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </nav>
    </motion.div>
  );
}
