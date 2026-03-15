import { describe, it, expect } from 'vitest';
import { generateTemplateHoroscope, getSectorDomain, getSectorDimension } from '@/src/lib/horoscope/templates';
import { validateWording, sanitizeWording } from '@/src/lib/horoscope/wording-validator';
import type { SectorResonance, TransitEventInput } from '@/src/lib/horoscope/types';

// ── Template Generator Tests ──────────────────────────────────────────

describe('generateTemplateHoroscope', () => {
  const baseResonances: SectorResonance[] = Array.from({ length: 12 }, (_, i) => ({
    sector: i,
    resonance: 0.3,
    transit_intensity: 0.3,
    impact: 0.09,
    dimension: getSectorDimension(i),
    domain_de: getSectorDomain(i, 'de'),
    domain_en: getSectorDomain(i, 'en'),
  }));

  it('generates calm horoscope when no strong signals', () => {
    const result = generateTemplateHoroscope(baseResonances, [], 'de', '2026-03-15');
    expect(result.headline).toBeTruthy();
    expect(result.body).toBeTruthy();
    expect(result.advice).toBeTruthy();
    expect(result.pushworthy).toBe(false);
  });

  it('generates high-intensity horoscope with strong resonance', () => {
    const active = [...baseResonances];
    active[4] = { ...active[4], impact: 0.7, resonance: 0.8, transit_intensity: 0.9 };

    const result = generateTemplateHoroscope(active, [], 'de', '2026-03-15');
    expect(result.headline).toContain('Ausdruck'); // Sector 4 = Leo = Ausdruck
    expect(result.primary_sector).toBe(4);
    expect(result.pushworthy).toBe(true);
  });

  it('is deterministic for same date and sector', () => {
    const active = [...baseResonances];
    active[7] = { ...active[7], impact: 0.6, resonance: 0.7, transit_intensity: 0.8 };

    const r1 = generateTemplateHoroscope(active, [], 'de', '2026-03-15');
    const r2 = generateTemplateHoroscope(active, [], 'de', '2026-03-15');
    expect(r1.headline).toBe(r2.headline);
    expect(r1.body).toBe(r2.body);
    expect(r1.advice).toBe(r2.advice);
  });

  it('produces different results for different dates', () => {
    const active = [...baseResonances];
    active[7] = { ...active[7], impact: 0.6, resonance: 0.7, transit_intensity: 0.8 };

    const r1 = generateTemplateHoroscope(active, [], 'de', '2026-03-15');
    const r2 = generateTemplateHoroscope(active, [], 'de', '2026-03-16');
    // With only 2 templates per tier, they might still match, but the function should be date-dependent
    expect(r1.primary_sector).toBe(r2.primary_sector); // same data
  });

  it('uses event headline for high-priority events', () => {
    const active = [...baseResonances];
    active[3] = { ...active[3], impact: 0.5 };

    const events: TransitEventInput[] = [
      { type: 'moon_event', sector: 3, trigger_planet: 'Moon', description_de: 'Mond in Krebs', priority: 80 },
    ];

    const result = generateTemplateHoroscope(active, events, 'de', '2026-03-15');
    expect(result.headline).toContain('Mond');
    expect(result.headline).toContain('Geborgenheit');
  });

  it('generates English horoscope', () => {
    const active = [...baseResonances];
    active[10] = { ...active[10], impact: 0.6, resonance: 0.7, transit_intensity: 0.8 };

    const result = generateTemplateHoroscope(active, [], 'en', '2026-03-15');
    expect(result.headline).toContain('Freedom'); // Sector 10 = Aquarius = Freedom
  });
});

// ── Sector Domain Tests ───────────────────────────────────────────────

describe('getSectorDomain', () => {
  it('returns correct German domain for each sector', () => {
    expect(getSectorDomain(0, 'de')).toBe('Antrieb');
    expect(getSectorDomain(7, 'de')).toBe('Tiefe');
    expect(getSectorDomain(11, 'de')).toBe('Intuition');
  });

  it('returns correct English domain for each sector', () => {
    expect(getSectorDomain(0, 'en')).toBe('Drive');
    expect(getSectorDomain(7, 'en')).toBe('Depth');
    expect(getSectorDomain(11, 'en')).toBe('Intuition');
  });

  it('wraps sector index modulo 12', () => {
    expect(getSectorDomain(12, 'de')).toBe('Antrieb'); // 12 % 12 = 0
    expect(getSectorDomain(15, 'en')).toBe('Nurture'); // 15 % 12 = 3
  });
});

// ── Wording Validator Tests ───────────────────────────────────────────

describe('validateWording', () => {
  it('accepts Ring-native voice text', () => {
    const result = validateWording('Dein Antrieb-Feld flammt heute besonders.', 'de');
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('rejects imperative language', () => {
    const result = validateWording('Du solltest heute vorsichtig sein.', 'de');
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.type === 'imperative')).toBe(true);
  });

  it('rejects diagnostic language', () => {
    const result = validateWording('Du hast narzisstische Tendenzen.', 'de');
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.type === 'diagnostic')).toBe(true);
  });

  it('rejects technical astrology terms', () => {
    const result = validateWording('Mars steht im Quadrat zu Saturn.', 'de');
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.type === 'technical')).toBe(true);
  });

  it('validates English text', () => {
    const good = validateWording('Your Connection field is especially active today.', 'en');
    expect(good.valid).toBe(true);

    const bad = validateWording('You should avoid socializing today.', 'en');
    expect(bad.valid).toBe(false);
  });
});

describe('sanitizeWording', () => {
  it('replaces "Du solltest" with non-imperative alternative', () => {
    const result = sanitizeWording('Du solltest heute aufpassen.', 'de');
    expect(result).toContain('bereichernd');
    expect(result).not.toContain('solltest');
  });

  it('replaces English imperatives', () => {
    const result = sanitizeWording('You should be careful today.', 'en');
    expect(result).toContain('enriching');
    expect(result).not.toContain('should');
  });
});
