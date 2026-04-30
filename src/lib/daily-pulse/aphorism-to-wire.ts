import type { AphorismRecord } from './aphorism-select';
import type { z } from 'zod';
import { PulseAphorismSchema, CouncilKeySchema, DayModeSchema } from '../schemas/daily-pulse';

type PulseAphorism = z.infer<typeof PulseAphorismSchema>;

const COUNCIL_KEYS = new Set<string>(CouncilKeySchema.options);
const DAY_MODES = new Set<string>(DayModeSchema.options);

/**
 * Adapts a curation-side AphorismRecord (nested text/source, loose figure_affinity)
 * into the wire-level PulseAphorism shape (flat text_de/text_en/author/work,
 * strict CouncilKey/DayMode unions). Unknown enum values are dropped with a
 * warn so a typo'd figure key in the JSON pool can't crash the response.
 */
export function aphorismToWire(rec: AphorismRecord): PulseAphorism {
  const filteredFigures: PulseAphorism['figure_affinity'] = [];
  for (const k of rec.figure_affinity) {
    if (COUNCIL_KEYS.has(k)) {
      filteredFigures.push(k as PulseAphorism['figure_affinity'][number]);
    } else {
      console.warn(`[aphorismToWire] dropping unknown figure_affinity '${k}' on ${rec.id}`);
    }
  }
  const filteredModes: PulseAphorism['mode_tags'] = [];
  for (const m of rec.mode_tags) {
    if (DAY_MODES.has(m)) {
      filteredModes.push(m as PulseAphorism['mode_tags'][number]);
    } else {
      console.warn(`[aphorismToWire] dropping unknown mode_tag '${m}' on ${rec.id}`);
    }
  }
  return {
    id: rec.id,
    text_de: rec.text.de,
    text_en: rec.text.en,
    author: rec.source.author,
    work: rec.source.work,
    copyright: rec.copyright as PulseAphorism['copyright'],
    attribution_status: rec.attribution_status as PulseAphorism['attribution_status'],
    mode_tags: filteredModes,
    tone_tags: rec.tone_tags,
    element_affinity: rec.element_affinity,
    figure_affinity: filteredFigures,
    season_affinity: rec.season_affinity,
  };
}
