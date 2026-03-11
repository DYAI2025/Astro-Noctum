import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LandingHero } from "./LandingHero";

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
  const [phase, setPhase] = useState<"hero" | "gate" | "video" | "animation">(() => {
    try {
      return localStorage.getItem(HERO_SEEN_KEY) === "true" ? "gate" : "hero";
    } catch { return "hero"; }
  });
  const [stage, setStage] = useState(0); // CSS animation stages (0-4)
  const [videoFading, setVideoFading] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

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
        startAnimation();
        return;
      }

      video.load();
      video.muted = false;
      video.volume = 0.8;
      video.play().catch((err) => {
        console.warn("Video play failed after interaction:", err);
        startAnimation();
      });
    });
  }, [videoError, startAnimation, resetVideoStallGuard]);

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

      {/* ── HERO: Landing Page ── */}
      <AnimatePresence>
        {phase === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-50 overflow-y-auto"
          >
            <LandingHero
              onContinue={() => {
                try { localStorage.setItem(HERO_SEEN_KEY, "true"); } catch {}
                setPhase("gate");
              }}
            />
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

      {/* ── ENTER SCREEN — ephemeris scroll reveal after video ── */}
      <div
        className={`enter-screen absolute inset-0 z-20 transition-opacity duration-[3000ms] ${
          phase === "animation" || videoFading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Deep space gradient base */}
        <div className="absolute inset-0 enter-bg" />

        {/* Noise texture */}
        <div className="absolute inset-0 enter-noise pointer-events-none" />

        {/* Sparse twinkling starfield */}
        <EnterStarfield active={stage >= 1} />

        {/* Subtle gold particle canvas */}
        <EnterParticles active={stage >= 1} />

        {/* ── Central composition ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">

          {/* ── Ephemeris Scroll ── */}
          <div className="relative flex flex-col items-center">

            {/* Subtitle above scroll */}
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={stage >= 2 ? { opacity: 0.6, letterSpacing: "0.6em" } : {}}
              transition={{ duration: 3 }}
              className="font-sans text-[8px] md:text-[10px] uppercase text-[#d4af37]/50 mb-6 md:mb-8 z-10"
            >
              Fusion Firmaments
            </motion.p>

            {/* Scroll container with unroll animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={stage >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 2.5, ease: "easeOut" }}
            >
              <div className={`enter-scroll-wrap enter-scroll-unroll ${stage >= 2 ? "unrolled" : ""}`}>
                {/* Top scroll rod */}
                <div className="enter-scroll-rod enter-scroll-rod--top" />

                {/* Ephemeris image */}
                <img
                  src="/ephemeris-fused-firmament.png"
                  alt="Fused Firmament Engine — celestial star chart"
                  className="enter-ephemeris"
                />

                {/* Overlay for text readability */}
                <div className="enter-scroll-overlay" />

                {/* Bottom scroll rod */}
                <div className="enter-scroll-rod enter-scroll-rod--bottom" />
              </div>
            </motion.div>

            {/* Title below scroll */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={stage >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
              className="enter-title font-landing-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-8 md:mt-12 mb-2 z-10"
            >
              Bazodiac
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={stage >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 2, delay: 0.6 }}
              className="font-serif text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] text-[#d4af37]/40 z-10"
            >
              Coniunctio Caelorum
            </motion.p>
          </div>

          {/* ── Enter button ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={stage >= 4 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute bottom-12 md:bottom-20 text-center z-10"
          >
            <button
              onClick={onEnter}
              className="enter-btn group relative px-14 py-5 border border-[#d4af37]/15 text-[#d4af37]/70 font-sans text-[10px] tracking-[0.5em] uppercase backdrop-blur-md transition-all duration-700 hover:border-[#d4af37]/35 hover:text-[#d4af37] cursor-pointer"
            >
              <span className="relative z-10">Enter</span>
              <div className="absolute inset-0 bg-[#d4af37]/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-0 enter-btn-glow opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </button>
            <motion.p
              initial={{ opacity: 0 }}
              animate={stage >= 4 ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-4 text-[8px] text-[#d4af37]/20 tracking-[0.4em] uppercase"
            >
              Awaken the cosmos
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none" />
      </div>
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
