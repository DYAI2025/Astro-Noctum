import { BootstrapResponseSchema, SignatureDeltaResponseSchema, DailyResponseSchema } from '../lib/schemas/experience';
import type { BootstrapResponse, SignatureDeltaResponse, DailyResponse } from '../lib/schemas/experience';
import { authedFetch } from '../lib/authedFetch';

export async function bootstrapExperience(birth: {
  date: string; time: string; tz: string; lat: number; lon: number; place_label?: string;
}, locale = 'de-DE'): Promise<BootstrapResponse> {
  const resp = await authedFetch('/api/experience/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birth, locale }),
  });
  if (!resp.ok) throw new Error(`Bootstrap failed: ${resp.status}`);
  return BootstrapResponseSchema.parse(await resp.json());
}

export async function signatureDelta(
  soulprintSectors: number[],
  signatureBlueprint: { seed: string; visual?: any; elements?: Record<string, number> },
  keyword: string,
): Promise<SignatureDeltaResponse> {
  const resp = await authedFetch('/api/experience/signature-delta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      soulprint_sectors: soulprintSectors,
      signature_blueprint: signatureBlueprint,
      quiz_answer: [{ id: keyword, weight: 1.0 }],
    }),
  });
  if (!resp.ok) throw new Error(`Signature delta failed: ${resp.status}`);
  return SignatureDeltaResponseSchema.parse(await resp.json());
}

export interface TransitInfluenceInput {
  planet: string;
  aspectDeg: number;
  fieldStrength: number;
  isResonant: boolean;
}

export async function fetchDailyExperience(
  birth: { date: string; time: string; tz: string; lat: number; lon: number },
  soulprintSectors: number[],
  quizSectors: number[],
  targetDate: string,
  locale = 'de-DE',
  transitInfluences: TransitInfluenceInput[] = [],
  birthSign = '',
  options?: { signal?: AbortSignal },
): Promise<DailyResponse> {
  const resp = await authedFetch('/api/experience/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth,
      soulprint_sectors: soulprintSectors,
      quiz_sectors: quizSectors,
      target_date: targetDate,
      locale,
      transit_influences: transitInfluences,
      birth_sign: birthSign,
    }),
    signal: options?.signal,
  });
  if (!resp.ok) throw new Error(`Daily horoscope failed: ${resp.status}`);
  return DailyResponseSchema.parse(await resp.json());
}
