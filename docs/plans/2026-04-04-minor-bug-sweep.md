# Minor Bug Sweep Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 6 minor bugs found during code review: dead hover state, hardcoded i18n strings, missing aria-labels, CosmicWeatherCard leftovers, duplicate variable.

**Architecture:** Pure cleanup — no new features, no architectural changes. Each task is a single file edit + test verification.

**Tech Stack:** React 19, TypeScript (strict: true), Vitest, i18n/translations.ts

---

### Task 1: Fix dead hover state in CosmicInfluenceSection

**Files:**
- Modify: `src/components/dashboard/CosmicInfluenceSection.tsx:102`

**Step 1: Fix the hover class**

In `src/components/dashboard/CosmicInfluenceSection.tsx` line ~102, change:
```tsx
// BEFORE:
<span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] group-hover:text-zinc-300 transition-colors">

// AFTER:
<span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] group-hover:text-zinc-100 transition-colors">
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/cosmic-influence-section.test.tsx`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/dashboard/CosmicInfluenceSection.tsx
git commit -m "fix(ui): restore hover effect on CosmicInfluence gauge labels"
```

---

### Task 2: Move hardcoded VibesModal strings to i18n

**Files:**
- Modify: `src/components/dashboard/VibesModal.tsx:54-56`
- Modify: `src/i18n/translations.ts` (add vibesModal keys)

**Step 1: Add i18n keys to translations.ts**

In the English `translationsEn` object, find the `dashboard` section and add:
```typescript
vibesModal: {
  whyLabel: 'Why am I seeing this?',
  signaturLabel: 'Your Signature:',
  transitLabel: 'Current Phase:',
},
```

In the German `translationsDe` object, add:
```typescript
vibesModal: {
  whyLabel: 'Warum sehe ich das?',
  signaturLabel: 'Deine Signatur:',
  transitLabel: 'Aktuelle Phase:',
},
```

**Step 2: Update VibesModal.tsx**

Replace the three hardcoded lines:
```tsx
// BEFORE:
const whyLabel = lang === 'de' ? 'Warum sehe ich das?' : 'Why am I seeing this?';
const signaturLabel = lang === 'de' ? 'Deine Signatur:' : 'Your Signature:';
const transitLabel = lang === 'de' ? 'Aktuelle Phase:' : 'Current Phase:';

// AFTER:
const whyLabel = t('dashboard.vibesModal.whyLabel');
const signaturLabel = t('dashboard.vibesModal.signaturLabel');
const transitLabel = t('dashboard.vibesModal.transitLabel');
```

Note: The component must already import `useLanguage` and have `const { t } = useLanguage()`. If only `lang` is destructured, add `t` to the destructuring.

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass (VibesModal may not have dedicated tests — verify no regressions)

**Step 4: Commit**

```bash
git add src/components/dashboard/VibesModal.tsx src/i18n/translations.ts
git commit -m "fix(i18n): move hardcoded VibesModal strings to translations"
```

---

### Task 3: Move hardcoded CosmicWeatherCard strings to i18n

**Files:**
- Modify: `src/components/CosmicWeatherCard.tsx:133,184`
- Modify: `src/i18n/translations.ts`

**Step 1: Add i18n keys**

In EN translations, add under `dashboard`:
```typescript
cosmicWeatherCard: {
  leviLabel: 'Levi',
  tierPremium: 'LEVI PREMIUM',
  tierFreemium: 'FREEMIUM',
},
```

In DE translations, add:
```typescript
cosmicWeatherCard: {
  leviLabel: 'Levi',
  tierPremium: 'LEVI PREMIUM',
  tierFreemium: 'FREEMIUM',
},
```

**Step 2: Update CosmicWeatherCard.tsx**

Line ~133:
```tsx
// BEFORE:
  Levi

// AFTER:
  {t('dashboard.cosmicWeatherCard.leviLabel')}
```

Line ~184:
```tsx
// BEFORE:
{horoscope.tier === 'premium' ? 'LEVI PREMIUM' : 'FREEMIUM'}

// AFTER:
{horoscope.tier === 'premium' ? t('dashboard.cosmicWeatherCard.tierPremium') : t('dashboard.cosmicWeatherCard.tierFreemium')}
```

**Step 3: Run tests**

Run: `npx vitest run`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/CosmicWeatherCard.tsx src/i18n/translations.ts
git commit -m "fix(i18n): move hardcoded CosmicWeatherCard strings to translations"
```

---

### Task 4: Add aria-labels to ShareCard buttons

**Files:**
- Modify: `src/components/ShareCard.tsx:34,44,54,64`
- Modify: `src/i18n/translations.ts`

**Step 1: Add i18n keys**

EN:
```typescript
share: {
  whatsappAria: 'Share on WhatsApp',
  twitterAria: 'Share on X / Twitter',
  linkedinAria: 'Share on LinkedIn',
  copyAria: 'Copy link to clipboard',
},
```

DE:
```typescript
share: {
  whatsappAria: 'Auf WhatsApp teilen',
  twitterAria: 'Auf X / Twitter teilen',
  linkedinAria: 'Auf LinkedIn teilen',
  copyAria: 'Link kopieren',
},
```

**Step 2: Add aria-labels to each button**

For each of the 4 share buttons, add `aria-label={t('dashboard.share.<platform>Aria')}`. The exact prop name depends on the current button structure — read the file first to determine exact insertion points.

**Step 3: Run tests**

Run: `npx vitest run`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/ShareCard.tsx src/i18n/translations.ts
git commit -m "fix(a11y): add aria-labels to ShareCard social buttons"
```

---

### Task 5: Remove duplicate sunSign variable

**Files:**
- Modify: `src/components/Dashboard.tsx:250`

**Step 1: Check usage**

The `sunSign` variable in Dashboard.tsx (line ~250) is used for:
- `birthConstellationKey` memo (getConstellationForSign)
- Passed to AgentSection via `sunSign={apiData?.western?.zodiac_sign || ''}`

Since it's used in Dashboard.tsx scope, it's NOT a duplicate — DashboardAstroSection computes its own independently. Both are needed in their respective scopes. **No change needed.**

**Step 2: Skip — no commit**

This is not actually a bug. Both components need their own local `sunSign` since they operate independently.

---

### Task 6: Clean up CosmicWeatherCard refresh tooltip

**Files:**
- Modify: `src/components/CosmicWeatherCard.tsx`
- Modify: `src/i18n/translations.ts`

**Step 1: Replace inline refresh tooltip**

The refresh button tooltip was changed to an inline ternary:
```tsx
title={lang === 'de' ? 'Aktualisieren' : 'Refresh'}
```

Add to i18n instead:

EN: `cosmicWeatherCard.refreshLabel: 'Refresh'`
DE: `cosmicWeatherCard.refreshLabel: 'Aktualisieren'`

Then:
```tsx
title={t('dashboard.cosmicWeatherCard.refreshLabel')}
```

This can be combined with Task 3's commit since it touches the same file and namespace.

**Step 2: Run tests**

Run: `npx vitest run`
Expected: PASS

**Step 3: Commit** (combined with Task 3)

---

## Summary

| Task | Type | Files | Effort |
|------|------|-------|--------|
| 1. Dead hover state | Cosmetic | 1 | 1 min |
| 2. VibesModal i18n | Minor bug | 2 | 5 min |
| 3+6. CosmicWeatherCard i18n | Minor bug | 2 | 5 min |
| 4. ShareCard aria-labels | Accessibility | 2 | 5 min |
| 5. Duplicate sunSign | ~~Dead code~~ | 0 | Skip — not a bug |

**Total: 4 tasks, ~16 minutes, 4 commits**
