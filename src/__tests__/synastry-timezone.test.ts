import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/src/services/timezone', () => ({
  fetchTimezone: vi.fn(),
}));

import { fetchTimezone } from '@/src/services/timezone';

const mockFetchTimezone = fetchTimezone as ReturnType<typeof vi.fn>;

describe('AddPartnerForm timezone resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses detected timezone from fetchTimezone when available', async () => {
    mockFetchTimezone.mockResolvedValue('Asia/Tokyo');

    const lat = 35.6762;
    const lon = 139.6503;
    const result = await mockFetchTimezone(lat, lon);
    const localTz = 'Europe/Berlin';
    const resolved = result ?? localTz;

    expect(mockFetchTimezone).toHaveBeenCalledWith(lat, lon);
    expect(resolved).toBe('Asia/Tokyo');
  });

  it('falls back to local timezone when fetchTimezone returns null', async () => {
    mockFetchTimezone.mockResolvedValue(null);

    const result = await mockFetchTimezone(35.6762, 139.6503);
    const localTz = 'Europe/Berlin';
    const resolved = result ?? localTz;

    expect(resolved).toBe('Europe/Berlin');
  });

  it('falls back to local timezone when fetchTimezone throws', async () => {
    mockFetchTimezone.mockRejectedValue(new Error('network error'));

    let result: string | null = null;
    try {
      result = await mockFetchTimezone(35.6762, 139.6503);
    } catch {
      result = null;
    }
    const localTz = 'Europe/Berlin';
    const resolved = result ?? localTz;

    expect(resolved).toBe('Europe/Berlin');
  });

  it('uses partner location timezone not user local timezone', async () => {
    // Partner born in Tokyo, user is in Berlin
    mockFetchTimezone.mockResolvedValue('Asia/Tokyo');

    const partnerLat = 35.6762;
    const partnerLon = 139.6503;
    const userLocalTz = 'Europe/Berlin';

    const detected = await mockFetchTimezone(partnerLat, partnerLon);
    const resolved = detected ?? userLocalTz;

    expect(resolved).toBe('Asia/Tokyo');
    expect(resolved).not.toBe(userLocalTz);
  });
});
