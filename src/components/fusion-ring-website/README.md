# Signatur Trigger → Effect → Latency Contract

Source of truth for how real-time inputs modulate the Signatur ring.
Referenced by Sprint S-QA-2026-04-15 Phase 2 tasks.

## Trigger Map

| # | Trigger | Source | Poll / Event Interval | Effect on Ring | Expected Latency | Current Status |
|---|---------|--------|----------------------|----------------|------------------|----------------|
| T1 | **Transit-state delta** | `useFusionSignal` → `GET /api/transit-state/:userId` | 800ms poll (15s offline) | `baseSignals[12]` → `soulprintToNatalWeights()` → 7 planet weights → V2 particle positions/colors | ≤ 5s (per REQ AC) | **Needs tuning** — deltas exist but produce near-imperceptible visual change (QA-8, QA-15). Floor/ceiling on intensity mapping too narrow. |
| T2 | **Quiz cluster completion** | `useQuizContribution` → `POST /api/contribute` | On quiz `onComplete` callback | Soulprint sectors update → ring geometry shifts. Only fires when ALL quizzes in a cluster are done. | Immediate (fire-and-forget POST, next poll picks up) | **Needs audit** — gate logic present in `useQuizContribution` L26-31 but server-side upsert in `/api/contribute` not independently gated (QA-17, QA-24). |
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
     → cluster gate check (isClusterComplete)
     → POST /api/contribute → contribution_events table
     → next T1 poll picks up updated soulprint

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
| V2 canvas fails to init | Red banner: `labels.renderError` ("Renderer-Fehler. Fallback aktiv.") | 2D SVG sector ring fallback — no error text visible to user |
| V3 lazy-load fails | Suspense fallback (loading spinner) | Same 2D SVG fallback |
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
