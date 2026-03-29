// Quiz schemas and scoring
export { scoreQuiz } from './scoring';
export type { QuizDefinition, QuizResult } from './schema';

// Generator pipeline
export { generateQuiz } from './generate-quiz';
export type { QuizGeneratorInputWithContent } from './generate-quiz';
export { generateAffinityEntries } from './generate-affinity-entries';
export { generateEventConverter } from './generate-event-converter';
export type {
  QuizGeneratorInput,
  GeneratedQuiz,
  DimensionSpec,
  ResultProfile,
  AffinityMapEntry,
  EventConverterSpec,
  AggregationRules,
  MarkerDomain,
  SignaturDimension,
  MasterSignalDimension,
} from './generator-types';
export {
  ZODIAC_SECTORS,
  SIGNATUR_DIMENSIONS,
  MASTER_SIGNAL_DIMENSIONS,
  FUSION_WEIGHTS,
} from './generator-types';

// Quiz definitions
export { shadowArchetypeQuiz } from './definitions/shadow-archetype';
