import { SECTOR_COUNT } from './constants';
import { AFFINITY_MAP, TAG_AFFINITY } from './affinity-map';
import type { ContributionEvent, Marker } from '@/src/lib/lme/types';

/**
 * Resolve einen einzelnen Marker auf 12 Sektor-Gewichte.
 */
export function resolveMarkerToSectors(marker: Marker): number[] {
  const parts = marker.id.split('.');
  const domain = parts[1];
  const keyword = parts[2];

  if (keyword && AFFINITY_MAP[keyword]) {
    return AFFINITY_MAP[keyword].map(a => a * marker.weight);
  }

  if (domain && AFFINITY_MAP[domain]) {
    return AFFINITY_MAP[domain].map(a => a * marker.weight);
  }

  return new Array(SECTOR_COUNT).fill(0);
}

/**
 * Aggregiere alle Marker eines Events zu einem Sektor-Signal.
 */
export function eventToSectorSignals(event: ContributionEvent): number[] {
  const signals = new Array(SECTOR_COUNT).fill(0);

  for (const marker of event.payload.markers) {
    const contribution = resolveMarkerToSectors(marker);
    for (let s = 0; s < SECTOR_COUNT; s++) {
      signals[s] += contribution[s];
    }
  }

  if (event.payload.tags) {
    for (const tag of event.payload.tags) {
      const archetype = tag.id.split('.').pop();
      if (archetype && TAG_AFFINITY[archetype]) {
        const weight = tag.weight ?? 0.5;
        for (let s = 0; s < SECTOR_COUNT; s++) {
          signals[s] += TAG_AFFINITY[archetype][s] * weight;
        }
      }
    }
  }

  const maxAbs = Math.max(...signals.map(Math.abs), 0.01);
  return signals.map(s => s / maxAbs);
}

function avgConfidence(event: ContributionEvent): number {
  const markers = event.payload.markers;
  if (markers.length === 0) return 0.5;

  const confidences = markers
    .map(m => m.evidence?.confidence ?? 0.5)
    .filter(c => c > 0);

  if (confidences.length === 0) return 0.5;
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

/**
 * Fusioniere alle abgeschlossenen Quiz-Events zu T(s).
 */
export function fuseAllEvents(events: ContributionEvent[]): number[] {
  if (events.length === 0) return new Array(SECTOR_COUNT).fill(0);

  const fused = new Array(SECTOR_COUNT).fill(0);

  for (const event of events) {
    const eventSignals = eventToSectorSignals(event);
    const confidence = avgConfidence(event);

    for (let s = 0; s < SECTOR_COUNT; s++) {
      fused[s] += eventSignals[s] * confidence;
    }
  }

  const maxAbs = Math.max(...fused.map(Math.abs), 0.01);
  return fused.map(s => Math.max(-1, Math.min(1, s / maxAbs)));
}
