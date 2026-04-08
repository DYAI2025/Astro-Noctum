/**
 * NatalSignaturStatic — Collapsible accordion wrapper for static natal content.
 *
 * Implements: REQ-F-dashboard-live-daily-signals
 * Decision:   DEC-dashboard-volatile-first (position 4 — last, collapsed by default)
 *
 * Wraps any static natal content (DashboardAstroSection / BaZiFourPillars / WuXing)
 * inside a collapsed accordion. No data changes — layout reorganization only.
 *
 * Collapsed by default so volatile live signals (positions 1–3) get visual priority.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface NatalSignaturStaticProps {
  children: React.ReactNode;
  /** Override default collapsed state (useful for testing) */
  defaultExpanded?: boolean;
}

export function NatalSignaturStatic({
  children,
  defaultExpanded = false,
}: NatalSignaturStaticProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';
  const [expanded, setExpanded] = useState(defaultExpanded);

  const title = isDe ? 'Deine Natal-Signatur (statisch)' : 'Your Natal Signature (static)';
  const subtitle = isDe
    ? 'BaZi-Vier-Pfeiler · Wu-Xing-Elemente · Westliche Astrologie'
    : 'BaZi Four Pillars · Wu-Xing Elements · Western Astrology';

  return (
    <div
      className="cosmic-tile overflow-hidden"
      data-testid="natal-signatur-static"
    >
      {/* ── Accordion header ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
        aria-expanded={expanded}
        aria-controls="natal-signatur-content"
      >
        <div className="space-y-0.5">
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--tile-text-primary)' }}
          >
            {title}
          </h3>
          <p
            className="text-[10px] tracking-wide"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
          >
            {subtitle}
          </p>
        </div>

        <ChevronDown
          size={16}
          className="flex-shrink-0 ml-4 transition-transform duration-300"
          style={{
            color: 'var(--tile-text-secondary)',
            opacity: 0.5,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          aria-hidden="true"
        />
      </button>

      {/* ── Accordion body ─────────────────────────────────────────────── */}
      {expanded && (
        <div
          id="natal-signatur-content"
          className="border-t"
          style={{ borderColor: 'var(--tile-border)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
