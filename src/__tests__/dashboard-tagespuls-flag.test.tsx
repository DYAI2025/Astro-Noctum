// src/__tests__/dashboard-tagespuls-flag.test.tsx
//
// Phase F — Dashboard ↔ TagespulsCard mount + feature-flag gating.
//
// Three guarantees:
//   TPF-001  TagespulsCard is mounted by default (flag default = true).
//   TPF-002  TagespulsCard is hidden when the flag is overridden to false
//            via `localStorage.setItem('ff_tagespuls_neu_v1', 'false')`.
//   TPF-003  TagespulsCard renders ABOVE DailyChartHero in Dashboard.tsx
//            (source-text order check, mirrors dashboard-section-order.test).
//
// Why source-text + isolated-mount instead of full-Dashboard render:
//   The Dashboard component pulls in 40+ contexts/hooks (auth, language,
//   premium, sky/space-weather, planetarium, fusion-ring, useFirstRunDaily,
//   useActiveImpacts, useDashboardTour, useCelestialOrrery, useDeviceLocation,
//   ...). Mocking all of them for a flag-gating contract test is overkill.
//   The flag invariant is provable from the source + a TagespulsCard render.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── TPF-001 / TPF-002 mocks: render TagespulsCard with the real
// `isFeatureEnabled` so we can flip the localStorage override. The card
// itself depends on useDailyPulse + useLanguage; both are mocked.
// ────────────────────────────────────────────────────────────────────────

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de' as const,
    setLang: vi.fn(),
    t: (k: string) => k,
  }),
}));

vi.mock('@/src/hooks/useDailyPulse', () => ({
  useDailyPulse: () => ({
    pulse: null,
    loading: true, // skeleton path → tagespuls-card-skeleton has its own
                  // testid; the mounted/not-mounted distinction is what
                  // TPF-001/002 actually assert.
    error: null,
    refresh: vi.fn(),
    selectedFigure: null,
    interpretation: null,
    loadingInterpretation: false,
    interpretationError: null,
    selectCouncilFigure: vi.fn(),
  }),
}));

import { isFeatureEnabled } from '@/src/lib/feature-flags';
import { TagespulsCard } from '@/src/components/dashboard/TagespulsCard';

describe('Dashboard ↔ TagespulsCard mount (Phase F)', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('TPF-001: TagespulsCard is mounted by default (flag default = true)', () => {
    expect(isFeatureEnabled('tagespuls_neu_v1')).toBe(true);

    // Simulate the dashboard gate: render TagespulsCard only when the flag
    // is enabled. With no localStorage override, the flag is true, so the
    // card mounts. Loading=true → skeleton renders.
    if (isFeatureEnabled('tagespuls_neu_v1')) {
      render(<TagespulsCard />);
    }

    expect(screen.getByTestId('tagespuls-card-skeleton')).toBeInTheDocument();
  });

  it('TPF-002: TagespulsCard is hidden when flag is overridden to false via localStorage', () => {
    localStorage.setItem('ff_tagespuls_neu_v1', 'false');
    expect(isFeatureEnabled('tagespuls_neu_v1')).toBe(false);

    // Mirror the dashboard gate: when the flag is off, nothing mounts.
    if (isFeatureEnabled('tagespuls_neu_v1')) {
      render(<TagespulsCard />);
    }

    // Neither the card nor its skeleton should be in the DOM.
    expect(screen.queryByTestId('tagespuls-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tagespuls-card-skeleton')).not.toBeInTheDocument();
  });

  it('TPF-003: TagespulsCard renders ABOVE DailyChartHero in Dashboard.tsx', async () => {
    // Source-text check (matches dashboard-section-order.test.tsx pattern):
    // the Tagespuls block must precede the DailyChartHero block by source
    // position in Dashboard.tsx. Two anchors:
    //   - "TAGESPULS" comment header
    //   - "DAILY CHART HERO" comment header
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    const tagespulsIdx = source.indexOf('TAGESPULS');
    const heroIdx = source.indexOf('DAILY CHART HERO');

    expect(tagespulsIdx, 'TAGESPULS marker should exist').toBeGreaterThan(-1);
    expect(heroIdx, 'DAILY CHART HERO marker should exist').toBeGreaterThan(-1);
    expect(
      tagespulsIdx,
      'TAGESPULS should appear before DAILY CHART HERO in Dashboard.tsx',
    ).toBeLessThan(heroIdx);

    // Also verify the gating expression and prop wiring are intact.
    expect(source).toContain("isFeatureEnabled('tagespuls_neu_v1')");
    expect(source).toContain('<TagespulsCard onCompleteProfile={onReset} />');
  });
});
