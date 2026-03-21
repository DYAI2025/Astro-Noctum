import { motion } from 'motion/react';

type EncounterPhase = 'materializing' | 'levi-speaks' | 'birth-input' | 'calculating' | 'ring-reveal' | 'quiz' | 'complete';

interface ParallaxOffset { x: number; y: number; }

interface CosmicEncounterMobileProps {
  phase: EncounterPhase;
  formOffset?: ParallaxOffset;
  leviOffset?: ParallaxOffset;
  formPulse?: number;
  leviSpeaking?: number;
  className?: string;
}

export function CosmicEncounterMobile({
  phase,
  formOffset = { x: 0, y: 0 },
  leviOffset = { x: 0, y: 0 },
  formPulse = 0,
  leviSpeaking = 0,
  className = '',
}: CosmicEncounterMobileProps) {
  const isVisible = phase !== 'ring-reveal' && phase !== 'complete';

  return (
    <div
      data-testid="cosmic-mobile"
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: '#010409' }}
    >
      {/* Die Form — Gold gradient orb (left) */}
      <div
        data-testid="mobile-form-artifact"
        className="absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(${formOffset.x}px, ${formOffset.y}px)` }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12, duration: 2 }}
        >
          <div
            className="w-28 h-28 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, rgba(212,175,55,${0.15 + formPulse * 0.15}) 0%, transparent 70%)`,
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-4 rounded-full"
            style={{
              background: 'radial-gradient(circle at 40% 40%, #D4AF37 0%, #8B6914 50%, #0a0a14 100%)',
              boxShadow: `0 0 30px rgba(212,175,55,${0.3 + formPulse * 0.2})`,
            }}
          />
          <div className="absolute inset-2 rounded-full border border-[#D4AF37]/20 animate-spin" style={{ animationDuration: '8s' }} />
        </motion.div>
      </div>

      {/* Levi — Cyan gradient orb (right) */}
      <div
        data-testid="mobile-levi-artifact"
        className="absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2"
        style={{ transform: `translate(${leviOffset.x}px, ${leviOffset.y}px)` }}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 14, duration: 2.5, delay: 0.5 }}
        >
          <div
            className="w-24 h-24 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, rgba(0,245,255,${0.15 + leviSpeaking * 0.2}) 0%, transparent 70%)`,
              animation: 'pulse 2.5s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-4 rounded-full"
            style={{
              background: 'radial-gradient(circle at 40% 40%, #00F5FF 0%, #00C5FF 50%, #003040 100%)',
              boxShadow: `0 0 25px rgba(0,245,255,${0.3 + leviSpeaking * 0.3})`,
            }}
          />
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 rounded-full bg-white/50 blur-[1px]" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
