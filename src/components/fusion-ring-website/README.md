# Signatur Trigger → Effect → Latency Contract

Source of truth for how real-time inputs modulate the Signatur ring.
Referenced by Sprint S-QA-2026-04-15 Phase 2 tasks.

## Trigger Map

| # | Trigger | Source | Poll / Event Interval | Effect on Ring | Expected Latency | Current Status |
|---|---------|--------|----------------------|----------------|------------------|----------------|
| T1 | **Transit-state delta** | `useFusionSignal` → `GET /api/transit-state/:userId` | 800ms poll (15s offline) | `targetSignals[12]` (clamped [0,1]) → `soulprintToNatalWeights()` → 7 planet weights → V2 particle positions/colors. Rebuild skipped when Δ < 0.01. | ≤ 5s (per REQ AC) | **Fixed** — was feeding static `baseSignals` instead of transit-modulated `targetSignals`. Power curve softened (1.5→1.2). |
| T2 | **Quiz cluster completion** | `useQuizContribution` → `POST /api/contribute` | On quiz `onComplete` callback | Soulprint sectors update → ring geometry shifts. Only fires when ALL quizzes in a cluster are done. Partial results queued in localStorage via `contribution-queue.ts`. On cluster completion: `burst` effect (cluster color + significance-scaled intensity) → radial displacement, color injection, resonance wave, screen shake. | Immediate (fire-and-forget batch POST, next poll picks up) | **Fixed** — localStorage queue stores partial quiz results; batch-POSTs all on cluster completion. Animated burst verified with 11 tests. |
| T3 | **Space weather** | `useSpaceWeather` → `GET /api/space-weather/extended` | 5-min poll (server: 5-min cache) | `ringModulation` (1.0–1.5) → particle intensity + korona effects at G3+ | 5–10 min (poll + cache) | **Working** — `computeRingModulation()` feeds into `FusionRing3D.solarModulation` prop. |
| T4 | **Cousto audio mute** | `useCoustoAudio` (localStorage `cousto_audio_muted`) | User click | All 6 Cousto oscillators gain → 0. Mute state persists in localStorage. | < 100ms (per REQ AC) | **Needs verification** — `toggleMute()` sets state + localStorage, but oscillator stop timing not measured (QA-25). |

## Data Flow

```
T1: useFusionSignal (800ms poll)
     ↓ signalData.baseSignals[12]
     → soulprintToNatalWeights() → natalWeights{7}
     → FusionRingCanvasV2 (28K particles)

T2: useQuizContribution (on quiz complete)
     → eventToSectorSignals() + AFFINITY_MAP → sectorWeights[12]
     → queueContribution() → localStorage (always)
     → cluster gate check (isClusterComplete)
     → if incomplete: return (no POST, data queued)
     → if complete: drainClusterContributions() → batch POST /api/contribute
     → contribution_events table → next T1 poll picks up updated soulprint

T3: useSpaceWeather (5-min poll)
     ↓ computeSolarPressureScore() → solarPressure (0–1)
     → computeRingModulation() → ringModulation (1.0–1.5)
     → FusionRing3D.solarModulation prop → particle intensity

T4: useCoustoAudio
     ↓ toggleMute() → localStorage('cousto_audio_muted')
     → engine.setMasterGain(0) → all oscillators silent
     → persists across reload via getStoredMuted()
```

## WebGL Failure Path

| Condition | Current Behavior | Target Behavior (TASK-qa-sig-webgl-fallback) |
|-----------|-----------------|----------------------------------------------|
| V2 canvas fails to init | Red banner: `labels.renderError` ("Renderer-Fehler. Fallback aktiv.") | **Fixed** — `FusionRingCanvasV2.onFailed` → `FusionRing3D` switches to V1 `FusionRingWebsiteCanvas`. Error banner suppressed in production (DEV-only). |
| V3 lazy-load fails | Suspense fallback (loading spinner) | **Fixed** — Suspense fallback is now `FusionRingWebsiteCanvas` (V1 sector ring) instead of a dark div. |
| `prefers-reduced-motion` | Reduced motion hint text shown | Acceptable as-is |

## Theme Awareness

| Component | Current | Target (TASK-qa-sig-theme-aware) |
|-----------|---------|----------------------------------|
| `FusionRingCanvasV2` | Hard-coded dark background/particles | Respect `planetariumMode` — dark (Planetarium) or bright (Solar System) palette |
| `FusionRingWebsiteCanvas` (V1) | Hard-coded dark | Same — bright-mode particle colors |
| `FuRingPage` background | Dark gradient | Theme-aware gradient |

## Key Files

| File | Role |
|------|------|
| `src/hooks/useFusionSignal.ts` | T1: transit-state polling (800ms), Zod parse, signal computation |
| `src/hooks/useQuizContribution.ts` | T2: quiz → sector weights → cluster gate → POST |
| `src/hooks/useSpaceWeather.ts` | T3: space weather polling (5 min), solar pressure score |
| `src/hooks/useCoustoAudio.ts` | T4: Cousto audio lifecycle, mute persistence |
| `src/lib/fusion-ring/clusters.ts` | Cluster definitions (6 clusters), `isClusterComplete()` |
| `src/services/contribute.ts` | `contributeQuizResult()` — POST to /api/contribute |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | Orchestrator: wires all triggers into V2/V3/V1 canvas |
| `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | V2 renderer: 28K particles, spirograph geometry |
| `src/components/fusion-ring-website/signatur-bridge.ts` | `soulprintToNatalWeights()`, `quizSectorsToQuizWeights()` |
| `src/lib/space-weather/solar-pressure.ts` | `computeSolarPressureScore()`, `computeRingModulation()` |
| `src/lib/audio/cousto-audio-engine.ts` | AudioContext + 6 Cousto-frequency oscillators |
| `server.mjs` | `/api/transit-state`, `/api/contribute`, `/api/space-weather/extended` |
