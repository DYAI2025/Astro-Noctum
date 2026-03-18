import { authedFetch } from './api';
import {
  BootstrapResponseSchema,
  DailyResponseSchema,
  type BootstrapResponse,
  type DailyResponse,
} from '@bazodiac/shared';

export async function fetchDailyHoroscope(
  birth: { date: string; time: string; tz: string; lat: number; lon: number },
  soulprintSectors: number[],
  quizSectors: number[],
  targetDate: string,
): Promise<DailyResponse> {
  const resp = await authedFetch('/api/experience/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth,
      soulprint_sectors: soulprintSectors,
      quiz_sectors: quizSectors,
      target_date: targetDate,
      locale: 'de-DE',
    }),
  });
  if (!resp.ok) throw new Error(`Daily horoscope failed: ${resp.status}`);
  return DailyResponseSchema.parse(await resp.json());
}

export async function fetchBootstrap(
  birth: { date: string; time: string; tz: string; lat: number; lon: number; place_label?: string },
): Promise<BootstrapResponse> {
  const resp = await authedFetch('/api/experience/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birth, locale: 'de-DE' }),
  });
  if (!resp.ok) throw new Error(`Bootstrap failed: ${resp.status}`);
  return BootstrapResponseSchema.parse(await resp.json());
}
