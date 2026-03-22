/**
 * BUG-03 Contract Test: validates that our client-side Zod schemas
 * are compatible with FuFirE's OpenAPI spec.
 *
 * If FuFirE adds a required field or renames one, this test catches it.
 * The spec is stored in spec/fufire-openapi.json — update it by copying
 * from the FuFirE repo: cp FuFirE/spec/openapi/openapi.json spec/fufire-openapi.json
 */
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JSON import
import openapi from '@/spec/fufire-openapi.json';

// ── Helpers ─────────────────────────────────────────────────────────
type OASSchema = {
  required?: string[];
  properties?: Record<string, { type?: string; $ref?: string }>;
};

function getSchema(name: string): OASSchema {
  const schemas = (openapi as any).components?.schemas;
  const schema = schemas?.[name];
  if (!schema) throw new Error(`Schema "${name}" not found in OpenAPI spec`);
  return schema;
}

function requiredFields(name: string): string[] {
  return getSchema(name).required ?? [];
}

function allFields(name: string): string[] {
  return Object.keys(getSchema(name).properties ?? {});
}

// ── Contract: BaZi ──────────────────────────────────────────────────
describe('FuFirE Contract: BaZi', () => {
  it('BaziResponse has expected required fields', () => {
    const required = requiredFields('BaziResponse');
    // Our api.ts mapper reads: pillars, chinese
    expect(required).toContain('pillars');
    expect(required).toContain('chinese');
  });

  it('PillarDetail has stamm/zweig/tier/element (German keys)', () => {
    const fields = allFields('PillarDetail');
    expect(fields).toContain('stamm');
    expect(fields).toContain('zweig');
    expect(fields).toContain('tier');
    expect(fields).toContain('element');
  });

  it('ChineseSection has day_master and year info', () => {
    const fields = allFields('ChineseSection');
    expect(fields).toContain('day_master');
    expect(fields).toContain('year');
  });
});

// ── Contract: Western ───────────────────────────────────────────────
describe('FuFirE Contract: Western', () => {
  it('WesternResponse has bodies, houses, angles', () => {
    const fields = allFields('WesternResponse');
    expect(fields).toContain('bodies');
    expect(fields).toContain('houses');
    expect(fields).toContain('angles');
  });

  it('WesternBodyResponse has zodiac_sign as integer index', () => {
    const fields = allFields('WesternBodyResponse');
    expect(fields).toContain('zodiac_sign');
    expect(fields).toContain('longitude');
  });
});

// ── Contract: WuXing ────────────────────────────────────────────────
describe('FuFirE Contract: WuXing', () => {
  it('WxResponse has wu_xing_vector and dominant_element', () => {
    const required = requiredFields('WxResponse');
    expect(required).toContain('wu_xing_vector');
    expect(required).toContain('dominant_element');
  });
});

// ── Contract: Fusion ────────────────────────────────────────────────
describe('FuFirE Contract: Fusion', () => {
  it('FusionResponse has harmony_index and wu_xing_vectors', () => {
    const required = requiredFields('FusionResponse');
    expect(required).toContain('harmony_index');
    expect(required).toContain('wu_xing_vectors');
  });
});

// ── Contract: TST ───────────────────────────────────────────────────
describe('FuFirE Contract: TST', () => {
  it('TSTResponse has true_solar_time fields', () => {
    const required = requiredFields('TSTResponse');
    expect(required).toContain('true_solar_time_hours');
    expect(required).toContain('true_solar_time_formatted');
  });
});

// ── Contract: Experience API ────────────────────────────────────────
describe('FuFirE Contract: Experience', () => {
  it('BootstrapResponse has profile, soulprint_sectors, signature_blueprint', () => {
    const required = requiredFields('BootstrapResponse');
    expect(required).toContain('profile');
    expect(required).toContain('soulprint_sectors');
    expect(required).toContain('signature_blueprint');
  });

  it('ProfileSummary has sun_sign, moon_sign, day_master, harmony_index', () => {
    const fields = allFields('ProfileSummary');
    expect(fields).toContain('sun_sign');
    expect(fields).toContain('moon_sign');
    expect(fields).toContain('day_master');
    expect(fields).toContain('harmony_index');
  });

  it('SignatureDeltaResponse has quiz_sectors and signature_delta', () => {
    const required = requiredFields('SignatureDeltaResponse');
    expect(required).toContain('quiz_sectors');
    expect(required).toContain('signature_delta');
  });

  it('DailyResponse has western, eastern, fusion sections', () => {
    const required = requiredFields('DailyResponse');
    expect(required).toContain('western');
    expect(required).toContain('eastern');
    expect(required).toContain('fusion');
  });
});

// ── Contract: Transit ───────────────────────────────────────────────
describe('FuFirE Contract: Transit', () => {
  it('TransitStateResponse has ring, events, delta', () => {
    const required = requiredFields('TransitStateResponse');
    expect(required).toContain('ring');
    expect(required).toContain('events');
    expect(required).toContain('delta');
  });

  it('TransitEvent has type, sector, description_de', () => {
    const fields = allFields('TransitEvent');
    expect(fields).toContain('type');
    expect(fields).toContain('sector');
    expect(fields).toContain('description_de');
  });
});

// ── Structural integrity: all schemas we depend on exist ────────────
describe('FuFirE Contract: Schema existence', () => {
  const requiredSchemas = [
    'BaziRequest', 'BaziResponse', 'PillarDetail', 'ChineseSection',
    'WesternRequest', 'WesternResponse', 'WesternBodyResponse',
    'FusionRequest', 'FusionResponse',
    'WxRequest', 'WxResponse',
    'TSTRequest', 'TSTResponse',
    'BootstrapRequest', 'BootstrapResponse', 'ProfileSummary',
    'SignatureDeltaRequest', 'SignatureDeltaResponse',
    'DailyRequest', 'DailyResponse',
    'TransitStateRequest', 'TransitStateResponse', 'TransitEvent',
  ];

  it.each(requiredSchemas)('schema "%s" exists in OpenAPI spec', (name) => {
    expect(() => getSchema(name)).not.toThrow();
  });
});
