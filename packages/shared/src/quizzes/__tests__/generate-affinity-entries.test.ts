import { describe, it, expect } from 'vitest';
import { generateAffinityEntries } from '../generate-affinity-entries';
import type { DimensionSpec, AffinityMapEntry } from '../generator-types';

// Shadow archetype dimensions — 4 dims, 2 keywords each = 8 entries
const SHADOW_DIMS: DimensionSpec[] = [
  {
    key: 'destroyer',
    label: 'The Destroyer',
    description: 'Suppressed rage',
    markerDomain: 'shadow',
    markerKeywords: ['aggressive', 'primal_force'],
    fusionMapping: {
      wuxingElement: 'Fire',
      primarySector: 0,   // Aries
      secondarySector: 7,  // Scorpio
      signaturDimension: 'assertion',
      masterSignalDimension: 'passion',
    },
  },
  {
    key: 'orphan',
    label: 'The Orphan',
    description: 'Abandonment wound',
    markerDomain: 'shadow',
    markerKeywords: ['isolation', 'vulnerability'],
    fusionMapping: {
      wuxingElement: 'Water',
      primarySector: 7,   // Scorpio
      secondarySector: 3,  // Cancer
      signaturDimension: 'empathy',
      masterSignalDimension: 'connection',
    },
  },
  {
    key: 'tyrant',
    label: 'The Tyrant',
    description: 'Need for control',
    markerDomain: 'shadow',
    markerKeywords: ['dominance', 'strategic_control'],
    fusionMapping: {
      wuxingElement: 'Earth',
      primarySector: 9,  // Capricorn
      signaturDimension: 'discipline',
      masterSignalDimension: 'stability',
    },
  },
  {
    key: 'trickster',
    label: 'The Trickster',
    description: 'Chaos as protection',
    markerDomain: 'shadow',
    markerKeywords: ['deflection', 'mimicry'],
    fusionMapping: {
      wuxingElement: 'Metal',
      primarySector: 5,   // Virgo
      secondarySector: 2,  // Gemini
      signaturDimension: 'logic',
      masterSignalDimension: 'autonomy',
    },
  },
];

describe('generateAffinityEntries', () => {
  it('generates one entry per marker keyword', () => {
    const entries = generateAffinityEntries(SHADOW_DIMS);
    expect(entries).toHaveLength(8);
    expect(entries[0].keyword).toBe('aggressive');
    expect(entries[1].keyword).toBe('primal_force');
    expect(entries[2].keyword).toBe('isolation');
    expect(entries[3].keyword).toBe('vulnerability');
    expect(entries[4].keyword).toBe('dominance');
    expect(entries[5].keyword).toBe('strategic_control');
    expect(entries[6].keyword).toBe('deflection');
    expect(entries[7].keyword).toBe('mimicry');
  });

  it('primary sector gets highest weight', () => {
    const entries = generateAffinityEntries(SHADOW_DIMS);
    for (const entry of entries) {
      const vec = entry.sectorWeights;
      const maxWeight = Math.max(...vec);
      const maxIdx = vec.indexOf(maxWeight);
      // Find the corresponding dimension to check its primary sector
      const dim = SHADOW_DIMS.find(d => d.markerKeywords.includes(entry.keyword))!;
      expect(maxIdx).toBe(dim.fusionMapping.primarySector);
    }
  });

  it('vector sums to approximately 1.0', () => {
    const entries = generateAffinityEntries(SHADOW_DIMS);
    for (const entry of entries) {
      const sum = entry.sectorWeights.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });

  it('each vector has exactly 12 elements', () => {
    const entries = generateAffinityEntries(SHADOW_DIMS);
    for (const entry of entries) {
      expect(entry.sectorWeights).toHaveLength(12);
    }
  });

  it('includes domain and rationale', () => {
    const entries = generateAffinityEntries(SHADOW_DIMS);
    // Destroyer entries
    expect(entries[0].domain).toBe('shadow');
    expect(entries[0].rationale).toContain('Fire');
    expect(entries[0].rationale).toContain('Aries');
    expect(entries[0].rationale).toContain('The Destroyer');

    // Orphan entries
    expect(entries[2].domain).toBe('shadow');
    expect(entries[2].rationale).toContain('Water');
    expect(entries[2].rationale).toContain('Scorpio');

    // Tyrant entries
    expect(entries[4].domain).toBe('shadow');
    expect(entries[4].rationale).toContain('Earth');
    expect(entries[4].rationale).toContain('Capricorn');

    // Trickster entries
    expect(entries[6].domain).toBe('shadow');
    expect(entries[6].rationale).toContain('Metal');
    expect(entries[6].rationale).toContain('Virgo');
  });

  it('no duplicate keywords across dimensions', () => {
    const entries = generateAffinityEntries(SHADOW_DIMS);
    const keywords = entries.map(e => e.keyword);
    const unique = new Set(keywords);
    expect(unique.size).toBe(keywords.length);
  });

  it('secondary sector gets second-highest weight when defined', () => {
    // Destroyer: primary=0 (Aries), secondary=7 (Scorpio)
    const entries = generateAffinityEntries([SHADOW_DIMS[0]]);
    const vec = entries[0].sectorWeights;
    // Primary (Aries) should be highest
    expect(vec[0]).toBeGreaterThan(vec[7]);
    // Secondary (Scorpio) should be second-highest
    const sorted = [...vec].sort((a, b) => b - a);
    expect(vec[7]).toBe(sorted[1]);
  });

  it('distributes remaining weight to element canonical sectors', () => {
    // Tyrant: Earth, primary=9 (Capricorn), no secondary
    // Earth sectors are [1, 10] — both should get remaining weight
    const entries = generateAffinityEntries([SHADOW_DIMS[2]]);
    const vec = entries[0].sectorWeights;
    // Primary (Capricorn) = highest
    expect(vec[9]).toBeGreaterThan(vec[1]);
    expect(vec[9]).toBeGreaterThan(vec[10]);
    // Element sectors (Taurus, Aquarius) should have positive weight
    expect(vec[1]).toBeGreaterThan(0);
    expect(vec[10]).toBeGreaterThan(0);
    // Element sectors should share remaining weight equally
    expect(vec[1]).toBeCloseTo(vec[10], 3);
  });

  it('all weights are non-negative', () => {
    const entries = generateAffinityEntries(SHADOW_DIMS);
    for (const entry of entries) {
      for (const w of entry.sectorWeights) {
        expect(w).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('works with a single dimension', () => {
    const entries = generateAffinityEntries([SHADOW_DIMS[0]]);
    expect(entries).toHaveLength(2);
    expect(entries[0].keyword).toBe('aggressive');
    expect(entries[1].keyword).toBe('primal_force');
  });
});
