import { describe, it, expect } from 'vitest';
import { FlareTimelineSchema } from '../lib/schemas/flare-timeline';
import { AuroraDataSchema } from '../lib/schemas/aurora';
import { NeoResponseSchema } from '../lib/schemas/neo';

// ── Flare Timeline ──────────────────────────────────────────────────

describe('FlareTimelineSchema', () => {
  it('parses valid timeline data', () => {
    const data = {
      xrayCurve: [{ timestamp: '2026-03-19T10:00:00Z', flux: 1.2e-6 }],
      kpBars: [{ timestamp: '2026-03-19T09:00:00Z', kp: 6.33, noaaScale: 'G2' }],
      events: [{
        id: 'donki-cme-1',
        type: 'cme_arrival',
        timestamp: '2026-03-19T08:00:00Z',
        label: 'Earthbound CME',
        intensity: 0.2,
      }],
      enlilWindow: { startAt: '2026-03-18T00:00:00Z', endAt: '2026-03-20T00:00:00Z' },
    };
    expect(() => FlareTimelineSchema.parse(data)).not.toThrow();
  });

  it('parses timeline with null enlilWindow', () => {
    const data = {
      xrayCurve: [],
      kpBars: [],
      events: [],
      enlilWindow: null,
    };
    expect(() => FlareTimelineSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid event intensity (> 1)', () => {
    const data = {
      xrayCurve: [],
      kpBars: [],
      events: [{ id: 'x', type: 'flare', timestamp: 't', label: 'l', intensity: 2.0 }],
      enlilWindow: null,
    };
    expect(() => FlareTimelineSchema.parse(data)).toThrow();
  });

  it('rejects unknown event type', () => {
    const data = {
      xrayCurve: [],
      kpBars: [],
      events: [{ id: 'x', type: 'unknown_type', timestamp: 't', label: 'l', intensity: 0.5 }],
      enlilWindow: null,
    };
    expect(() => FlareTimelineSchema.parse(data)).toThrow();
  });
});

// ── Aurora ──────────────────────────────────────────────────────────

describe('AuroraDataSchema', () => {
  it('parses valid aurora data with forecast', () => {
    const data = {
      kp: 6.0,
      auroraActive: true,
      europeForecast: [{ lat: 60, lon: 10, probability: 45 }],
      gfzKp: 5.7,
      visibilityDE: 'Aurora moeglich',
      updatedAt: '2026-03-19T12:00:00Z',
    };
    expect(() => AuroraDataSchema.parse(data)).not.toThrow();
  });

  it('parses aurora data with null gfzKp', () => {
    const data = {
      kp: 2.0,
      auroraActive: false,
      europeForecast: [],
      gfzKp: null,
      visibilityDE: 'Keine Aurora-Aktivitaet erwartet.',
      updatedAt: '2026-03-19T12:00:00Z',
    };
    expect(() => AuroraDataSchema.parse(data)).not.toThrow();
  });

  it('rejects probability out of range', () => {
    const data = {
      kp: 6.0,
      auroraActive: true,
      europeForecast: [{ lat: 60, lon: 10, probability: 150 }], // > 100
      gfzKp: null,
      visibilityDE: 'test',
      updatedAt: '2026-03-19T12:00:00Z',
    };
    expect(() => AuroraDataSchema.parse(data)).toThrow();
  });
});

// ── NEO ─────────────────────────────────────────────────────────────

describe('NeoResponseSchema', () => {
  it('parses valid NEO response', () => {
    const data = {
      objects: [{
        designation: '2026-AB',
        name: '2026 AB',
        closeApproachDate: '2026-03-22',
        distanceKm: 1_500_000,
        distanceEarthRadii: 235.4,
        velocityKmS: 12.3,
        estimatedDiameterM: 150,
        isPotentiallyHazardous: false,
      }],
      fetchedAt: '2026-03-19T12:00:00Z',
    };
    expect(() => NeoResponseSchema.parse(data)).not.toThrow();
  });

  it('parses NEO with null name', () => {
    const data = {
      objects: [{
        designation: '2026000123',
        name: null,
        closeApproachDate: '2026-03-25',
        distanceKm: 500_000,
        distanceEarthRadii: 78.5,
        velocityKmS: 8.1,
        estimatedDiameterM: 50,
        isPotentiallyHazardous: true,
      }],
      fetchedAt: '2026-03-19T12:00:00Z',
    };
    expect(() => NeoResponseSchema.parse(data)).not.toThrow();
  });

  it('parses empty objects array', () => {
    const data = { objects: [], fetchedAt: '2026-03-19T12:00:00Z' };
    expect(() => NeoResponseSchema.parse(data)).not.toThrow();
  });
});
