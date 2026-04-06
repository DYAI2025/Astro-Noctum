import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VibesModal } from '../components/dashboard/VibesModal';
import type { VibesResponse } from '../services/vibes';

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.vibesModal.closeLabel': 'Schließen',
        'dashboard.vibesModal.whyLabel': 'Warum?',
        'dashboard.vibesModal.signaturLabel': 'Signatur',
        'dashboard.vibesModal.transitLabel': 'Transit',
        'dashboard.vibesModal.emptyContent': 'Kein Inhalt',
      };
      return map[key] || key;
    },
  }),
}));

vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));

// motion/react minimal mock
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div className={className} {...rest}>{children}</div>
    ),
    span: ({ children, className, ...rest }: React.HTMLAttributes<HTMLSpanElement> & Record<string, unknown>) => (
      <span className={className} {...rest}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Fixtures ───────────────────────────────────────────────────────

const VIBES: VibesResponse = {
  horizon: 'Heute',
  kurzsignal: 'Du stehst an einer Schwelle des Wandels.',
  treiber: ['Feuer', 'Transformation', 'Mut'],
  erklaerung: 'Deine Energie ist heute besonders stark.',
  explain: {
    signatur_context: 'Deine Signatur zeigt Yin-Holz in der Führungsachse.',
    transit_context: 'Mars aktiviert deinen Aufstiegssektor.',
  },
};

// ── Tests ──────────────────────────────────────────────────────────

describe('VibesModal — mobile readability (REQ-USA-mobile-first-readability)', () => {
  describe('Level 1: Kurzsignal', () => {
    it('renders kurzsignal text', () => {
      render(<VibesModal data={VIBES} onClose={vi.fn()} />);
      expect(screen.getByText(VIBES.kurzsignal!)).toBeTruthy();
    });

    it('has leading-normal class (line-height ≥1.5)', () => {
      render(<VibesModal data={VIBES} onClose={vi.fn()} />);
      const el = screen.getByText(VIBES.kurzsignal!);
      expect(el.className).toContain('leading-normal');
    });

    it('does not use leading-snug (line-height ≈1.375, below minimum)', () => {
      render(<VibesModal data={VIBES} onClose={vi.fn()} />);
      const el = screen.getByText(VIBES.kurzsignal!);
      expect(el.className).not.toContain('leading-snug');
    });

    it('uses text-2xl base font size (≥14px — well above minimum)', () => {
      render(<VibesModal data={VIBES} onClose={vi.fn()} />);
      const el = screen.getByText(VIBES.kurzsignal!);
      expect(el.className).toMatch(/text-2xl|text-3xl/);
    });
  });

  describe('Level 2: Treiber pills', () => {
    it('renders all treiber tags', () => {
      render(<VibesModal data={VIBES} onClose={vi.fn()} />);
      for (const tag of VIBES.treiber) {
        expect(screen.getByText(tag)).toBeTruthy();
      }
    });

    it('uses text-sm class (14px — meets ≥14px requirement)', () => {
      render(<VibesModal data={VIBES} onClose={vi.fn()} />);
      for (const tag of VIBES.treiber) {
        const el = screen.getByText(tag);
        expect(el.className).toContain('text-sm');
      }
    });

    it('does not use text-xs (12px — below 14px minimum)', () => {
      render(<VibesModal data={VIBES} onClose={vi.fn()} />);
      for (const tag of VIBES.treiber) {
        const el = screen.getByText(tag);
        expect(el.className).not.toContain('text-xs');
      }
    });
  });

  describe('Empty kurzsignal fallback', () => {
    it('shows fallback text when kurzsignal is empty', () => {
      render(
        <VibesModal
          data={{ ...VIBES, kurzsignal: '' }}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Kein Inhalt')).toBeTruthy();
    });
  });
});
