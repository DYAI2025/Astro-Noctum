import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Moon, Sparkles } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';
import type { DailyResponse } from '../../lib/schemas/experience';

// ── Types ────────────────────────────────────────────────────────────

type TabKey = 'western' | 'eastern' | 'fusion';

interface Props {
  data: DailyResponse;
  onClose: () => void;
}

// ── Tab configuration ────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: typeof Sun }[] = [
  { key: 'western', label: 'Westlich', icon: Sun },
  { key: 'eastern', label: 'BaZi', icon: Moon },
  { key: 'fusion', label: 'Fusion', icon: Sparkles },
];

// ── Component ────────────────────────────────────────────────────────

export function DailyHoroscopeModal({ data, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('western');
  const hasTrackedRef = useRef(false);

  // Track open on mount
  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackEvent('daily_modal_opened');
      hasTrackedRef.current = true;
    }
  }, []);

  const handleClose = () => {
    trackEvent('daily_modal_closed');
    onClose();
  };

  const handleTabChange = (tab: TabKey) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      trackEvent('daily_tab_changed', { tab });
    }
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="morning-card max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8 relative"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#1E2A3A]/40 hover:text-[#8B6914] hover:bg-[#8B6914]/10 transition-colors"
          aria-label="Schliessen"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-[9px] uppercase tracking-[0.5em] text-[#8B6914]/55 mb-2">
            Tageshoroskop
          </p>
          <h2 className="font-serif text-xl sm:text-2xl text-[#1E2A3A]">
            {formatDateGerman(data.date)}
          </h2>
        </div>

        {/* Tab bar */}
        <div className="flex rounded-xl bg-[#8B6914]/05 p-1 mb-6">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all
                ${activeTab === key
                  ? 'bg-[#8B6914]/15 text-[#8B6914] shadow-sm'
                  : 'text-[#1E2A3A]/40 hover:text-[#1E2A3A]/60'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'western' && <SectionContent section={data.western} />}
            {activeTab === 'eastern' && <SectionContent section={data.eastern} />}
            {activeTab === 'fusion' && <FusionContent fusion={data.fusion} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Section content (Western / Eastern) ──────────────────────────────

function SectionContent({ section }: { section: DailyResponse['western'] | DailyResponse['eastern'] }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-[#1E2A3A]/80 leading-relaxed">
        {section.summary}
      </p>

      {/* Theme pills */}
      <div className="flex flex-wrap gap-2">
        {section.themes.map((theme, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider bg-[#8B6914]/08 text-[#8B6914]/70 border border-[#8B6914]/10"
          >
            {theme}
          </span>
        ))}
      </div>

      {/* Opportunity card */}
      <div className="rounded-xl border border-emerald-200/40 bg-emerald-50/30 p-4">
        <p className="text-[9px] uppercase tracking-[0.3em] text-emerald-600/70 mb-1.5">
          Chance
        </p>
        <p className="text-sm text-emerald-800/80 leading-relaxed">
          {section.opportunity}
        </p>
      </div>

      {/* Caution card */}
      <div className="rounded-xl border border-amber-200/40 bg-amber-50/30 p-4">
        <p className="text-[9px] uppercase tracking-[0.3em] text-amber-600/70 mb-1.5">
          Achtsamkeit
        </p>
        <p className="text-sm text-amber-800/80 leading-relaxed">
          {section.caution}
        </p>
      </div>
    </div>
  );
}

// ── Fusion content ───────────────────────────────────────────────────

function FusionContent({ fusion }: { fusion: DailyResponse['fusion'] }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <p className="text-sm text-[#1E2A3A]/80 leading-relaxed">
        {fusion.summary}
      </p>

      {/* Synthesis box (gold gradient) */}
      <div className="rounded-xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/08 to-[#D4AF37]/02 p-4">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-1.5">
          Synthese
        </p>
        <p className="text-sm text-[#1E2A3A]/75 leading-relaxed">
          {fusion.synthesis}
        </p>
      </div>

      {/* Action box */}
      <div className="rounded-xl border border-[#8B6914]/15 bg-[#8B6914]/05 p-4">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/60 mb-1.5">
          Tagesimpuls
        </p>
        <p className="text-sm text-[#1E2A3A]/75 leading-relaxed font-medium">
          {fusion.action}
        </p>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDateGerman(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
