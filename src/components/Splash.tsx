import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashProps {
  onEnter: () => void;
  /** Called when user selects DE or EN in the gate — syncs app language */
  onLanguageSelect?: (lang: "de" | "en") => void;
}

const CROSSFADE_DURATION = 3; // seconds before video end to start crossfade
const SEEN_KEY = "bazodiac_intro_seen";
const HERO_SEEN_KEY = "bazodiac_hero_seen";

const VIDEOS: Record<string, string> = {
  de: "/bazodiac_male_intro_GER.mp4",
  en: "/bazodiac_fem_intro_ENG.mp4",
};

export function Splash({ onEnter, onLanguageSelect }: SplashProps) {
  // Phases: "hero" → "gate" → "video" → "animation"
  // "hero"  = marketing/value prop scroll page
  // "gate"  = language selection to unlock audio context
  const [phase, setPhase] = useState<"hero" | "gate" | "video">(() => {
    try {
      return localStorage.getItem(HERO_SEEN_KEY) === "true" ? "gate" : "hero";
    } catch { return "hero"; }
  });
  const [videoFading, setVideoFading] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hasSeenIntro = useRef(false);
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

  // Stall guard: only fallback when video playback stops progressing.
  const resetVideoStallGuard = useCallback(() => {
    if (videoStallTimer.current) clearTimeout(videoStallTimer.current);

    if (phase !== "video" || videoFading) return;

    videoStallTimer.current = setTimeout(() => {
      console.warn("Splash video stalled, entering app");
      markSeen();
      onEnter();
    }, 4000);
  }, [phase, videoFading, markSeen, onEnter]);

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
      // Skip Fusion Firmaments animation — go directly to app
      markSeen();
      onEnter();
    }
  }, [videoFading, resetVideoStallGuard, markSeen, onEnter]);

  // Video ended
  const handleVideoEnded = useCallback(() => {
    markSeen();
    onEnter();
  }, [markSeen, onEnter]);

  // Video error fallback
  const handleVideoError = useCallback(() => {
    console.warn("Intro video failed to load — graceful fade");
    setVideoError(true);
    setTimeout(() => {
      markSeen();
      onEnter();
    }, 1200);
  }, [onEnter, markSeen]);

  // Skip handler (repeat visitors)
  const handleSkip = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    markSeen();
    onEnter();
  }, [markSeen, onEnter]);

  // Gate click → choose language and start video with sound
  const handleGateClick = useCallback((lang: "de" | "en") => {
    // Propagate language selection to the app's i18n context
    onLanguageSelect?.(lang);
    setVideoSrc(VIDEOS[lang]);
    setPhase("video");

    // Wait for next frame so the <source> is updated before playing
    requestAnimationFrame(() => {
      resetVideoStallGuard();

      const video = videoRef.current;
      if (!video || videoError) {
        setTimeout(() => {
          markSeen();
          onEnter();
        }, 1200);
        return;
      }

      video.load();
      video.muted = false;
      video.volume = 0.8;
      video.play().catch((err) => {
        console.warn("Video play failed after interaction:", err);
        onEnter();
      });
    });
  }, [videoError, onEnter, markSeen, resetVideoStallGuard]);

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center overflow-hidden">

      {/* ── VIDEO LAYER (hidden until gate is passed) ── */}
      {!videoError && videoSrc && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover z-30 transition-opacity duration-[3000ms] ease-in-out ${
            phase === "video" && !videoFading ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${phase === "gate" ? "pointer-events-none" : ""}`}
          playsInline
          preload="none"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* ── HERO: Gold Cormorant Splash ── */}
      <AnimatePresence>
        {phase === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-50 bg-[#010409] cursor-pointer"
            onClick={() => {
              try { localStorage.setItem(HERO_SEEN_KEY, "true"); } catch {}
              setPhase("gate");
            }}
          >
            {/* Background particles */}
            <EnterStarfield active />
            <EnterParticles active />

            {/* Central typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1 className="font-serif text-gold text-5xl md:text-7xl tracking-[0.3em] uppercase">
                BAZODIAC
              </h1>
              <p className="text-gold/50 text-[9px] tracking-[0.5em] uppercase mt-6">
                TOUCH THE SURFACE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GATE: Language selection to unlock audio ── */}
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
              <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-white/30 mb-10">
                Bazodiac
              </p>
              <div className="flex gap-6">
                <button
                  onClick={() => handleGateClick("de")}
                  className="group relative px-12 py-5 border border-gold/15 text-gold/80 font-sans text-[10px] tracking-[0.5em] uppercase hover:bg-gold/5 hover:border-gold/40 transition-all duration-700 backdrop-blur-sm"
                >
                  <span className="relative z-10">German</span>
                  <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </button>
                <button
                  onClick={() => handleGateClick("en")}
                  className="group relative px-12 py-5 border border-gold/15 text-gold/80 font-sans text-[10px] tracking-[0.5em] uppercase hover:bg-gold/5 hover:border-gold/40 transition-all duration-700 backdrop-blur-sm"
                >
                  <span className="relative z-10">English</span>
                  <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </button>
              </div>
              <p className="mt-6 text-[8px] text-white/20 tracking-widest italic">
                Choose your experience
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIDEO ERROR FALLBACK: shimmer entering animation ── */}
      {videoError && phase === "video" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-obsidian">
          <div className="animate-pulse">
            <p className="font-serif text-gold/60 text-3xl md:text-5xl tracking-[0.3em] uppercase">
              BAZODIAC
            </p>
            <div className="mt-4 mx-auto w-24 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </div>
        </div>
      )}

      {/* ── SKIP BUTTON (only on repeat visits, during video) ── */}
      {canSkip && phase === "video" && !videoFading && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          onClick={handleSkip}
          className="absolute bottom-12 right-12 z-40 px-6 py-3 border border-white/15 text-white/50 text-[9px] uppercase tracking-[0.4em] hover:text-white/80 hover:border-white/30 hover:bg-white/5 transition-all backdrop-blur-sm"
        >
          Skip
        </motion.button>
      )}

    </div>
  );
}

// ── Enter Screen Sub-Components ─────────────────────────────────────

/** Starfield — twinkling gold dots */
function EnterStarfield({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const stars: HTMLDivElement[] = [];
    const count = 80;

    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 1.8 + 0.4;
      const maxOpacity = Math.random() * 0.6 + 0.1;
      Object.assign(star.style, {
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        borderRadius: "50%",
        backgroundColor: "#d4af37",
        opacity: "0",
        boxShadow: `0 0 ${size * 3}px rgba(212,175,55,0.3)`,
        willChange: "opacity",
      });
      container.appendChild(star);
      stars.push(star);

      star.animate(
        [{ opacity: 0 }, { opacity: maxOpacity }, { opacity: 0 }],
        {
          duration: (Math.random() * 3 + 2) * 1000,
          delay: Math.random() * 4000,
          iterations: Infinity,
          easing: "ease-in-out",
        },
      );
    }

    return () => { stars.forEach((s) => s.remove()); };
  }, [active]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none transition-opacity duration-[3000ms] ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

/** Particle canvas — floating motes that drift and respond to gravity center */
function EnterParticles({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    interface Mote {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      phase: number;
    }

    let motes: Mote[] = [];

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      motes = [];
      for (let i = 0; i < 60; i++) {
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: Math.random() * 1.2 + 0.3,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const cx = () => width / 2;
    const cy = () => height * 0.4;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const m of motes) {
        // Gentle pull toward center
        const dx = cx() - m.x;
        const dy = cy() - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const pull = Math.min(0.003, 30 / (dist * dist));
        m.vx += dx * pull * 0.01;
        m.vy += dy * pull * 0.01;

        // Orbital drift
        m.vx += (-dy / dist) * 0.0004;
        m.vy += (dx / dist) * 0.0004;

        m.vx *= 0.995;
        m.vy *= 0.995;
        m.x += m.vx;
        m.y += m.vy;

        // Wrap
        if (m.x < -10) m.x = width + 10;
        if (m.x > width + 10) m.x = -10;
        if (m.y < -10) m.y = height + 10;
        if (m.y > height + 10) m.y = -10;

        const alpha = 0.15 + Math.sin((m.phase += 0.012)) * 0.1;
        ctx.fillStyle = `rgba(212,175,55,${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-[3000ms] ${
        active ? "opacity-60" : "opacity-0"
      }`}
    />
  );
}
