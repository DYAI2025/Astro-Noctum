# Development Tasks

## Phase: Current Sprint — S-BRIDGE (Shared Bridge Refactor)

**Sprint Goal:** `DIMENSION_DEFS` + V3-Bridge-Funktionen aus lokalen Dateien in `packages/shared/src/signatur/` als Single Source of Truth extrahieren. Determinismus-Test-Suite als automatisierten Beweis für plattformübergreifende Konsistenz. Swift-Konstanten-Referenzdokument für iOS-Port.

### Phase 1 — DIMENSION_DEFS: Single Source of Truth

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-sbridge-dimension-defs | Erstelle `packages/shared/src/signatur/dimension-defs.ts`: extrahiere `DimensionDef` Typ und `DIMENSION_DEFS` Array (6 Einträge, exakte Werte) aus `bipolar-engine.ts` | shared | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | - | 2026-03-29 | Keine Werte ändern — 1:1 Extraktion |
| TASK-sbridge-v3-bridge-fn | Ergänze `packages/shared/src/signatur/signatur-bridge.ts` um `soulprintToDimensionWeights()` aus `src/components/fusion-ring-website/signatur-bridge.ts`; bestehende Funktionen behalten | shared | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-dimension-defs | 2026-03-29 | |
| TASK-sbridge-shared-index | Update `packages/shared/src/signatur/index.ts`: exportiere `DIMENSION_DEFS`, `DimensionDef`, `soulprintToNatalWeights`, `quizSectorsToQuizWeights`, `soulprintToDimensionWeights` | shared | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-v3-bridge-fn | 2026-03-29 | |
| TASK-sbridge-engine-consume | Update `bipolar-engine.ts`: importiere `DimensionDef` + `DIMENSION_DEFS` aus `@/packages/shared/src/signatur`; lösche lokale Definitionen; `npx vitest run` muss grün bleiben | frontend | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-shared-index | 2026-03-29 | Achtung: Tests importieren aktuell direkt aus bipolar-engine |
| TASK-sbridge-web-bridge-consume | Update `src/components/fusion-ring-website/signatur-bridge.ts`: lokale `soulprintToDimensionWeights` durch Re-Export aus `@/packages/shared/src/signatur` ersetzen | frontend | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-engine-consume | 2026-03-29 | |
| TASK-sbridge-test-imports | Update `src/__tests__/signatur-v3-engine.test.ts`: `DIMENSIONS` aus `@/packages/shared/src/signatur` importieren statt aus lokalem `bipolar-engine.ts`; alle 15 Tests müssen grün bleiben | frontend | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | Done | TASK-sbridge-web-bridge-consume | 2026-03-29 | |

### Phase 2 — Determinismus-Test-Suite

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-sbridge-dim-contract | Vitest (`packages/shared`): DIMENSION_DEFS hat 6 Einträge, alle Hz einzigartig, Winkel exakt `[0, π/3, 2π/3, π, 4π/3, 5π/3]`, alle colorA/B ∈ [0,1], keine leeren Pol-Namen | shared | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-shared-index | 2026-03-29 | |
| TASK-sbridge-hz-constants | Vitest: Hz-Werte matchen exakt die Spec (Mars=144.72, Moon=210.42, Sun=126.22, Mercury=141.27, Jupiter=183.58, Saturn=147.85) — schlägt fehl bei stiller Änderung | shared | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-dim-contract | 2026-03-29 | Guard-Test: Intent erzwingen |
| TASK-sbridge-bridge-contract | Vitest: alle Outputs von `soulprintToDimensionWeights` + `quizSectorsToQuizWeights` ∈ [0,1]; Edge-cases: leeres Array → 0.5, Array mit 12 Einsen → 1.0 | shared | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-dim-contract | 2026-03-29 | |
| TASK-sbridge-determinism | Vitest: `initializePoles()` + 200× `updatePoles()` mit identischen Inputs zweimal → alle 12 Pol-Positionen (x,y) Differenz < 1e-10 | frontend | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | Done | TASK-sbridge-test-imports | 2026-03-29 | Beweist Float-Determinismus für Matching-Basis |

### Phase 3 — Swift-Referenz & Runbook

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-sbridge-swift-doc | Erstelle `packages/shared/src/signatur/SWIFT_CONSTANTS.md`: Swift-ready `struct DimensionDef` + `let DIMENSION_DEFS` Array mit hz als Double, baseAngle als Double, colorA/B als `(Double,Double,Double)` — generiert aus TS-Werten | shared | [REQ-F-signatur-ios-swift](../1-objectives/requirements/REQ-F-signatur-ios-swift.md) | Done | TASK-sbridge-hz-constants | 2026-03-29 | Manueller Sync bis Codegen; kein Hardcoding in Swift |
| TASK-sbridge-manual-testing | Erstelle `docs/runbooks/signatur-s-bridge-verification.md`: (a) `npx vitest run` grün, (b) MiniSignature rendert, (c) Signatur-Seite rendert, (d) `npx tsc --noEmit` clean | frontend, shared | - | Done | TASK-sbridge-determinism, TASK-sbridge-swift-doc | 2026-03-29 | |

---

## Phase: Completed — S-DAUP (Dashboard Aufräumen)

**Sprint Goal:** Bestätigte Bugs im Dashboard beheben: Four Pillars-Duplikat entfernen, Sunsign/BaZi/Wuxing Kacheln auf Detail-View umbauen, leeren Blueprint-Placeholder fixen, DayModeModal Dark-Mode-Kontrast korrigieren, MiniSignature-Skalierung prüfen.

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| DAUP-01 | Remove duplicate Four Pillars section | frontend | — | Done | `DashboardAstroSection.tsx:314–324` removed |
| DAUP-02 | Build click-to-detail for Sunsign / BaZi / Wuxing tiles (modal or drawer) | frontend | REQ-F-astro-card-detail-view | Done | `AstroDetailModal.tsx` created; `DashboardHeroNav` → buttons with `onTileClick`; wired in `DashboardAstroSection` |
| DAUP-03 | Fix oversized empty Blueprint placeholder | frontend | — | Done | `BlueprintReveal.tsx:35–39` — returns null instead of 220px skeleton |
| DAUP-04 | Fix CosmicWeatherCard Dark Mode contrast | frontend | — | Done | `CosmicWeatherCard.tsx:80,117` — `bg-white/60` → `bg-[#00050A]/80`, border → gold |
| DAUP-05 | Constrain MiniSignature width in Dashboard | frontend | — | Done | `Dashboard.tsx` wrapper — added `max-w-xs mx-auto` |

---

## Phase: Completed — S-DASH-POLISH (Dashboard Polish & Navigation)

**Sprint Goal:** Dashboard wird production-ready: Ghost UI entfernen, Navigation überarbeiten, Planetarium aufwerten, Detailansichten aufbauen, Levi-Layer fixen.

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| S-DP-01 | Remove "Tour wiederholen" + "Zahlung verwalten" from menu | frontend | Done | Ghost UI removed |
| S-DP-02 | Remove "Neustarten" button | frontend | Done | Button removed |
| S-DP-03 | Remove reload button in "dein Bazodiac" heading | frontend | Done | Button removed |
| S-DP-04 | Remove "KI-Synthese" heading | frontend | Done | Heading removed |
| S-DP-05 | Replace "Your Bazaar Blueprint" with German copy | frontend | Done | German copy applied |
| S-DP-06 | Fix Cosmic Blueprint DE/EN inconsistency | frontend | Done | CON-german-ui enforced |
| S-DP-07 | Fix Wu-Xing Metal icon showing "Wind" | frontend | Done | Icon + aria-label corrected to "Metall" |
| S-DP-08 | Build WuXingPage as extended analysis detail page | frontend | Done | commit e13d937 / 8cad909 |
| S-DP-09 | Gate WuXingPage extended content behind PremiumGate | frontend | Done | commit 55d3118 |
| S-DP-10 | Move Western houses from Dashboard to WuXingPage | frontend | Done | commit e13d937 |
| S-DP-11 | Fix Levi text: alignment, font size, remove italic | frontend | Done | commit 4152086 |
| S-DP-12 | Fix Levi buttons: size "Call Levi", remove "Levi Bazzi bereit" | frontend | Done | commit 4152086 + 57426d3 |
| S-DP-13 | Move Levi section higher in Dashboard | frontend | Done | commit 4152086 |
| S-DP-14 | Increase date/time display in Planetarium | frontend | Done | commit 943904c |
| S-DP-15 | Show current constellation alongside birth chart | frontend | Done | commit 943904c |
| S-DP-16 | Add constellation description at Planetarium bottom | frontend | Done | commit 943904c |
| S-DP-17 | Apply Planetarium enhancements to Solar System view | frontend | Done | commit 943904c |
| S-DP-18 | Create 3 navigation menu proposals with hover submenus | frontend | Done | commit 89d94ad / a322b2c |
| S-DP-19 | Redesign header: enlarge heading, create header zone | frontend | Done | commit 89d94ad |
| S-DP-20 | Surface FusionRingCanvasV2 post-processing errors | frontend | Done | commit edea89d |
| S-DP-21 | Surface usePremium Realtime fallback | frontend | Done | commit b43b9d7 |
| S-DP-22 | Add error propagation for tour_completed write | frontend | Done | commit fbaae99 |

### Dissonance Coefficient (2026-03-24)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DEC-01 | DissonanceResult type + computeDissonance() | frontend | Done | commit f5b2c54 |
| DEC-02 | VisualModulation parameters type | frontend | Done | commit f5b2c54 |
| DEC-03 | Extend bazodiac-engine.ts with modulation hooks | frontend | Done | commit c83259e |
| DEC-04 | useDissonance React hook | frontend | Done | commit 41235e6 |
| DEC-05 | Morph transition system with dissonance-aware easing | frontend | Done | commit 5ca1681 |
| DEC-06 | Apply modulation in FusionRingCanvasV2 render loop | frontend | Done | commit 8f6e59d |
| DEC-07 | Persist dissonance state to Supabase | api-server | Done | commit 7c2257a |
| DEC-08 | Premium "Sichtbare Werte" toggle + gauge component | frontend | Done | commit 24f630f |

### Day-Pulse / Day-Mode (2026-03-25)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DAY-01 | V3 Bipolar Trail Signature Engine prototype | frontend | Done | commit dd46bab |
| DAY-02 | DayHarmonicState + computeDayHarmonic + modulateConfig | frontend | Done | commit 009c03a |
| DAY-03 | harmony_index + day_mode in DailyFusionSchema | api-server | Done | commit 7d8dd62 |
| DAY-04 | Inject harmony_index + day_mode in /api/experience/daily proxy | api-server | Done | commit e52f3b0 |
| DAY-05 | Wire DayHarmonicState through SignaturV3Canvas + useFirstRunDaily | frontend | Done | commit 237ac13 |
| DAY-06 | DayModeModal wired into Dashboard | frontend | Done | commit 8096396 |
| DAY-07 | Extract DayHarmonicState to lib/fusion-ring/day-harmonic.ts | frontend | Done | commit 78f18c4 |

## Phase: Current Sprint — S-SIG (Signatur Definition & Build)

**Sprint Goal:** Signatur V3 (Bipolar Trail Engine) production-ready auf Web + iOS. Cousto-Audio, Dissonance-Wiring, Mobile Native 3D, Performance-Targets.

### Execution Plan

#### Phase 1: Signatur V3 Web Production

**Capabilities delivered:**
- V3 bipolar trail engine replaces V2 as default Signatur renderer
- Dissonance model drives visible pole behavior
- Day harmonic and space weather modulate membrane layer
- V2 remains as feature-flag fallback

**Tasks:**
1. TASK-v3-engine-production
2. TASK-v3-dissonance-wiring
3. TASK-v3-day-harmonic
4. TASK-v3-space-weather
5. TASK-v3-data-bridge
6. TASK-v3-feature-flag
7. TASK-v3-graceful-fallback
8. TASK-v3-unit-tests
9. TASK-phase-1-manual-testing

#### Phase 2: Cousto Audio Synthesis

**Capabilities delivered:**
- Signatur generates ambient sound from Cousto frequencies
- Pole weight maps to oscillator amplitude
- User controls for mute/volume

**Tasks:**
1. TASK-audio-synthesis-module
2. TASK-audio-weight-mapping
3. TASK-audio-ui-controls
4. TASK-audio-lifecycle
5. TASK-audio-ios-safari
6. TASK-phase-2-manual-testing

#### Phase 3: Mobile Native 3D Signatur

**Capabilities delivered:**
- Full 3D Signatur on iOS via expo-gl
- Same mathematical model as web, reduced particles
- Touch gesture controls

**Tasks:**
1. TASK-mobile-v3-engine
2. TASK-mobile-mount-signatur
3. TASK-mobile-gesture-handler
4. TASK-mobile-data-pipeline
5. TASK-mobile-audio
6. TASK-phase-3-manual-testing

#### Phase 4: Performance & Cross-Platform Polish

**Capabilities delivered:**
- All REQ-PERF targets met across platforms
- Optimized trail rendering

**Tasks:**
1. TASK-perf-desktop-benchmark
2. TASK-perf-mobile-web-benchmark
3. TASK-perf-ios-native-benchmark
4. TASK-perf-trail-optimization
5. TASK-perf-first-frame
6. TASK-perf-transit-api
7. TASK-phase-4-manual-testing

### Phase 1 Tasks — Signatur V3 Web Production

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-v3-engine-production | Finalize V3 bipolar trail engine: 12 poles, Cousto frequencies, additive trail rendering, center void | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | - | 2026-03-27 | External dissonance + solar modulation interfaces, delta-time, visibility API |
| TASK-v3-dissonance-wiring | Wire three-layer dissonance into V3: d_natal→movement mode, d_accumulated→trail density, d_elemental→Sheng/Ke texture | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-engine-production | 2026-03-27 | External DissonanceResult → V3DissonanceState, Dashboard wired |
| TASK-v3-day-harmonic | Wire DayHarmonicState into V3 pole configuration (day-mode visual accent) | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-engine-production | 2026-03-27 | Already wired in Day-Pulse sprint (DAY-01–07) |
| TASK-v3-space-weather | Wire space weather modulation into V3 membrane layer (solar pressure → trail intensity 1.0–1.5) | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-engine-production | 2026-03-27 | SolarModulation interface + Dashboard wiring done in dissonance-wiring |
| TASK-v3-data-bridge | Verify signatur-bridge: soulprint→natalWeights(7), quizSectors→quizWeights(6), transit polling — all feeding V3 | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-engine-production | 2026-03-27 | Bridge verified: soulprintToDimensionWeights→6D, soulprintToNatalWeights→7D, quizSectorsToQuizWeights→6D |
| TASK-v3-feature-flag | Add signatur_engine_v3 feature flag: V3 default, V2 fallback via localStorage | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-engine-production | 2026-03-27 | Flag added, Dashboard V3 gated, critical flag warning |
| TASK-v3-graceful-fallback | Implement graceful data source fallback: missing transit/weather/quiz → neutral defaults, no visual glitch | frontend | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Done | TASK-v3-data-bridge | 2026-03-27 | Engine defaults to 0.5 per dimension, null solar/dissonance/dayHarmonic all guarded |
| TASK-v3-unit-tests | Vitest: pole determinism, dissonance→visual correlation, data bridge transforms | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-dissonance-wiring | 2026-03-27 | 15 tests: dimensions, determinism, dissonance, day-harmonic, trails |
| TASK-phase-1-manual-testing | Create runbook: Signatur V3 web manual test scenarios | frontend | - | Done | TASK-v3-unit-tests | 2026-03-28 | docs/runbooks/signatur-v3-web-manual-testing.md |

### Phase 2 Tasks — Cousto Audio Synthesis

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-audio-synthesis-module | Create CoustoAudioEngine: Web Audio API, 6 frequencies (Mars 144.72, Moon 210.42, Sun 126.22, Mercury 141.27, Jupiter 183.58, Saturn 147.85 Hz) | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-v3-engine-production | 2026-03-27 | cousto-audio-engine.ts — 6 sine oscillators |
| TASK-audio-weight-mapping | Map pole weights to oscillator gain with smooth interpolation | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-audio-synthesis-module | 2026-03-27 | linearRampToValueAtTime with 300ms ramp |
| TASK-audio-ui-controls | Add mute toggle + volume slider to Signatur page (localStorage persisted) | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-audio-synthesis-module | 2026-03-27 | FuRingPage header, VolumeX/Volume2 icons |
| TASK-audio-lifecycle | Wire audio lifecycle: start on mount, suspend on hidden, resume on visible, stop on unmount | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Done | TASK-audio-synthesis-module | 2026-03-27 | useCoustoAudio hook, visibility API |
| TASK-audio-ios-safari | Test/fix Web Audio API on mobile Safari (user gesture for AudioContext.resume()) | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-audio-lifecycle | 2026-03-27 | Click/touchstart listener starts AudioContext |
| TASK-phase-2-manual-testing | Update runbook: audio test scenarios (mute, volume, tab switch, Safari gesture) | frontend | - | Done | TASK-audio-ios-safari | 2026-03-28 | docs/runbooks/signatur-cousto-audio-manual-testing.md |

### Phase 3 Tasks — Mobile Native 3D Signatur

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-mobile-v3-engine | Adapt V3 bipolar trail engine for expo-gl: Canvas 2D → GL context, reduced trail buffer | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-v3-engine-production | 2026-03-28 | Skipped: iOS app is native Swift (separate repo), not Expo |
| TASK-mobile-mount-signatur | Mount V3 SignaturCanvas on FuRingScreen, replacing 2D bootstrap view | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-mobile-v3-engine | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-mobile-gesture-handler | Implement gesture controls: pan (1 finger), pinch-zoom (2 fingers), orbit (drag) | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-mobile-mount-signatur | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-mobile-data-pipeline | Wire useBootstrapSignatur → natal weights + quiz weights → V3 input vector | mobile | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Cancelled | TASK-mobile-mount-signatur | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-mobile-audio | Implement Cousto audio on React Native via expo-av (6 oscillators, weight-mapped gain) | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Cancelled | TASK-audio-synthesis-module, TASK-mobile-mount-signatur | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |
| TASK-phase-3-manual-testing | Update runbook: iOS Signatur test scenarios (gestures, audio, data, older device perf) | mobile, frontend | - | Cancelled | TASK-mobile-audio | 2026-03-28 | Skipped: see TASK-mobile-v3-engine |

### Phase 4 Tasks — Performance & Cross-Platform Polish

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-perf-desktop-benchmark | Benchmark V3 on desktop Chrome/Safari: target ≥60fps sustained | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-v3-engine-production | 2026-03-28 | 0.010ms/frame avg — 0.06% of 16.6ms budget |
| TASK-perf-mobile-web-benchmark | Benchmark V3 on mobile Safari/Chrome: target ≥30fps with reduced trails | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-v3-engine-production | 2026-03-28 | 0.002ms/frame avg — 0.006% of 33.3ms budget |
| TASK-perf-ios-native-benchmark | Benchmark iOS native (iPhone 12+): ≥30fps, <150MB GPU, no thermal throttle 60s | mobile | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Cancelled | TASK-mobile-v3-engine | 2026-03-28 | Skipped: iOS in separate Swift repo |
| TASK-perf-trail-optimization | Optimize trail buffer size, fade rate, render batch based on benchmarks | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-perf-desktop-benchmark | 2026-03-28 | 3-tier adaptive: high(2000) / medium(800) / low(300) auto-selected by canvas size |
| TASK-perf-first-frame | Validate <2s first visible frame from data availability on web | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | TASK-v3-engine-production | 2026-03-28 | <50ms init→frame-ready (budget: 2000ms). 2 tests added |
| TASK-perf-transit-api | Validate /api/transit-state p95 <500ms under concurrent load | api-server | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Done | - | 2026-03-28 | scripts/benchmark-transit-state.mjs — run against staging with BENCHMARK_USER_ID + TOKEN |
| TASK-phase-4-manual-testing | Final runbook: all-platform Signatur test matrix | frontend, mobile, api-server | - | Done | TASK-perf-trail-optimization | 2026-03-28 | docs/runbooks/signatur-performance-test-matrix.md |

---

## Phase: Deferred (Previously Current Sprint — moved to next sprint)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DPB-01 | Supabase daily_horoscope_cache as L2 behind in-memory Map | api-server | Done | L2 read in try/catch for resilience |
| DPB-02 | Daily recurrence — seen flag boolean → date-based | frontend | Done | daily_modal_seen_date DATE column |
| DPB-03 | SVG fallback when canvas unavailable in DayModeModal | frontend | Done | commit fb6ff99 |
| DPB-04 | Delete deprecated DailyHoroscopeModal | frontend | Done | commit 24ba304 |
| DPB-05 | Update API docs (harmony_index, day_mode) + architecture refs | - | Done | commit 3c6441f |
| DPB-06 | Remove dead daily_modal_* analytics event names | frontend | Done | commit 3b8fb4b |
| DPB-07 | Update daily_modal_v1 flag description in CLAUDE.md | - | Done | commit 6873ca3 |

### Bugs (Fixed)

| ID | Bug | Component | Status | Notes |
|----|-----|-----------|--------|-------|
| BUG-04 | FusionRingCanvasV2 post-processing errors swallowed | frontend | Done | commit edea89d |
| BUG-05 | usePremium Realtime subscription falls back silently | frontend | Done | commit b43b9d7 |
| BUG-06 | Tour persistence fails silently | frontend | Done | commit fbaae99 |
| BUG-07 | Ghost UI: "Tour wiederholen" and "Zahlung verwalten" | frontend | Done | S-DP-01 |
| BUG-08 | "Neustarten" button with no function | frontend | Done | S-DP-02 |
| BUG-09 | Redundant reload button | frontend | Done | S-DP-03 |
| BUG-10 | Placeholder "Your Bazaar Blueprint" | frontend | Done | S-DP-05 |
| BUG-11 | Wu-Xing Metal icon shows "Wind" | frontend | Done | S-DP-07 |
| BUG-12 | Levi layer layout/sizing issues | frontend | Done | commit 4152086 + 57426d3 |
| BUG-13 | Blueprint DE/EN inconsistency | frontend | Done | S-DP-06 |
| BUG-14 | "KI-Synthese" heading never specified | frontend | Done | S-DP-04 |

---

## Execution Plan

### Sprint S-BRIDGE: Shared Bridge Refactor

**Sprint Goal:** DIMENSION_DEFS als Single Source of Truth; Determinismus-Tests; Swift-Referenz.

#### Phase 1: DIMENSION_DEFS Single Source of Truth

**Capabilities delivered:**
- `DIMENSION_DEFS` + alle Bridge-Funktionen aus `@bazodiac/shared/signatur` importierbar
- `bipolar-engine.ts` und Web-Bridge konsumieren Shared Package — keine lokale Duplizierung
- Alle bestehenden Tests laufen weiter grün

**Tasks:**
1. TASK-sbridge-dimension-defs
2. TASK-sbridge-v3-bridge-fn
3. TASK-sbridge-shared-index
4. TASK-sbridge-engine-consume
5. TASK-sbridge-web-bridge-consume
6. TASK-sbridge-test-imports

#### Phase 2: Determinismus-Test-Suite

**Capabilities delivered:**
- Automatisierter Beweis: identische Inputs → identische Pol-Geometrie (Float-Determinismus)
- DIMENSION_DEFS Contract maschinengeprüft — stille Hz-Änderungen schlagen sofort fehl
- Bridge-Funktionen produzieren nachweislich spec-konforme Werte ∈ [0,1]

**Tasks:**
1. TASK-sbridge-dim-contract
2. TASK-sbridge-hz-constants
3. TASK-sbridge-bridge-contract
4. TASK-sbridge-determinism

#### Phase 3: Swift-Referenz & Runbook

**Capabilities delivered:**
- iOS-Entwickler hat Copy-paste-ready Swift-Konstanten für alle 6 Dimensionen (kein Hardcoding)
- Verifizierungsrunbook: Refactor nachweisbar ohne Regressionen

**Tasks:**
1. TASK-sbridge-swift-doc
2. TASK-sbridge-manual-testing

---

### Phase A: Production Hardening

**Capabilities delivered:**
- Stripe payments fully operational (webhook verification)
- Deploy and migration procedures documented as runbooks

**Tasks:**
1. TASK-stripe-webhook-secret
2. TASK-bafe-determinism-test
3. TASK-deploy-runbook
4. TASK-migration-runbook

### Phase B: Onboarding Completion

**Capabilities delivered:**
- Experience API fully wired (bootstrap + signature-delta replace direct BAFE calls)
- REQ-F-cosmic-encounter-onboarding moves from Draft → Implemented
- Cosmic Encounter 7-phase onboarding gated behind feature flag

**Tasks:**
1. TASK-fuffire-experience-api
2. TASK-onboarding-route
3. TASK-onboarding-mobile-fallback
4. TASK-onboarding-flag-gate
5. TASK-phase-b-manual-testing

### Phase C: Dashboard & Voice Polish

**Capabilities delivered:**
- Dashboard layout matches product vision (Big Three prominent top)
- Levi voice agent has Signatur V2 knowledge base
- Daily Home layout ported to Dashboard

**Tasks:**
1. TASK-dashboard-wireframe
2. TASK-dashboard-layout-redesign
3. TASK-daily-home-port
4. TASK-levi-system-prompt
5. TASK-levi-auto-summary

### Phase D: Signatur V3 Engine — SUPERSEDED by S-SIG sprint

V3 engine tasks (pole system, trail renderer, dissonance wiring, feature flag) were completed in S-SIG Phase 1–2. Remaining:
1. TASK-bloom-fine-tuning (Deferred)
2. TASK-bloom-solar-coupling (Todo)

### Phase E: Autopoietic UX Evolution

**Capabilities delivered:**
- Z-axis depth navigation replaces horizontal scrolling
- UI adapts to user's dominant Wu-Xing element
- Progressive fluidity based on engagement depth

**Tasks:**
1. TASK-depth-navigation
2. TASK-depth-nav-implement
3. TASK-element-ui-adaptation
4. TASK-engagement-fluidity
5. TASK-phase-e-manual-testing

### Phase F: Partnership Features (Blocked)

Blocked on 6 open questions (OQ-house-system through OQ-synastry-signal). 18 tasks tracked in GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136). Will be added once OQs are resolved.

### Phase G: Mobile Parity

**Capabilities delivered:**
- iOS app reaches feature parity with web on core flows
- 3D SignaturCanvas mounted and functional
- Offline contribution queue tested end-to-end

**Tasks:**
1. TASK-mobile-signatur-3d
2. TASK-mobile-offline-e2e
3. TASK-mobile-onboarding
4. TASK-ios-lockscreen-widget

### Phase V1: Vibes Core (MVP)

**Capabilities delivered:**
- "Vibe abrufen" button on Dashboard delivers personalized 2–3h insight within <2s
- 3-level output: Kurzsignal → Treiber → Erklärung
- Deterministic: same user + timestamp = same result
- "Warum sehe ich das?" explainability

**Tasks:**
1. TASK-vibes-api-endpoint
2. TASK-vibes-gemini-prompt
3. TASK-vibes-deterministic-cache
4. TASK-vibes-fallback-template
5. TASK-vibes-dashboard-button
6. TASK-vibes-result-modal
7. TASK-vibes-explainability
8. TASK-vibes-response-time-test
9. TASK-vibes-manual-testing

### Phase V2: Weekly Insights

**Capabilities delivered:**
- "Deine Woche im Überblick" shows 7 life areas with tendency labels
- Top 3 areas highlighted with additional depth
- Weekly refresh (Monday boundary)
- "Warum?" explainability per area

**Tasks:**
1. TASK-weekly-life-area-mapping
2. TASK-weekly-api-endpoint
3. TASK-weekly-gemini-prompt
4. TASK-weekly-cache
5. TASK-weekly-prioritization-algo
6. TASK-weekly-insights-page
7. TASK-weekly-area-explainability
8. TASK-weekly-route
9. TASK-weekly-manual-testing

### Phase V3: Transparency & Mobile Polish

**Capabilities delivered:**
- Zero unexplained numbers in the UI (system-wide enforcement)
- Mobile-first readability validated across all insight screens
- Consistent logic between mobile and web

**Tasks:**
1. TASK-transparency-audit
2. TASK-transparency-tooltips
3. TASK-transparency-gemini-guard
4. TASK-mobile-readability-vibes
5. TASK-mobile-readability-weekly
6. TASK-mobile-vibes-integration
7. TASK-vibes-weekly-e2e-test
8. TASK-vibes-weekly-manual-testing

---

## Shared Package

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-sbridge-dimension-defs | Erstelle `packages/shared/src/signatur/dimension-defs.ts`: `DimensionDef` + `DIMENSION_DEFS` aus `bipolar-engine.ts` extrahieren | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | - | 2026-03-29 | |
| TASK-sbridge-v3-bridge-fn | `soulprintToDimensionWeights()` in `packages/shared/src/signatur/signatur-bridge.ts` portieren | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-dimension-defs | 2026-03-29 | |
| TASK-sbridge-shared-index | `packages/shared/src/signatur/index.ts` mit allen Exporten aktualisieren | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-v3-bridge-fn | 2026-03-29 | |
| TASK-sbridge-dim-contract | Vitest: DIMENSION_DEFS Contract (6 Einträge, Hz, Winkel, Farben) | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-shared-index | 2026-03-29 | |
| TASK-sbridge-hz-constants | Vitest: Hz-Guard-Test (exakte Spec-Werte, schlägt bei stiller Änderung fehl) | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-dim-contract | 2026-03-29 | |
| TASK-sbridge-bridge-contract | Vitest: Bridge-Funktionen outputs ∈ [0,1], Edge-cases | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-dim-contract | 2026-03-29 | |
| TASK-sbridge-swift-doc | `packages/shared/src/signatur/SWIFT_CONSTANTS.md` mit Swift-ready Konstanten | P1 | Done | [REQ-F-signatur-ios-swift](../1-objectives/requirements/REQ-F-signatur-ios-swift.md) | TASK-sbridge-hz-constants | 2026-03-29 | |

## Setup & Infrastructure

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-stripe-webhook-secret | Configure `STRIPE_WEBHOOK_SECRET` on Railway; verify webhook signature validation | P0 | Done | - | - | 2026-03-28 | 5-min config task, only remaining Stripe blocker |
| TASK-bafe-determinism-test | Add contract test: identical birth data → identical BAFE responses across runs | P1 | Done | [REQ-F-natal-chart-calculation](../1-objectives/requirements/REQ-F-natal-chart-calculation.md) | - | 2026-03-28 | Covers determinism Success Criterion |
| TASK-depth-navigation | Design Z-axis depth navigation concept (surface → core metaphor replacing horizontal scroll) | P1 | Todo | - | - | 2026-03-28 | Design-first: wireframe before code |

## Frontend

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-onboarding-route | Build OnboardingPage with BirthForm + FusionRingReveal + quiz phase as state machine | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-fuffire-experience-api | 2026-03-28 | 7-phase state machine |
| TASK-onboarding-mobile-fallback | Implement mobile fallback for onboarding (CSS+image when viewport < 768px) | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | CosmicEncounterMobile component |
| TASK-onboarding-flag-gate | Gate full Cosmic Encounter behind `cosmic_encounter_v1` flag; legacy BirthForm as fallback | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | Flag currently hard-disabled |
| TASK-dashboard-wireframe | Design wireframe for Dashboard redesign (Big Three top, influence gauges, Levi, Blueprint) | P1 | Done | - | - | 2026-03-29 | docs/wireframes/dashboard-v2.md — F1 Big Four, F2 MiniSignature+Toggle, F3 unified TagesEnergie, F4 Upgrade nach Levi |
| TASK-dashboard-layout-redesign | Implement Dashboard layout per approved wireframe | P1 | Done | - | TASK-dashboard-wireframe | 2026-03-30 | F1 BigFour + F2 MiniSignature + F3 TagesEnergie + F4 Upgrade repositioned |
| TASK-tagesenergie-hero | DashboardTagesEnergie Hero-Sektion mit Kosmoswetter + Resonanz | P1 | Done | [REQ-F-signatur-day-night-pulse](../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md) | TASK-dashboard-wireframe | 2026-03-30 | Implementiert + 37 Tests + i18n |
| TASK-daily-home-port | Port 5-zone Daily Home layout to Dashboard.tsx with real Contexts | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-dashboard-layout-redesign | 2026-03-30 | |
| ~~TASK-v3-pole-system~~ | ~~Duplicate of S-SIG TASK-v3-engine-production~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| ~~TASK-v3-trail-renderer~~ | ~~Duplicate of S-SIG TASK-v3-engine-production~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| ~~TASK-v3-dissonance-visual~~ | ~~Duplicate of S-SIG TASK-v3-dissonance-wiring~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| ~~TASK-v3-feature-flag~~ | ~~Duplicate of S-SIG TASK-v3-feature-flag~~ | - | Done | - | - | 2026-03-29 | Superseded by S-SIG sprint |
| TASK-bloom-fine-tuning | Reduce glow, increase color saturation per user feedback (V2+V3) | P2 | Deferred | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-03-28 | After live test |
| TASK-bloom-solar-coupling | Couple Bloom intensity to solar activity via computeRingModulation | P2 | Todo | [REQ-F-space-weather-modulation](../1-objectives/requirements/REQ-F-space-weather-modulation.md) | - | 2026-03-28 | Needs decision |
| TASK-sbridge-engine-consume | `bipolar-engine.ts`: `DimensionDef`+`DIMENSION_DEFS` aus Shared Package importieren; lokale Defs entfernen | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-shared-index | 2026-03-29 | |
| TASK-sbridge-web-bridge-consume | `signatur-bridge.ts` (web): lokale `soulprintToDimensionWeights` durch Shared-Import ersetzen | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-engine-consume | 2026-03-29 | |
| TASK-sbridge-test-imports | `signatur-v3-engine.test.ts`: `DIMENSIONS` aus Shared Package importieren; alle 15 Tests grün | P1 | Done | [REQ-F-signatur-shared-bridge](../1-objectives/requirements/REQ-F-signatur-shared-bridge.md) | TASK-sbridge-web-bridge-consume | 2026-03-29 | |
| TASK-sbridge-determinism | Vitest: `initializePoles()` + 200× `updatePoles()` mit identischen Inputs → alle Pol-Positionen Δ < 1e-10 | P1 | Done | [REQ-F-signatur-determinism](../1-objectives/requirements/REQ-F-signatur-determinism.md) | TASK-sbridge-test-imports | 2026-03-29 | |
| TASK-depth-nav-implement | Implement depth navigation: Dashboard (surface) → Signatur (mid) → Core detail views (deep) | P1 | Todo | - | TASK-depth-navigation | 2026-03-28 | |
| TASK-element-ui-adaptation | Apply user's dominant Wu-Xing element to UI accent colors, card textures, transition speeds | P1 | Todo | - | - | 2026-03-28 | DEC-wuxing-ui-mapping |
| TASK-engagement-fluidity | Progressive UI fluidity: new users see conventional nav, engaged users see gesture-based fluid nav | P1 | Todo | - | TASK-depth-nav-implement | 2026-03-28 | |
| TASK-vibes-dashboard-button | Add "Vibe abrufen" CTA button on Dashboard with loading skeleton | P1 | Done | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-result-modal | Build VibesModal: Level 1 (Kurzsignal) + Level 2 (Treiber) visible, Level 3 behind "Warum?" tap | P1 | Done | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-dashboard-button | 2026-03-30 | | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-dashboard-button | 2026-03-30 | |
| TASK-vibes-explainability | Implement "Warum sehe ich das?" panel referencing Signatur + constellation | P1 | Done | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-vibes-result-modal | 2026-03-30 | | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-vibes-result-modal | 2026-03-30 | |
| TASK-weekly-insights-page | Build WeeklyInsightsPage: 7 area cards, top 3 highlighted, rest reduced | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-weekly-area-explainability | Add "Warum?" per area referencing Signatur sector + transit | P1 | Done | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-weekly-insights-page | 2026-03-30 | | [REQ-F-explainability-layer](../1-objectives/requirements/REQ-F-explainability-layer.md) | TASK-weekly-insights-page | 2026-03-30 | |
| TASK-weekly-route | Add `/weekly` route to router.tsx, lazy-loaded, add nav entry | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-insights-page | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-insights-page | 2026-03-30 | |
| TASK-transparency-audit | Audit all UI screens for unexplained numbers | P1 | Done | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-03-30 | 4 BARE + 3 PARTIAL fixed, 0 remaining | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-03-30 | | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | - | 2026-03-30 | Dashboard, Vibes, Weekly, Signatur, Wu-Xing, space weather |
| TASK-transparency-tooltips | Add tooltips/labels for all numerical values found in audit | P1 | Todo | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | TASK-transparency-audit | 2026-03-30 | |
| TASK-mobile-readability-vibes | Optimize VibesModal for 375px: Level 1+2 above fold, ≥14px, ≥1.5 line-height | P1 | Todo | [REQ-USA-mobile-first-readability](../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | TASK-vibes-result-modal | 2026-03-30 | |
| TASK-mobile-readability-weekly | Optimize WeeklyInsightsPage for 375px: top-3 above fold | P1 | Todo | [REQ-USA-mobile-first-readability](../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | TASK-weekly-insights-page | 2026-03-30 | |

## API Server

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-fuffire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in server.mjs; replace direct BAFE calls | P1 | Done | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | - | 2026-03-28 | FuFirE live at bafe-production.up.railway.app |
| TASK-levi-system-prompt | Configure ElevenLabs agent with Signatur V2 knowledge base | P1 | Done | - | - | 2026-03-30 | Enhanced /api/profile with dominant_element, signatur_summary, day_mode, vibes_summary | - | - | 2026-03-28 | See docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md |
| TASK-levi-auto-summary | Auto-summarize user profile after 3 Levi sessions via /api/agent/summary | P2 | Done | - | TASK-levi-system-prompt | 2026-03-30 | Gemini synthesis + agent_summary column | - | TASK-levi-system-prompt | 2026-03-28 | |
| TASK-eve-brand-safety-review | Review Eve system prompt for brand safety before production launch | P1 | Todo | [REQ-SEC-eve-brand-safety](../1-objectives/requirements/REQ-SEC-eve-brand-safety.md) | - | 2026-03-29 | Needs Ben's sign-off on persona tone |
| TASK-agent-extensibility-verify | Verify adding 3rd agent requires config-only change (no structural code) | P2 | Todo | [REQ-MNT-agent-extensibility](../1-objectives/requirements/REQ-MNT-agent-extensibility.md) | - | 2026-03-29 | Smoke test: add mock agent to config, confirm renders |
| TASK-vibes-api-endpoint | Create `/api/vibes`: soulprint + transit + space weather → Gemini → 3-level JSON | P1 | Done | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | - | 2026-03-30 | Implemented in Phase V1 | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | - | 2026-03-30 | Reuses existing transit-state + space weather data |
| TASK-vibes-gemini-prompt | Design Gemini prompt: 3-level structure, resource-oriented, no bare numbers, German | P1 | Done | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-F-vibes-output-structure](../1-objectives/requirements/REQ-F-vibes-output-structure.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-deterministic-cache | Deterministic cache: same user + same 30-min window = same result (L1 + L2 Supabase) | P1 | Done | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-F-vibes-core](../1-objectives/requirements/REQ-F-vibes-core.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-fallback-template | Deterministic fallback templates when Gemini unavailable (5 variants by element) | P1 | Done | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-api-endpoint | 2026-03-30 | | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-api-endpoint | 2026-03-30 | |
| TASK-vibes-response-time-test | Perf test: Vibes API <2s p95 (Gemini), <500ms (cached) | P1 | Done | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-deterministic-cache | 2026-03-30 | | [REQ-PERF-vibes-response-time](../1-objectives/requirements/REQ-PERF-vibes-response-time.md) | TASK-vibes-deterministic-cache | 2026-03-30 | |
| TASK-weekly-life-area-mapping | Map 12 zodiac sectors → 7 life areas | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | - | 2026-03-30 | 18 tests, house-based mapping | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | - | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | - | 2026-03-30 | |
| TASK-weekly-api-endpoint | Create `/api/weekly-insights`: soulprint + weekly transit → 7 areas via Gemini | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-life-area-mapping | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-life-area-mapping | 2026-03-30 | |
| TASK-weekly-gemini-prompt | Design Gemini prompt: 7 areas, 1 statement + 1 tendency each, resource-oriented, German | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-weekly-cache | Weekly cache: 1 per user per ISO week (L1 + L2 Supabase) | P1 | Done | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-insights-engine](../1-objectives/requirements/REQ-F-weekly-insights-engine.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-weekly-prioritization-algo | Top-3 area selection: transit intensity × soulprint weight, deterministic | P2 | Done | [REQ-F-weekly-area-prioritization](../1-objectives/requirements/REQ-F-weekly-area-prioritization.md) | TASK-weekly-api-endpoint | 2026-03-30 | | [REQ-F-weekly-area-prioritization](../1-objectives/requirements/REQ-F-weekly-area-prioritization.md) | TASK-weekly-api-endpoint | 2026-03-30 | |
| TASK-transparency-gemini-guard | Gemini output validation: reject/rewrite responses with bare numbers | P1 | Todo | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | TASK-vibes-gemini-prompt | 2026-03-30 | |
| TASK-vibes-weekly-e2e-test | Integration test: Vibes + Weekly API return valid structure, no bare numbers | P1 | Todo | [REQ-F-transparency-rule](../1-objectives/requirements/REQ-F-transparency-rule.md) | TASK-transparency-gemini-guard | 2026-03-30 | |

## Mobile

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-mobile-signatur-3d | Mount SignaturCanvas on FuRingScreen (currently unused expo-gl + three.js component) | P2 | Todo | [REQ-F-fusion-ring-visualization](../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | - | 2026-03-28 | |
| TASK-mobile-offline-e2e | End-to-end test: offline quiz → queue → flush on reconnect | P2 | Todo | [REQ-F-quiz-contribution-system](../1-objectives/requirements/REQ-F-quiz-contribution-system.md) | - | 2026-03-28 | |
| TASK-mobile-onboarding | Port onboarding flow to mobile (CosmicEncounterMobile fallback) | P2 | Todo | [REQ-F-cosmic-encounter-onboarding](../1-objectives/requirements/REQ-F-cosmic-encounter-onboarding.md) | TASK-onboarding-route | 2026-03-28 | |
| TASK-ios-lockscreen-widget | Concept + prototype for daily Signatur widget on iOS Lock Screen | P2 | Todo | - | - | 2026-03-28 | Idea phase |
| TASK-mobile-vibes-integration | Add Vibes button + Weekly link to mobile app (same API, adapted layout) | P1 | Todo | [REQ-USA-mobile-first-readability](../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | TASK-vibes-api-endpoint, TASK-weekly-api-endpoint | 2026-03-30 | |

## Deploy & Operations

| ID | Task | Priority | Status | Req | Dependencies | Updated | Notes |
|----|------|----------|--------|-----|--------------|---------|-------|
| TASK-deploy-runbook | Create Railway deploy runbook (build, env vars checklist, rollback steps) | P0 | Done | - | - | 2026-03-28 | |
| TASK-migration-runbook | Create Supabase migration runbook (SQL Editor workflow, rollback patterns) | P0 | Done | - | - | 2026-03-28 | |
| TASK-phase-b-manual-testing | Create onboarding runbook: test scenarios for all 7 phases, desktop + mobile, flag on/off | P1 | Done | - | TASK-onboarding-flag-gate | 2026-03-28 | |
| TASK-phase-e-manual-testing | Update deploy runbook with depth-nav test scenarios and element-adaptation verification | P1 | Todo | - | TASK-engagement-fluidity | 2026-03-28 | |
| TASK-sbridge-manual-testing | Erstelle `docs/runbooks/signatur-s-bridge-verification.md`: vitest grün, MiniSignature rendert, Signatur-Seite rendert, tsc clean | P1 | Done | - | TASK-sbridge-determinism, TASK-sbridge-swift-doc | 2026-03-29 | |

## Partnership Features (Blocked)

Open questions requiring human decision before work can begin:

| ID | Question | Status |
|----|----------|--------|
| OQ-house-system | House system: Placidus or Koch? | Blocked (Ben's decision) |
| OQ-synastry-consent | Synastry without partner account? | Blocked (Ben's decision) |
| OQ-orb-tolerance | Orb tolerance for interaspects? | Blocked (Ben's decision) |
| OQ-minor-aspects | Minor aspects (Quincunx, Semisextile) or only 5 main? | Blocked (Ben's decision) |
| OQ-narrative-generation | Partnership narratives: fixed templates or Gemini-generated? | Blocked (Ben's decision) |
| OQ-synastry-signal | Synastry as 4th signal or separate system? | Blocked (Ben's decision) |

Partnership implementation tasks (18 items across S08-S11) are tracked in GitHub Issues and will be added here once open questions are resolved.

---

GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136) remain in GitHub for detailed tracking.
