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
  sunSign?: string;
  moonSign?: string;
  ascendant?: string;
  baziAnimal?: string;
  wuxingElement?: string;
}

function IdentityPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg border px-2 py-1.5 text-center"
      style={{ borderColor: 'var(--tile-border)' }}
      data-testid={`identity-pill-${label.toLowerCase()}`}
    >
      <p
        className="text-[8px] font-sans uppercase tracking-[0.2em]"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
      >
        {label}
      </p>
      <p
        className="text-sm font-serif truncate"
        style={{ color: 'var(--tile-text-primary)' }}
      >
        {value || '—'}
      </p>
    </div>
  );
}

export function NatalSignaturStatic({
  children,
  defaultExpanded = false,
  sunSign,
  moonSign,
  ascendant,
  baziAnimal,
  wuxingElement,
}: NatalSignaturStaticProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasAnyIdentity = !!(sunSign || moonSign || ascendant || baziAnimal || wuxingElement);

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
          {hasAnyIdentity && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4" data-testid="identity-strip">
              {sunSign && <IdentityPill label={isDe ? 'Sonne' : 'Sun'} value={sunSign} />}
              {moonSign && <IdentityPill label={isDe ? 'Mond' : 'Moon'} value={moonSign} />}
              {ascendant && <IdentityPill label="AC" value={ascendant} />}
              {baziAnimal && <IdentityPill label="BaZi" value={baziAnimal} />}
              {wuxingElement && <IdentityPill label="Wu-Xing" value={wuxingElement} />}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
