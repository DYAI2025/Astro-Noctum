/**
 * Core Quiz Assembler
 *
 * Transforms a QuizGeneratorInput (with pre-authored questions and result profiles)
 * into a complete GeneratedQuiz containing all integration artifacts:
 * - QuizDefinition (for scoreQuiz())
 * - AffinityMapEntry[] (for AFFINITY_MAP merge)
 * - EventConverterSpec (for quiz-to-event registration)
 * - ResultProfile[] (narrative texts)
 * - AggregationRules (long-term profile building)
 *
 * The generator does NOT create questions or narratives — those are injected
 * via the input as pre-authored content (LLM or human authored beforehand).
 */

import type {
  QuizGeneratorInput,
  GeneratedQuiz,
  AggregationRules,
  ResultProfile,
  LocalizedText,
} from './generator-types';
import type { QuizDefinition, QuizQuestion, QuizOption, QuizProfile } from './schema';
import { generateAffinityEntries } from './generate-affinity-entries';
import { generateEventConverter } from './generate-event-converter';

// ─────────────────────────────────────────────────────────────
// Input extension: pre-authored content injected into generator
// ─────────────────────────────────────────────────────────────

export interface QuestionInput {
  id: string;
  scenario?: LocalizedText;
  prompt?: LocalizedText;
  /** Flat text fallback (used when no localized prompt given) */
  text?: LocalizedText;
  options: OptionInput[];
}

export interface OptionInput {
  id: string;
  text: LocalizedText;
  /** For multi-dimension scoring */
  scores?: Record<string, number>;
  /** For profile-driven scoring */
  profileId?: string;
  emotionalTag?: string;
}

export interface QuizGeneratorInputWithContent extends QuizGeneratorInput {
  /** Pre-authored questions — the generator assembles, does NOT create these */
  questions: QuestionInput[];
  /** Pre-authored result profiles with narrative texts */
  resultProfiles: ResultProfile[];
  /** Display title (localized) */
  title?: LocalizedText;
  /** Display subtitle (localized) */
  subtitle?: LocalizedText;
  /** Emoji for the quiz card */
  emoji?: string;
  /** Accent color hex for the quiz card */
  accentColor?: string;
  /** Custom aggregation weight (default: 0.15) */
  aggregationWeight?: number;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function localizedToEn(text: LocalizedText | undefined, fallback: string): string {
  return text?.['en-US'] ?? fallback;
}

function localizedToDe(text: LocalizedText | undefined, fallback: string): string {
  return text?.['de-DE'] ?? fallback;
}

/**
 * Map a QuestionInput to the flat QuizQuestion format expected by schema.ts.
 * Uses the prompt field as the question text, with scenario as context.
 */
function mapQuestion(q: QuestionInput): QuizQuestion {
  const text = localizedToEn(q.prompt, localizedToEn(q.text, q.id));
  return {
    id: q.id,
    text,
    context: localizedToDe(q.scenario, undefined as unknown as string) || undefined,
    options: q.options.map(mapOption),
  };
}

function mapOption(o: OptionInput): QuizOption {
  const opt: QuizOption = {
    id: o.id,
    text: localizedToEn(o.text, o.id),
  };
  if (o.scores) opt.scores = o.scores;
  if (o.profileId) opt.profileId = o.profileId;
  return opt;
}

/**
 * Build QuizProfile entries from dimensions (for multi-dimension scoring)
 * or from resultProfiles (for profile-driven scoring).
 */
function buildProfiles(
  input: QuizGeneratorInputWithContent,
): QuizProfile[] {
  if (input.scoringModel === 'profile-driven') {
    return input.resultProfiles.map((rp, i) => ({
      id: rp.id,
      title: localizedToEn(rp.name, rp.id),
      emoji: rp.visual.symbol,
      color: rp.visual.color,
      description: localizedToEn(rp.description, ''),
      priority: i,
    }));
  }

  // multi-dimension: one profile per dimension with threshold-based matching
  return input.dimensions.map((dim, i) => {
    const rp = input.resultProfiles.find(r => r.id === dim.key);
    return {
      id: dim.key,
      title: rp ? localizedToEn(rp.name, dim.label) : dim.label,
      emoji: rp?.visual.symbol ?? '',
      color: rp?.visual.color ?? '#D4AF37',
      description: rp ? localizedToEn(rp.description, dim.description) : dim.description,
      thresholds: { [dim.key]: 6 },
      priority: i,
    };
  });
}

/**
 * Build resultMapping from dimensions — maps each profile to its marker traits.
 */
function buildResultMapping(input: QuizGeneratorInputWithContent): {
  markerId: string;
  profileToTraits: Record<string, Record<string, number>>;
} {
  const quizId = `${input.topic}_01`;
  const profileToTraits: Record<string, Record<string, number>> = {};

  for (const dim of input.dimensions) {
    const traits: Record<string, number> = {};
    for (const kw of dim.markerKeywords) {
      traits[kw] = 1.0;
    }
    profileToTraits[dim.key] = traits;
  }

  return {
    markerId: `marker.${input.patternCategory}.${input.topic}`,
    profileToTraits,
  };
}

// ─────────────────────────────────────────────────────────────
// Main assembler
// ─────────────────────────────────────────────────────────────

/**
 * Assembles a complete GeneratedQuiz from structured input with pre-authored content.
 *
 * @param input - QuizGeneratorInput extended with questions and resultProfiles
 * @returns GeneratedQuiz with all 5 artifacts
 * @throws Error if questions array is empty or missing
 */
export function generateQuiz(input: QuizGeneratorInputWithContent): GeneratedQuiz {
  if (!input.questions || input.questions.length === 0) {
    throw new Error(
      'questions are required: the generator assembles pre-authored content, it does not create questions',
    );
  }

  const quizId = `${input.topic}_01`;

  // 1. Build QuizDefinition matching schema.ts format exactly
  const definition: QuizDefinition = {
    id: quizId,
    title: localizedToEn(input.title, input.topic.replace(/_/g, ' ')),
    titleDe: localizedToDe(input.title, input.topic.replace(/_/g, ' ')),
    subtitle: localizedToEn(input.subtitle, input.targetPattern),
    subtitleDe: localizedToDe(input.subtitle, input.targetPattern),
    emoji: input.emoji ?? '',
    accentColor: input.accentColor ?? '#D4AF37',
    scoringModel: input.scoringModel,
    dimensions: input.dimensions.map(d => d.key),
    questions: input.questions.map(mapQuestion),
    profiles: buildProfiles(input),
    resultMapping: buildResultMapping(input),
    premium: input.cluster.isPremium || undefined,
  };

  // 2. Generate affinity map entries for all marker keywords
  const affinityMapEntries = generateAffinityEntries(input.dimensions);

  // 3. Generate event converter spec
  const eventConverter = generateEventConverter(quizId, input.dimensions);

  // 4. Set aggregation rules
  const aggregation: AggregationRules = {
    contributesTo: [input.cluster.clusterId],
    weight: input.aggregationWeight ?? 0.15,
    decay: 'none',
    recurrence: 'once',
    maxNatalDeviation: 0.5,
  };

  return {
    definition,
    resultProfiles: input.resultProfiles,
    affinityMapEntries,
    eventConverter,
    aggregation,
  };
}
