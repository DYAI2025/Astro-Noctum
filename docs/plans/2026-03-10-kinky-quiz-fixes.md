# Kinky Quiz Fixes: Series Complete + i18n

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix hardcoded `quizIndex === 4` and add bilingual (DE/EN) support to KinkySeriesQuiz using existing JSON translations and LanguageContext.

**Architecture:** The component reads from JSON files that already have `de-DE` and `en-US` keys for all user-facing strings. We add a locale helper mapping `Language` (`'de'|'en'`) to JSON locale key (`'de-DE'|'en-US'`), consume `useLanguage()` from context, and thread the locale key through all sub-components.

**Tech Stack:** React 19, TypeScript, LanguageContext (`src/contexts/LanguageContext.tsx`)

---

## Task 1: Fix Hardcoded Series Complete Check

**Files:**
- Modify: `src/components/quizzes/Kinky/KinkySeriesQuiz.tsx:500`

**Step 1: Replace hardcoded check**

Change line 500 from:
```typescript
const isSeriesComplete = quizIndex === 4;
```
to:
```typescript
const isSeriesComplete = quizIndex === data.series.quiz_count;
```

**Step 2: Verify type-check passes**

Run: `npx tsc --noEmit 2>&1 | grep "KinkySeriesQuiz" || echo "CLEAN"`
Expected: CLEAN (no errors in this file)

**Step 3: Commit**

```bash
git add src/components/quizzes/Kinky/KinkySeriesQuiz.tsx
git commit -m "fix: use data.series.quiz_count instead of hardcoded 4 for series complete"
```

---

## Task 2: Update QuizData Interface for Bilingual Fields

The `QuizData` interface currently types `series.title`, `series.theme`, `meta.facet_label`, and `disclaimer` as `{ 'de-DE': string }` only. The JSON actually has `{ 'de-DE': string; 'en-US': string }`.

**Files:**
- Modify: `src/components/quizzes/Kinky/KinkySeriesQuiz.tsx:45-56`

**Step 1: Fix QuizData interface**

Replace:
```typescript
interface QuizData {
  series: { title: { 'de-DE': string }; quiz_index: number; quiz_count: number; theme: { 'de-DE': string } };
  meta: { facet_label: { 'de-DE': string }; axis_key: string };
  questions: QuizQuestion[];
  profiles: QuizProfile[];
  marker_emission: {
    cluster_domain_map: Record<string, string>;
    cluster_keyword_map: Record<string, string>;
  };
  contribution_event: { series_id: string };
  disclaimer: { 'de-DE': string };
}
```

With:
```typescript
type I18nString = { 'de-DE': string; 'en-US': string };

interface QuizData {
  series: { title: I18nString; quiz_index: number; quiz_count: number; theme: I18nString };
  meta: { facet_label: I18nString; axis_key: string };
  questions: QuizQuestion[];
  profiles: QuizProfile[];
  marker_emission: {
    cluster_domain_map: Record<string, string>;
    cluster_keyword_map: Record<string, string>;
  };
  contribution_event: { series_id: string };
  disclaimer: I18nString;
}
```

Note: `QuizOption.label`, `QuizQuestion.prompt`, and `QuizProfile` fields already have `{ 'de-DE': string; 'en-US': string }` — no changes needed there.

**Step 2: Verify type-check passes**

Run: `npx tsc --noEmit 2>&1 | grep "KinkySeriesQuiz" || echo "CLEAN"`
Expected: CLEAN

**Step 3: Commit**

```bash
git add src/components/quizzes/Kinky/KinkySeriesQuiz.tsx
git commit -m "fix: widen QuizData interface to include en-US translations"
```

---

## Task 3: Add Locale Key Helper and useLanguage Hook

**Files:**
- Modify: `src/components/quizzes/Kinky/KinkySeriesQuiz.tsx` (top of file + main component)

**Step 1: Add import and locale helper**

After the existing imports (line 4), add:
```typescript
import { useLanguage } from '@/src/contexts/LanguageContext';
```

After the `type Screen` line (after line 58), add:
```typescript
type LocaleKey = 'de-DE' | 'en-US';
const LOCALE_KEY: Record<'de' | 'en', LocaleKey> = { de: 'de-DE', en: 'en-US' };
```

**Step 2: Add locale to main component**

In the `KinkySeriesQuiz` function (line 463), add after `const data = useMemo(...)`:
```typescript
const { lang } = useLanguage();
const lk = LOCALE_KEY[lang];
```

**Step 3: Verify type-check passes**

Run: `npx tsc --noEmit 2>&1 | grep "KinkySeriesQuiz" || echo "CLEAN"`
Expected: CLEAN

**Step 4: Commit**

```bash
git add src/components/quizzes/Kinky/KinkySeriesQuiz.tsx
git commit -m "feat: add useLanguage hook and locale key helper to KinkySeriesQuiz"
```

---

## Task 4: Thread Locale Through Sub-Components

This is the main i18n task. Each sub-component needs a `lk: LocaleKey` prop to select the right translation.

**Files:**
- Modify: `src/components/quizzes/Kinky/KinkySeriesQuiz.tsx` (multiple sub-components)

### Step 1: Update ProgressBar

Line 84 — hardcoded "Frage". Change:
```typescript
<span className="text-xs text-white/40 uppercase tracking-widest font-sans">Frage</span>
```
to:
```typescript
<span className="text-xs text-white/40 uppercase tracking-widest font-sans">{lk === 'de-DE' ? 'Frage' : 'Question'}</span>
```

Add `lk: LocaleKey` to ProgressBar's props type and thread it from callers.

### Step 2: Update IntroScreen

Add `lk: LocaleKey` to IntroScreen props. Replace all `['de-DE']` with `[lk]`:

| Line | Current | Replacement |
|------|---------|-------------|
| 150 | `data.meta.facet_label['de-DE']` | `data.meta.facet_label[lk]` |
| 154 | `data.series.title['de-DE']` | `data.series.title[lk]` |
| 158 | `data.series.theme['de-DE']` | `data.series.theme[lk]` |
| 146 | `Quiz {quizIndex} von {data.series.quiz_count}` | `{lk === 'de-DE' ? `Quiz ${quizIndex} von ${data.series.quiz_count}` : `Quiz ${quizIndex} of ${data.series.quiz_count}`}` |
| 167 | `2 Minuten` | `{lk === 'de-DE' ? '2 Minuten' : '2 Minutes'}` |
| 174 | `{data.questions.length} Fragen` | `{data.questions.length} {lk === 'de-DE' ? 'Fragen' : 'Questions'}` |
| 185 | `Beginnen` | `{lk === 'de-DE' ? 'Beginnen' : 'Start'}` |

### Step 3: Update QuestionScreen

Add `lk: LocaleKey` to QuestionScreen props. Replace:

| Line | Current | Replacement |
|------|---------|-------------|
| 229 | `question.prompt['de-DE']` | `question.prompt[lk]` |
| 264 | `option.label['de-DE']` | `option.label[lk]` |

### Step 4: Update LoadingScreen

Add `lk: LocaleKey` to LoadingScreen props. Replace:

| Line | Current | Replacement |
|------|---------|-------------|
| 300 | `Die Flamme liest dich...` | `{lk === 'de-DE' ? 'Die Flamme liest dich...' : 'The flame reads you...'}` |
| 301 | `Dein {facetLabel}-Profil entsteht` | `{lk === 'de-DE' ? `Dein ${facetLabel}-Profil entsteht` : `Your ${facetLabel} profile is forming`}` |

### Step 5: Update ResultScreen

Add `lk: LocaleKey` to ResultScreen props. Replace:

| Line | Current | Replacement |
|------|---------|-------------|
| 349 | `Dein Profil` | `{lk === 'de-DE' ? 'Dein Profil' : 'Your Profile'}` |
| 351 | `profile.title['de-DE']` | `profile.title[lk]` |
| 353 | `profile.tagline['de-DE']` | `profile.tagline[lk]` |
| 362 | `profile.description['de-DE']` | `profile.description[lk]` |
| 368-369 | `stat.label['de-DE']` (key + display) | `stat.label[lk]` |
| 380 | `Verbündete` | `{lk === 'de-DE' ? 'Verbündete' : 'Allies'}` |
| 386 | `Herausforderung` | `{lk === 'de-DE' ? 'Herausforderung' : 'Challenge'}` |
| 403 | `Weiter zur nächsten Facette` / `Fertig` | `{quizIndex < totalQuizzes ? (lk === 'de-DE' ? 'Weiter zur nächsten Facette' : 'Continue to next facet') : (lk === 'de-DE' ? 'Fertig' : 'Done')}` |
| 408-409 | Disclaimer hardcoded DE | Use `data.disclaimer[lk]` — pass `disclaimer: string` as prop from parent |

### Step 6: Update LoadingScreen call in main component

Line 542: pass `lk`:
```typescript
<LoadingScreen key="loading" facetLabel={data.meta.facet_label[lk]} lk={lk} />
```

### Step 7: Update all component calls in main render

Thread `lk` to every sub-component call:
- `IntroScreen`: add `lk={lk}`
- `QuestionScreen`: add `lk={lk}`
- `LoadingScreen`: add `lk={lk}` (and change `facetLabel` to use `[lk]`)
- `ResultScreen`: add `lk={lk}` and `disclaimer={data.disclaimer[lk]}`

### Step 8: Verify type-check passes

Run: `npx tsc --noEmit 2>&1 | grep "KinkySeriesQuiz" || echo "CLEAN"`
Expected: CLEAN

### Step 9: Commit

```bash
git add src/components/quizzes/Kinky/KinkySeriesQuiz.tsx
git commit -m "feat: add bilingual DE/EN support to KinkySeriesQuiz using LanguageContext"
```

---

## Task 5: Manual Smoke Test

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test German (default)**

- Open `http://localhost:3000`
- Navigate to a Kinky quiz cluster
- Click any Kinky quiz (e.g., Quiz 01)
- Verify: Intro screen shows German text ("Beginnen", "Fragen", "Minuten")
- Complete the quiz — verify all screens show German

**Step 3: Test English**

- Add `?lang=en` to the URL
- Start a Kinky quiz
- Verify: Intro shows English ("Start", "Questions", "Minutes")
- Complete quiz — verify result screen shows English profile title/tagline/description/stats

**Step 4: Test series completion**

- Complete Quiz 04
- Verify: The `isSeriesComplete` flag is true (check console or emitted event)
- Verify: Result button says "Fertig" (DE) or "Done" (EN), not "Weiter"

---

## Summary

| Fix | Lines Changed | Risk |
|-----|--------------|------|
| #3 hardcoded `=== 4` | 1 line | Zero — direct data read |
| QuizData interface widening | 6 lines | Zero — additive typing |
| i18n threading | ~25 lines | Low — every string already exists in JSON |
| Total | ~32 lines changed | Low |
