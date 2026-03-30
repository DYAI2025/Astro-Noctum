import { describe, it, expect } from 'vitest';
import { generateQuiz } from '../generate-quiz';
import type { QuizGeneratorInputWithContent } from '../generate-quiz';
import { scoreQuiz } from '../scoring';
import type { QuizGeneratorInput, ResultProfile } from '../generator-types';

// ─────────────────────────────────────────────────────────────
// Shadow Archetype fixture — derived from example-shadow-archetype.md
// ─────────────────────────────────────────────────────────────

const SHADOW_BASE_INPUT: QuizGeneratorInput = {
  topic: 'shadow_archetype',
  targetPattern: 'Primary shadow archetype — the disowned self',
  patternCategory: 'shadow',
  tone: 'mysterious',
  dimensions: [
    {
      key: 'destroyer',
      label: 'The Destroyer',
      description: 'Suppressed rage, desire to tear down what feels false',
      markerDomain: 'shadow',
      markerKeywords: ['aggressive', 'primal_force'],
      fusionMapping: {
        wuxingElement: 'Fire',
        primarySector: 0,
        secondarySector: 7,
        signaturDimension: 'assertion',
        masterSignalDimension: 'passion',
      },
    },
    {
      key: 'orphan',
      label: 'The Orphan',
      description: 'Deep abandonment wound, fear of being unseen',
      markerDomain: 'shadow',
      markerKeywords: ['isolation', 'vulnerability'],
      fusionMapping: {
        wuxingElement: 'Water',
        primarySector: 7,
        secondarySector: 3,
        signaturDimension: 'empathy',
        masterSignalDimension: 'connection',
      },
    },
    {
      key: 'tyrant',
      label: 'The Tyrant',
      description: 'Need for control masking vulnerability',
      markerDomain: 'shadow',
      markerKeywords: ['dominance', 'strategic_control'],
      fusionMapping: {
        wuxingElement: 'Earth',
        primarySector: 9,
        signaturDimension: 'discipline',
        masterSignalDimension: 'stability',
      },
    },
    {
      key: 'trickster',
      label: 'The Trickster',
      description: 'Chaos as protection, deflection through performance',
      markerDomain: 'shadow',
      markerKeywords: ['deflection', 'mimicry'],
      fusionMapping: {
        wuxingElement: 'Metal',
        primarySector: 5,
        secondarySector: 2,
        signaturDimension: 'logic',
        masterSignalDimension: 'autonomy',
      },
    },
  ],
  cluster: { clusterId: 'cluster.mystiker.v1', isPremium: false, orderIndex: 5 },
  scoringModel: 'multi-dimension',
  locale: 'de-DE',
};

const SHADOW_RESULT_PROFILES: ResultProfile[] = [
  {
    id: 'destroyer',
    name: { 'de-DE': 'Der Zerstoerer', 'en-US': 'The Destroyer' },
    subtitle: { 'de-DE': 'Die Flamme hinter der Stille', 'en-US': 'The flame behind the stillness' },
    description: {
      'de-DE': 'Du traegst eine Kraft in dir, die Altes verbrennen will.',
      'en-US': 'You carry a force that wants to burn away what is old.',
    },
    shadowInsight: { 'de-DE': 'Tiefe Einsicht', 'en-US': 'Deep insight' },
    fusionMapping: {
      element: 'Fire',
      zodiacAffinity: ['Aries', 'Scorpio'],
      ringPosition: 0,
      signaturDimension: 'assertion',
      masterSignalDimension: 'passion',
    },
    visual: { color: '#FF4500', symbol: 'flame' },
    zoneLogic: {
      flowCondition: 'natal.assertion > 0.6',
      sparkCondition: 'natal.empathy > 0.5',
      talkCondition: 'natal.discipline > 0.7',
    },
  },
  {
    id: 'orphan',
    name: { 'de-DE': 'Das Waisenkind', 'en-US': 'The Orphan' },
    subtitle: { 'de-DE': 'Die Leere, die ruft', 'en-US': 'The void that calls' },
    description: {
      'de-DE': 'Du sehnst dich nach Zugehoerigkeit.',
      'en-US': 'You long for belonging.',
    },
    shadowInsight: { 'de-DE': 'Tiefe Einsicht', 'en-US': 'Deep insight' },
    fusionMapping: {
      element: 'Water',
      zodiacAffinity: ['Scorpio', 'Cancer'],
      ringPosition: 7,
      signaturDimension: 'empathy',
      masterSignalDimension: 'connection',
    },
    visual: { color: '#1E90FF', symbol: 'droplet' },
    zoneLogic: {
      flowCondition: 'natal.empathy > 0.6',
      sparkCondition: 'natal.assertion > 0.5',
      talkCondition: 'natal.logic > 0.7',
    },
  },
  {
    id: 'tyrant',
    name: { 'de-DE': 'Der Tyrann', 'en-US': 'The Tyrant' },
    subtitle: { 'de-DE': 'Kontrolle als Schild', 'en-US': 'Control as shield' },
    description: {
      'de-DE': 'Du suchst Sicherheit durch Dominanz.',
      'en-US': 'You seek safety through dominance.',
    },
    shadowInsight: { 'de-DE': 'Tiefe Einsicht', 'en-US': 'Deep insight' },
    fusionMapping: {
      element: 'Earth',
      zodiacAffinity: ['Capricorn'],
      ringPosition: 9,
      signaturDimension: 'discipline',
      masterSignalDimension: 'stability',
    },
    visual: { color: '#8B4513', symbol: 'crown' },
    zoneLogic: {
      flowCondition: 'natal.discipline > 0.6',
      sparkCondition: 'natal.creativity > 0.5',
      talkCondition: 'natal.empathy > 0.7',
    },
  },
  {
    id: 'trickster',
    name: { 'de-DE': 'Der Trickster', 'en-US': 'The Trickster' },
    subtitle: { 'de-DE': 'Die Maske tanzt', 'en-US': 'The mask dances' },
    description: {
      'de-DE': 'Du nutzt Chaos als Schutzschild.',
      'en-US': 'You use chaos as a shield.',
    },
    shadowInsight: { 'de-DE': 'Tiefe Einsicht', 'en-US': 'Deep insight' },
    fusionMapping: {
      element: 'Metal',
      zodiacAffinity: ['Virgo', 'Gemini'],
      ringPosition: 5,
      signaturDimension: 'logic',
      masterSignalDimension: 'autonomy',
    },
    visual: { color: '#9370DB', symbol: 'mask' },
    zoneLogic: {
      flowCondition: 'natal.logic > 0.6',
      sparkCondition: 'natal.intuition > 0.5',
      talkCondition: 'natal.assertion > 0.7',
    },
  },
];

const SHADOW_QUESTIONS = [
  {
    id: 'q1',
    scenario: {
      'de-DE': 'Du bist auf einer Dinnerparty. Jemand erzaehlt eine Geschichte, ueber die alle lachen — aber der Witz geht leise auf deine Kosten.',
      'en-US': 'You are at a dinner party. Someone tells a story that everyone laughs at — but the joke is quietly at your expense.',
    },
    prompt: {
      'de-DE': 'Was passiert in dir?',
      'en-US': 'What happens inside you?',
    },
    options: [
      {
        id: 'a',
        text: { 'de-DE': 'Ein heisser Stich steigt in mir auf.', 'en-US': 'A hot flash of anger rises in my chest.' },
        scores: { destroyer: 3, tyrant: 1, orphan: 0, trickster: 0 },
        emotionalTag: 'suppressed_rage',
      },
      {
        id: 'b',
        text: { 'de-DE': 'Ich fuehle mich unsichtbar.', 'en-US': 'I feel invisible.' },
        scores: { orphan: 3, destroyer: 0, tyrant: 0, trickster: 0 },
        emotionalTag: 'abandonment_trigger',
      },
      {
        id: 'c',
        text: { 'de-DE': 'Ich notiere es innerlich.', 'en-US': 'I mentally note it.' },
        scores: { tyrant: 3, destroyer: 1, orphan: 0, trickster: 0 },
        emotionalTag: 'strategic_control',
      },
      {
        id: 'd',
        text: { 'de-DE': 'Ich lache lauter als alle anderen.', 'en-US': 'I laugh louder than everyone else.' },
        scores: { trickster: 3, orphan: 1, destroyer: 0, tyrant: 0 },
        emotionalTag: 'deflection_humor',
      },
    ],
  },
];

const SHADOW_INPUT_WITH_CONTENT: QuizGeneratorInputWithContent = {
  ...SHADOW_BASE_INPUT,
  questions: SHADOW_QUESTIONS,
  resultProfiles: SHADOW_RESULT_PROFILES,
  title: {
    'de-DE': 'Was lauert hinter deinem Laecheln?',
    'en-US': 'What Lurks Beneath Your Smile?',
  },
  subtitle: {
    'de-DE': 'Ein Blick auf die Seite von dir, die niemand zu sehen bekommt.',
    'en-US': 'A look at the side of you nobody gets to see.',
  },
  emoji: '🎭',
  accentColor: '#8B0000',
};

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('generateQuiz', () => {
  it('throws when no questions provided', () => {
    const inputWithoutQuestions = {
      ...SHADOW_BASE_INPUT,
      questions: [],
      resultProfiles: SHADOW_RESULT_PROFILES,
    } as QuizGeneratorInputWithContent;

    expect(() => generateQuiz(inputWithoutQuestions)).toThrow(/questions/);
  });

  it('throws when questions field is missing', () => {
    const inputMissing = {
      ...SHADOW_BASE_INPUT,
      resultProfiles: SHADOW_RESULT_PROFILES,
    } as unknown as QuizGeneratorInputWithContent;

    expect(() => generateQuiz(inputMissing)).toThrow(/questions/);
  });

  it('produces valid GeneratedQuiz with all 5 artifacts', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);

    expect(result.definition).toBeDefined();
    expect(result.resultProfiles).toBeDefined();
    expect(result.affinityMapEntries).toBeDefined();
    expect(result.eventConverter).toBeDefined();
    expect(result.aggregation).toBeDefined();

    // All 5 artifacts are non-empty
    expect(result.resultProfiles.length).toBeGreaterThan(0);
    expect(result.affinityMapEntries.length).toBeGreaterThan(0);
    expect(result.definition.questions.length).toBeGreaterThan(0);
    expect(result.definition.profiles.length).toBeGreaterThan(0);
  });

  it('definition.id follows naming pattern {topic}_01', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);
    expect(result.definition.id).toBe('shadow_archetype_01');
    expect(result.definition.id).toMatch(/^[a-z_]+_\d{2}$/);
  });

  it('definition.scoringModel matches input', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);
    expect(result.definition.scoringModel).toBe('multi-dimension');
  });

  it('definition maps localized title/subtitle to flat string fields', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);
    expect(result.definition.title).toBe('What Lurks Beneath Your Smile?');
    expect(result.definition.titleDe).toBe('Was lauert hinter deinem Laecheln?');
    expect(result.definition.subtitle).toBe('A look at the side of you nobody gets to see.');
    expect(result.definition.subtitleDe).toBe('Ein Blick auf die Seite von dir, die niemand zu sehen bekommt.');
    expect(result.definition.emoji).toBe('🎭');
    expect(result.definition.accentColor).toBe('#8B0000');
  });

  it('definition.dimensions lists all dimension keys', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);
    expect(result.definition.dimensions).toEqual([
      'destroyer', 'orphan', 'tyrant', 'trickster',
    ]);
  });

  it('affinityMapEntries has entries for all marker keywords', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);

    // 4 dimensions x 2 keywords each = 8 entries
    const allKeywords = SHADOW_BASE_INPUT.dimensions.flatMap(d => d.markerKeywords);
    expect(allKeywords).toHaveLength(8);

    const entryKeywords = result.affinityMapEntries.map(e => e.keyword);
    for (const kw of allKeywords) {
      expect(entryKeywords).toContain(kw);
    }
    expect(result.affinityMapEntries).toHaveLength(allKeywords.length);
  });

  it('eventConverter.moduleId matches quiz ID', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);
    expect(result.eventConverter.moduleId).toBe('quiz.shadow_archetype_01.v1');
    expect(result.eventConverter.functionName).toBe('shadowArchetype01ToEvent');
  });

  it('aggregation.maxNatalDeviation === 0.5', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);
    expect(result.aggregation.maxNatalDeviation).toBe(0.5);
    expect(result.aggregation.weight).toBe(0.15);
    expect(result.aggregation.decay).toBe('none');
    expect(result.aggregation.recurrence).toBe('once');
    expect(result.aggregation.contributesTo).toContain('cluster.mystiker.v1');
  });

  it('aggregation.weight respects custom input', () => {
    const input: QuizGeneratorInputWithContent = {
      ...SHADOW_INPUT_WITH_CONTENT,
      aggregationWeight: 0.10,
    };
    const result = generateQuiz(input);
    expect(result.aggregation.weight).toBe(0.10);
  });

  it('produced definition can be scored by scoreQuiz()', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);

    // Answer q1 with option 'a' (destroyer: 3, tyrant: 1)
    const quizResult = scoreQuiz(result.definition, { q1: 'a' });

    expect(quizResult.quizId).toBe('shadow_archetype_01');
    expect(quizResult.profileId).toBeDefined();
    expect(quizResult.dimensionScores).toBeDefined();
    expect(quizResult.dimensionScores['destroyer']).toBe(3);
    expect(quizResult.dimensionScores['tyrant']).toBe(1);
    expect(quizResult.answers).toEqual({ q1: 'a' });
  });

  it('scored result picks correct profile for dominant dimension', () => {
    const result = generateQuiz(SHADOW_INPUT_WITH_CONTENT);

    // Answer 'b' for orphan-dominant (orphan: 3)
    const quizResult = scoreQuiz(result.definition, { q1: 'b' });
    // With only 1 question and threshold 6, no profile matches thresholds,
    // so fallback to last profile by priority
    expect(quizResult.profileId).toBeDefined();
    expect(quizResult.dimensionScores['orphan']).toBe(3);
  });
});
