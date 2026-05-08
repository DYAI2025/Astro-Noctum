/**
 * F1 of docs/plans/2026-05-09-sustainable-findings-cleanup.md
 *
 * Pins that the DailyChartHero error block's inline color values are
 * wrapped in `var(--color-error-*, fallback)` form so future theme
 * tokens can override them without touching the component.
 *
 * Initial state: RED. The current implementation uses raw `rgba(...)`
 * and `rgb(...)` literals (Task 1.10 commit `238bb0d`). The fix wraps
 * them in `var()` form — the visual output is unchanged today (fallback
 * matches the prior literal), but if the theme adds `--color-error-bg`
 * etc. later, the error block automatically picks them up.
 *
 * Per project doctrine 2026-05-08: errors must remain visibly distinct
 * from the rest of the UI; the var() form preserves that guarantee
 * across theme changes.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';
import type { TransitEvent } from '@/src/lib/schemas/transit-state';

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const }),
}));
vi.mock('@/src/components/shared/ActiveImpactsList', () => ({
  ActiveImpactsList: () => null,
}));

import { DailyChartHero, type DailyChartHeroProps } from '@/src/components/dashboard/DailyChartHero';

const stubSpaceWeather = {
  kpIndex: 2,
  solarPressure: 0.3,
  events: [],
  alerts: [],
  loading: false,
  error: null,
} as unknown as SpaceWeatherState;

const baseProps: DailyChartHeroProps = {
  loading: false,
  baseCoherence: 50,
  positiveDailyDelta: 0,
  displayedCoherence: 50,
  spaceWeather: stubSpaceWeather,
  transitEvents: [] as TransitEvent[],
  dayMode: 'pulse',
  birthSign: 'Aries',
  impulsText: undefined,
  profileIncomplete: false,
  error: null,
};

describe('DailyChartHero error block — theme-token compatibility (F1)', () => {
  it('inline border + background styles are wrapped in var() form', () => {
    const { container } = render(
      <DailyChartHero
        {...baseProps}
        error={{ code: 'TEST-CODE', message: 'test message' }}
      />,
    );
    const errorSection = container.querySelector('[data-testid="daily-pulse-error"]');
    expect(errorSection).not.toBeNull();
    const innerBlock = errorSection!.querySelector('div');
    expect(innerBlock).not.toBeNull();
    const inlineStyle = innerBlock!.getAttribute('style') ?? '';
    // Both color props MUST use var(...) so future theme tokens can override
    expect(inlineStyle, 'borderColor should be var()-wrapped').toMatch(/border[a-z-]*:\s*var\(/i);
    expect(inlineStyle, 'background should be var()-wrapped').toMatch(/background[a-z-]*:\s*var\(/i);
  });

  it('error code text color is wrapped in var() form', () => {
    const { container } = render(
      <DailyChartHero
        {...baseProps}
        error={{ code: 'TEST-CODE', message: 'test message' }}
      />,
    );
    const codeEl = container.querySelector('[data-testid="daily-pulse-error-code"]');
    expect(codeEl).not.toBeNull();
    const codeStyle = codeEl!.getAttribute('style') ?? '';
    expect(codeStyle, 'error-code color should be var()-wrapped').toMatch(/color:\s*var\(/i);
  });
});
