import { describe, it, expect } from 'vitest';
import { generateEventConverter } from '../generate-event-converter';
import type { DimensionSpec } from '../generator-types';

describe('generateEventConverter', () => {
  const dims: DimensionSpec[] = [
    {
      key: 'destroyer',
      label: 'Destroyer',
      description: 'rage',
      markerDomain: 'shadow',
      markerKeywords: ['aggressive', 'primal_force'],
      fusionMapping: {
        wuxingElement: 'Fire',
        primarySector: 0,
        signaturDimension: 'assertion',
        masterSignalDimension: 'passion',
      },
    },
    {
      key: 'orphan',
      label: 'Orphan',
      description: 'abandonment',
      markerDomain: 'shadow',
      markerKeywords: ['isolation', 'vulnerability'],
      fusionMapping: {
        wuxingElement: 'Water',
        primarySector: 7,
        signaturDimension: 'empathy',
        masterSignalDimension: 'connection',
      },
    },
  ];

  it('generates converter spec with correct moduleId', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    expect(spec.moduleId).toBe('quiz.shadow_archetype_01.v1');
    expect(spec.functionName).toBe('shadowArchetype01ToEvent');
  });

  it('maps each dimension to its marker keywords', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    expect(spec.dimensionToMarkers).toHaveLength(2);
    expect(spec.dimensionToMarkers[0].dimensionKey).toBe('destroyer');
    expect(spec.dimensionToMarkers[0].markers).toHaveLength(2);
    expect(spec.dimensionToMarkers[0].markers[0].id).toBe('marker.shadow.aggressive');
  });

  it('uses marker.{domain}.{keyword} format for all marker IDs', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    const allMarkers = spec.dimensionToMarkers.flatMap((d) => d.markers);
    for (const marker of allMarkers) {
      expect(marker.id).toMatch(/^marker\.\w+\.\w+$/);
    }
  });

  it('all dimensions are represented in the output', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    const outputKeys = spec.dimensionToMarkers.map((d) => d.dimensionKey);
    expect(outputKeys).toEqual(['destroyer', 'orphan']);
  });

  it('generates weight formula referencing the dimension key', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    expect(spec.dimensionToMarkers[0].markers[0].weightFormula).toBe(
      'normalize(scores.destroyer)',
    );
    expect(spec.dimensionToMarkers[1].markers[0].weightFormula).toBe(
      'normalize(scores.orphan)',
    );
  });

  it('total marker count equals sum of all dimension keywords', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    const totalMarkers = spec.dimensionToMarkers.reduce(
      (sum, d) => sum + d.markers.length,
      0,
    );
    // 2 keywords per dimension * 2 dimensions = 4
    expect(totalMarkers).toBe(4);
  });
});
