export const QUIZ_MODULE_IDS = [
  "personality-core",
  "career-dna",
  "social-role",
  "aura-colors",
  "partner-match-01",
  "partner-match-02",
  "partner-match-03"
] as const;

export type QuizModuleId = (typeof QUIZ_MODULE_IDS)[number];
