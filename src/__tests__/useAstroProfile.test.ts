import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAstroProfile } from '../hooks/useAstroProfile';
import { parseAstroProfileJson } from '../types/bafe';

// Mock all external services
vi.mock('../services/api', () => ({
  calculateAll: vi.fn().mockResolvedValue({
    bazi: { day_master: 'Jia', zodiac_sign: 'Rat', pillars: undefined },
    western: { zodiac_sign: 'Aries', moon_sign: 'Taurus', ascendant_sign: 'Gemini', houses: {} },
    wuxing: { dominant_element: 'Wood', elements: { Wood: 3, Fire: 2, Earth: 1, Metal: 1, Water: 1 } },
    fusion: {},
    tst: {},
    issues: [],
  }),
}));
vi.mock('../services/gemini', () => ({
  generateInterpretation: vi.fn().mockResolvedValue({
    interpretation: 'Test interpretation',
    tiles: { sun: 'Sun tile' },
    houses: {},
  }),
}));
vi.mock('../services/supabase', () => ({
  fetchAstroProfile: vi.fn().mockResolvedValue(null),
  upsertAstroProfile: vi.fn().mockResolvedValue(undefined),
  insertBirthData: vi.fn().mockResolvedValue(undefined),
  insertNatalChart: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));

const mockUser = { id: 'user-123' } as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAstroProfile', () => {
  it('starts in idle state when no user', () => {
    const { result } = renderHook(() => useAstroProfile(null, 'de'));
    expect(result.current.profileState).toBe('idle');
    expect(result.current.apiData).toBeNull();
  });

  it('transitions to not-found when user has no profile', async () => {
    const { result } = renderHook(() => useAstroProfile(mockUser, 'de'));
    await waitFor(() => {
      expect(result.current.profileState).toBe('not-found');
    });
  });

  it('handleReset clears data in not-found state', async () => {
    const { result } = renderHook(() => useAstroProfile(mockUser, 'de'));
    await waitFor(() => {
      expect(result.current.profileState).toBe('not-found');
    });
    act(() => { result.current.handleReset(); });
    expect(result.current.apiData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handleSubmit sets profileState to found after success', async () => {
    const { result } = renderHook(() => useAstroProfile(mockUser, 'de'));
    await waitFor(() => {
      expect(result.current.profileState).toBe('not-found');
    });
    await act(async () => {
      await result.current.handleSubmit({
        date: '2000-01-01T12:00:00',
        tz: 'Europe/Berlin',
        lat: 52.5,
        lon: 13.4,
      });
    });
    await waitFor(() => {
      expect(result.current.profileState).toBe('found');
      expect(result.current.interpretation).toBe('Test interpretation');
      expect(result.current.isFirstReading).toBe(true);
    });
  });

  it('re-generates interpretation when language changes after profile is loaded', async () => {
    const { generateInterpretation } = await import('../services/gemini');
    const mockGenerate = vi.mocked(generateInterpretation);
    mockGenerate.mockResolvedValue({
      interpretation: 'English interpretation',
      tiles: {},
      houses: {},
    });

    const { result, rerender } = renderHook(
      ({ lang }: { lang: 'de' | 'en' }) => useAstroProfile(mockUser, lang),
      { initialProps: { lang: 'de' as const } }
    );

    // Wait for profile to reach not-found, then submit to reach 'found'
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    await act(async () => {
      await result.current.handleSubmit({
        date: '2000-01-01T12:00:00',
        tz: 'Europe/Berlin',
        lat: 52.5,
        lon: 13.4,
      });
    });
    expect(result.current.profileState).toBe('found');

    const callCountAfterLoad = mockGenerate.mock.calls.length;

    // Switch language — should trigger re-generation
    await act(async () => {
      rerender({ lang: 'en' });
      await new Promise(r => setTimeout(r, 50));
    });

    expect(mockGenerate.mock.calls.length).toBeGreaterThan(callCountAfterLoad);
    expect(result.current.interpretation).toBe('English interpretation');
  });
});

describe('parseAstroProfileJson', () => {
  it('parses v1 flat format', () => {
    const input = {
      version: 1 as const,
      bazi: { day_master: 'Jia', zodiac_sign: 'Rat' },
      western: { zodiac_sign: 'Aries', moon_sign: 'Taurus', ascendant_sign: 'Gemini', houses: {} },
      wuxing: { dominant_element: 'Wood', elements: { Wood: 3 } },
      fusion: {},
      tst: {},
      interpretation: 'Hello',
      tiles: { sun: 'Sun' },
      houses: {},
    };
    const result = parseAstroProfileJson(input);
    expect(result?.interpretation).toBe('Hello');
    expect(result?.apiData.bazi?.day_master).toBe('Jia');
    expect(result?.tiles.sun).toBe('Sun');
  });

  it('parses legacy bafe-nested format', () => {
    const input = {
      bafe: {
        bazi: { day_master: 'Yi', zodiac_sign: 'Ox' },
        western: { zodiac_sign: 'Scorpio', moon_sign: 'Leo', ascendant_sign: 'Virgo', houses: {} },
        wuxing: { dominant_element: 'Fire', elements: {} },
        fusion: {},
        tst: {},
        interpretation: 'Legacy text',
      },
    };
    const result = parseAstroProfileJson(input);
    expect(result?.interpretation).toBe('Legacy text');
    expect(result?.apiData.bazi?.day_master).toBe('Yi');
  });

  it('returns null for null input', () => {
    expect(parseAstroProfileJson(null)).toBeNull();
  });
});
