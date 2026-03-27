// src/__tests__/dashboard-ghost-ui.test.tsx
// Regression test: verify ghost UI elements are absent from Dashboard
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ── Context / hook mocks ───────────────────────────────────────────────────
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de' as const,
    t: (k: string) => {
      // Return the actual German strings for the keys we test
      const map: Record<string, string> = {
        'dashboard.startOver': 'Zurück',
        'dashboard.welcome': 'Willkommen',
        'dashboard.title': 'Dein Atlas',
        'dashboard.fallbackNote': 'Hinweis',
        'dashboard.interpretation.sectionLabel': 'KI-Synthese',
        'dashboard.interpretation.sectionTitle': 'Gesamtanalyse',
        'dashboard.premium.teaserInterpretation': 'Premium',
      };
      return map[k] ?? k;
    },
  }),
}));

vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

vi.mock('@/src/contexts/PlanetariumContext', () => ({
  usePlanetarium: () => ({ setPlanetariumMode: vi.fn(), planetariumMode: false }),
}));

vi.mock('@/src/hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: true, loading: false }),
}));

vi.mock('@/src/hooks/useDashboardTour', () => ({
  useDashboardTour: () => ({
    tourStep: 'done' as const,
    next: vi.fn(),
    skip: vi.fn(),
    restart: vi.fn(),
  }),
}));

vi.mock('@/src/hooks/useFirstRunDaily', () => ({
  useFirstRunDaily: () => ({ dailyData: null, showModal: false, handleClose: vi.fn() }),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
        }),
      }),
    }),
  },
}));

vi.mock('@/src/lib/feature-flags', () => ({
  isFeatureEnabled: () => false,
}));

vi.mock('@/src/contexts/FusionRingContext', () => ({
  useFusionRingContext: () => ({
    events: [],
    signal: null,
    masterSignal: null,
    addQuizResult: vi.fn(),
    completedModules: new Set(),
  }),
}));

// ── Heavy component mocks ──────────────────────────────────────────────────
vi.mock('@/src/components/dashboard/BlueprintCard', () => ({
  default: () => <div data-testid="blueprint-card" />,
}));

vi.mock('@/src/components/dashboard/DashboardAstroSection', () => ({
  DashboardAstroSection: () => <div data-testid="astro-section" />,
}));

vi.mock('@/src/components/dashboard/DashboardInterpretationSection', () => ({
  DashboardInterpretationSection: ({ interpretation }: { interpretation: string; isPremium: boolean }) => (
    <div data-testid="interpretation-section">
      <p>{interpretation}</p>
    </div>
  ),
}));

vi.mock('@/src/components/dashboard/AgentSection', () => ({
  AgentSection: () => <div data-testid="agent-section" />,
}));
vi.mock('@/src/contexts/AgentContext', () => ({
  AgentProvider: ({ children }: any) => <>{children}</>,
  useAgent: vi.fn(() => ({ agentStates: {}, activeAgent: null, widgetExpanded: false, startAgent: vi.fn(), stopAgent: vi.fn(), setUpgrading: vi.fn(), setWidgetExpanded: vi.fn() })),
}));

vi.mock('@/src/components/dashboard/TourOverlay', () => ({
  TourOverlay: () => null,
}));

vi.mock('@/src/components/dashboard/SectionErrorBoundary', () => ({
  SectionErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/src/components/ShareCard', () => ({
  ShareCard: () => <div data-testid="share-card" />,
}));

vi.mock('@/src/components/LegalFooter', () => ({
  LegalFooter: () => <div data-testid="legal-footer" />,
}));

vi.mock('@/src/components/ManageSubscription', () => ({
  ManageSubscription: () => <div data-testid="manage-subscription" />,
}));

vi.mock('@/src/components/UpgradeButton', () => ({
  UpgradeButton: () => <button>Upgrade</button>,
}));

import React from 'react';
import { Dashboard } from '@/src/components/Dashboard';

const minimalApiData = {
  western: { zodiac_sign: 'Aries', moon_sign: 'Cancer' },
  bazi: { zodiac_sign: 'Dragon' },
  wuxing: { dominant_element: 'Wood' },
} as any;

const baseProps = {
  interpretation: 'Test interpretation text',
  apiData: minimalApiData,
  userId: 'test-user-id',
  birthDate: '1990-01-01',
  onReset: vi.fn(),
  onRegenerate: vi.fn(),
  isLoading: false,
  apiIssues: [],
  onStopAudio: vi.fn(),
  onResumeAudio: vi.fn(),
};

describe('Dashboard ghost UI cleanup (S-DP-01 to S-DP-04)', () => {
  it('does NOT render "Tour wiederholen" button', () => {
    render(<Dashboard {...baseProps} />);
    expect(screen.queryByText('Tour wiederholen')).toBeNull();
    expect(screen.queryByText('Replay tour')).toBeNull();
  });

  it('does NOT render "Zahlung verwalten" text in the Dashboard top-right menu', () => {
    render(<Dashboard {...baseProps} />);
    // ManageSubscription is mocked — its internal text should not appear in the menu area
    expect(screen.queryByText('Zahlung verwalten')).toBeNull();
  });

  it('does NOT render a "Neustarten" button', () => {
    render(<Dashboard {...baseProps} />);
    expect(screen.queryByText('Neustarten')).toBeNull();
    expect(screen.queryByText('Restart')).toBeNull();
  });

  it('does NOT render the "KI-Synthese" badge heading anywhere in the page', () => {
    render(<Dashboard {...baseProps} />);
    expect(screen.queryByText('KI-Synthese')).toBeNull();
    // Also check via translation key value
    expect(screen.queryByText('dashboard.interpretation.sectionLabel')).toBeNull();
  });
});
