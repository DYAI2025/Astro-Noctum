import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashProps {
  onEnter: () => void;
}

export function Splash({ onEnter }: SplashProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1000);
    const t2 = setTimeout(() => setStage(2), 2500);
    const t3 = setTimeout(() => setStage(3), 4500);
    const t4 = setTimeout(() => setStage(4), 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center overflow-hidden">
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

      <div className="relative flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 1, boxShadow: "0 0 0px 0px rgba(255,255,255,0)" }}
          animate={
            stage === 1
              ? { opacity: 1, scale: 1, boxShadow: "0 0 30px 4px rgba(255,255,255,0.8)" }
              : stage >= 2
              ? { opacity: 0.05, scale: 120, boxShadow: "0 0 30px 4px rgba(255,255,255,0.8)" }
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

      <div className="mt-20 text-center z-10">
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={stage >= 3 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 2 }}
          className="font-serif text-3xl tracking-[0.3em] mb-4"
        >
          NOCTURNE ATLAS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={stage >= 3 ? { opacity: 1 } : {}}
          transition={{ duration: 2, delay: 0.5 }}
          className="font-sans text-[10px] uppercase tracking-[0.5em] text-gold/80"
        >
          Präzise berechnet. Sanft erzählt.
        </motion.p>
      </div>

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
  );
}
