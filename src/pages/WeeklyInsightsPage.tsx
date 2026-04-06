import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { fetchWeeklyInsights, type WeeklyResponse, type WeeklyArea } from '@/src/services/weekly';
import { trackEvent } from '@/src/lib/analytics';

// ── Area emoji mapping ──────────────────────────────────────────────

const AREA_ICONS: Record<string, string> = {
  love: '\u2764\uFE0F',
  career: '\uD83D\uDCBC',
  health: '\uD83C\uDF3F',
  finance: '\uD83D\uDCB0',
  social: '\uD83E\uDD1D',
  creativity: '\uD83C\uDFA8',
  spirituality: '\uD83D\uDD6E',
  family: '\uD83C\uDFE0',
  education: '\uD83D\uDCDA',
  travel: '\u2708\uFE0F',
  communication: '\uD83D\uDCAC',
  energy: '\u26A1',
};

function getAreaIcon(key: string): string {
  return AREA_ICONS[key] ?? '\u2728';
}

// ── Skeleton ────────────────────────────────────────────────────────

function SkeletonCard({ highlighted }: { highlighted: boolean }) {
  const base = highlighted
    ? 'border border-gold/20 bg-gold/5 p-6'
    : 'border border-gold/10 bg-[#0D0F14] p-4';
  return (
    <div className={`rounded-xl ${base} animate-pulse`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-6 h-6 rounded-full bg-gold/10" />
        <div className="h-4 w-24 rounded bg-gold/10" />
        <div className="h-5 w-16 rounded-full bg-gold/10 ml-auto" />
      </div>
      {highlighted && (
        <>
          <div className="h-4 w-full rounded bg-gold/8 mt-3" />
          <div className="h-4 w-3/4 rounded bg-gold/8 mt-2" />
        </>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i} highlighted />
      ))}
      {[3, 4, 5, 6].map((i) => (
        <SkeletonCard key={i} highlighted={false} />
      ))}
    </div>
  );
}

// ── Highlighted area card ───────────────────────────────────────────

function HighlightedAreaCard({ area, lang }: { area: WeeklyArea; lang: 'de' | 'en' }) {
  const [explainOpen, setExplainOpen] = useState(false);

  const handleExplainToggle = () => {
    if (!explainOpen) {
      trackEvent('weekly_area_explain_opened', { area: area.key });
    }
    setExplainOpen((prev) => !prev);
  };

  const label = area.label[lang] ?? area.label.de;
  const whyLabel = lang === 'de' ? 'Warum?' : 'Why?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-xl border border-gold/20 bg-gold/5 p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-xl" role="img" aria-label={label}>
          {getAreaIcon(area.key)}
        </span>
        <h3 className="font-serif text-lg text-white/90">{label}</h3>
        <span className="bg-gold/10 text-gold/80 rounded-full px-2 py-0.5 text-xs ml-auto whitespace-nowrap">
          {area.tendency}
        </span>
      </div>

      {/* Statement */}
      <p className="mt-3 text-sm text-white/70 leading-relaxed">
        {area.statement}
      </p>

      {/* Warum? toggle */}
      <button
        onClick={handleExplainToggle}
        className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mt-3 min-h-11"
      >
        <span>{whyLabel}</span>
        <motion.span
          animate={{ rotate: explainOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Explain panel */}
      <AnimatePresence initial={false}>
        {explainOpen && (
          <motion.div
            key={`explain-${area.key}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-gold/10 mt-3">
              <p className="text-sm text-white/60 leading-relaxed">
                {area.explain}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Compact area card ───────────────────────────────────────────────

function CompactAreaCard({ area, lang }: { area: WeeklyArea; lang: 'de' | 'en' }) {
  const label = area.label[lang] ?? area.label.de;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-xl border border-gold/10 bg-[#0D0F14] p-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-base" role="img" aria-label={label}>
          {getAreaIcon(area.key)}
        </span>
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className="bg-gold/10 text-gold/80 rounded-full px-2 py-0.5 text-xs ml-auto whitespace-nowrap">
          {area.tendency}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/50 leading-relaxed line-clamp-2">
        {area.statement}
      </p>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function WeeklyInsightsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<WeeklyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedRef = useRef(false);

  const userId = user?.id;

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeeklyInsights(userId);
      setData(result);
    } catch (err) {
      console.error('[WeeklyInsightsPage] Fetch failed:', err);
      setError(
        lang === 'de'
          ? 'Wocheneinblicke konnten nicht geladen werden.'
          : 'Could not load weekly insights.',
      );
    } finally {
      setLoading(false);
    }
  }, [userId, lang]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Track page open once
  useEffect(() => {
    if (!hasTrackedRef.current && data) {
      trackEvent('weekly_opened');
      hasTrackedRef.current = true;
    }
  }, [data]);

  const highlighted = data?.areas.filter((a) => a.isHighlighted) ?? [];
  const reduced = data?.areas.filter((a) => !a.isHighlighted) ?? [];

  const title = lang === 'de' ? 'Deine Woche im Überblick' : 'Your Week at a Glance';
  const subtitle = data?.week ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-lg mx-auto px-4 pb-16"
    >
      {/* Header */}
      <div className="text-center mb-8 pt-2">
        {subtitle && (
          <p className="text-gold/50 text-[9px] uppercase tracking-[0.5em] mb-3">
            {subtitle}
          </p>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl text-white/90">
          {title}
        </h1>
      </div>

      {/* Content */}
      {loading && <LoadingSkeleton />}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle className="w-8 h-8 text-red-400/60" />
          <p className="text-sm text-red-400/80 text-center">{error}</p>
          <button
            onClick={loadData}
            className="text-xs text-gold/70 hover:text-gold transition-colors underline underline-offset-2"
          >
            {lang === 'de' ? 'Erneut versuchen' : 'Try again'}
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-3">
          {/* Top 3 highlighted areas */}
          {highlighted.map((area) => (
            <HighlightedAreaCard key={area.key} area={area} lang={lang} />
          ))}

          {/* Divider */}
          {reduced.length > 0 && (
            <div className="border-t border-gold/8 my-1" />
          )}

          {/* Remaining compact areas */}
          {reduced.map((area) => (
            <CompactAreaCard key={area.key} area={area} lang={lang} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
