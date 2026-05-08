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

// ── Why source-level assertions ─────────────────────────────────────
// JSDom's CSSOM rejects CSS Custom Properties (`var(...)`) during inline-
// style normalization. The result is that `getAttribute('style')`,
// `el.style.borderColor`, and `outerHTML` all return values WITHOUT the
// `var()` form — even when React rendered it correctly. Real browsers
// preserve `var()` because Chromium/Firefox/Safari support it natively.
//
// To pin the theme-token contract reliably, we assert against the
// component SOURCE FILE — checking that the JSX literally contains the
// `var(--color-error-*, fallback)` form. This is a static-analysis-style
// test: regression-armor that doesn't depend on JSDom's CSS support.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const componentPath = resolve(
  __dirname,
  '..',
  'components',
  'dashboard',
  'DailyChartHero.tsx',
);
const componentSource = readFileSync(componentPath, 'utf-8');

describe('DailyChartHero error block — theme-token compatibility (F1)', () => {
  // Regex strategy: assert prefix only — `var(--color-error-<token>` followed
  // by word-boundary. Doesn't try to match the closing `)` because nested
  // rgba() parens inside the fallback would require recursive regex.
  // The presence of the prefix is sufficient evidence of the var()-wrapper
  // contract; fallback content is style and out-of-scope for this test.
  it('borderColor uses var(--color-error-border, ...) form in component source', () => {
    expect(componentSource).toMatch(/borderColor:\s*['"]var\(--color-error-border\b/);
  });

  it('background uses var(--color-error-bg, ...) form in component source', () => {
    expect(componentSource).toMatch(/background:\s*['"]var\(--color-error-bg\b/);
  });

  it('error-code color uses var(--color-error-code, ...) form in component source', () => {
    expect(componentSource).toMatch(/color:\s*['"]var\(--color-error-code\b/);
  });

  // Sanity check: the actual element still renders with the testid so the
  // theme-token wrapper doesn't break the JSDom render path
  it('error block still renders correctly under JSDom (sanity)', () => {
    const { container } = render(
      <DailyChartHero
        {...baseProps}
        error={{ code: 'TEST-CODE', message: 'test message' }}
      />,
    );
    expect(container.querySelector('[data-testid="daily-pulse-error"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="daily-pulse-error-code"]')).not.toBeNull();
  });
});
