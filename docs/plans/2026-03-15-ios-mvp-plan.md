# Bazodiac iOS MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship Bazodiac as a polished iOS app (iPhone, iOS 16+) with full quiz system (22 quizzes), native 3D Signatur visualization, and native ElevenLabs voice agent within 5 weeks + 1 week App Store review buffer.

**Architecture:** Three parallel workstreams — (1) JSON-driven quiz engine that renders all 22 quizzes from a unified schema, (2) native 3D Signatur via expo-gl/three.js ported from the web canvas, (3) native ElevenLabs SDK integration. The mobile app lives in `apps/mobile/` within the Astro-Noctum monorepo. Shared logic is in `packages/shared/`.

**Tech Stack:** React Native 0.79, Expo 53, TypeScript, @bazodiac/shared (fusion signal math), expo-gl + three.js (3D), ElevenLabs iOS SDK (voice), Supabase (auth/data), Stripe (payments via expo-web-browser)

---

## What Already Works (DO NOT REBUILD)

- Auth (signup/signin via Supabase)
- Onboarding (birth data → BAFE calculation → Supabase persistence)
- Dashboard (cosmic profile, space weather, AI interpretation)
- Stripe checkout (premium upgrade via WebBrowser)
- Offline contribution queue (AsyncStorage + auto-flush)
- Navigation (tabs + stack, deep linking)
- Device identity (SecureStore)
- Profile sync (Supabase realtime + 45s polling)

---

## Workstream 1: Quiz System (Weeks 1-3)

### Overview

The web app has 22 quiz components as individual TSX files. Each follows one of 3 scoring patterns:

| Pattern | Quizzes | How it works |
|---------|---------|-------------|
| **Multi-Dimension** | PersonalityQuiz, EQQuiz, CharmeQuiz | Scores accumulate into named dimensions, profile matched via thresholds |
| **Categorical** | DestinyQuiz, CareerDNAQuiz, SpotlightQuiz, SocialRoleQuiz | Answers map to categories, highest total wins |
| **Profile-Driven** | KrafttierQuiz, AuraColorsQuiz, BlumenwesenQuiz, EnergiesteinQuiz, CelebritySoulmateQuiz, PartyQuiz, RpgIdentityQuiz, LoveLanguagesQuiz | Each answer votes for a profile, majority wins |

**Approach:** Define a unified JSON schema covering all 3 patterns. Build one `QuizRenderer` component that handles any quiz from its JSON definition. Extract quiz data from the 22 web TSX files into JSON.

---

### Task 1: Define quiz JSON schema in shared package

**Files:**
- Create: `packages/shared/src/quizzes/schema.ts`

**Step 1: Create the unified quiz schema types**

```typescript
// packages/shared/src/quizzes/schema.ts

/** Scoring models that cover all 22 Bazodiac quizzes */
export type ScoringModel = 'multi-dimension' | 'categorical' | 'profile-driven';

export interface QuizOption {
  id: string;
  text: string;
  /** For multi-dimension/categorical: maps dimension/category → score */
  scores?: Record<string, number>;
  /** For profile-driven: which profile this option votes for */
  profileId?: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  /** Optional context/category label shown above the question */
  context?: string;
  options: QuizOption[];
}

export interface QuizProfile {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  /** For multi-dimension: threshold rules as "dimension >= value" pairs */
  thresholds?: Record<string, number>;
  /** For categorical: minimum score to match this profile */
  minScore?: number;
  /** Priority when multiple profiles match (lower = higher priority) */
  priority?: number;
}

export interface QuizResultMapping {
  /** LME marker ID emitted when this quiz is completed */
  markerId: string;
  /** Maps profile IDs to trait scores for the Fusion Ring signal */
  profileToTraits: Record<string, Record<string, number>>;
}

export interface QuizDefinition {
  id: string;
  title: string;
  titleDe: string;
  subtitle: string;
  subtitleDe: string;
  emoji: string;
  accentColor: string;
  scoringModel: ScoringModel;
  /** Dimension names for multi-dimension scoring */
  dimensions?: string[];
  questions: QuizQuestion[];
  profiles: QuizProfile[];
  resultMapping: QuizResultMapping;
  /** Premium-only quiz */
  premium?: boolean;
  /** Part of a series (kinky, partner-match) */
  seriesId?: string;
  seriesOrder?: number;
}
```

**Step 2: Export from shared package**

Add to `packages/shared/src/index.ts`:
```typescript
export * from './quizzes/schema';
```

**Step 3: Verify typecheck passes**

```bash
cd packages/shared && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add packages/shared/src/quizzes/schema.ts packages/shared/src/index.ts
git commit -m "feat(shared): add unified quiz JSON schema types"
```

---

### Task 2: Build the quiz scoring engine

**Files:**
- Create: `packages/shared/src/quizzes/scoring.ts`
- Create: `packages/shared/src/quizzes/__tests__/scoring.test.ts`

**Step 1: Write failing tests**

Create `packages/shared/src/quizzes/__tests__/scoring.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { scoreQuiz } from '../scoring';
import type { QuizDefinition } from '../schema';

const profileDrivenQuiz: QuizDefinition = {
  id: 'test-profile',
  title: 'Test', titleDe: 'Test',
  subtitle: '', subtitleDe: '',
  emoji: '', accentColor: '',
  scoringModel: 'profile-driven',
  questions: [
    { id: 'q1', text: 'Q1', options: [
      { id: 'a', text: 'A', profileId: 'wolf' },
      { id: 'b', text: 'B', profileId: 'eagle' },
    ]},
    { id: 'q2', text: 'Q2', options: [
      { id: 'a', text: 'A', profileId: 'wolf' },
      { id: 'b', text: 'B', profileId: 'eagle' },
    ]},
  ],
  profiles: [
    { id: 'wolf', title: 'Wolf', emoji: '🐺', color: '#fff', description: '' },
    { id: 'eagle', title: 'Eagle', emoji: '🦅', color: '#fff', description: '' },
  ],
  resultMapping: { markerId: 'test', profileToTraits: {} },
};

const multiDimQuiz: QuizDefinition = {
  id: 'test-multi',
  title: 'Test', titleDe: 'Test',
  subtitle: '', subtitleDe: '',
  emoji: '', accentColor: '',
  scoringModel: 'multi-dimension',
  dimensions: ['warmth', 'logic'],
  questions: [
    { id: 'q1', text: 'Q1', options: [
      { id: 'a', text: 'A', scores: { warmth: 3, logic: 1 } },
      { id: 'b', text: 'B', scores: { warmth: 1, logic: 3 } },
    ]},
  ],
  profiles: [
    { id: 'empath', title: 'Empath', emoji: '💗', color: '#fff', description: '', thresholds: { warmth: 2 }, priority: 1 },
    { id: 'analyst', title: 'Analyst', emoji: '🧠', color: '#fff', description: '', thresholds: { logic: 2 }, priority: 2 },
  ],
  resultMapping: { markerId: 'test', profileToTraits: {} },
};

describe('scoreQuiz', () => {
  it('scores profile-driven quiz by majority vote', () => {
    const result = scoreQuiz(profileDrivenQuiz, { q1: 'a', q2: 'a' });
    expect(result.profileId).toBe('wolf');
  });

  it('scores profile-driven quiz with tie goes to first', () => {
    const result = scoreQuiz(profileDrivenQuiz, { q1: 'a', q2: 'b' });
    expect(result.profileId).toBeDefined();
  });

  it('scores multi-dimension quiz by thresholds', () => {
    const result = scoreQuiz(multiDimQuiz, { q1: 'a' });
    expect(result.profileId).toBe('empath');
  });

  it('returns dimension scores', () => {
    const result = scoreQuiz(multiDimQuiz, { q1: 'a' });
    expect(result.dimensionScores).toEqual({ warmth: 3, logic: 1 });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd packages/shared && npx vitest run src/quizzes/__tests__/scoring.test.ts
```

Expected: FAIL — `scoreQuiz` not found

**Step 3: Implement the scoring engine**

Create `packages/shared/src/quizzes/scoring.ts`:

```typescript
import type { QuizDefinition, QuizProfile } from './schema';

export interface QuizResult {
  quizId: string;
  profileId: string;
  profile: QuizProfile;
  dimensionScores: Record<string, number>;
  answers: Record<string, string>;
}

export function scoreQuiz(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): QuizResult {
  switch (quiz.scoringModel) {
    case 'profile-driven':
      return scoreProfileDriven(quiz, answers);
    case 'multi-dimension':
    case 'categorical':
      return scoreDimensional(quiz, answers);
  }
}

function scoreProfileDriven(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): QuizResult {
  const votes: Record<string, number> = {};

  for (const q of quiz.questions) {
    const selectedId = answers[q.id];
    const option = q.options.find(o => o.id === selectedId);
    if (option?.profileId) {
      votes[option.profileId] = (votes[option.profileId] || 0) + 1;
    }
  }

  let maxVotes = 0;
  let winnerId = quiz.profiles[0]?.id ?? '';
  for (const [pid, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerId = pid;
    }
  }

  const profile = quiz.profiles.find(p => p.id === winnerId) ?? quiz.profiles[0];

  return {
    quizId: quiz.id,
    profileId: winnerId,
    profile,
    dimensionScores: votes,
    answers,
  };
}

function scoreDimensional(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): QuizResult {
  const scores: Record<string, number> = {};

  for (const q of quiz.questions) {
    const selectedId = answers[q.id];
    const option = q.options.find(o => o.id === selectedId);
    if (option?.scores) {
      for (const [dim, val] of Object.entries(option.scores)) {
        scores[dim] = (scores[dim] || 0) + val;
      }
    }
  }

  // Match profiles by thresholds (priority order)
  const sorted = [...quiz.profiles].sort(
    (a, b) => (a.priority ?? 99) - (b.priority ?? 99),
  );

  for (const profile of sorted) {
    if (!profile.thresholds) continue;
    const matches = Object.entries(profile.thresholds).every(
      ([dim, min]) => (scores[dim] ?? 0) >= min,
    );
    if (matches) {
      return { quizId: quiz.id, profileId: profile.id, profile, dimensionScores: scores, answers };
    }
  }

  // Fallback: profile with highest matching dimension total
  const fallback = sorted[sorted.length - 1] ?? quiz.profiles[0];
  return { quizId: quiz.id, profileId: fallback.id, profile: fallback, dimensionScores: scores, answers };
}
```

**Step 4: Export from shared**

Add to `packages/shared/src/index.ts`:
```typescript
export * from './quizzes/scoring';
```

**Step 5: Run tests**

```bash
cd packages/shared && npx vitest run src/quizzes/__tests__/scoring.test.ts
```

Expected: All 4 tests PASS

**Step 6: Commit**

```bash
git add packages/shared/src/quizzes/scoring.ts packages/shared/src/quizzes/__tests__/scoring.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add universal quiz scoring engine with tests"
```

---

### Task 3: Extract first 5 quiz definitions to JSON

**Files:**
- Create: `packages/shared/src/quizzes/definitions/personality.ts`
- Create: `packages/shared/src/quizzes/definitions/career-dna.ts`
- Create: `packages/shared/src/quizzes/definitions/aura-colors.ts`
- Create: `packages/shared/src/quizzes/definitions/krafttier.ts`
- Create: `packages/shared/src/quizzes/definitions/destiny.ts`
- Create: `packages/shared/src/quizzes/definitions/index.ts`

**Context:** Each web quiz component (e.g. `src/components/quizzes/PersonalityQuiz.tsx`) contains inline `QUESTIONS` and `PROFILES` arrays. Extract these into `QuizDefinition` objects.

**Step 1: Read each web quiz file and extract question/profile data**

For each quiz, read the source TSX file, extract the QUESTIONS array and PROFILES/result mapping, and create a TypeScript file that exports a `QuizDefinition` object.

Example for PersonalityQuiz — read `src/components/quizzes/PersonalityQuiz.tsx`, find:
- `QUESTIONS` array (usually near top of file)
- `PROFILES` or result calculation logic
- The quiz-to-event mapping from `src/lib/fusion-ring/quiz-to-event.ts`

Then create the definition file following the `QuizDefinition` schema from Task 1.

**Step 2: Create the barrel export**

```typescript
// packages/shared/src/quizzes/definitions/index.ts
import type { QuizDefinition } from '../schema';

import { personalityQuiz } from './personality';
import { careerDnaQuiz } from './career-dna';
import { auraColorsQuiz } from './aura-colors';
import { krafttierQuiz } from './krafttier';
import { destinyQuiz } from './destiny';

export const QUIZ_DEFINITIONS: QuizDefinition[] = [
  personalityQuiz,
  careerDnaQuiz,
  auraColorsQuiz,
  krafttierQuiz,
  destinyQuiz,
];

export { personalityQuiz, careerDnaQuiz, auraColorsQuiz, krafttierQuiz, destinyQuiz };
```

**Step 3: Verify typecheck**

```bash
cd packages/shared && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add packages/shared/src/quizzes/definitions/
git commit -m "feat(shared): extract first 5 quiz definitions (personality, career-dna, aura, krafttier, destiny)"
```

---

### Task 4: Extract remaining 17 quiz definitions

**Files:**
- Create: `packages/shared/src/quizzes/definitions/` — one file per quiz

**Remaining quizzes to extract:**

Regular (9):
- `charme.ts` ← CharmeQuiz.tsx
- `eq.ts` ← EQQuiz.tsx
- `spotlight.ts` ← SpotlightQuiz.tsx
- `social-role.ts` ← SocialRoleQuiz.tsx
- `blumenwesen.ts` ← BlumenwesenQuiz.tsx
- `energiestein.ts` ← EnergiesteinQuiz.tsx
- `celebrity-soulmate.ts` ← CelebritySoulmateQuiz.tsx
- `party.ts` ← PartyQuiz.tsx
- `rpg-identity.ts` ← RpgIdentityQuiz.tsx
- `love-languages.ts` ← LoveLanguagesQuiz.tsx (NOTE: this is 10, not 9)

Kinky Series (4):
- `kinky-01.ts` through `kinky-04.ts` ← KinkySeriesQuiz.tsx (multi-facet, premium)

PartnerMatch Series (3 + ConversationAnalysis):
- `partner-match-01.ts` through `partner-match-03.ts` ← PartnerMatchSeriesQuiz.tsx
- `conversation-analysis.ts` ← ConversationAnalysisQuiz.tsx

**Step 1: Extract each quiz following the same pattern as Task 3**

Read the web TSX, extract QUESTIONS + PROFILES, create QuizDefinition.

For series quizzes (Kinky, PartnerMatch): set `seriesId` and `seriesOrder` fields.
For premium quizzes: set `premium: true`.

**Step 2: Add all to the barrel export in `definitions/index.ts`**

**Step 3: Verify typecheck and commit**

```bash
cd packages/shared && npx tsc --noEmit
git add packages/shared/src/quizzes/definitions/
git commit -m "feat(shared): extract all 22 quiz definitions to shared package"
```

---

### Task 5: Build the mobile QuizRenderer component

**Files:**
- Create: `apps/mobile/src/components/QuizRenderer.tsx`

**Context:** This is the single component that renders ANY quiz from a `QuizDefinition`. It handles:
- Question display with progress indicator
- Answer selection (single choice — all Bazodiac quizzes are single choice)
- Scoring via `scoreQuiz()` from shared package
- Result screen with profile display
- ContributionEvent emission via offline queue

**Step 1: Create the QuizRenderer**

The component should have this interface:

```typescript
interface QuizRendererProps {
  quiz: QuizDefinition;
  userId: string;
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
}
```

**UI flow:**
1. Intro screen (title, subtitle, emoji, "Start" button)
2. Question screens (one at a time, progress bar, answer buttons with `min-h-[44px]`)
3. Loading screen (spinner, 1-2 seconds fake delay for dramatic effect)
4. Result screen (profile emoji, title, description, accent color background)
5. "Close" button → calls `onComplete` with result + emits ContributionEvent

**Styling:** Match the dark obsidian theme (`#060b12` background, `#D4AF37` gold accents). Use React Native StyleSheet, not Tailwind.

**Step 2: Verify it renders by importing into QuizScreen temporarily**

**Step 3: Commit**

```bash
git add apps/mobile/src/components/QuizRenderer.tsx
git commit -m "feat(mobile): add universal QuizRenderer component"
```

---

### Task 6: Rebuild QuizScreen with real quiz list

**Files:**
- Modify: `apps/mobile/src/screens/QuizScreen.tsx`

**Step 1: Replace the checkbox mock with a FlatList of quiz cards**

Each card shows:
- Quiz emoji + title
- Completion status (checkmark if done, locked icon if premium + not premium user)
- Tap → opens QuizRenderer in a modal

**Step 2: Add series grouping**

Group Kinky and PartnerMatch quizzes under collapsible headers. Show series progress (e.g., "2/4 complete").

**Step 3: Wire ContributionEvent emission**

On quiz completion:
1. `queueContributionEvent()` with the quiz result
2. `flushContributionQueue()` to sync immediately
3. Update local completion state in AsyncStorage

**Step 4: Verify quiz flow end-to-end**

- Open QuizScreen
- Tap a quiz
- Answer all questions
- See result
- Verify contribution event was queued

**Step 5: Commit**

```bash
git add apps/mobile/src/screens/QuizScreen.tsx
git commit -m "feat(mobile): rebuild QuizScreen with real quiz list and QuizRenderer"
```

---

## Workstream 2: Native 3D Signatur (Weeks 1-3)

### Task 7: Set up expo-gl + three.js rendering context

**Files:**
- Modify: `apps/mobile/package.json` (add expo-gl, three, expo-three)
- Create: `apps/mobile/src/components/SignaturCanvas.tsx`

**Step 1: Install dependencies**

```bash
cd apps/mobile && npx expo install expo-gl three expo-three
```

**Step 2: Create minimal GL canvas**

Build a component that:
- Creates an ExpoGL context
- Initializes a Three.js WebGLRenderer with the GL context
- Renders a simple rotating torus ring (placeholder geometry)
- Uses `requestAnimationFrame` for the render loop
- Handles cleanup on unmount

**Step 3: Verify rendering on iOS simulator**

```bash
cd apps/mobile && npx expo run:ios
```

Navigate to FuRing tab, verify 3D object renders.

**Step 4: Commit**

```bash
git add apps/mobile/package.json apps/mobile/src/components/SignaturCanvas.tsx
git commit -m "feat(mobile): set up expo-gl + three.js rendering context"
```

---

### Task 8: Port Signatur ring geometry and shaders

**Files:**
- Modify: `apps/mobile/src/components/SignaturCanvas.tsx`

**Context:** The web Signatur canvas (`src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx`, ~1750 lines) uses:
- Custom ring geometry with 12 sectors
- Deformation channels driven by the fusion signal
- GLSL shaders for glow effects
- Audio-reactive deformation

**Step 1: Port the ring geometry**

Extract the ring-building logic from the web canvas. Create a 12-sector torus with per-sector deformation driven by `computeFusionSignal()` from `@bazodiac/shared`.

**Step 2: Port simplified shaders**

Mobile GPUs can't handle all web effects. Port:
- Base ring material with sector coloring
- Glow effect (simplified Fresnel)
- Skip: bloom post-processing (too expensive for mobile)

**Step 3: Connect to live fusion signal**

Use `computeFusionSignal()` to drive sector amplitudes. The signal input comes from the user's astro profile (passed as props).

**Step 4: Commit**

```bash
git add apps/mobile/src/components/SignaturCanvas.tsx
git commit -m "feat(mobile): port Signatur ring geometry and simplified shaders"
```

---

### Task 9: Add touch interaction and performance tuning

**Files:**
- Modify: `apps/mobile/src/components/SignaturCanvas.tsx`
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`

**Step 1: Add touch gestures**

- Pan gesture → rotate ring
- Pinch gesture → zoom
- Use `react-native-gesture-handler` (already installed)

**Step 2: Performance optimizations**

- Cap at 30fps (vs 60 on web)
- `powerPreference: 'low-power'`
- Disable antialiasing
- Limit pixel ratio to 1
- Add visibility check — pause render loop when screen not focused

**Step 3: Replace WebView fallback in FuRingScreen**

Remove the "Open Advanced Visual" WebView button. Replace with the native SignaturCanvas component.

**Step 4: Commit**

```bash
git add apps/mobile/src/components/SignaturCanvas.tsx apps/mobile/src/screens/FuRingScreen.tsx
git commit -m "feat(mobile): add touch interaction and replace WebView with native Signatur"
```

---

## Workstream 3: ElevenLabs Native + Polish (Weeks 3-5)

### Task 10: Integrate ElevenLabs native SDK

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/src/lib/elevenlabs.ts`
- Modify: `apps/mobile/src/screens/VoiceScreen.tsx`

**Step 1: Research SDK availability**

Check if `elevenlabs-react-native` or `@11labs/react-native` exists. If not, use the iOS Swift SDK via Expo Config Plugin / native module bridge.

**Step 2: Create wrapper module**

```typescript
// apps/mobile/src/lib/elevenlabs.ts
// Wrapper around ElevenLabs SDK for conversational AI
// Handles: session creation, audio streaming, agent context injection
```

**Step 3: Replace WebView in VoiceScreen**

Remove the WebView wrapper. Build native UI:
- Call/Hangup button
- Audio waveform visualization (Reanimated-driven)
- Premium gate (show upgrade button if not premium)
- Inject chart context (sun sign, zodiac animal, dominant element)

**Step 4: Commit**

```bash
git add apps/mobile/src/lib/elevenlabs.ts apps/mobile/src/screens/VoiceScreen.tsx apps/mobile/package.json
git commit -m "feat(mobile): integrate native ElevenLabs conversational AI SDK"
```

---

### Task 11: Enhance WuXing page with descriptions

**Files:**
- Modify: `apps/mobile/src/screens/WuXingScreen.tsx`

**Step 1: Add element descriptions**

The web app shows detailed element descriptions from `src/lib/astro-data/`. Port the bilingual (DE/EN) element descriptions to the mobile WuXing screen. Show:
- Element bars (already exists)
- Dominant element highlight (already exists)
- Element description text (new)
- Element interaction hints (generating/overcoming cycles)

**Step 2: Commit**

```bash
git add apps/mobile/src/screens/WuXingScreen.tsx
git commit -m "feat(mobile): add element descriptions to WuXing page"
```

---

### Task 12: Rename "Fu-Ring" to "Signatur" in mobile app

**Files:**
- Modify: `apps/mobile/src/navigation/RootNavigator.tsx`
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`
- Modify: any other files with user-facing "Ring"/"Fu-Ring" text

**Step 1: Find and replace all user-facing text**

Navigation tab labels, screen titles, button labels — change "Fu-Ring" → "Signatur" and "Fusion Ring" → "Signatur".

**Step 2: Do NOT rename files or code identifiers** — only user-facing text.

**Step 3: Commit**

```bash
git add apps/mobile/
git commit -m "content(mobile): rename Fu-Ring to Signatur in all user-facing text"
```

---

### Task 13: App Store preparation

**Files:**
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/store/` (screenshots, metadata)

**Step 1: Update app.json metadata**

- App name: "Bazodiac"
- Version: 1.0.0
- Add App Store category: "Lifestyle"
- Privacy URL, Support URL

**Step 2: Generate App Store screenshots**

- iPhone 15 Pro (6.7")
- iPhone SE (4.7")
- 5 screenshots: Dashboard, Signatur 3D, Quiz in progress, Quiz result, Voice Agent

**Step 3: Write App Store description (DE + EN)**

**Step 4: Create TestFlight build**

```bash
cd apps/mobile && eas build --platform ios --profile production
```

**Step 5: Submit for review**

```bash
cd apps/mobile && eas submit --platform ios
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Quiz data extraction takes too long | Automate with a script that parses TSX and outputs QuizDefinition stubs |
| expo-gl + three.js performance issues | Fall back to 2D canvas (Skia) if GL is too slow on older iPhones |
| ElevenLabs has no RN SDK | Use optimized WebView with native audio bridge as fallback |
| App Store rejection | 1 week buffer; common rejection reasons: missing privacy policy, incomplete features |

## NOT in Scope

- iPad support
- Android (ships later)
- Wissen/Articles section
- 3D Orrery/Planetarium
- Push notifications
- Analytics/crash reporting
- Cluster Energy System
