import type { ReactNode } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export interface SubTile {
  label: string;
  value: string;
  description?: string;
}

interface AstroAccordionTileProps {
  icon: ReactNode;
  title: string;
  value: string;
  description?: string;
  subTiles: SubTile[];
  isOpen: boolean;
  onToggle: () => void;
  isFirstReveal?: boolean;
}

export function AstroAccordionTile({
  icon, title, value, description, subTiles, isOpen, onToggle, isFirstReveal,
}: AstroAccordionTileProps) {
  return (
    <div className="cosmic-tile overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gold/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold/70">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-serif opacity-80">{value}</span>
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4 text-gold/40" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Main description */}
              {description && (
                <p className="text-sm opacity-70 leading-relaxed font-sans">{description}</p>
              )}

              {/* Signatur hint */}
              <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
                <p className="text-xs text-gold leading-relaxed font-sans">
                  Diese Energien bilden das Fundament deiner Signatur.
                </p>
              </div>

              {/* Sub-tiles */}
              {subTiles.map((sub) => (
                <SubAccordion key={sub.label} {...sub} isFirstReveal={isFirstReveal} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubAccordion({ label, value, description, isFirstReveal }: SubTile & { isFirstReveal?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        isFirstReveal && !open
          ? 'border-gold/40 animate-pulse-gold'
          : 'border-gold/15'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gold/5 transition-colors"
      >
        <span className="text-xs opacity-60 uppercase tracking-wider font-sans">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-serif opacity-70">{value}</span>
          <motion.div animate={{ rotate: open ? 90 : 0 }}>
            <ChevronRight className="w-3 h-3 text-gold/30" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {description && <p className="text-xs opacity-60 leading-relaxed font-sans">{description}</p>}
              <div className="p-2 rounded-lg bg-gold/5 border border-gold/10">
                <p className="text-[10px] text-gold/80 font-sans">
                  Fundament deiner Signatur
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
