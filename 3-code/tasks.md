# Development Tasks

## Phase: Current Sprint — S-DAUP (Dashboard Aufräumen)

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
**Full Sprint Spec:** [Sprints/sprint-dashboard-polish/SPRINT.md](../Sprints/sprint-dashboard-polish/SPRINT.md)

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
| S-DP-09 | Gate WuXingPage extended content behind PremiumGate | frontend | Done | commit 55d3118 — PremiumGate wraps element analysis |
| S-DP-10 | Move Western houses from Dashboard to WuXingPage | frontend | Done | commit e13d937 — houses removed from Dashboard |
| S-DP-11 | Fix Levi text: alignment, font size, remove italic | frontend | Done | commit 4152086 |
| S-DP-12 | Fix Levi buttons: size "Call Levi", remove "Levi Bazzi bereit" | frontend | Done | commit 4152086 + 57426d3 compact tile |
| S-DP-13 | Move Levi section higher in Dashboard | frontend | Done | commit 4152086 |
| S-DP-14 | Increase date/time display in Planetarium | frontend | Done | commit 943904c |
| S-DP-15 | Show current constellation alongside birth chart | frontend | Done | commit 943904c |
| S-DP-16 | Add constellation description at Planetarium bottom | frontend | Done | commit 943904c |
| S-DP-17 | Apply Planetarium enhancements to Solar System view | frontend | Done | commit 943904c |
| S-DP-18 | Create 3 navigation menu proposals with hover submenus | frontend | Done | commit 89d94ad / a322b2c — Variant A implemented |
| S-DP-19 | Redesign header: enlarge heading, create header zone | frontend | Done | commit 89d94ad — gold accent line + enlarged heading |
| S-DP-20 | Surface FusionRingCanvasV2 post-processing errors | frontend | Done | commit edea89d — REDUZIERTER MODUS badge + onPostProcessDegraded callback |
| S-DP-21 | Surface usePremium Realtime fallback | frontend | Done | commit b43b9d7 — 30s poll fallback with console.warn |
| S-DP-22 | Add error propagation for tour_completed write | frontend | Done | commit fbaae99 — persistError exposed from useDashboardTour |

## Phase: Completed — Dissonance Coefficient (2026-03-24)

| ID | Task | Component | Status | Notes |
|----|------|-----------|--------|-------|
| DEC-01 | DissonanceResult type + computeDissonance() | frontend | Done | commit f5b2c54 — src/lib/fusion-ring/dissonance.ts |
| DEC-02 | VisualModulation parameters type | frontend | Done | commit f5b2c54 — src/lib/fusion-ring/dissonance-visual.ts |
| DEC-03 | Extend bazodiac-engine.ts with modulation hooks | frontend | Done | commit c83259e |
| DEC-04 | useDissonance React hook | frontend | Done | commit 41235e6 — src/hooks/useDissonance.ts |
| DEC-05 | Morph transition system with dissonance-aware easing | frontend | Done | commit 5ca1681 |
| DEC-06 | Apply modulation in FusionRingCanvasV2 render loop | frontend | Done | commit 8f6e59d |
| DEC-07 | Persist dissonance state to Supabase (upsertDissonanceState) | api-server | Done | commit 7c2257a + migration 20260324_dissonance_state.sql |
| DEC-08 | Premium "Sichtbare Werte" toggle + gauge component | frontend | Done | commit 24f630f — DissonanceValues.tsx, FuRingPage wired |

## Phase: Completed — Day-Pulse / Day-Mode (2026-03-25)

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
| TASK-phase-1-manual-testing | Create runbook: Signatur V3 web manual test scenarios | frontend | - | Todo | TASK-v3-unit-tests | 2026-03-27 | Deferred to end of sprint |

### Phase 2 Tasks — Cousto Audio Synthesis

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-audio-synthesis-module | Create CoustoAudioEngine: Web Audio API, 6 frequencies (Mars 144.72, Moon 210.42, Sun 126.22, Mercury 141.27, Jupiter 183.58, Saturn 147.85 Hz) | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Todo | TASK-v3-engine-production | 2026-03-27 | |
| TASK-audio-weight-mapping | Map pole weights to oscillator gain with smooth interpolation | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Todo | TASK-audio-synthesis-module | 2026-03-27 | |
| TASK-audio-ui-controls | Add mute toggle + volume slider to Signatur page (localStorage persisted) | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Todo | TASK-audio-synthesis-module | 2026-03-27 | |
| TASK-audio-lifecycle | Wire audio lifecycle: start on mount, suspend on hidden, resume on visible, stop on unmount | frontend | [REQ-F-signatur-rendering-engine](../1-objectives/requirements/REQ-F-signatur-rendering-engine.md) | Todo | TASK-audio-synthesis-module | 2026-03-27 | |
| TASK-audio-ios-safari | Test/fix Web Audio API on mobile Safari (user gesture for AudioContext.resume()) | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Todo | TASK-audio-lifecycle | 2026-03-27 | |
| TASK-phase-2-manual-testing | Update runbook: audio test scenarios (mute, volume, tab switch, Safari gesture) | frontend | - | Todo | TASK-audio-ios-safari | 2026-03-27 | |

### Phase 3 Tasks — Mobile Native 3D Signatur

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-mobile-v3-engine | Adapt V3 bipolar trail engine for expo-gl: Canvas 2D → GL context, reduced trail buffer | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Todo | TASK-v3-engine-production | 2026-03-27 | SignaturCanvas.tsx exists as starting point |
| TASK-mobile-mount-signatur | Mount V3 SignaturCanvas on FuRingScreen, replacing 2D bootstrap view | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Todo | TASK-mobile-v3-engine | 2026-03-27 | |
| TASK-mobile-gesture-handler | Implement gesture controls: pan (1 finger), pinch-zoom (2 fingers), orbit (drag) | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Todo | TASK-mobile-mount-signatur | 2026-03-27 | react-native-gesture-handler |
| TASK-mobile-data-pipeline | Wire useBootstrapSignatur → natal weights + quiz weights → V3 input vector | mobile | [REQ-F-signatur-data-pipeline](../1-objectives/requirements/REQ-F-signatur-data-pipeline.md) | Todo | TASK-mobile-mount-signatur | 2026-03-27 | |
| TASK-mobile-audio | Implement Cousto audio on React Native via expo-av (6 oscillators, weight-mapped gain) | mobile | [REQ-F-signatur-mobile-native](../1-objectives/requirements/REQ-F-signatur-mobile-native.md) | Todo | TASK-audio-synthesis-module, TASK-mobile-mount-signatur | 2026-03-27 | |
| TASK-phase-3-manual-testing | Update runbook: iOS Signatur test scenarios (gestures, audio, data, older device perf) | mobile, frontend | - | Todo | TASK-mobile-audio | 2026-03-27 | |

### Phase 4 Tasks — Performance & Cross-Platform Polish

| ID | Task | Component | Req | Status | Dependencies | Updated | Notes |
|----|------|-----------|-----|--------|--------------|---------|-------|
| TASK-perf-desktop-benchmark | Benchmark V3 on desktop Chrome/Safari: target ≥60fps sustained | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Todo | TASK-v3-engine-production | 2026-03-27 | |
| TASK-perf-mobile-web-benchmark | Benchmark V3 on mobile Safari/Chrome: target ≥30fps with reduced trails | frontend | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Todo | TASK-v3-engine-production | 2026-03-27 | |
| TASK-perf-ios-native-benchmark | Benchmark iOS native (iPhone 12+): ≥30fps, <150MB GPU, no thermal throttle 60s | mobile | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Todo | TASK-mobile-v3-engine | 2026-03-27 | |
| TASK-perf-trail-optimization | Optimize trail buffer size, fade rate, render batch based on benchmarks | frontend, mobile | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Todo | TASK-perf-desktop-benchmark, TASK-perf-ios-native-benchmark | 2026-03-27 | |
| TASK-perf-first-frame | Validate <2s first visible frame from data availability on all platforms | frontend, mobile | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Todo | TASK-v3-engine-production, TASK-mobile-mount-signatur | 2026-03-27 | |
| TASK-perf-transit-api | Validate /api/transit-state p95 <500ms under concurrent load | api-server | [REQ-PERF-signatur-performance](../1-objectives/requirements/REQ-PERF-signatur-performance.md) | Todo | - | 2026-03-27 | |
| TASK-phase-4-manual-testing | Final runbook: all-platform Signatur test matrix | frontend, mobile, api-server | - | Todo | TASK-perf-trail-optimization | 2026-03-27 | |

---

## Phase: Deferred (Previously Current Sprint — moved to next sprint)

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| TASK-daily-home-port | Port 5-zone Daily Home layout to Dashboard.tsx with real Contexts | frontend | REQ-F-cosmic-encounter-onboarding | Deferred | Data mapping from source layout |
| TASK-levi-system-prompt | Configure ElevenLabs agent with Signatur V2 knowledge base | api-server | — | Deferred | See docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md |
| TASK-onboarding-route | Build OnboardingPage with BirthForm + FusionRingReveal flow | frontend | REQ-F-cosmic-encounter-onboarding | Deferred | Adjust App.tsx routing |
| TASK-bloom-fine-tuning | Reduce glow, increase color saturation per user feedback | frontend | REQ-F-fusion-ring-visualization | Deferred | After live test |

## Phase: Bugs (Fix Before Next Feature)

| ID | Bug | Component | Status | Notes |
|----|-----|-----------|--------|-------|
| BUG-04 | Silent-catch in `FusionRingCanvasV2` `Vignette`/`OutputPass` — Three.js post-processing errors swallowed, no console output | frontend | Done | commit edea89d — onPostProcessDegraded callback + REDUZIERTER MODUS badge |
| BUG-05 | `usePremium` Realtime subscription falls back to polling silently — no log, no user feedback | frontend | Done | commit b43b9d7 — setInterval(30s) poll fallback on CHANNEL_ERROR/TIMED_OUT |
| BUG-06 | Tour persistence fails silently — `tour_completed` write to Supabase fails without error propagation | frontend | Done | commit fbaae99 — persistError state exposed from useDashboardTour |
| BUG-07 | Dashboard top-right shows "Tour wiederholen" and "Zahlung verwalten" options — never intended, no descriptions | frontend | Done | Ghost UI removed (S-DP-01) |
| BUG-08 | "Neustarten" button present but no restart function exists for horoscope/quizzes/content | frontend | Done | Button removed (S-DP-02) |
| BUG-09 | Redundant reload button in "dein Bazodiac" heading — browser already provides this | frontend | Done | Button removed (S-DP-03) |
| BUG-10 | Placeholder text "Your Bazaar Blueprint" shown in "Kosmischer Blueprint" section | frontend | Done | German copy applied (S-DP-05) |
| BUG-11 | Wu-Xing element chart: Metal icon shows "Wind" with hover tooltip "Wind" | frontend | Done | Icon + aria-label fixed to "Metall" (S-DP-07) |
| BUG-12 | Levi layer: text offset left-aligned, italic, very small (poor readability); "Call Levi" button oversized; extra small "Levi Bazzi bereit" button present | frontend | Done | commit 4152086 + 57426d3 — layout, sizing, italic removed |
| BUG-13 | Cosmic Blueprint section: inconsistent DE/EN language mix; heading and body text respond differently to language toggle | frontend | Done | CON-german-ui enforced (S-DP-06) |
| BUG-14 | "KI-Synthese" heading displayed but never specified in design | frontend | Done | Heading removed (S-DP-04) |

## Phase: Backlog (Prioritized)

| ID | Task | Component | Req | Status | Notes |
|----|------|-----------|-----|--------|-------|
| TASK-fuffire-experience-api | Wire `/experience/bootstrap` + `/experience/signature-delta` in `server.mjs`; replace direct BAFE calls in bootstrap flow | api-server | REQ-F-cosmic-encounter-onboarding | Pending | FuFirE live at bafe-production.up.railway.app; see docs/API_EXPERIENCE.md |
| TASK-stripe-checkout-endpoint | ~~Implement checkout endpoint~~ — CODE EXISTS: `/api/checkout` in server.mjs | api-server | — | Done | Verified via code scan 2026-03-24 |
| TASK-stripe-webhook-secret | Configure `STRIPE_WEBHOOK_SECRET` env var on Railway; verify `/api/webhook` signature validation | api-server | — | Pending | ONLY remaining Stripe blocker — 5min config task |
| TASK-dashboard-layout-redesign | Redesign Dashboard layout: Big Three (Sun/Moon/Ascendant) prominent top; Wu-Xing + Houses moved to detail page | frontend | — | Pending | Design-first task; needs wireframe before implementation |
| TASK-levi-auto-summary | Auto-summarize user profile after 3 Levi sessions | api-server | — | Pending | FEAT from backlog |
| TASK-bloom-solar-coupling | Evaluate coupling Bloom intensity to solar activity | frontend | REQ-F-space-weather-modulation | Pending | FRAGE: needs decision |
| TASK-ios-lockscreen-widget | Concept for daily Signatur widget on iOS Lock Screen | mobile | — | Pending | IDEA: later phase |

## Phase: Partnership Features (Roadmap — blocked by open questions)

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

GitHub Issues (#115, #117, #118, #119, #123, #124, #129, #130, #132, #136) remain in GitHub for detailed tracking. Items above are the scaffold-level view.
