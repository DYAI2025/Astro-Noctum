import { describe, it, expect } from 'vitest';
import { translations, type DeepStringRecord } from '../i18n/translations';

// Walk a dotted path like `signatureReveal.previewNote` in a nested object.
function resolveKey(obj: DeepStringRecord, path: string): string | undefined {
  const parts = path.split('.');
  let current: DeepStringRecord | string = obj;
  for (const p of parts) {
    if (typeof current === 'string') return undefined;
    const next = current[p];
    if (next === undefined) return undefined;
    current = next;
  }
  return typeof current === 'string' ? current : undefined;
}

// Regression guard for 2026-04-19 bug: SignatureReveal.tsx used 5 i18n keys
// that had no corresponding entries in either translationsEn or translationsDe,
// so the onboarding reveal screen showed raw keys ("signatureReveal.previewNote")
// instead of localized copy. Existing SignatureReveal tests mocked useLanguage
// with a fake t-map so the bug was invisible to the suite.
const REQUIRED_KEYS = [
  'signatureReveal.soulprintCalculating',
  'signatureReveal.signatureForming',
  'signatureReveal.signaturePartialError',
  'signatureReveal.previewNote',
  'signatureReveal.continueAnyway',
] as const;

describe('SignatureReveal i18n coverage', () => {
  for (const lang of ['en', 'de'] as const) {
    for (const key of REQUIRED_KEYS) {
      it(`${lang}: "${key}" resolves to a non-empty string`, () => {
        const value = resolveKey(translations[lang], key);
        expect(value, `missing ${lang} translation for ${key}`).toBeDefined();
        expect(typeof value).toBe('string');
        expect(value?.length).toBeGreaterThan(0);
      });
    }
  }
});
