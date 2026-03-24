# Signatur Quizzes — Architecture Documentation

> Frontend logic, data flow, and mechanics of the Bazodiac quiz system on the Signatur page.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Quiz Inventory](#quiz-inventory)
3. [Cluster System](#cluster-system)
4. [Component Architecture](#component-architecture)
5. [Data Flow](#data-flow)
6. [Signal Pipeline](#signal-pipeline)
7. [Ring Integration](#ring-integration)
8. [Premium Gating](#premium-gating)
9. [Key Decisions](#key-decisions)
10. [File Reference](#file-reference)

---

## System Overview

The Signatur quiz system is a 22-quiz personality profiling engine that feeds into the Fusion Ring visualization. Users complete quizzes grouped into 6 thematic clusters. When a cluster is fully completed, the accumulated quiz data is persisted as 12-sector zodiac weights, which modulate the Signatur ring's particle geometry in real time.

```
                            ┌─────────────────┐
                            │  ClusterSidebar  │
                            │  (6 clusters,    │
                            │   22 quiz btns)  │
                            └───────┬─────────┘
                                    │ onStartQuiz(quizId)
                                    ▼
┌──────────────────────────────────────────────────────────┐
│                      QuizOverlay                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │   QUIZ_MAP[quizId] → React.lazy(QuizComponent)   │   │
│  │   Props: { onComplete, onClose }                  │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────┘
                        │ onComplete(ContributionEvent)
                        ▼
┌──────────────────────────────────────────────────────────┐
│                  FuRingPage.handleQuizComplete()         │
│                                                          │
│  1. useQuizContribution(event)                           │
│     → eventToSectorSignals() → AFFINITY_MAP → 12 sectors│
│     → cluster gate check                                 │
│     → POST /api/contribute (fire-and-forget)             │
│                                                          │
│  2. addModule(moduleId) → update completedModuleIds      │
│                                                          │
│  3. If cluster complete:                                 │
│     → ClusterPipeline animation (particles)              │
│     → Ring burst effect (significance-scaled)            │
│                                                          │
│  4. liveQuizWeights → FusionRing3D (immediate update)    │
└──────────────────────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│  POST /api/contribute → Supabase contribution_events     │
│  GET  /api/transit-state → FuFirE → useFusionSignal()    │
│  → soulprintToNatalWeights() → FusionRingCanvasV2        │
└──────────────────────────────────────────────────────────┘
```

---

## Quiz Inventory

### Standalone Quizzes (15)

| Module ID | Component | Cluster | Converter |
|-----------|-----------|---------|-----------|
| `quiz.love_languages.v1` | `LoveLanguagesQuiz` | mentalist | `loveLangToEvent` |
| `quiz.krafttier.v1` | `KrafttierQuiz` | naturkind | `krafttierToEvent` |
| `quiz.personality.v1` | `PersonalityQuiz` | stratege | `personalityToEvent` |
| `quiz.aura_colors.v1` | `AuraColorsQuiz` | naturkind | `auraToEvent` |
| `quiz.blumenwesen.v1` | `BlumenwesenQuiz` | naturkind | `blumenwesenToEvent` |
| `quiz.energiestein.v1` | `EnergiesteinQuiz` | naturkind | `energiesteinToEvent` |
| `quiz.charme.v1` | `CharmeQuiz` | mentalist | `charmeToEvent` |
| `quiz.eq.v1` | `EQQuiz` | mentalist | `eqToEvent` |
| `quiz.career_dna.v2` | `CareerDNAQuiz` | stratege | `careerDnaToEvent` |
| `quiz.social_role.v2` | `SocialRoleQuiz` | stratege | `socialRoleToEvent` |
| `quiz.spotlight.v2` | `SpotlightQuiz` | stratege | `spotlightToEvent` |
| `quiz.destiny.v1` | `DestinyQuiz` | mystiker | `destinyToEvent` |
| `quiz.rpg_identity.v1` | `RpgIdentityQuiz` | mystiker | `rpgIdentityToEvent` |
| `quiz.party_need.v1` | `PartyQuiz` | mystiker | `partyToEvent` |
| `quiz.celebrity_soulmate.v1` | `CelebritySoulmateQuiz` | mystiker | `celebritySoulmateToEvent` |

### Series Quizzes (8, Premium)

**Kinky Series** — wrapper: `KinkySeriesQuiz`, converter: `kinkySeriesQuizToEvent`

| Module ID | Component | JSON Source |
|-----------|-----------|-------------|
| `quiz.kinky_01.v1` | `KinkyQuiz01` | `kinky_quiz_01_*.json` |
| `quiz.kinky_02.v1` | `KinkyQuiz02` | `kinky_quiz_02_*.json` |
| `quiz.kinky_03.v1` | `KinkyQuiz03` | `kinky_quiz_03_*.json` |
| `quiz.kinky_04.v1` | `KinkyQuiz04` | `kinky_quiz_04_*.json` |

**Partner Match Series** — wrapper: `PartnerMatchSeriesQuiz`, converter: `partnerMatchSeriesQuizToEvent`

| Module ID | Component | JSON Source |
|-----------|-----------|-------------|
| `quiz.partner_match_01.v1` | `PartnerMatchQuiz01` | `partner_match_01_*.json` |
| `quiz.partner_match_02.v1` | `PartnerMatchQuiz02` | `partner_match_02_*.json` |
| `quiz.partner_match_03.v1` | `PartnerMatchQuiz03` | `partner_match_03_*.json` |
| `quiz.partner_convo.v1` | `ConversationAnalysisQuiz` | AI-powered (POST `/api/analyze/conversation`) |

---

## Cluster System

Six thematic clusters group quizzes by psychological domain. Each cluster has a **significance weight** (0.7–1.0) that drives the intensity of visual feedback when the cluster is completed.

```
src/lib/fusion-ring/clusters.ts
```

| Cluster | Icon | Color | Significance | Quizzes | Premium |
|---------|------|-------|-------------|---------|---------|
| `cluster.naturkind.v1` | 🌿 | `#2D5A4C` | 0.70 | krafttier, aura_colors, blumenwesen, energiestein | No |
| `cluster.mentalist.v1` | 🔮 | `#4A0E4E` | 0.80 | love_languages, charme, eq | No |
| `cluster.stratege.v1` | ♟️ | `#1A3A5C` | 0.75 | personality, career_dna, social_role, spotlight | No |
| `cluster.mystiker.v1` | 🌀 | `#5C1A4A` | 0.85 | destiny, rpg_identity, party_need, celebrity_soulmate | No |
| `cluster.kinky.v1` | 🔥 | `#8B1A1A` | 0.90 | kinky_01..04 | **Yes** |
| `cluster.partner_match.v1` | 💞 | `#9B3A6A` | 1.00 | partner_match_01..03, partner_convo | **Yes** |

### Cluster Gate

A quiz's contribution is only persisted to the server when its **entire cluster** is complete. This batching strategy ensures the ring receives a coherent signal from a complete personality profile, not partial data.

```typescript
// useQuizContribution.ts — simplified
const cluster = findClusterForModule(moduleId);
const updated = new Set([...completedModuleIds, moduleId]);
if (!isClusterComplete(cluster, updated)) return; // don't POST yet
void contributeQuizResult(moduleId, normalizedWeights, 0.75);
```

### Key Exports

| Export | Purpose |
|--------|---------|
| `CLUSTER_REGISTRY` | Array of all 6 `ClusterDef` objects |
| `findClusterForModule(moduleId)` | Returns the cluster containing a given quiz module |
| `isClusterComplete(cluster, completedIds)` | True if all quizzes in cluster are done |
| `clusterProgress(cluster, completedIds)` | 0–1 completion ratio |

---

## Component Architecture

### QuizOverlay

```
src/components/QuizOverlay.tsx
```

Central router that maps quiz IDs to lazy-loaded components.

```typescript
interface QuizOverlayProps {
  quizId: string | null;  // null = overlay closed
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}
```

- **QUIZ_MAP**: Record mapping 23 short IDs (e.g. `'love_languages'`) to `React.lazy()` imports
- Renders within a fixed-position modal overlay with backdrop
- `Suspense` fallback shows a spinner during chunk loading
- `QuizErrorBoundary` catches render errors gracefully
- Escape key and backdrop click close the overlay

### Quiz Component Contract

Every quiz component receives the same props:

```typescript
{ onComplete: (event: ContributionEvent) => void, onClose: () => void }
```

**Lifecycle:**
1. **Intro screen** — theme, description
2. **Question flow** — 8–15 questions with 3–5 options each
3. **Result screen** — profile card, description, Share button
4. User dismisses via close button, backdrop, or Escape

Quizzes are **not repeatable**. The "Nochmal" (restart) button was removed from all quizzes. The `ClusterSidebar` disables completed quiz buttons (`disabled={quizDone}`). This prevents `contribution_events` upsert corruption.

### ClusterSidebar

```
src/components/signatur/ClusterSidebar.tsx
```

```typescript
interface ClusterSidebarProps {
  completedModuleIds: Set<string>;
  onStartQuiz: (quizId: string) => void;
  onPremiumClick?: (clusterName: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
  suggestedModule: string | null;
}
```

Renders 6 expandable `ClusterPanel` components, each showing:
- Cluster header (icon, name, progress X/Y)
- Animated progress bar (`motion.div`)
- Quiz buttons with 4 states:
  - **Done**: Grayed out with checkmark
  - **Premium locked**: Lock icon, triggers `PremiumUpgradeModal`
  - **Suggested**: Gold border with pulse animation
  - **Open**: Clickable, triggers quiz launch

Uses `MODULE_TO_QUIZ_ID` and `QUIZ_NAMES` from `quiz-maps.ts` for button labels and ID translation.

### SharePopup

```
src/components/SharePopup.tsx
```

```typescript
interface SharePopupProps {
  quizTitle: string;    // e.g. "Krafttier"
  resultTitle: string;  // e.g. "Eagle"
  onClose: () => void;
}
```

Appears on the quiz result screen. 4 social sharing buttons:
- **WhatsApp**: `https://wa.me/?text=...` with encoded share text
- **Facebook**: `https://www.facebook.com/sharer/sharer.php?u=...`
- **Instagram**: Links to Instagram home (no native share URL)
- **TikTok**: Links to TikTok home

Share text template (DE): `"Mein Bazodiac {quizTitle}-Ergebnis: {resultTitle}! Finde dein kosmisches Profil:"`

### ClusterPipeline

```
src/components/signatur/ClusterPipeline.tsx
```

Animated energy flow from sidebar to ring, triggered on cluster completion.

```typescript
interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;
  significance?: number;  // 0–1, default 0.7
}
```

**Animation phases:**
1. `idle` — not rendered
2. `animate` — 6-part particle animation:
   - Growing glow line (0 → 100% width)
   - 3 lead particles (fast, medium, slow)
   - Comet trail (significance > 0.8 only)
   - Ring-side burst flash
3. `static` — persistent glow line

**Significance scaling:**
- Duration: `1.5 + significance * 1.5` seconds (1.5s–3s)
- Glow spread: `8 + significance * 16` px (8–24px)
- Burst scale: `1.5 + significance * 1.5` (1.5x–3x)
- Particle sizes and glow intensities all scale proportionally

**One-time gate:** `localStorage` key `bazodiac_pipeline_shown_{clusterId}` prevents replay.
**Reduced motion:** Skips directly to `static` phase.

---

## Data Flow

### ContributionEvent Type

```
src/lib/lme/types.ts
```

```typescript
type ContributionEvent = {
  specVersion: 'sp.contribution.v1';
  eventId: string;           // UUID
  occurredAt: string;        // ISO timestamp
  source: {
    vertical: 'quiz';
    moduleId: string;        // e.g. 'quiz.love_languages.v1'
    domain?: string;
    locale?: string;
  };
  payload: {
    markers: Marker[];       // Required — semantic personality signals
    traits?: TraitScore[];   // Optional — raw dimension scores
    tags?: Tag[];            // Optional — archetype labels
    summary?: {
      title?: string;
      bullets?: string[];
      resultId?: string;
    };
  };
};

type Marker = {
  id: string;      // Format: "marker.{domain}.{keyword}"
  weight: number;  // 0–1
  evidence?: { itemsAnswered?: number; confidence?: number };
};

type Tag = {
  id: string;
  label: string;
  kind: 'archetype' | 'shadow' | 'style' | 'astro' | 'interest' | 'misc';
  weight?: number;
};
```

### Quiz-to-Event Conversion

```
src/lib/fusion-ring/quiz-to-event.ts
```

Each quiz type has a dedicated converter function (e.g. `loveLangToEvent`, `krafttierToEvent`). All converters use a shared builder:

```typescript
function buildEvent(moduleId: string, markers: Marker[], tags: Tag[]): ContributionEvent
```

**Converter pattern:** Quiz results (scores, profileId, archetype) → semantic `Marker` objects with domain/keyword IDs and 0–1 weights → `ContributionEvent`.

### End-to-End Flow

```
User clicks quiz → ClusterSidebar → FuRingPage.setActiveQuiz(id)
    │
    ▼
QuizOverlay renders → QUIZ_MAP[id] → lazy quiz component
    │
    ▼
Quiz completes → quiz calls onComplete(event)
    │
    ▼
FuRingPage.handleQuizComplete(event):
    ├─→ useQuizContribution(event)
    │     ├─→ eventToSectorSignals(event) → 12 floats [-1, 1]
    │     ├─→ findClusterForModule(moduleId)
    │     ├─→ isClusterComplete? → NO: return (gate closed)
    │     └─→ YES: normalize [0,1] → contributeQuizResult() → POST /api/contribute
    │
    ├─→ addModule(moduleId) → update completedModuleIds
    │
    ├─→ Cluster just completed?
    │     ├─→ setJustCompletedCluster(clusterId) → ClusterPipeline animates
    │     └─→ setRingEffect({ type:'burst', color, intensity: significance })
    │
    └─→ quizSectorsToQuizWeights(sectors) → liveQuizWeights → FusionRing3D
```

### Server Persistence

```
POST /api/contribute → server.mjs
    ├─→ Validate Bearer token (Supabase JWT)
    ├─→ Upsert into contribution_events (user_id, module_id)
    └─→ 200 OK

GET /api/transit-state/:userId → server.mjs
    ├─→ Load astro_profiles + contribution_events from Supabase
    ├─→ Derive soulprint_sectors + quiz_sectors
    ├─→ POST to FuFirE /transit/state
    ├─→ Fallback to profile-derived synthetic state on error
    └─→ Return TransitState to client
```

---

## Signal Pipeline

### AFFINITY_MAP

```
src/lib/fusion-ring/affinity-map.ts
```

Maps marker keywords to 12-sector zodiac weight vectors. ~87 keyword entries + ~5 archetype tag entries.

```typescript
const AFFINITY_MAP: Record<string, number[]> = {
  // Keyword-level (high precision)
  'physical_touch':   [0, .2, 0, 0, 0, 0, 0, .6, 0, 0, 0, .2],
  'extroversion':     [.1, 0, .2, 0, .3, 0, .2, 0, .1, 0, .1, 0],
  'empathy':          [0, 0, 0, .4, 0, 0, .2, .1, 0, 0, .1, .2],
  // Domain-level (fallback)
  'love':             [0, .1, 0, .3, 0, 0, .3, .3, 0, 0, 0, 0],
  'social':           [.1, 0, .1, 0, .2, 0, .3, 0, 0, 0, .2, .1],
  // ...
};
```

**Resolution:** Parse `marker.{domain}.{keyword}` → try keyword first, fall back to domain.

### eventToSectorSignals

```
src/lib/fusion-ring/test-signal.ts
```

```typescript
function eventToSectorSignals(event: ContributionEvent): number[]
```

1. Initialize 12-sector array to zeros
2. For each marker: resolve keyword → AFFINITY_MAP vector, multiply by marker.weight, accumulate
3. For each tag: resolve archetype → TAG_AFFINITY vector, multiply by tag.weight, accumulate
4. Normalize to [-1, 1] range (divide by max absolute value)

### 12 Zodiac Sectors

| Index | Sign | German | Wu-Xing Element | Opposite |
|-------|------|--------|-----------------|----------|
| 0 | Aries | Widder | Wood | 6 (Libra) |
| 1 | Taurus | Stier | Earth | 7 (Scorpio) |
| 2 | Gemini | Zwillinge | Fire | 8 (Sagittarius) |
| 3 | Cancer | Krebs | Fire | 9 (Capricorn) |
| 4 | Leo | Loewe | Fire | 10 (Aquarius) |
| 5 | Virgo | Jungfrau | Metal | 11 (Pisces) |
| 6 | Libra | Waage | Metal | 0 (Aries) |
| 7 | Scorpio | Skorpion | Water | 1 (Taurus) |
| 8 | Sagittarius | Schuetze | Water | 2 (Gemini) |
| 9 | Capricorn | Steinbock | Water | 3 (Cancer) |
| 10 | Aquarius | Wassermann | Earth | 4 (Leo) |
| 11 | Pisces | Fische | Wood | 5 (Virgo) |

### signatur-bridge.ts

```
src/components/fusion-ring-website/signatur-bridge.ts
```

Two adapter functions that convert sector data into ring engine parameters:

**`soulprintToNatalWeights(sectors: number[]): Record<string, number>`**
Maps 12 sectors → 7 planet weights via zodiac rulership:

| Planet | Ruling Sector(s) |
|--------|-----------------|
| Sun | Leo (4) |
| Moon | Cancer (3) |
| Mercury | Gemini (2) + Virgo (5) |
| Venus | Taurus (1) + Libra (6) |
| Mars | Aries (0) + Scorpio (7) |
| Jupiter | Sagittarius (8) + Pisces (11) |
| Saturn | Capricorn (9) + Aquarius (10) |

**`quizSectorsToQuizWeights(sectors: number[]): Record<string, number>`**
Maps 12 sectors → 6 quiz dimensions for the V2 engine:

| Dimension | Source Sector |
|-----------|--------------|
| assertion | 0 (Aries) |
| empathy | 3 (Cancer) |
| logic | 5 (Virgo) |
| intuition | 8 (Sagittarius) |
| creativity | 4 (Leo) |
| discipline | 9 (Capricorn) |

---

## Ring Integration

### FusionRing3D

```
src/components/fusion-ring-3d/FusionRing3D.tsx
```

Wrapper that bridges data hooks to the canvas renderer.

```typescript
type FusionRing3DProps = {
  userId: string;
  quizWeights?: Record<string, number>;       // 6 quiz dimensions
  effectTrigger?: {
    type: string;
    color?: string;
    timestamp: number;
    intensity?: number;                        // 0–1, from cluster significance
  } | null;
  solarModulation?: number;                    // 1.0–1.5 from space weather
  labels: FusionRing3DLabels;
};
```

Data flow:
1. `useFusionSignal(userId)` → polls transit state → `signalData.baseSignals` (12 sectors)
2. `soulprintToNatalWeights(baseSignals)` → 7 planet weights → `natalWeights` prop
3. `quizWeights` passed through from `FuRingPage.liveQuizWeights`
4. `effectTrigger` passed through from `FuRingPage.ringEffect`
5. Feature flag `signature_engine_v2` gates V2 (spirograph) vs V1 (canvas) renderer

### FusionRingCanvasV2 Effect System

```
src/components/fusion-ring-website/FusionRingCanvasV2.tsx
```

The V2 engine processes effects via an `EffectState` object in the animation loop:

```typescript
interface EffectState {
  type: string;
  progress: number;        // 0–1
  intensity: number;       // scaled by significance: 0.5 + sig * 0.5
  duration: number;        // scaled by significance: 2.0 + sig * 3.0
  clusterColorHex?: string;
}
```

**Burst effect (cluster completion):**
- Attack-decay envelope with resonance oscillation wave
- Oscillation frequency: `3 + intensity * 4` cycles
- Cluster color injected into effect lights
- Camera shake scaled by intensity
- Tone mapping exposure boost

---

## Premium Gating

### Premium Clusters

The `kinky` and `partner_match` clusters are premium-only. Gating is at the cluster level (all quizzes in the cluster are locked), not individual quiz level.

### PremiumUpgradeModal

```
src/components/signatur/PremiumUpgradeModal.tsx
```

```typescript
interface PremiumUpgradeModalProps {
  clusterName: string;
  onClose: () => void;
}
```

Triggered by `ClusterSidebar.onPremiumClick()` when a free user clicks a premium quiz. Shows upgrade CTA with Stripe checkout button. Auto-closes when `usePremium().isPremium` flips to true (e.g. after Stripe redirect return).

### Premium Check

```typescript
// ClusterSidebar — determines if cluster requires premium
const isPremiumCluster = cluster.id === 'cluster.kinky.v1'
                      || cluster.id === 'cluster.partner_match.v1';
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Cluster gating** | Contributions only POST when full cluster is complete. Ensures coherent personality signal, prevents partial/noisy data from distorting the ring. |
| **Fire-and-forget POST** | `/api/contribute` never awaits. UI never blocks on network. Silent retry on failure. |
| **Non-repeatable quizzes** | Restart was removed. `contribution_events` uses `UPSERT ON (user_id, module_id)` — replaying would overwrite sector weights and corrupt the signal. |
| **Lazy loading** | All 23 quiz components loaded via `React.lazy()`. Fast initial page load, chunks only fetched when quiz is opened. |
| **Significance scaling** | Cluster significance (0.7–1.0) drives pipeline animation intensity and ring burst magnitude. Higher-value clusters (partner_match: 1.0) produce more dramatic visual feedback. |
| **AFFINITY_MAP** | Keyword→sector mapping is declarative, not computed. Easy to tune per quiz domain without touching quiz code. |
| **Series quiz JSON** | Kinky/PartnerMatch quiz data lives in JSON files with `marker_emission` configs. Allows content changes without code changes. |
| **One-time pipeline animation** | `localStorage` prevents replay. Users see the celebration exactly once per cluster. |

---

## Hooks Reference

| Hook | File | Purpose |
|------|------|---------|
| `useQuizContribution` | `src/hooks/useQuizContribution.ts` | Converts event → sectors, gates on cluster, POSTs contribution |
| `useCompletedModules` | `src/hooks/useCompletedModules.ts` | Fetches completed module IDs from Supabase, provides `addModule()` |
| `useQuizSuggestion` | `src/hooks/useQuizSuggestion.ts` | Daily random suggestion from incomplete modules (30% skip chance) |
| `useFusionSignal` | `src/hooks/useFusionSignal.ts` | Polls `/api/transit-state` every 800ms with backoff |
| `usePremium` | `src/hooks/usePremium.ts` | Reads `profiles.is_premium` from Supabase |
| `useSpaceWeather` | `src/hooks/useSpaceWeather.ts` | Polls space weather, computes ring modulation |

---

## File Reference

### Core Quiz System

| File | Purpose |
|------|---------|
| `src/components/QuizOverlay.tsx` | Modal router — QUIZ_MAP, lazy loading, error boundary |
| `src/components/quizzes/*.tsx` | 15 standalone quiz components |
| `src/components/quizzes/Kinky/KinkySeriesQuiz.tsx` | Kinky series wrapper |
| `src/components/quizzes/PartnerMatch/PartnerMatchSeriesQuiz.tsx` | Partner Match series wrapper |
| `src/components/SharePopup.tsx` | Social sharing popup (WhatsApp, Facebook, Instagram, TikTok) |

### Cluster & Signal

| File | Purpose |
|------|---------|
| `src/lib/fusion-ring/clusters.ts` | 6 cluster definitions, completion logic, significance weights |
| `src/lib/fusion-ring/quiz-to-event.ts` | Per-quiz event converters (`*ToEvent()` functions) |
| `src/lib/fusion-ring/affinity-map.ts` | AFFINITY_MAP — keyword → 12-sector weight vectors |
| `src/lib/fusion-ring/test-signal.ts` | `eventToSectorSignals()` — event → 12-sector array |
| `src/lib/fusion-ring/quiz-maps.ts` | MODULE_TO_QUIZ_ID, QUIZ_NAMES (bilingual) |
| `src/lib/lme/types.ts` | ContributionEvent, Marker, Tag, TraitScore types |

### Signatur Page

| File | Purpose |
|------|---------|
| `src/pages/FuRingPage.tsx` | Full Signatur page — sidebar + pipeline + ring + overlay |
| `src/components/signatur/ClusterSidebar.tsx` | Cluster navigation with quiz buttons |
| `src/components/signatur/ClusterPipeline.tsx` | Completion animation (particle flow) |
| `src/components/signatur/PremiumUpgradeModal.tsx` | Premium upgrade CTA modal |

### Ring Visualization

| File | Purpose |
|------|---------|
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | Data bridge → canvas renderer |
| `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | V2 spirograph engine (28K particles) |
| `src/components/fusion-ring-website/signatur-bridge.ts` | Sector → planet weights / quiz dimensions adapters |
| `src/components/fusion-ring-website/bazodiac-engine.ts` | Cousto-frequency spirograph math |

### Server & Persistence

| File | Purpose |
|------|---------|
| `server.mjs` (POST /api/contribute) | Upserts quiz weights to `contribution_events` |
| `server.mjs` (GET /api/transit-state) | Reads contributions, POSTs to FuFirE, returns transit state |
| `src/services/contribute.ts` | Client-side fire-and-forget POST with retry |

### Tests

| File | Covers |
|------|--------|
| `src/__tests__/cluster-completion.test.ts` | Cluster significance, completion gate, findClusterForModule |
| `src/__tests__/share-popup.test.tsx` | SharePopup rendering, social buttons, onClose |
| `src/__tests__/contribute-pipeline.test.ts` | eventToSectorSignals, cluster gates |
| `packages/shared/src/quizzes/__tests__/scoring.test.ts` | Quiz scoring models |
