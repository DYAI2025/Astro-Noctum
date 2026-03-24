import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock heavy animations ──────────────────────────────────────────────────
vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target: unknown, prop: string) => {
      return ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
        const El = prop as keyof JSX.IntrinsicElements;
        return <El {...props}>{children}</El>;
      };
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Mock context providers ─────────────────────────────────────────────────
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

vi.mock('../contexts/AppLayoutContext', () => ({
  useAppLayout: () => ({
    apiData: {
      wuxing: {
        elements: { Wood: 3, Fire: 2, Earth: 1, Metal: 2, Water: 2 },
        dominant_element: 'Wood',
      },
    },
  }),
}));

vi.mock('../contexts/PlanetariumContext', () => ({
  usePlanetarium: () => ({ planetariumMode: false }),
}));

vi.mock('../hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: false }),
}));

// ── Mock child SVG components ──────────────────────────────────────────────
vi.mock('../components/WuXingPentagon', () => ({
  WuXingPentagon: () => <svg data-testid="wuxing-pentagon" />,
}));

vi.mock('../components/WuXingCycleWheel', () => ({
  WuXingCycleWheel: () => <svg data-testid="wuxing-cycle-wheel" />,
}));

vi.mock('../components/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/UpgradeButton', () => ({
  UpgradeButton: ({ label }: { label?: string }) => <button>{label ?? 'Upgrade'}</button>,
}));

import WuXingPage from '../pages/WuXingPage';

describe('WuXingPage detail extensions', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <WuXingPage />
      </MemoryRouter>,
    );
  }

  it('renders the pentagon and cycle wheel visualizations', () => {
    renderPage();
    expect(screen.getByTestId('wuxing-pentagon')).toBeDefined();
    expect(screen.getByTestId('wuxing-cycle-wheel')).toBeDefined();
  });

  it('renders the premium section header text for the extended analysis', () => {
    renderPage();
    // The premium section heading should appear in the DOM
    const matches = screen.queryAllByText(/Elementbalance|element balance/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders the element balance chart inside the premium gate (blurred but in DOM)', () => {
    // PremiumGate blurs children for non-premium but still mounts them in DOM
    renderPage();
    expect(screen.getByTestId('element-balance-chart')).toBeDefined();
  });
});
