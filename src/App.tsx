import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BirthForm } from "./components/BirthForm";
import { Dashboard } from "./components/Dashboard";
import { Splash } from "./components/Splash";
import { AuthGate } from "./components/AuthGate";
import { useAuth } from "./contexts/AuthContext";
import { calculateAll, BirthData, ApiIssue } from "./services/api";
import { generateInterpretation } from "./services/gemini";
import {
  upsertAstroProfile,
  insertBirthData,
  insertNatalChart,
} from "./services/supabase";
import { useAmbientePlayer } from "./hooks/useAmbientePlayer";
import { Volume2, VolumeX, LogOut, LayoutGrid } from "lucide-react";

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [showSplash, setShowSplash] = useState(true);
  const [siteVisible, setSiteVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [apiIssues, setApiIssues] = useState<ApiIssue[]>([]);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ambiente = useAmbientePlayer();

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
    try {
      const results = await calculateAll(data);
      setApiData(results);
      setApiIssues(results.issues);

      const aiInterpretation = await generateInterpretation(results);
      setInterpretation(aiInterpretation);

      // Persist to Supabase if user is logged in
      if (user) {
        try {
          await Promise.all([
            upsertAstroProfile(user.id, data, results, aiInterpretation),
            insertBirthData(user.id, data),
            insertNatalChart(user.id, results),
          ]);
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
      const aiInterpretation = await generateInterpretation(apiData);
      setInterpretation(aiInterpretation);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setError(
        err.message ||
          "An error occurred while regenerating your interpretation. Please try again later.",
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
  };

  // Show splash first
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
          <Splash onEnter={handleEnter} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="w-1 h-1 bg-gold rounded-full animate-ping" />
      </div>
    );
  }

  // Not logged in -> show AuthGate
  if (!user) {
    return <AuthGate />;
  }

  // Logged in -> show main app
  return (
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
          <span className="text-[9px] text-white/30 tracking-wider max-w-[120px] truncate">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center hover:bg-gold/10 hover:border-gold/40 transition-all"
            title="Abmelden"
          >
            <LogOut className="w-3 h-3 text-gold/80" />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-grow pt-24 md:pt-32 pb-24 md:pb-20 relative z-10 container mx-auto px-4 flex flex-col items-center justify-center">
        {error && (
          <div className="w-full max-w-md mb-8 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
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
            onReset={handleReset}
            onRegenerate={handleRegenerate}
            isLoading={isLoading}
            apiIssues={apiIssues}
            onStopAudio={ambiente.pause}
            onResumeAudio={ambiente.resume}
          />
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
      </nav>
    </motion.div>
  );
}
