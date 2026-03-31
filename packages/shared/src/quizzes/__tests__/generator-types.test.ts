import { describe, it, expect } from 'vitest';
import type {
  QuizGeneratorInput,
  GeneratedQuiz,
  DimensionSpec,
  ClusterAssignment,
  ResultProfile,
  AffinityMapEntry,
  EventConverterSpec,
  AggregationRules,
  MarkerDomain,
  ZodiacSectorIndex,
  SignaturDimension,
  MasterSignalDimension,
  LocalizedText,
} from '../generator-types';
import {
  ZODIAC_SECTORS,
  SIGNATUR_DIMENSIONS,
  MASTER_SIGNAL_DIMENSIONS,
  FUSION_WEIGHTS,
} from '../generator-types';

describe('generator-types', () => {
  it('QuizGeneratorInput accepts valid shadow archetype input', () => {
    const input: QuizGeneratorInput = {
      topic: 'shadow_archetype',
      targetPattern: 'Primary shadow archetype — the disowned self',
      patternCategory: 'shadow',
      tone: 'mysterious',
      dimensions: [
        {
          key: 'destroyer',
          label: 'The Destroyer',
          description: 'Suppressed rage and transformation energy',
          markerDomain: 'shadow',
          markerKeywords: ['aggressive', 'destructive'],
          fusionMapping: {
            wuxingElement: 'Fire',
            primarySector: 0,
            signaturDimension: 'assertion',
            masterSignalDimension: 'passion',
          },
        },
        {
          key: 'martyr',
          label: 'The Martyr',
          description: 'Self-sacrifice and boundary dissolution',
          markerDomain: 'eq',
          markerKeywords: ['selfless', 'sacrifice'],
          fusionMapping: {
            wuxingElement: 'Water',
            primarySector: 11,
            secondarySector: 3,
            signaturDimension: 'empathy',
            masterSignalDimension: 'connection',
          },
        },
      ],
      cluster: {
        clusterId: 'cluster.mystiker.v1',
        isPremium: false,
        orderIndex: 5,
      },
      scoringModel: 'multi-dimension',
      locale: 'de-DE',
    };

    expect(input.topic).toBe('shadow_archetype');
    expect(input.dimensions).toHaveLength(2);
    expect(input.dimensions[0].fusionMapping.primarySector).toBe(0);
    expect(input.cluster.clusterId).toBe('cluster.mystiker.v1');
  });

  it('ZODIAC_SECTORS has exactly 12 entries', () => {
    expect(ZODIAC_SECTORS).toHaveLength(12);
  });

  it('ZODIAC_SECTORS covers indices 0-11 with correct signs', () => {
    expect(ZODIAC_SECTORS[0].sign).toBe('Aries');
    expect(ZODIAC_SECTORS[0].index).toBe(0);
    expect(ZODIAC_SECTORS[11].sign).toBe('Pisces');
    expect(ZODIAC_SECTORS[11].index).toBe(11);
  });

  it('ZODIAC_SECTORS opposition pairs are symmetric', () => {
    for (const sector of ZODIAC_SECTORS) {
      const opposite = ZODIAC_SECTORS[sector.opposition];
      expect(opposite.opposition).toBe(sector.index);
    }
  });

  it('SIGNATUR_DIMENSIONS has exactly 6 keys', () => {
    expect(Object.keys(SIGNATUR_DIMENSIONS)).toHaveLength(6);
  });

  it('SIGNATUR_DIMENSIONS keys match SignaturDimension union', () => {
    const expectedKeys: SignaturDimension[] = [
      'assertion',
      'empathy',
      'creativity',
      'logic',
      'intuition',
      'discipline',
    ];
    expect(Object.keys(SIGNATUR_DIMENSIONS).sort()).toEqual(
      expectedKeys.sort(),
    );
  });

  it('SIGNATUR_DIMENSIONS angles are spaced 60 degrees apart', () => {
    const angles = Object.values(SIGNATUR_DIMENSIONS).map((d) => d.angle);
    expect(angles).toEqual([0, 60, 120, 180, 240, 300]);
  });

  it('MASTER_SIGNAL_DIMENSIONS has exactly 5 keys', () => {
    expect(Object.keys(MASTER_SIGNAL_DIMENSIONS)).toHaveLength(5);
  });

  it('MASTER_SIGNAL_DIMENSIONS keys match MasterSignalDimension union', () => {
    const expectedKeys: MasterSignalDimension[] = [
      'passion',
      'stability',
      'future',
      'connection',
      'autonomy',
    ];
    expect(Object.keys(MASTER_SIGNAL_DIMENSIONS).sort()).toEqual(
      expectedKeys.sort(),
    );
  });

  it('FUSION_WEIGHTS sum to 1.0', () => {
    const sum =
      FUSION_WEIGHTS.natal +
      FUSION_WEIGHTS.quiz +
      FUSION_WEIGHTS.gcb +
      FUSION_WEIGHTS.alignmentBoost;
    expect(sum).toBeCloseTo(1.0);
  });

  it('FUSION_WEIGHTS has exactly 4 keys', () => {
    expect(Object.keys(FUSION_WEIGHTS)).toHaveLength(4);
  });

  it('AffinityMapEntry sectorWeights is a 12-element tuple', () => {
    const entry: AffinityMapEntry = {
      keyword: 'aggressive',
      sectorWeights: [0.8, 0.1, 0.2, 0.1, 0.5, 0.0, 0.1, 0.7, 0.3, 0.2, 0.1, 0.0],
      domain: 'shadow',
      rationale: 'Mars-Scorpio aggression axis',
    };
    expect(entry.sectorWeights).toHaveLength(12);
  });

  it('AggregationRules maxNatalDeviation is fixed at 0.5', () => {
    const rules: AggregationRules = {
      contributesTo: ['master_signal', 'signatur_ring'],
      weight: 0.15,
      decay: 'slow',
      recurrence: 'once',
      maxNatalDeviation: 0.5,
    };
    expect(rules.maxNatalDeviation).toBe(0.5);
  });

  it('LocalizedText accepts de-DE and en-US', () => {
    const text: LocalizedText = {
      'de-DE': 'Schattenarchetyp',
      'en-US': 'Shadow Archetype',
    };
    expect(text['de-DE']).toBe('Schattenarchetyp');
    expect(text['en-US']).toBe('Shadow Archetype');
  });
});
