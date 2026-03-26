# GO-LIVE-04: i18n Audit — Hardcoded Strings eliminieren

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate visible Sprachmix from the main user flow by replacing hardcoded strings in the 5 highest-impact components with `t()` calls and adding the missing translation keys to both DE and EN language files.

**Architecture:** 5 tasks. Tasks 1–4 fix one component each (AppErrorBoundary, AuthGate, TourOverlay, LegalFooter). Task 5 does a final grep-audit for remaining obvious hardcoded strings and runs the full build.

**Scope:** This plan targets the visible Go-Live blockers in the main flow. The 22 quiz components (German-only by design) and LandingHero CONTENT refactor are separate follow-ups.

**Tech Stack:** TypeScript, React 19, Vitest

**GitHub Issue:** #180

---

## Task 1: Fix AppErrorBoundary — hardcoded German strings

**Files:**
- Modify: `src/components/AppErrorBoundary.tsx`
- Modify: `src/i18n/translations.ts`

### Step 1 — Confirm current state

```bash
grep -n "Etwas\|schiefgelaufen\|Fehler\|versuchen\|Erneut" src/components/AppErrorBoundary.tsx
```

Confirm that all visible user-facing strings are hardcoded German. Also check if the project has `react-error-boundary` installed:

```bash
grep "react-error-boundary" package.json
```

### Step 2 — Add translation keys to translations.ts

Read `src/i18n/translations.ts` first and check whether a top-level `error` key already exists. If it does, add `boundary` nested under it. If it does not, add the full `error` block.

Keys to add in both `translationsEn` and `translationsDe`:

```typescript
// In translationsEn — add under existing `error` key or as new top-level key:
error: {
  boundary: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    retry: 'Try again',
  }
}

// In translationsDe — add under existing `error` key or as new top-level key:
error: {
  boundary: {
    title: 'Etwas ist schiefgelaufen',
    message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
    retry: 'Erneut versuchen',
  }
}
```

Note: translations.ts uses a nested object with dot-notation resolution via `deepGet`. Adding `error.boundary.*` will be accessible as `t('error.boundary.title')` etc.

### Step 3 — Modify AppErrorBoundary

`AppErrorBoundary` is a class component — React hooks cannot be used inside it. Do NOT convert it to a functional component unless `react-error-boundary` is already in the project dependencies.

Instead, read the language from localStorage directly inside the `render()` method using a static helper:

```typescript
private getTranslation(de: string, en: string): string {
  const lang = localStorage.getItem('bazodiac_lang') || 'en';
  return lang === 'de' ? de : en;
}
```

Then replace every hardcoded string in `render()` with calls to `this.getTranslation(...)`:

```typescript
// Replace: "Etwas ist schiefgelaufen"
this.getTranslation('Etwas ist schiefgelaufen', 'Something went wrong')

// Replace: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut."
this.getTranslation(
  'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.',
  'An unexpected error occurred. Please try again.'
)

// Replace: "Erneut versuchen"
this.getTranslation('Erneut versuchen', 'Try again')
```

The DE values intentionally mirror the translations.ts DE strings so that if a future refactor wires the class component to the real translation context, the strings are consistent.

### Step 4 — Run tests

```bash
npm run test -- --run
```

Confirm no regressions. If an existing test covers AppErrorBoundary, confirm it still passes with English output when `localStorage` does not have `bazodiac_lang` set.

### Step 5 — Commit

```bash
git add src/components/AppErrorBoundary.tsx src/i18n/translations.ts
git commit -m "fix(i18n): localize AppErrorBoundary strings via localStorage lang read (GO-LIVE-04)"
```

---

## Task 2: Fix AuthGate — replace 6 inline lang ternaries with t()

**Files:**
- Modify: `src/components/AuthGate.tsx`
- Modify: `src/i18n/translations.ts`

### Step 1 — Confirm current state

```bash
grep -n 'lang === "de"' src/components/AuthGate.tsx
```

Expected output: at least 6 lines with inline ternaries around auth strings. Also confirm that `useLanguage` is already imported:

```bash
grep -n "useLanguage\|import.*Language" src/components/AuthGate.tsx
```

### Step 2 — Add translation keys to translations.ts

Read the current `auth.*` keys in `translations.ts` to avoid duplicates. Then add any missing keys:

```typescript
// In translationsEn — under existing `auth` block:
auth: {
  signin: 'Login',
  register: 'Register now',
  // ... (preserve all existing auth.* keys)
}

// In translationsDe — under existing `auth` block:
auth: {
  signin: 'Einloggen',
  register: 'Jetzt registrieren',
  // ... (preserve all existing auth.* keys)
}
```

Check for existing `auth.signin` and `auth.register` keys before adding — if they exist under a different name (e.g. `auth.login`), use the existing key instead of adding a duplicate.

### Step 3 — Modify AuthGate

Replace each inline ternary with a `t()` call. The `t` function is already available via `useLanguage`. For each occurrence:

```typescript
// Line ~96: Replace:
lang === "de" ? "Einloggen" : "Login"
// With:
t('auth.signin')

// Line ~129: Replace (same pattern):
lang === "de" ? "Einloggen" : "Login"
// With:
t('auth.signin')

// Line ~149: Replace:
lang === "de" ? "Jetzt registrieren" : "Register now"
// With:
t('auth.register')
```

Remove the `lang` destructure from `useLanguage()` if it is no longer used after the replacements (check all remaining usages of `lang` in the file first).

### Step 4 — Run tests

```bash
npm run test -- --run
```

Confirm no regressions.

### Step 5 — Commit

```bash
git add src/components/AuthGate.tsx src/i18n/translations.ts
git commit -m "fix(i18n): replace AuthGate lang ternaries with t() calls (GO-LIVE-04)"
```

---

## Task 3: Fix TourOverlay — month names array and button text

**Files:**
- Modify: `src/components/dashboard/TourOverlay.tsx`
- Modify: `src/i18n/translations.ts`

### Step 1 — Confirm current state

```bash
grep -n "Januar\|Februar\|Weiter\|month\|MONTHS" src/components/dashboard/TourOverlay.tsx
```

Confirm the hardcoded month names array (lines ~17–20) and the "Weiter" button text. Also check whether `useLanguage` is already imported:

```bash
grep -n "useLanguage\|import.*Language" src/components/dashboard/TourOverlay.tsx
```

### Step 2 — Add translation keys to translations.ts

Translation arrays are not natively supported by the `t()` deepGet resolver — add 12 individual month keys plus the next-button key:

```typescript
// In translationsEn:
tour: {
  next: 'Next',
  month: {
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
  }
}

// In translationsDe:
tour: {
  next: 'Weiter',
  month: {
    january: 'Januar',
    february: 'Februar',
    march: 'März',
    april: 'April',
    may: 'Mai',
    june: 'Juni',
    july: 'Juli',
    august: 'August',
    september: 'September',
    october: 'Oktober',
    november: 'November',
    december: 'Dezember',
  }
}
```

If a `tour` key already exists in translations.ts, add the new keys nested within the existing `tour` object.

### Step 3 — Modify TourOverlay

Add `useLanguage` import if not present:

```typescript
import { useLanguage } from '@/src/contexts/LanguageContext';
```

Inside the component, destructure `t` from the hook:

```typescript
const { t } = useLanguage();
```

Replace the hardcoded month names array with a dynamically built array using `t()`:

```typescript
const MONTHS = [
  t('tour.month.january'),
  t('tour.month.february'),
  t('tour.month.march'),
  t('tour.month.april'),
  t('tour.month.may'),
  t('tour.month.june'),
  t('tour.month.july'),
  t('tour.month.august'),
  t('tour.month.september'),
  t('tour.month.october'),
  t('tour.month.november'),
  t('tour.month.december'),
];
```

Replace the hardcoded "Weiter" button:

```typescript
// Replace: "Weiter"
// With:
{t('tour.next')}
```

Also replace any other hardcoded tour step narrative text with `t()` calls, adding the corresponding keys to translations.ts (lines ~41 and ~45 per the audit).

### Step 4 — Run tests

```bash
npm run test -- --run
```

Confirm no regressions.

### Step 5 — Commit

```bash
git add src/components/dashboard/TourOverlay.tsx src/i18n/translations.ts
git commit -m "fix(i18n): localize TourOverlay month names and button text (GO-LIVE-04)"
```

---

## Task 4: Fix LegalFooter — add useLanguage and extract strings

**Files:**
- Modify: `src/components/LegalFooter.tsx`
- Modify: `src/i18n/translations.ts`

### Step 1 — Confirm current state

Read the full file to identify all user-visible strings:

```bash
# List all string literals in the file
grep -n '"[A-Za-zÄÖÜäöüß][^"]*"' src/components/LegalFooter.tsx | head -40
```

Identify each hardcoded string and its semantic meaning to choose the correct translation key path.

### Step 2 — Add translation keys to translations.ts

After reading the current state, add keys under a `legal` namespace (or `footer` if that already exists). Example structure for common footer content:

```typescript
// In translationsEn:
legal: {
  imprint: 'Imprint',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  // add all strings found in Step 1
}

// In translationsDe:
legal: {
  imprint: 'Impressum',
  privacy: 'Datenschutz',
  terms: 'Nutzungsbedingungen',
  // add all strings found in Step 1
}
```

Adjust keys based on actual content found in Step 1.

### Step 3 — Modify LegalFooter

Add the `useLanguage` import:

```typescript
import { useLanguage } from '@/src/contexts/LanguageContext';
```

Add the hook call inside the component function and destructure `t`:

```typescript
const { t } = useLanguage();
```

Replace each hardcoded string with the corresponding `t('legal.*')` call.

### Step 4 — Run tests

```bash
npm run test -- --run
```

Confirm no regressions.

### Step 5 — Commit

```bash
git add src/components/LegalFooter.tsx src/i18n/translations.ts
git commit -m "fix(i18n): add useLanguage to LegalFooter and extract hardcoded strings (GO-LIVE-04)"
```

---

## Task 5: Grep audit + build verification

**Files:**
- No file changes required unless obvious regressions are found

### Step 1 — Grep for remaining obvious hardcoded strings in main-flow components

Run targeted searches to surface any remaining Sprachmix in the main user flow (exclude quiz components — those are German-only by design):

```bash
# Hardcoded "Loading..." variants
grep -rn '"Loading\|Laden\.\.' src/components/ --include="*.tsx" | grep -v "quizzes/"

# Obvious German-only strings in non-quiz components
grep -rn '"Bitte\|"Fehler\|"Willkommen\|"Weiter\|"Einloggen\|"Registrieren' src/components/ --include="*.tsx" | grep -v "quizzes/"

# Components still missing useLanguage import
grep -rL "useLanguage" src/components/*.tsx 2>/dev/null | head -20

# lang ternary pattern — remaining occurrences
grep -rn 'lang === "de" ?' src/components/ --include="*.tsx" | grep -v "quizzes/"
```

Review the output. If critical main-flow strings are found, fix them inline in this task (add keys to translations.ts + replace with t()). Document any non-critical findings as follow-up items.

### Step 2 — Run full build

```bash
npm run build
```

Must succeed with no TypeScript errors. If TSC errors are introduced by this plan's changes, fix them before proceeding.

### Step 3 — Run full test suite

```bash
npm run test -- --run
```

800+ tests must pass. Investigate and fix any failures introduced by this plan's changes.

### Step 4 — Commit

If Step 1 produced any additional fixes:

```bash
git add src/components/ src/i18n/translations.ts
git commit -m "fix(i18n): grep audit — remaining main-flow hardcoded strings (GO-LIVE-04)"
```

If no additional changes were needed:

```bash
git commit --allow-empty -m "chore(i18n): GO-LIVE-04 audit complete — build and test suite green"
```

---

## Completion Criteria

- [ ] `AppErrorBoundary` renders English text when `bazodiac_lang` is not set or is `'en'`
- [ ] `AuthGate` uses `t()` for all auth button labels — no `lang === "de"` ternaries remain
- [ ] `TourOverlay` month names and "Weiter" button respond to language switch
- [ ] `LegalFooter` uses `useLanguage` and all visible strings are in translations.ts
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes (800+ tests)
- [ ] No new `lang === "de"` ternaries introduced outside quiz components
