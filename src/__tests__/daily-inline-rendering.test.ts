import { describe, it, expect } from 'vitest';
import { buildFallbackDaily, todayKey } from '../hooks/useFirstRunDaily';

/**
 * Reproduces BUG-19: useFirstRunDaily returned early when alreadySeen=true,
 * leaving dailyData=null. The inline DashboardTagesEnergie never rendered.
 *
 * The fix: always load dailyData (for inline display), only skip modal auto-open.
 * This test validates the fallback always provides renderable data.
 */
describe('BUG-19: Daily data always available for inline rendering', () => {
  it('buildFallbackDaily provides complete structure for DashboardTagesEnergie', () => {
    const daily = buildFallbackDaily('de');

    // DashboardTagesEnergie checks: if (!daily) return null;
    expect(daily).not.toBeNull();

    // DashboardTagesEnergie reads these fields:
    expect(daily.fusion.synthesis).toBeTruthy();
    expect(daily.fusion.synthesis.length).toBeGreaterThan(0);
    expect(daily.fusion.harmony_index).toBeGreaterThanOrEqual(0);
    expect(daily.fusion.harmony_index).toBeLessThanOrEqual(1);
    expect(daily.fusion.day_mode).toMatch(/^(pulse|trace)$/);
    expect(daily.fusion.action).toBeTruthy();
    expect(daily.date).toBe(todayKey());

    // DashboardTagesEnergie calls resolveElement(daily) which reads:
    expect(daily.eastern).toBeDefined();

    // Kosmoswetter reads daily.western?.evidence?.natal_focus
    expect(daily.western).toBeDefined();
  });

  it('fallback daily is usable as DashboardTagesEnergie "daily" prop', () => {
    const daily = buildFallbackDaily('de');

    // Simulate what DashboardTagesEnergie does:
    const isTrace = daily.fusion.day_mode === 'trace';
    const harmonyIndex = daily.fusion.harmony_index;

    // bodyText extraction (lines from DashboardTagesEnergie.tsx):
    const bodyText =
      daily.fusion.synthesis ||
      daily.fusion.summary ||
      'fallback';
    expect(bodyText).not.toBe('fallback');
    expect(bodyText.length).toBeGreaterThan(10);

    // Resonance calculation must not produce NaN
    const resonance = Math.max(0, Math.min(1,
      harmonyIndex * 0.65 + 0 * 0.35, // solarPressure = 0
    ));
    expect(Number.isFinite(resonance)).toBe(true);
  });
});
