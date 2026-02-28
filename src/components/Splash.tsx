import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashProps {
  onEnter: () => void;
}

const CROSSFADE_DURATION = 3; // seconds before video end to start crossfade
const SEEN_KEY = "bazodiac_intro_seen";

export function Splash({ onEnter }: SplashProps) {
  // Phases: "gate" → "video" → "animation" → "ready"
  // "gate" = initial click to unlock audio context (browser policy)
  const [phase, setPhase] = useState<"gate" | "video" | "animation">("gate");
  const [stage, setStage] = useState(0); // CSS animation stages (0-4)
  const [videoFading, setVideoFading] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSeenIntro = useRef(false);
  const animTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const videoStallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user has seen the intro before
  useEffect(() => {
    try {
      hasSeenIntro.current = localStorage.getItem(SEEN_KEY) === "true";
    } catch {
      hasSeenIntro.current = false;
    }
    if (hasSeenIntro.current) {
      setCanSkip(true);
    }
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      animTimers.current.forEach(clearTimeout);
      if (videoStallTimer.current) clearTimeout(videoStallTimer.current);
    };
  }, []);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // silent
    }
  }, []);

  // Start CSS animation sequence
  const startAnimation = useCallback(() => {
    setPhase((prev) => {
      if (prev === "animation") return prev;
      return "animation";
    });

    animTimers.current.forEach(clearTimeout);
    animTimers.current = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 1800),
      setTimeout(() => setStage(3), 3800),
      setTimeout(() => setStage(4), 5300),
    ];
  }, []);

  // Stall guard: only fallback when video playback stops progressing.
  const resetVideoStallGuard = useCallback(() => {
    if (videoStallTimer.current) clearTimeout(videoStallTimer.current);

    if (phase !== "video" || videoFading) return;

    videoStallTimer.current = setTimeout(() => {
      console.warn("Splash video stalled, forcing animation fallback");
      setVideoFading(true);
      markSeen();
      startAnimation();
    }, 4000);
  }, [phase, videoFading, markSeen, startAnimation]);

  useEffect(() => {
    if (phase !== "video" || videoFading) return;
    resetVideoStallGuard();

    return () => {
      if (videoStallTimer.current) clearTimeout(videoStallTimer.current);
    };
  }, [phase, videoFading, resetVideoStallGuard]);

  // Video timeupdate: detect crossfade point
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || videoFading) return;

    resetVideoStallGuard();

    const remaining = video.duration - video.currentTime;
    if (remaining <= CROSSFADE_DURATION && remaining > 0) {
      setVideoFading(true);
      startAnimation();
    }
  }, [videoFading, startAnimation, resetVideoStallGuard]);

  // Video ended
  const handleVideoEnded = useCallback(() => {
    markSeen();
    setVideoFading(true);
    startAnimation();
  }, [markSeen, startAnimation]);

  // Video error fallback
  const handleVideoError = useCallback(() => {
    console.warn("Intro video failed to load, skipping to animation");
    setVideoError(true);
    setVideoFading(true);
    startAnimation();
  }, [startAnimation]);

  // Skip handler (repeat visitors)
  const handleSkip = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    setVideoFading(true);
    markSeen();
    startAnimation();
  }, [markSeen, startAnimation]);

  // Gate click → start video with sound
  const handleGateClick = useCallback(() => {
    setPhase("video");

    resetVideoStallGuard();

    const video = videoRef.current;
    if (!video || videoError) {
      // No video available, go straight to animation
      startAnimation();
      return;
    }

    video.muted = false;
    video.volume = 1;
    video.play().catch((err) => {
      console.warn("Video play failed after interaction:", err);
      startAnimation();
    });
  }, [videoError, startAnimation, resetVideoStallGuard]);

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center overflow-hidden">

      {/* ── VIDEO LAYER (hidden until gate is passed) ── */}
      {!videoError && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover z-30 transition-opacity duration-[3000ms] ease-in-out ${
            phase === "video" && !videoFading ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${phase === "gate" ? "pointer-events-none" : ""}`}
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        >
          <source src="/bazodiac_intro_fem_ENG.mp4" type="video/mp4" />
        </video>
      )}

      {/* ── GATE: Initial click to unlock audio ── */}
      <AnimatePresence>
        {phase === "gate" && (
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-obsidian"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="text-center"
            >
              <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-white/30 mb-8">
                Bazodiac
              </p>
              <button
                onClick={handleGateClick}
                className="group relative px-16 py-5 border border-gold/15 text-gold/80 font-sans text-[10px] tracking-[0.5em] uppercase hover:bg-gold/5 hover:border-gold/40 transition-all duration-700 backdrop-blur-sm"
              >
                <span className="relative z-10">Singularität initiieren</span>
                <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </button>
              <p className="mt-6 text-[8px] text-white/20 tracking-widest italic">
                Mit Audio-Erlebnis
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SKIP BUTTON (only on repeat visits, during video) ── */}
      {canSkip && phase === "video" && !videoFading && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          onClick={handleSkip}
          className="absolute bottom-12 right-12 z-40 px-6 py-3 border border-white/15 text-white/50 text-[9px] uppercase tracking-[0.4em] hover:text-white/80 hover:border-white/30 hover:bg-white/5 transition-all backdrop-blur-sm"
        >
          Überspringen
        </motion.button>
      )}

      {/* ── CSS ANIMATION LAYER ── */}
      <div
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-[3000ms] ${
          phase === "animation" || videoFading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Star Atlas Background */}
        <div
          className={`absolute inset-0 transition-opacity duration-[3000ms] ${
            stage >= 2 ? "opacity-40" : "opacity-0"
          }`}
        >
          <img
            src="https://r2-bucket.flowith.net/f/77e7a2286de210ee/nocturne_atlas_star_map_index_1%404096x2286.jpeg"
            alt="Star Atlas"
            className="w-full h-full object-cover scale-125 blur-sm brightness-50"
          />
        </div>

        {/* Singularity Point */}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{
              opacity: 0,
              scale: 1,
              boxShadow: "0 0 0px 0px rgba(255,255,255,0)",
            }}
            animate={
              stage === 1
                ? {
                    opacity: 1,
                    scale: 1,
                    boxShadow: "0 0 30px 4px rgba(255,255,255,0.8)",
                  }
                : stage >= 2
                ? {
                    opacity: 0.05,
                    scale: 120,
                    boxShadow: "0 0 30px 4px rgba(255,255,255,0.8)",
                  }
                : {}
            }
            transition={{ duration: stage === 1 ? 2 : 4, ease: "easeInOut" }}
            className="w-1 h-1 bg-white rounded-full"
          />
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={stage >= 2 ? { opacity: 0.2, scale: 2 } : {}}
            transition={{ duration: 4 }}
            className="absolute w-0.5 h-64 bg-white/10 blur-xl rotate-45"
          />
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={stage >= 2 ? { opacity: 0.2, scale: 2 } : {}}
            transition={{ duration: 4 }}
            className="absolute w-0.5 h-64 bg-white/10 blur-xl -rotate-45"
          />
        </div>

        {/* Title */}
        <div className="mt-20 text-center z-10">
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={stage >= 3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 2 }}
            className="font-serif text-3xl tracking-[0.3em] mb-4"
          >
            Coniunctio Caelorum Occidentalis et Orientalis
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={stage >= 3 ? { opacity: 1 } : {}}
            transition={{ duration: 2, delay: 0.5 }}
            className="font-sans text-[10px] uppercase tracking-[0.5em] text-gold/80"
          >
            Bazodiac
          </motion.p>
        </div>

        {/* Enter Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={stage >= 4 ? { opacity: 1 } : {}}
          transition={{ duration: 1 }}
          className="absolute bottom-20 text-center"
        >
          <button
            onClick={onEnter}
            className="px-12 py-4 border border-gold/20 text-gold font-sans text-[10px] tracking-[0.4em] uppercase hover:bg-gold/5 hover:border-gold/50 transition-all backdrop-blur-sm"
          >
            Eintreten
          </button>
          <p className="mt-4 text-[8px] text-white/30 tracking-widest italic">
            Klicke, um den Kosmos zu wecken
          </p>
        </motion.div>
      </div>
    </div>
  );
}
