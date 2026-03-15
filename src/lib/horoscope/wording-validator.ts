/**
 * Horoscope Wording Validator
 *
 * Ensures horoscope text follows the Ring-native voice:
 * ✅ "Dein Antrieb-Feld flammt heute besonders."
 * ✅ "Die Spannung zwischen Tiefe und Freiheit löst sich heute leichter."
 * ❌ "Mars steht im Quadrat zu Saturn." (too technical)
 * ❌ "Du solltest heute vorsichtig sein." (imperative forbidden)
 * ❌ "Du hast eine toxische Persönlichkeit." (diagnostic forbidden)
 */

// ── Forbidden patterns ────────────────────────────────────────────────

const IMPERATIVE_PATTERNS_DE = [
  /\bdu solltest\b/i,
  /\bdu musst\b/i,
  /\bsei vorsichtig\b/i,
  /\bpass auf\b/i,
  /\bvermeide\b/i,
  /\bhöre auf\b/i,
  /\bmache?\b.*\bnicht\b/i,
  /\btue?\b.*\bnicht\b/i,
];

const IMPERATIVE_PATTERNS_EN = [
  /\byou should\b/i,
  /\byou must\b/i,
  /\bbe careful\b/i,
  /\bwatch out\b/i,
  /\bavoid\b/i,
  /\bstop\b.*\bing\b/i,
  /\bdon'?t\b/i,
  /\bnever\b/i,
];

const DIAGNOSTIC_PATTERNS = [
  /\btoxisch\b/i,
  /\btoxic\b/i,
  /\bstörung\b/i,
  /\bdisorder\b/i,
  /\bdiagnose\b/i,
  /\bdiagnosis\b/i,
  /\bkrankh/i,
  /\bdisease\b/i,
  /\btherapie\b/i,
  /\btherapy\b/i,
  /\bnarziss/i,
  /\bnarciss/i,
  /\bdepression\b/i,
  /\banxiety\b/i,
  /\bangststörung\b/i,
];

const TECHNICAL_ASTRO_PATTERNS = [
  /\b(?:quadrat|opposition|konjunktion|trigon|sextil)\b/i,
  /\b(?:square|opposition|conjunction|trine|sextile)\b/i,
  /\b(?:mars|venus|jupiter|saturn|pluto|neptun|uranus)\b.*\b(?:steht|transit|aspekt)\b/i,
  /\b(?:mars|venus|jupiter|saturn|pluto|neptune|uranus)\b.*\b(?:is in|transits|aspects)\b/i,
];

// ── Validation result ─────────────────────────────────────────────────

export interface WordingViolation {
  type: 'imperative' | 'diagnostic' | 'technical';
  pattern: string;
  match: string;
  position: number;
}

export interface WordingValidationResult {
  valid: boolean;
  violations: WordingViolation[];
}

// ── Validator ─────────────────────────────────────────────────────────

export function validateWording(text: string, lang: 'de' | 'en' = 'de'): WordingValidationResult {
  const violations: WordingViolation[] = [];

  const imperativePatterns = lang === 'de' ? IMPERATIVE_PATTERNS_DE : IMPERATIVE_PATTERNS_EN;

  for (const pattern of imperativePatterns) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'imperative',
        pattern: pattern.source,
        match: match[0],
        position: match.index ?? 0,
      });
    }
  }

  for (const pattern of DIAGNOSTIC_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'diagnostic',
        pattern: pattern.source,
        match: match[0],
        position: match.index ?? 0,
      });
    }
  }

  for (const pattern of TECHNICAL_ASTRO_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        type: 'technical',
        pattern: pattern.source,
        match: match[0],
        position: match.index ?? 0,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Strip or rewrite forbidden patterns from text.
 * Last-resort safety net — should rarely fire if templates are well-written.
 */
export function sanitizeWording(text: string, lang: 'de' | 'en' = 'de'): string {
  let result = text;

  // Replace imperative "Du solltest" → "Es könnte hilfreich sein"
  if (lang === 'de') {
    result = result.replace(/\bDu solltest\b/gi, 'Es könnte bereichernd sein');
    result = result.replace(/\bDu musst\b/gi, 'Es liegt nahe');
    result = result.replace(/\bSei vorsichtig\b/gi, 'Achtsamkeit könnte heute besonders wertvoll sein');
    result = result.replace(/\bVermeide\b/gi, 'Weniger Fokus auf');
  } else {
    result = result.replace(/\bYou should\b/gi, 'It might be enriching to');
    result = result.replace(/\bYou must\b/gi, 'It suggests');
    result = result.replace(/\bBe careful\b/gi, 'Mindfulness might be especially valuable today');
    result = result.replace(/\bAvoid\b/gi, 'Less focus on');
  }

  return result;
}
