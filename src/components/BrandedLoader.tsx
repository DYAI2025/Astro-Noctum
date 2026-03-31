import { motion } from "motion/react";
import { IconOrbit } from "./animated-icons";

interface BrandedLoaderProps {
  message?: string;
  className?: string;
}

export function BrandedLoader({ message, className = "" }: BrandedLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      <div className="relative w-16 h-16">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gold-deep/20 rounded-full blur-xl animate-pulse" />
        
        {/* Spinning Orbit Icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="relative z-10 w-full h-full text-gold-deep"
        >
          <IconOrbit width={64} height={64} strokeWidth={1.5} />
        </motion.div>
        
        {/* Center pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gold-deep rounded-full animate-ping" />
        </div>
      </div>

      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] uppercase tracking-[0.4em] text-gold-deep/50 font-mono text-center max-w-[200px]"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
