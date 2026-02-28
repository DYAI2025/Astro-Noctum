import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BirthForm } from "./components/BirthForm";
import { Dashboard } from "./components/Dashboard";
import { Splash } from "./components/Splash";
import { AuthGate } from "./components/AuthGate";
import { calculateAll, BirthData, ApiIssue } from "./services/api";
import { generateInterpretation } from "./services/gemini";
import {
  upsertAstroProfile,
  insertBirthData,
  insertNatalChart,
  fetchAstroProfile,
} from "./services/supabase";
import { useAuth } from "./contexts/AuthContext";
import { useAmbientePlayer } from "./hooks/useAmbientePlayer";
import { Volume2, VolumeX, User, LayoutGrid, LogOut } from "lucide-react";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const ambiente = useAmbientePlayer();

  const [showSplash, setShowSplash] = useState(true);
  const [siteVisible, setSiteVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [apiIssues, setApiIssues] = useState<ApiIssue[]>([]);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBirthInput, setLastBirthInput] = useState<BirthData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasStoredProfile, setHasStoredProfile] = useState(false);

  // Load existing astro profile for returning users
  useEffect(() => {
    if (!user || apiData) return;
    setProfileLoading(true);
    fetchAstroProfile(user.id)
      .then((profile) => {
        setHasStoredProfile(!!profile);
        if (profile?.astro_json) {
          const json = profile.astro_json as any;
          setApiData({
            bazi: json.bazi,
            western: json.western,
            fusion: json.fusion,
            wuxing: json.wuxing,
            tst: json.tst,
            issues: [],
          });
          setInterpretation(
            json.interpretation ||
              "Dein gespeichertes Chart wurde geladen. Du kannst jederzeit unten eine neue KI-Deutung erzeugen.",
          );
          if (profile.birth_date) {
            setLastBirthInput({
              date: `${profile.birth_date}T${profile.birth_time || "12:00"}`,
              tz: profile.iana_time_zone || "Europe/Berlin",
              lat: profile.birth_lat || 0,
              lon: profile.birth_lng || 0,
            });
          }
        }
      })
      .catch((err) => console.warn("Profile load failed:", err))
      .finally(() => setProfileLoading(false));
  }, [user]);

  const handleEnter = () => {
    setShowSplash(false);
    setTimeout(() => {
      setSiteVisible(true);
    }, 100);
    ambiente.start();
  };

  const handleSubmit = async (data: BirthData) => {
    setIsLoading(true);
    setError(null);
    setLastBirthInput(data);
    try {
      const results = await calculateAll(data);
      setApiData(results);
      setApiIssues(results.issues);

      const aiInterpretation = await generateInterpretation(results);
      setInterpretation(aiInterpretation);

      // Persist to Supabase under user's profile
      if (user) {
        Promise.all([
          insertBirthData(user.id, data),
          upsertAstroProfile(user.id, data, results, aiInterpretation),
          insertNatalChart(user.id, results),
        ]).catch((persistError) => {
          console.warn("Supabase persist failed (non-blocking):", persistError);
        });
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
      const aiInterpretation = await generateInterpretation(apiData);
      setInterpretation(aiInterpretation);

      // Update stored profile with new interpretation
      if (user && lastBirthInput) {
        upsertAstroProfile(
          user.id,
          lastBirthInput,
          apiData,
          aiInterpretation,
        ).catch((e) => console.warn("Profile update failed:", e));
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(
        err.message ||
          "An error occurred while regenerating your interpretation.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setApiData(null);
    setInterpretation(null);
    setError(null);
    setApiIssues([]);
    setLastBirthInput(null);
    setHasStoredProfile(false);
  };

  const handleSignOut = async () => {
    handleReset();
    await signOut();
  };

  // Determine what to show
  const isLoggedIn = !!user;
  const hasDashboard = !!apiData;

  return (
    <>
      {/* Splash Overlay */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[200]"
          >
            <Splash onEnter={handleEnter} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Site */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: siteVisible ? 1 : 0 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        className="min-h-screen bg-obsidian text-white/90 font-sans selection:bg-gold/30 flex flex-col"
      >
        {/* Top Nav (Desktop) */}
        <header className="hidden md:flex fixed top-0 w-full h-20 items-center justify-between px-12 z-50 bg-obsidian/40 backdrop-blur-xl border-b border-gold/5">
          <div
            className="font-serif text-xl tracking-widest text-gold cursor-pointer"
            onClick={handleReset}
          >
            Bazodiac
          </div>
          <nav className="flex space-x-12 text-[10px] uppercase tracking-[0.3em]">
            <a
              href="#"
              className="nav-link hover:text-gold transition-colors active"
            >
              Atlas
            </a>
          </nav>
          <div className="flex items-center gap-6">
            <button
              onClick={ambiente.toggle}
              className="hover:text-gold transition-colors opacity-60 hover:opacity-100"
            >
              {ambiente.playing ? (
                <Volume2 className="w-4 h-4 text-gold" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/40" />
              )}
            </button>
            <div className="w-[1px] h-4 bg-gold/20"></div>
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-gold/60 uppercase tracking-widest max-w-[120px] truncate">
                  {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/40 transition-all"
                  title="Abmelden"
                >
                  <LogOut className="w-3 h-3 text-white/60" />
                </button>
              </div>
            ) : (
              <button className="w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center hover:bg-gold/10 hover:border-gold/40 transition-all">
                <User className="w-3 h-3 text-gold/80" />
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-grow pt-24 md:pt-32 pb-24 md:pb-20 relative z-10 container mx-auto px-4 flex flex-col items-center justify-center">
          {/* Auth loading spinner */}
          {authLoading && (
            <div className="flex flex-col items-center justify-center h-[40vh] space-y-6">
              <div className="relative w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="absolute inset-0 skeleton-dust"></div>
              </div>
              <p className="font-serif text-lg italic text-gold/60 animate-pulse">Laden...</p>
            </div>
          )}

          {/* Not logged in → AuthGate */}
          {!authLoading && !isLoggedIn && <AuthGate />}

          {/* Logged in → BirthForm or Dashboard */}
          {!authLoading && isLoggedIn && (
            <>
              {error && (
                <div className="w-full max-w-md mb-8 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              {profileLoading ? (
                <div className="flex flex-col items-center justify-center h-[40vh] space-y-6">
                  <div className="relative w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="absolute inset-0 skeleton-dust"></div>
                  </div>
                  <p className="font-serif text-lg italic text-white/60 animate-pulse">Lade dein Profil...</p>
                </div>
              ) : !hasDashboard ? (
                <BirthForm onSubmit={handleSubmit} isLoading={isLoading} />
              ) : (
                <Dashboard
                  interpretation={interpretation || ""}
                  apiData={apiData}
                  onReset={handleReset}
                  onRegenerate={handleRegenerate}
                  isLoading={isLoading}
                  apiIssues={apiIssues}
                  userId={user!.id}
                  birthInput={lastBirthInput}
                  onStopAudio={ambiente.pause}
                  onResumeAudio={ambiente.resume}
                />
              )}

              {!profileLoading && !hasDashboard && hasStoredProfile && (
                <p className="mt-6 text-center text-xs text-white/40">
                  Dein Account wurde gefunden, aber es liegt noch kein vollständiges Astro-Profil vor.
                </p>
              )}
            </>
          )}
        </main>

        {/* Bottom Nav (Mobile) */}
        <nav className="md:hidden fixed bottom-0 w-full h-20 bg-obsidian/80 backdrop-blur-2xl border-t border-gold/10 flex items-center justify-around z-50">
          <a
            href="#"
            className="nav-link flex flex-col items-center gap-1 text-gold"
            onClick={handleReset}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[8px] uppercase tracking-tighter">Atlas</span>
          </a>
          {isLoggedIn && (
            <button
              onClick={handleSignOut}
              className="flex flex-col items-center gap-1 text-white/40"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[8px] uppercase tracking-tighter">
                Logout
              </span>
            </button>
          )}
        </nav>
      </motion.div>
    </>
  );
}
