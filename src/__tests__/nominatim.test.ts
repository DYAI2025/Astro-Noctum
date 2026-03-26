import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchNominatim } from '../services/nominatim';

describe('searchNominatim', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty array for short queries', async () => {
    const results = await searchNominatim('ab');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty string', async () => {
    const results = await searchNominatim('');
    expect(results).toEqual([]);
  });

  it('fetches from Nominatim API with correct params', async () => {
    const mockResults = [
      { display_name: 'Berlin, Germany', lat: '52.5200', lon: '13.4050' },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    } as Response);

    const results = await searchNominatim('Berlin');

    expect(fetch).toHaveBeenCalledOnce();
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain('nominatim.openstreetmap.org/search');
    expect(url).toContain('q=Berlin');
    expect(url).toContain('limit=5');
    expect(results).toEqual(mockResults);
  });

  it('returns empty array on fetch error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    const results = await searchNominatim('Berlin');
    expect(results).toEqual([]);
  });
});
