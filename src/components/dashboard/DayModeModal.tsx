import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import type { DailyResponse } from '../../lib/schemas/experience';
import type { DayHarmonicState } from '../../lib/day-harmonic';

// ── Types ────────────────────────────────────────────────────────────

interface Props {
  data: DailyResponse;
  dayHarmonic: DayHarmonicState | null;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  } catch {
    return dateStr;
  }
}

// ── Static canvas snapshot ───────────────────────────────────────────
// Renders a minimal Lissajous-style preview that reflects Pulse vs Trace.
// Falls back to an SVG placeholder if canvas is unavailable.

function ModeSnapshot({ mode, intensity }: { mode: 'pulse' | 'trace' | 'spannung'; intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasOk, setCanvasOk] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCanvasOk(false);
      return;
    }

    const S = 120;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    ctx.scale(dpr, dpr);
    const cx = S / 2;
    const cy = S / 2;
    const r = S * 0.38;

    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#050308';
    ctx.fillRect(0, 0, S, S);

    if (mode === 'pulse') {
      // Concentric softly glowing rings — calm, symmetric
      const rings = 3 + Math.round(intensity * 2);
      for (let i = 0; i < rings; i++) {
        const t = i / (rings - 1);
        const ringR = r * (0.3 + t * 0.7);
        const alpha = (1 - t) * (0.4 + intensity * 0.3);
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`; // gold
        ctx.lineWidth = 0.8 + intensity * 0.6;
        ctx.stroke();
      }
      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, 0.7)`;
      ctx.fill();
    } else {
      // Lissajous crossing lines — two frequency-offset figures
      const steps = 600;
      const freqRatio = 1 + intensity * 1.5; // higher intensity = more crossings
      const gold: [number, number, number] = [212, 175, 55];
      const cyan: [number, number, number] = [0, 210, 255];

      const drawCurve = (
        color: [number, number, number],
        phaseX: number,
        phaseY: number,
        alpha: number,
      ) => {
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const t = (s / steps) * Math.PI * 2;
          const x = cx + Math.cos(t + phaseX) * r;
          const y = cy + Math.sin(t * freqRatio + phaseY) * r * 0.8;
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const [r2, g, b] = color;
        ctx.strokeStyle = `rgba(${r2}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      };

      drawCurve(gold, 0, 0, 0.55 + intensity * 0.3);
      drawCurve(cyan, Math.PI * 0.3, Math.PI * 0.5, 0.35 + intensity * 0.2);

      // Center crossing glow
      const glowR = 10 + intensity * 8;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grad.addColorStop(0, `rgba(212, 175, 55, ${0.5 + intensity * 0.3})`);
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [mode, intensity]);

  return (
    <div style={{ position: 'relative', width: 120, height: 120 }}>
      <canvas
        ref={canvasRef}
        style={{ width: 120, height: 120, borderRadius: '50%' }}
        aria-hidden
      />
      {!canvasOk && (
        <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0">
          {mode === 'pulse' ? (
            <>
              <circle cx="100" cy="100" r="60" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
              <circle cx="100" cy="100" r="20" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.2" />
            </>
          ) : (
            <>
              <line x1="40" y1="40" x2="160" y2="160" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
              <line x1="160" y1="40" x2="40" y2="160" stroke="#00B4D8" strokeWidth="0.5" opacity="0.4" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────

export function DayModeModal({ data, dayHarmonic, onClose }: Props) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!hasTrackedRef.current) {
      const mode = dayHarmonic?.mode ?? data.fusion.day_mode ?? 'pulse';
      trackEvent('day_mode_modal_opened', { mode });
      hasTrackedRef.current = true;
    }
  }, [dayHarmonic, data.fusion.day_mode]);

  const handleClose = () => {
    trackEvent('day_mode_modal_closed');
    onClose();
  };
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // correctly empty — ref is always current

  // day_mode is required by Zod schema — always present
  // Compute intensity from schema field when dayHarmonic prop not yet available
  const mode = data.fusion.day_mode;
  const intensity = dayHarmonic?.intensity ??
    Math.abs((data.fusion.harmony_index - 0.45) / 0.55);
  const isTrace = mode === 'trace';
  const modeLabel = isTrace ? 'Day-Trace' : 'Day-Pulse';
  const dateLabel = formatDate(data.date);
  const text = data.fusion.synthesis || data.fusion.summary;

  return (
    <AnimatePresence>
      <motion.div
        key="day-mode-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          key="day-mode-card"
          className="relative z-10 w-full max-w-xs mx-4"
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-5 border border-white/8">
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
              aria-label="Schließen"
            >
              <X size={18} />
            </button>

            {/* Section title + mode badge */}
            <div className="text-center flex flex-col items-center gap-1.5">
              <p className="text-[9px] font-sans uppercase tracking-[0.3em] text-white/40">
                Daily Pulse
              </p>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-sans uppercase tracking-wider font-bold"
                style={{
                  background: isTrace ? 'rgba(212,175,55,0.12)' : 'rgba(160,180,204,0.10)',
                  color: isTrace ? '#D4AF37' : '#a0b4cc',
                  border: `1px solid ${isTrace ? 'rgba(212,175,55,0.25)' : 'rgba(160,180,204,0.18)'}`,
                }}
              >
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: isTrace ? '#D4AF37' : '#a0b4cc' }}
                />
                {modeLabel}
              </span>
              <p className="text-white/40 text-sm mt-0.5">{dateLabel}</p>
            </div>

            {/* Canvas snapshot */}
            <ModeSnapshot mode={mode} intensity={intensity} />

            {/* 2–3 sentence text */}
            <p className="text-center text-white/80 text-sm leading-relaxed font-serif italic max-w-[22ch]">
              {text}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
