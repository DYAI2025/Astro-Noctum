import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de' }),
}));
vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));
vi.mock('@/src/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/src/lib/authedFetch', () => ({ authedFetch: vi.fn() }));
vi.mock('@/src/services/weekly', () => ({
  fetchWeeklyInsights: vi.fn().mockResolvedValue({
    week: 'KW 15 / 2026',
    areas: [
      {
        key: 'love',
        label: { de: 'Liebe', en: 'Love' },
        statement: 'Offenheit und Zuneigung stärken deine Beziehungen.',
        tendency: 'steigend',
        score: 0.85,
        rank: 1,
        isHighlighted: true,
        explain: 'Venus aktiviert deine Beziehungsachse.',
      },
      {
        key: 'career',
        label: { de: 'Karriere', en: 'Career' },
        statement: 'Fokus und Ausdauer zahlen sich aus.',
        tendency: 'stabil',
        score: 0.78,
        rank: 2,
        isHighlighted: true,
        explain: 'Saturn stärkt deinen Antrieb.',
      },
      {
        key: 'health',
        label: { de: 'Gesundheit', en: 'Health' },
        statement: 'Ruhe und Bewegung halten die Balance.',
        tendency: 'stabil',
        score: 0.72,
        rank: 3,
        isHighlighted: true,
        explain: 'Holz-Energie fördert Regeneration.',
      },
      {
        key: 'finance',
        label: { de: 'Finanzen', en: 'Finance' },
        statement: 'Ausgaben bewusst steuern.',
        tendency: 'fallend',
        score: 0.45,
        rank: 4,
        isHighlighted: false,
        explain: 'Saturn bremst impulsive Entscheidungen.',
      },
    ],
    meta: { engine_version: '1.0', cached: false },
  }),
}));

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

// ── Tests ──────────────────────────────────────────────────────────

// Import after mocks are set up
const { default: WeeklyInsightsPage } = await import('../pages/WeeklyInsightsPage');

describe('WeeklyInsightsPage — mobile readability (REQ-USA-mobile-first-readability)', () => {
  describe('HighlightedAreaCard — top-3 statement text', () => {
    it('statement uses text-sm (14px — meets ≥14px)', async () => {
      render(<WeeklyInsightsPage />);
      // Wait for data to load
      const statements = await screen.findAllByText(/Offenheit|Fokus|Ruhe/);
      for (const el of statements) {
        expect(el.className).toContain('text-sm');
        expect(el.className).not.toContain('text-xs');
      }
    });

    it('statement uses leading-relaxed (1.625 — meets ≥1.5)', async () => {
      render(<WeeklyInsightsPage />);
      const statements = await screen.findAllByText(/Offenheit|Fokus|Ruhe/);
      for (const el of statements) {
        expect(el.className).toContain('leading-relaxed');
      }
    });
  });

  describe('CompactAreaCard — remaining area statement text', () => {
    it('compact statement uses text-sm (14px — meets ≥14px)', async () => {
      render(<WeeklyInsightsPage />);
      const compact = await screen.findByText('Ausgaben bewusst steuern.');
      expect(compact.className).toContain('text-sm');
      expect(compact.className).not.toContain('text-xs');
    });

    it('compact statement uses leading-relaxed (≥1.5)', async () => {
      render(<WeeklyInsightsPage />);
      const compact = await screen.findByText('Ausgaben bewusst steuern.');
      expect(compact.className).toContain('leading-relaxed');
    });
  });

  describe('Layout — top-3 highlighted cards render first', () => {
    it('renders highlighted areas before compact areas', async () => {
      render(<WeeklyInsightsPage />);
      const love = await screen.findByText('Liebe');
      const finance = await screen.findByText('Finanzen');
      // Love (highlighted) should appear before Finance (compact) in DOM order
      expect(
        love.compareDocumentPosition(finance) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it('renders all 3 highlighted area labels', async () => {
      render(<WeeklyInsightsPage />);
      expect(await screen.findByText('Liebe')).toBeTruthy();
      expect(await screen.findByText('Karriere')).toBeTruthy();
      expect(await screen.findByText('Gesundheit')).toBeTruthy();
    });
  });
});
