import { z } from 'zod';
import type { DayMode } from './mode';

export const AphorismRecordSchema = z.object({
  id: z.string(),
  status: z.literal('approved'),
  text: z.object({ de: z.string(), en: z.string(), original: z.string().nullable().optional() }),
  source: z.object({
    author: z.string(), work: z.string().nullable(), year: z.number().nullable(),
    original_language: z.string(),
    translator_de: z.string().nullable(), translator_en: z.string().nullable(),
  }),
  copyright: z.string(),
  attribution_status: z.string(),
  attribution_note: z.string().nullable().optional(),
  mode_tags: z.array(z.string()),
  tone_tags: z.array(z.string()),
  element_affinity: z.array(z.string()),
  figure_affinity: z.array(z.string()),
  season_affinity: z.array(z.string()),
  word_count_de: z.number(), word_count_en: z.number(),
  quality_rating: z.number(),
  first_used: z.string().nullable(),
  cooldown_days: z.number(),
});
export type AphorismRecord = z.infer<typeof AphorismRecordSchema>;

interface Hints {
  dominantElement?: string;
  season?: string;
  selectedFigure?: string;
  /** Required for the trace+intensity tone bump (spec §7 line 126). */
  intensity?: number;
}

/** Spec §7 line 121 — entries are blocked while their cooldown window is open. */
function isOnCooldown(a: AphorismRecord, today: string): boolean {
  if (!a.first_used || !a.cooldown_days || a.cooldown_days <= 0) return false;
  const last = Date.parse(a.first_used);
  const now = Date.parse(today);
  if (Number.isNaN(last) || Number.isNaN(now)) return false;
  const daysElapsed = (now - last) / 86400000;
  return daysElapsed < a.cooldown_days;
}

function fnv1a(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function selectDailyAphorism(
  pool: AphorismRecord[],
  userId: string,
  date: string,
  mode: DayMode,
  hints: Hints = {},
): AphorismRecord {
  const eligible = pool.filter(
    a => a.status === 'approved' && a.mode_tags.includes(mode) && !isOnCooldown(a, date),
  );
  if (eligible.length === 0) throw new Error(`No approved aphorism for mode=${mode}`);

  const scored = eligible.map(a => {
    let score = a.quality_rating;
    if (hints.dominantElement && a.element_affinity.includes(hints.dominantElement)) score += 2;
    if (hints.season && a.season_affinity.includes(hints.season)) score += 1;
    if (hints.selectedFigure && a.figure_affinity.includes(hints.selectedFigure as any)) score += 1;
    // Spec §7 line 126: trace + intensity > 0.7 + sharp/urgent tone → 1.2x multiplier.
    // Spec uses ASCII transliteration "draengend"; fallback pool uses "drängend" — match both.
    if (
      mode === 'trace' &&
      hints.intensity !== undefined &&
      hints.intensity > 0.7 &&
      (a.tone_tags.includes('scharf') || a.tone_tags.includes('drängend') || a.tone_tags.includes('draengend'))
    ) {
      score *= 1.2;
    }
    return { score, a };
  });
  scored.sort((x, y) => y.score - x.score || x.a.id.localeCompare(y.a.id));
  // Spec §7 line 128: pick deterministic from top 5.
  const top = scored.slice(0, 5).map(s => s.a);
  return top[fnv1a(`${userId}:${date}:${mode}`) % top.length];
}
