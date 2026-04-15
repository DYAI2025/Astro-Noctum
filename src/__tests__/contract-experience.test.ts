/**
 * contract-experience.test.ts
 *
 * Contract tests for all three Experience API endpoints:
 *   POST /api/experience/bootstrap
 *   POST /api/experience/signature-delta
 *   POST /api/experience/daily
 *
 * Validates request body shapes, Zod schema parsing, and key structural invariants.
 * No network calls — fetch is fully mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock authedFetch — experience.ts depends on it for auth headers
vi.mock('../lib/authedFetch', () => ({
  authedFetch: vi.fn(),
}));

import { authedFetch } from '../lib/authedFetch';
import { bootstrapExperience, signatureDelta, fetchDailyExperience } from '../services/experience';
import {
  BootstrapResponseSchema,
  SignatureDeltaResponseSchema,
  DailyResponseSchema,
} from '../lib/schemas/experience';

const mockAuthedFetch = vi.mocked(authedFetch);

// ── Response fixtures ─────────────────────────────────────────────────────────

const VALID_BOOTSTRAP = {
  profile: {
    sun_sign: 'Leo',
    moon_sign: 'Scorpio',
    ascendant_sign: 'Aquarius',
    day_master: 'Yi',
    harmony_index: 0.72,
  },
  soulprint_sectors: Array(12).fill(0).map((_, i) => 0.5 + i * 0.03),
  narratives: {
    core_summary: 'A determined yet flexible energy.',
    context_summary: 'Harvest season amplifies Wood energy.',
    integration_summary: 'Balance intuition with structure.',
  },
  signature_blueprint: {
    seed: 'leo-yi-2026',
    visual: { symmetry: 0.6, curvature: 0.4, angularity: 0.3, density: 0.7, contrast: 0.5, orbit_count: 5 },
    elements: { Wood: 3, Fire: 2, Earth: 1 },
  },
  meta: { engine_version: '2.1.0', generated_at: '2026-04-13T08:00:00Z' },
  soulprint_saved: true,
};

const VALID_DELTA = {
  quiz_sectors: Array(12).fill(0.6),
  narratives: {
    core_summary: 'Expressive fire drives your week.',
    context_summary: 'Current transits align with Leo ascendant.',
    integration_summary: 'Channel fire into focused work.',
  },
  signature_delta: { curvature: 0.1, contrast: 0.05, density: -0.02 },
  signature_blueprint: {
    seed: 'leo-yi-2026-v2',
    elements: { Wood: 2, Fire: 4 },
  },
};

const VALID_DAILY = {
  date: '2026-04-13',
  western: {
    summary: 'Sun in Aries activates your seventh house.',
    themes: ['partnership', 'clarity'],
    caution: 'Avoid confrontation today.',
    opportunity: 'Strengthen existing bonds.',
    evidence: { natal_focus: ['Sun', 'Venus'], day_master: 'Yi' },
  },
  eastern: {
    summary: 'Bing fire day master resonates.',
    themes: ['action', 'light'],
    caution: 'Fire can burn too bright.',
    opportunity: 'Illuminate creative projects.',
    evidence: { daily_pillar: { stem: 'Bing', branch: 'Chen' } },
  },
  fusion: {
    summary: 'Strong forward momentum.',
    synthesis: 'Fire and Wood work together.',
    action: 'Take initiative on a pending project.',
    pushworthy: true,
    push_text: 'Push today!',
    harmony_index: 0.85,
    day_mode: 'pulse' as const,
  },
  meta: { engine_version: '2.1.0' },
};

// ── bootstrapExperience ───────────────────────────────────────────────────────

describe('bootstrapExperience — request contract', () => {
  beforeEach(() => {
    mockAuthedFetch.mockResolvedValue({
      ok: true,
      json: async () => VALID_BOOTSTRAP,
    } as Response);
  });
  afterEach(() => { vi.clearAllMocks(); });

  it('sends POST to /api/experience/bootstrap', async () => {
    await bootstrapExperience({ date: '1990-04-15', time: '08:30', tz: 'Europe/Berlin', lat: 52.5, lon: 13.4 });
    expect(mockAuthedFetch).toHaveBeenCalledWith('/api/experience/bootstrap', expect.objectContaining({ method: 'POST' }));
  });

  it('sends { birth, locale } body', async () => {
    const birth = { date: '1990-04-15', time: '08:30', tz: 'Europe/Berlin', lat: 52.5, lon: 13.4 };
    await bootstrapExperience(birth, 'de-DE');

    const callArgs = mockAuthedFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body).toHaveProperty('birth');
    expect(body.birth).toMatchObject(birth);
    expect(body).toHaveProperty('locale', 'de-DE');
  });

  it('birth object includes date, time, tz, lat, lon', async () => {
    const birth = { date: '1990-04-15', time: '08:30', tz: 'Europe/Berlin', lat: 52.5, lon: 13.4 };
    await bootstrapExperience(birth);

    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.birth.date).toBe('1990-04-15');
    expect(body.birth.time).toBe('08:30');
    expect(body.birth.tz).toBe('Europe/Berlin');
    expect(body.birth.lat).toBe(52.5);
    expect(body.birth.lon).toBe(13.4);
  });

  it('uses de-DE as default locale when not specified', async () => {
    await bootstrapExperience({ date: '1990-04-15', time: '08:30', tz: 'UTC', lat: 0, lon: 0 });
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.locale).toBe('de-DE');
  });

  it('optionally includes place_label in birth', async () => {
    await bootstrapExperience({
      date: '1990-04-15', time: '08:30', tz: 'UTC', lat: 52.5, lon: 13.4, place_label: 'Berlin, DE',
    });
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.birth.place_label).toBe('Berlin, DE');
  });
});

describe('bootstrapExperience — response schema', () => {
  it('parses valid bootstrap response without throwing', () => {
    expect(() => BootstrapResponseSchema.parse(VALID_BOOTSTRAP)).not.toThrow();
  });

  it('parsed profile has required fields', () => {
    const parsed = BootstrapResponseSchema.parse(VALID_BOOTSTRAP);
    expect(parsed.profile.sun_sign).toBe('Leo');
    expect(parsed.profile.harmony_index).toBeGreaterThanOrEqual(0);
    expect(parsed.profile.harmony_index).toBeLessThanOrEqual(1);
  });

  it('soulprint_sectors is always length 12', () => {
    const parsed = BootstrapResponseSchema.parse(VALID_BOOTSTRAP);
    expect(parsed.soulprint_sectors).toHaveLength(12);
  });

  it('rejects soulprint_sectors with wrong length', () => {
    const bad = { ...VALID_BOOTSTRAP, soulprint_sectors: Array(11).fill(0.5) };
    expect(() => BootstrapResponseSchema.parse(bad)).toThrow();
  });

  it('rejects harmony_index > 1', () => {
    const bad = { ...VALID_BOOTSTRAP, profile: { ...VALID_BOOTSTRAP.profile, harmony_index: 1.1 } };
    expect(() => BootstrapResponseSchema.parse(bad)).toThrow();
  });
});

// ── signatureDelta ────────────────────────────────────────────────────────────

describe('signatureDelta — request contract', () => {
  beforeEach(() => {
    mockAuthedFetch.mockResolvedValue({
      ok: true,
      json: async () => VALID_DELTA,
    } as Response);
  });
  afterEach(() => { vi.clearAllMocks(); });

  it('sends POST to /api/experience/signature-delta', async () => {
    await signatureDelta(Array(12).fill(0.5), { seed: 'test-seed' }, 'Feuer');
    expect(mockAuthedFetch).toHaveBeenCalledWith('/api/experience/signature-delta', expect.objectContaining({ method: 'POST' }));
  });

  it('sends quiz_answer as array of { id, weight } objects', async () => {
    await signatureDelta(Array(12).fill(0.5), { seed: 'test-seed' }, 'Feuer');

    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(Array.isArray(body.quiz_answer)).toBe(true);
    expect(body.quiz_answer).toHaveLength(1);
    expect(body.quiz_answer[0]).toMatchObject({ id: 'Feuer', weight: 1.0 });
  });

  it('quiz_answer id equals the keyword argument', async () => {
    await signatureDelta(Array(12).fill(0.5), { seed: 's' }, 'Erde');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.quiz_answer[0].id).toBe('Erde');
  });

  it('quiz_answer weight is numeric 1.0', async () => {
    await signatureDelta(Array(12).fill(0.5), { seed: 's' }, 'Wasser');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(typeof body.quiz_answer[0].weight).toBe('number');
    expect(body.quiz_answer[0].weight).toBe(1.0);
  });

  it('sends soulprint_sectors array (12 elements)', async () => {
    const sectors = Array(12).fill(0.7);
    await signatureDelta(sectors, { seed: 's' }, 'Holz');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.soulprint_sectors).toEqual(sectors);
  });

  it('sends signature_blueprint with seed', async () => {
    await signatureDelta(Array(12).fill(0.5), { seed: 'my-seed' }, 'Holz');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.signature_blueprint.seed).toBe('my-seed');
  });
});

describe('signatureDelta — response schema', () => {
  it('parses valid delta response without throwing', () => {
    expect(() => SignatureDeltaResponseSchema.parse(VALID_DELTA)).not.toThrow();
  });

  it('quiz_sectors is length 12', () => {
    const parsed = SignatureDeltaResponseSchema.parse(VALID_DELTA);
    expect(parsed.quiz_sectors).toHaveLength(12);
  });

  it('signature_delta has curvature, contrast, density fields', () => {
    const parsed = SignatureDeltaResponseSchema.parse(VALID_DELTA);
    expect(typeof parsed.signature_delta.curvature).toBe('number');
    expect(typeof parsed.signature_delta.contrast).toBe('number');
    expect(typeof parsed.signature_delta.density).toBe('number');
  });
});

// ── fetchDailyExperience ─────────────────────────────────────────────────────

describe('fetchDailyExperience — request contract', () => {
  const BIRTH = { date: '1990-04-15', time: '08:30', tz: 'Europe/Berlin', lat: 52.5, lon: 13.4 };
  const SOULPRINT = Array(12).fill(0.5);
  const QUIZ = Array(12).fill(0.6);

  beforeEach(() => {
    mockAuthedFetch.mockResolvedValue({
      ok: true,
      json: async () => VALID_DAILY,
    } as Response);
  });
  afterEach(() => { vi.clearAllMocks(); });

  it('sends POST to /api/experience/daily', async () => {
    await fetchDailyExperience(BIRTH, SOULPRINT, QUIZ, '2026-04-13');
    expect(mockAuthedFetch).toHaveBeenCalledWith('/api/experience/daily', expect.objectContaining({ method: 'POST' }));
  });

  it('sends birth, soulprint_sectors, quiz_sectors, target_date in body', async () => {
    await fetchDailyExperience(BIRTH, SOULPRINT, QUIZ, '2026-04-13');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);

    expect(body.birth).toMatchObject(BIRTH);
    expect(body.soulprint_sectors).toEqual(SOULPRINT);
    expect(body.quiz_sectors).toEqual(QUIZ);
    expect(body.target_date).toBe('2026-04-13');
  });

  it('sends locale (defaults to de-DE)', async () => {
    await fetchDailyExperience(BIRTH, SOULPRINT, QUIZ, '2026-04-13');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.locale).toBe('de-DE');
  });

  it('sends custom locale when provided', async () => {
    await fetchDailyExperience(BIRTH, SOULPRINT, QUIZ, '2026-04-13', 'en-US');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.locale).toBe('en-US');
  });

  it('sends transit_influences array (empty by default)', async () => {
    await fetchDailyExperience(BIRTH, SOULPRINT, QUIZ, '2026-04-13');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(Array.isArray(body.transit_influences)).toBe(true);
    expect(body.transit_influences).toHaveLength(0);
  });

  it('sends provided transit_influences with planet/aspectDeg/fieldStrength/isResonant', async () => {
    const influences = [{ planet: 'Mars', aspectDeg: 90, fieldStrength: 0.8, isResonant: false }];
    await fetchDailyExperience(BIRTH, SOULPRINT, QUIZ, '2026-04-13', 'de-DE', influences);
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.transit_influences[0]).toMatchObject({ planet: 'Mars', aspectDeg: 90 });
  });

  it('sends birth_sign when provided', async () => {
    await fetchDailyExperience(BIRTH, SOULPRINT, QUIZ, '2026-04-13', 'de-DE', [], 'Leo');
    const body = JSON.parse(mockAuthedFetch.mock.calls[0][1]?.body as string);
    expect(body.birth_sign).toBe('Leo');
  });
});

describe('fetchDailyExperience — response schema', () => {
  it('parses valid daily response without throwing', () => {
    expect(() => DailyResponseSchema.parse(VALID_DAILY)).not.toThrow();
  });

  it('response has date, western, eastern, fusion, meta', () => {
    const parsed = DailyResponseSchema.parse(VALID_DAILY);
    expect(parsed.date).toBe('2026-04-13');
    expect(parsed.western).toBeDefined();
    expect(parsed.eastern).toBeDefined();
    expect(parsed.fusion).toBeDefined();
    expect(parsed.meta).toBeDefined();
  });

  it('fusion.day_mode is either pulse or trace', () => {
    const parsed = DailyResponseSchema.parse(VALID_DAILY);
    expect(['pulse', 'trace']).toContain(parsed.fusion.day_mode);
  });

  it('fusion.harmony_index is 0–1', () => {
    const parsed = DailyResponseSchema.parse(VALID_DAILY);
    expect(parsed.fusion.harmony_index).toBeGreaterThanOrEqual(0);
    expect(parsed.fusion.harmony_index).toBeLessThanOrEqual(1);
  });

  it('rejects invalid day_mode value', () => {
    const bad = { ...VALID_DAILY, fusion: { ...VALID_DAILY.fusion, day_mode: 'strobe' } };
    expect(() => DailyResponseSchema.parse(bad)).toThrow();
  });

  it('resonance_badges is optional', () => {
    const withoutBadges = { ...VALID_DAILY };
    // Should parse without resonance_badges
    expect(() => DailyResponseSchema.parse(withoutBadges)).not.toThrow();
  });

  it('resonance_badges parsed correctly when present', () => {
    const withBadges = {
      ...VALID_DAILY,
      resonance_badges: [
        { type: 'transit', label: 'Mars aktiv', intensity: 'hoch', color: '#FF0000' },
      ],
    };
    const parsed = DailyResponseSchema.parse(withBadges);
    expect(parsed.resonance_badges).toHaveLength(1);
    expect(parsed.resonance_badges![0].type).toBe('transit');
  });

  it('rejects resonance_badge with invalid intensity', () => {
    const bad = {
      ...VALID_DAILY,
      resonance_badges: [{ type: 'transit', label: 'Test', intensity: 'extreme', color: '#000' }],
    };
    expect(() => DailyResponseSchema.parse(bad)).toThrow();
  });
});
