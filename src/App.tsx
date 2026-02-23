import { useState, useRef, useEffect } from "react";
import { BirthForm } from "./components/BirthForm";
import { Dashboard } from "./components/Dashboard";
import { Splash } from "./components/Splash";
import { calculateAll, BirthData } from "./services/api";
import { generateInterpretation } from "./services/gemini";
import { Volume2, VolumeX, User, Compass, LayoutGrid, Archive } from "lucide-react";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = document.getElementById('cosmic-audio') as HTMLAudioElement;
  }, []);

  const handleEnter = () => {
    setShowSplash(false);
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.warn("Audio autoplay blocked by browser policy. Interaction required."));
      setAudioPlaying(true);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  const handleSubmit = async (data: BirthData) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await calculateAll(data);
      setApiData(results);

      const aiInterpretation = await generateInterpretation(results);
      setInterpretation(aiInterpretation);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while calculating your chart.",
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
      setError(
        err.message || "An error occurred while regenerating your interpretation.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setApiData(null);
    setInterpretation(null);
    setError(null);
  };

  if (showSplash) {
    return <Splash onEnter={handleEnter} />;
  }

  return (
    <div className="min-h-screen bg-obsidian text-white/90 font-sans selection:bg-gold/30 flex flex-col">
      {/* Top Nav (Desktop) */}
      <header className="hidden md:flex fixed top-0 w-full h-20 items-center justify-between px-12 z-50 bg-obsidian/40 backdrop-blur-xl border-b border-gold/5">
        <div className="font-serif text-xl tracking-widest text-gold cursor-pointer" onClick={handleReset}>NOCTURNE</div>
        <nav className="flex space-x-12 text-[10px] uppercase tracking-[0.3em]">
          <a href="#" className="nav-link hover:text-gold transition-colors active">Atlas</a>
        </nav>
        <div className="flex items-center gap-6">
          <button onClick={toggleAudio} className="hover:text-gold transition-colors opacity-60 hover:opacity-100">
            {audioPlaying ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>
          <div className="w-[1px] h-4 bg-gold/20"></div>
          <button className="w-8 h-8 rounded-full border border-gold/20 flex items-center justify-center hover:bg-gold/10 hover:border-gold/40 transition-all">
            <User className="w-3 h-3 text-gold/80" />
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
            onReset={handleReset}
            onRegenerate={handleRegenerate}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 w-full h-20 bg-obsidian/80 backdrop-blur-2xl border-t border-gold/10 flex items-center justify-around z-50">
        <a href="#" className="nav-link flex flex-col items-center gap-1 text-gold" onClick={handleReset}>
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[8px] uppercase tracking-tighter">Atlas</span>
        </a>
      </nav>
    </div>
  );
}
