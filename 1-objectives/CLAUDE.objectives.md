Phase-specific instructions for the **Objectives** phase. Extends [../CLAUDE.md](../CLAUDE.md).

## Purpose

This phase defines **what** we're building and **why**. Focus on clarity, measurability, and alignment with project needs.

## Phase artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Goals | [`goals/`](goals/) | High-level outcomes |
| Requirements | [`requirements/`](requirements/) | Testable system requirements |
| Assumptions | [`assumptions/`](assumptions/) | Beliefs taken as true but not verified |
| Constraints | [`constraints/`](constraints/) | Hard limits on design and implementation |

---

## AI Guidelines

### Per-artifact guidance

**Goals**: decompose vague ideas into concrete, measurable outcomes. Use MoSCoW priority consistently.
Status lifecycle: `Draft → Approved → Achieved → Deprecated`. Only a human can approve or deprecate. The agent marks `Achieved` when all success criteria are met (linked requirements implemented).

**Requirements**: use clear, testable language (not "should be fast" — use "response time < 200ms at p95"). Choose the correct requirement class.
Requirement classes: `REQ-F` Functional, `REQ-PERF` Performance, `REQ-SEC` Security, `REQ-REL` Reliability, `REQ-USA` Usability, `REQ-MNT` Maintainability, `REQ-PORT` Portability, `REQ-SCA` Scalability, `REQ-COMP` Compliance.
Status lifecycle: `Draft → Approved → Implemented → Deprecated`. Only a human can approve or deprecate. The agent marks `Implemented` when all linked tasks reach Done.

**Assumptions**: always record the risk level (what happens if wrong?) and a verification plan when possible.
Status lifecycle: `Unverified → Verified | Invalidated`. The agent marks `Verified` when the verification plan confirms the assumption. Only a human can mark `Invalidated` (triggers impact analysis on dependent artifacts).

**Constraints**: consider technical (platforms, dependencies), business (budget, timeline, team size), and operational (hosting, compliance) categories.
Status lifecycle: `Active → Lifted`. Only a human can lift a constraint.

### Conflict resolution

A conflict exists when two or more requirements cannot both be satisfied as stated.

**Never resolve a conflict silently.** Always surface it before acting.

1. **Identify**: note conflicting requirement IDs and why they are incompatible.
2. **Ask the user**: present what makes them incompatible, two or more resolution options, and a recommended option if one is clearly better.
3. **Wait for explicit approval** before modifying any file.
4. **Apply**: update affected requirement files and index rows. Update dependent goals if affected. Record a design decision if the resolution imposes a recurring constraint.
5. **Verify**: no artifacts remain in a conflicting state after resolution.

### Assumption invalidation

When an assumption is found to be wrong or no longer holds:

1. **Identify impact**: list all artifacts (requirements, design decisions) that depend on the invalidated assumption.
2. **Ask the user**: present the invalidated assumption, the affected artifacts, and proposed adjustments or alternatives.
3. **Wait for explicit approval** before modifying any file.
4. **Apply**: change the assumption's Status to `Invalidated`. Update or flag all dependent artifacts as directed.
5. **Verify**: no artifacts remain based on the invalidated assumption without acknowledgment.

### Artifact deprecation

When an artifact (goal, requirement) is no longer relevant:

1. Propose deprecation to the user with rationale and downstream impact.
2. Wait for explicit approval.
3. Change Status to `Deprecated` in the artifact file. Update its index row.
4. Check for dependent artifacts — flag any that reference the deprecated item.

---

## Linking to Other Phases

- Goals, constraints, assumptions, and requirements are referenced in design documents (`2-design/`)
- Requirements determine the development tasks in `3-code/tasks.md`; each task references the requirements it fulfills
- Acceptance criteria inform test cases (`3-code/`)

---

## Goals Index

| File | Priority | Status | Summary |
|------|----------|--------|---------|
| [GOAL-fusion-astrology](goals/GOAL-fusion-astrology.md) | Must | Approved | Kymatic fusion system — Signatur V3 als lebendiges kymatisches System; bijektive Kohärenz |
| [GOAL-autopoietic-ux](goals/GOAL-autopoietic-ux.md) | Must | Approved | UI adapts to user's elemental signature via three-layer autopoietic model |
| [GOAL-multi-agent-voice](goals/GOAL-multi-agent-voice.md) | Must | Approved | Levi + Eve as two fixed voice agent personas with independent conversation history |
| [GOAL-vibes-weekly-insights](goals/GOAL-vibes-weekly-insights.md) | Must | Approved | On-demand Vibes (2–3h) + Weekly Insights (7 life areas) with transparent outputs |
| [GOAL-signatur-phase2-density](goals/GOAL-signatur-phase2-density.md) | Must | Draft | Density Field (128×128) als numerische Signatur-Repräsentation + vollständiges Drei-Schichten-Dissonanz-Modell |
| [GOAL-signatur-phase3-matching](goals/GOAL-signatur-phase3-matching.md) | Must | Draft | Dual-Ring Matching, Frequenzkompatibilität, Cousto-Audio-Layer — Signatur als Identitätsprotokoll |
| [GOAL-daily-chart-coherence-first](goals/GOAL-daily-chart-coherence-first.md) | Must | Draft | Unified Daily Chart hero als erste Dashboard-Sektion — Kohärenz (Baseline + Tagesaktivierung), aktive Planeten, Daily Impulse, Driver-Strip in einer Karte |
| [GOAL-synastry-compatibility](goals/GOAL-synastry-compatibility.md) | Must | Draft | Partnership compatibility via synastry interaspect chart — free grid, premium Gemini narrative |
| [GOAL-navigation-app-shell-consistency](goals/GOAL-navigation-app-shell-consistency.md) | Must | Approved | Consistent app-shell navigation across all pages — active-route highlight, Dashboard link, non-confusing mode toggle |
| [GOAL-signatur-realtime-consistency](goals/GOAL-signatur-realtime-consistency.md) | Must | Approved | Signatur visibly reacts to real-time inputs; cluster-gate enforced; same V2 engine on web + mobile; Cousto mute reliable |
| [GOAL-i18n-quiz-ux-integrity](goals/GOAL-i18n-quiz-ux-integrity.md) | Must | Approved | Zero raw translation keys in UI; quiz overlays reliably dismissable (X / Esc / backdrop) |
| [GOAL-superglue-removal](goals/GOAL-superglue-removal.md) | Must | Approved | Superglue-Dependency aus 6 Core-UX-Flows entfernen; direkte Server-Endpoints gegen BAFE/FuFirE/Supabase |
| [GOAL-soulprint-persistence](goals/GOAL-soulprint-persistence.md) | Must | Approved | Bootstrap persistiert soulprint_sectors zuverlässig via upsert — fixt Default-Signatur-Symptom (Race-Condition-Bug 2026-04-18) |
| [GOAL-dashboard-signatur-hygiene](goals/GOAL-dashboard-signatur-hygiene.md) | Must | Approved | Dashboard + Signatur-Seite zeigen echte Daten ohne UI-Lügen, duplizierte Sektionen entfernt — Sprint A 2026-04-20 |
| [GOAL-quiz-signatur-coupling-v1](goals/GOAL-quiz-signatur-coupling-v1.md) | Must | Approved | Quiz → Signatur Coupling Sprint 1: Datenmodell + Wu-Xing-Kranz + Sofort-Effekt. 12 Axiome als Produkt-Gesetz via CON-quiz-signatur-axiome |

---

## User Stories Index

| File | Priority | Status | Summary |
|------|----------|--------|---------|
| [US-natal-chart-calculation](user-stories/US-natal-chart-calculation.md) | Must | Draft | Full natal chart (Western + BaZi + Wu-Xing) from single birth data input |
| [US-signatur-personal-geometry](user-stories/US-signatur-personal-geometry.md) | Must | Draft | Deterministic Signatur geometry emerges from natal + quiz + transit inputs |
| [US-ui-element-adaptation](user-stories/US-ui-element-adaptation.md) | Must | Draft | Wu-Xing element drives UI accent colours and animation style |
| [US-ui-depth-navigation](user-stories/US-ui-depth-navigation.md) | Must | Draft | Z-axis depth metaphor: Dashboard → Signatur → detail views |
| [US-agent-selection](user-stories/US-agent-selection.md) | Must | Draft | Premium: choose between Levi (calm) and Eve (bold) voice advisors |
| [US-signatur-density-field](user-stories/US-signatur-density-field.md) | Should | Draft | 128×128 density field for numerical Signatur comparison and reconstruction |
| [US-signatur-matching](user-stories/US-signatur-matching.md) | Could | Draft | Dual-ring overlay + dimensional compatibility score with another user |
| [US-synastry-partner-management](user-stories/US-synastry-partner-management.md) | Must | Draft | Add/view/delete partner profiles with birth data (no Bazodiac account required) |
| [US-synastry-aspect-analysis](user-stories/US-synastry-aspect-analysis.md) | Must | Draft | Interaspect grid (5 main aspects, staggered orbs) visible to all users |
| [US-synastry-premium-narrative](user-stories/US-synastry-premium-narrative.md) | Must | Draft | Gemini-generated synastry narrative for premium users; template for free |
| [US-vibes-on-demand](user-stories/US-vibes-on-demand.md) | Must | Draft | Spontaneous "Vibe abrufen" → current energetic state, <2s, 3-level output |
| [US-vibes-explainability](user-stories/US-vibes-explainability.md) | Must | Draft | "Warum sehe ich das?" tap explains insight via Signatur + constellation |
| [US-weekly-overview](user-stories/US-weekly-overview.md) | Must | Draft | Weekly Insights across 7 life areas with tendency labels |
| [US-weekly-prioritization](user-stories/US-weekly-prioritization.md) | Should | Draft | Top-3 weekly areas highlighted with additional depth |
| [US-number-transparency](user-stories/US-number-transparency.md) | Must | Draft | Every numerical value visible in UI has an explanation |
| [US-daily-coherence-visibility](user-stories/US-daily-coherence-visibility.md) | Must | Draft | Kohärenzindex + Day Mode visible above the fold on first load |
| [US-daily-active-planets](user-stories/US-daily-active-planets.md) | Must | Draft | Natal-relative active planet cards — only planets relevant to user shown |
| [US-daily-planet-transparency](user-stories/US-daily-planet-transparency.md) | Must | Draft | Each planet card shows strength, orb, and BaZi resonance — no magic numbers |
| [US-daily-cosmic-weather](user-stories/US-daily-cosmic-weather.md) | Must | Draft | Cosmic weather (solar pressure, Kp) feeds into Kohärenzindex |
| [US-daily-impulse-text](user-stories/US-daily-impulse-text.md) | Must | Draft | fusion.synthesis references active planets + values — data-grounded daily impulse |
| [US-daily-resonance-badges](user-stories/US-daily-resonance-badges.md) | Should | Draft | Premium resonance badges for active resonance types |
| [US-daily-action-recommendation](user-stories/US-daily-action-recommendation.md) | Should | Draft | Premium fusion.action recommendation tied to coherence + active planets |
| [US-daily-single-api-call](user-stories/US-daily-single-api-call.md) | Must | Draft | POST /experience/daily?include=impact returns all daily data in one call |
| [US-daily-impact-only-call](user-stories/US-daily-impact-only-call.md) | Should | Draft | POST /impact/active for structured data only — no LLM, fast refresh |
| [US-navigation-app-shell](user-stories/US-navigation-app-shell.md) | Must | Draft | Consistent app-shell navigation across all pages with active-route highlight and Dashboard link |
| [US-signatur-realtime-feedback](user-stories/US-signatur-realtime-feedback.md) | Must | Draft | Signatur visibly reacts to transit, space-weather, and cluster-completed quiz contributions |
| [US-quiz-i18n-integrity](user-stories/US-quiz-i18n-integrity.md) | Must | Draft | No raw translation keys in UI; quiz overlays dismissable via X, Esc, and backdrop |

---

## Requirements Index

| File | Type | Priority | Status | Summary |
|------|------|----------|--------|---------|
| [REQ-F-natal-chart-calculation](requirements/REQ-F-natal-chart-calculation.md) | REQ-F | Must | Implemented | Calculate BaZi, Western, Wu-Xing, Fusion from birth data via BAFE |
| [REQ-F-fusion-ring-visualization](requirements/REQ-F-fusion-ring-visualization.md) | REQ-F | Must | Implemented | Interactive 3D Fusion Ring (Signatur) combining all astrological data |
| [REQ-F-quiz-contribution-system](requirements/REQ-F-quiz-contribution-system.md) | REQ-F | Must | Implemented | 22 quizzes across 6 clusters modulating the Fusion Ring |
| [REQ-F-cosmic-encounter-onboarding](requirements/REQ-F-cosmic-encounter-onboarding.md) | REQ-F | Must | Implemented | 7-phase onboarding flow with Signatur reveal |
| [REQ-F-space-weather-modulation](requirements/REQ-F-space-weather-modulation.md) | REQ-F | Should | Implemented | Real-time solar weather modulates Fusion Ring intensity |
| [REQ-F-astro-card-detail-view](requirements/REQ-F-astro-card-detail-view.md) | REQ-F | Must | Implemented | Sunsign/BaZi/Wuxing tiles open full detail view (modal/drawer), not anchor scroll |
| [REQ-F-eve-voice-agent](requirements/REQ-F-eve-voice-agent.md) | REQ-F | Must | Implemented | Second ElevenLabs agent Eve with distinct bold/modern persona |
| [REQ-F-agent-architecture-refactor](requirements/REQ-F-agent-architecture-refactor.md) | REQ-F | Must | Implemented | Refactor Levi-specific components into generic multi-agent system |
| [REQ-F-agent-conversation-persistence](requirements/REQ-F-agent-conversation-persistence.md) | REQ-F | Must | Implemented | Store conversation history per (user_id, agent_type) |
| [REQ-F-agent-dashboard-selection](requirements/REQ-F-agent-dashboard-selection.md) | REQ-F | Must | Implemented | Dashboard shows two fixed side-by-side agent tiles (Levi + Eve) |
| [REQ-MNT-agent-extensibility](requirements/REQ-MNT-agent-extensibility.md) | REQ-MNT | Should | Approved | Adding third agent requires config only, no structural code changes |
| [REQ-SEC-eve-brand-safety](requirements/REQ-SEC-eve-brand-safety.md) | REQ-SEC | Must | Approved | Eve persona brand-safe; system prompt reviewed before production |
| [REQ-F-signatur-rendering-engine](requirements/REQ-F-signatur-rendering-engine.md) | REQ-F | Must | Implemented | V3 Bipolar Trail Engine: 12 Pole, Cousto-Frequenzen, additive Trails, adaptive Tiers |
| [REQ-F-signatur-data-pipeline](requirements/REQ-F-signatur-data-pipeline.md) | REQ-F | Must | Implemented | 6D-Dimension-Pipeline: Soulprint→natal, Quiz→dimensions, Transit, Space Weather, True North |
| [REQ-F-signatur-mobile-native](requirements/REQ-F-signatur-mobile-native.md) | REQ-F | Must | Deprecated | ~~expo-gl~~ — superseded by REQ-F-signatur-ios-swift (native Swift) |
| [REQ-PERF-signatur-performance](requirements/REQ-PERF-signatur-performance.md) | REQ-PERF | Must | Implemented | 60fps desktop (0.01ms/frame), 30fps mobile (0.002ms/frame), adaptive trail tiers |
| [REQ-F-signatur-dissonance-model](requirements/REQ-F-signatur-dissonance-model.md) | REQ-F | Must | Draft | Drei-Schichten-Dissonanz: d_natal→Geometrie, d_accumulated→Komplexität, d_elemental→Textur |
| [REQ-F-signatur-quiz-morph](requirements/REQ-F-signatur-quiz-morph.md) | REQ-F | Must | Draft | Quiz-Completion morpht Signatur live — Pol-Verhalten ändert sich proportional zur Dissonanz |
| [REQ-F-signatur-determinism](requirements/REQ-F-signatur-determinism.md) | REQ-F | Must | Implemented | Identische Inputs → bit-identische Pol-Positionen auf allen Plattformen |
| [REQ-F-signatur-density-field](requirements/REQ-F-signatur-density-field.md) | REQ-F | Should | Draft | 128×128 Float-Raster als numerische Signatur-Repräsentation für Vergleich + Matching |
| [REQ-F-signatur-ios-swift](requirements/REQ-F-signatur-ios-swift.md) | REQ-F | Must | Draft | Native Swift/SwiftUI Signatur — ersetzt deprecated expo-gl Ansatz |
| [REQ-F-signatur-shared-bridge](requirements/REQ-F-signatur-shared-bridge.md) | REQ-F | Must | Implemented | DIMENSION_DEFS als Single Source of Truth in @bazodiac/shared + Swift-Konstanten |
| [REQ-F-signatur-day-night-pulse](requirements/REQ-F-signatur-day-night-pulse.md) | REQ-F | Must | Implemented | Day-Pulse/Trace + Night-Pulse/Trace Modulation der Signatur |
| [REQ-F-quiz-generator-pipeline](requirements/REQ-F-quiz-generator-pipeline.md) | REQ-F | Must | Draft | Quiz generator with formal fusion mapping and canonical 6-field result schema |
| [REQ-F-vibes-core](requirements/REQ-F-vibes-core.md) | REQ-F | Must | Draft | On-demand Vibe insight with deterministic 2-hour refresh window and live drivers |
| [REQ-F-vibes-output-structure](requirements/REQ-F-vibes-output-structure.md) | REQ-F | Must | Implemented | 3-level output: Kurzsignal → Treiber → Erklärung |
| [REQ-F-weekly-insights-engine](requirements/REQ-F-weekly-insights-engine.md) | REQ-F | Must | Implemented | Weekly insights across 7 life areas with tendency labels |
| [REQ-F-weekly-area-prioritization](requirements/REQ-F-weekly-area-prioritization.md) | REQ-F | Should | Implemented | Top-3 life area highlighting with additional depth |
| [REQ-F-transparency-rule](requirements/REQ-F-transparency-rule.md) | REQ-F | Must | Implemented | System-wide: no number without explanation |
| [REQ-F-explainability-layer](requirements/REQ-F-explainability-layer.md) | REQ-F | Must | Implemented | "Warum sehe ich das?" for every insight |
| [REQ-USA-mobile-first-readability](requirements/REQ-USA-mobile-first-readability.md) | REQ-USA | Must | Implemented | <10s comprehension on mobile, mobile-first layout |
| [REQ-PERF-vibes-response-time](requirements/REQ-PERF-vibes-response-time.md) | REQ-PERF | Must | Implemented | Vibes result <2s p95, Gemini fallback within 1.5s |
| [REQ-F-orbital-signatur-visualization](requirements/REQ-F-orbital-signatur-visualization.md) | REQ-F | Should | Draft | Parametric ellipse in Valence×Arousal space — Home-Base orbit + perturbed trajectory |
| [REQ-F-depth-navigation](requirements/REQ-F-depth-navigation.md) | REQ-F | Must | Draft | Z-axis depth navigation: Dashboard (surface) → Signatur (mid) → detail views (core) |
| [REQ-F-progressive-ui-fluidity](requirements/REQ-F-progressive-ui-fluidity.md) | REQ-F | Must | Draft | UI fluidity grows with cluster completion; conventional for new users, gesture-driven for engaged users |
| [REQ-USA-wcag-contrast](requirements/REQ-USA-wcag-contrast.md) | REQ-USA | Should | Draft | WCAG 2.1 AA contrast ratios enforced on all text/interactive elements against obsidian background |
| [REQ-F-dashboard-identity-cards](requirements/REQ-F-dashboard-identity-cards.md) | REQ-F | Should | Draft | Dashboard top identity cards form a coherent 5-card set incl. Wu-Xing element |
| [REQ-F-dashboard-live-daily-signals](requirements/REQ-F-dashboard-live-daily-signals.md) | REQ-F | Must | Draft | Daily impulse and influence widgets use live date-sensitive data incl. cosmic weather |
| [REQ-F-navigation-shell](requirements/REQ-F-navigation-shell.md) | REQ-F | Must | Draft | Top bar: 3 primary items (Astro-Agents, Planetarium, Signatur) + Settings with all utility items; mobile responsive |
| [REQ-F-signatur-live-transit-panels](requirements/REQ-F-signatur-live-transit-panels.md) | REQ-F | Must | Draft | Lower Signatur-page tiles replaced with live transit resonance panels; no static placeholders |
| [REQ-F-dashboard-bazi-fusion-bridge](requirements/REQ-F-dashboard-bazi-fusion-bridge.md) | REQ-F | Must | Draft | Western–BaZi planet fusion: Sheng/Ke resonance calculation + German interpretation per planet card |
| [REQ-F-onboarding-display-name](requirements/REQ-F-onboarding-display-name.md) | REQ-F | Must | Implemented | Onboarding captures display_name; stored in profiles only, never forwarded to FuFirE |
| [REQ-F-daily-chart-coherence-hero](requirements/REQ-F-daily-chart-coherence-hero.md) | REQ-F | Must | Approved | Unified Daily Chart hero ersetzt split top-card layout — Kohärenz + Daily Impulse + aktive Planeten + Driver-Strip in einer Karte, Dark/Bright mode contrast-safe |
| [REQ-F-daily-chart-dashboard-order](requirements/REQ-F-daily-chart-dashboard-order.md) | REQ-F | Must | Implemented | Daily Chart section appears before Planetarium in dashboard layout |
| [REQ-F-impact-active-endpoint](requirements/REQ-F-impact-active-endpoint.md) | REQ-F | Must | Implemented | POST /impact/active returns ACTIVE_IMPACTS_v1 — structured, no LLM |
| [REQ-F-experience-daily-v2](requirements/REQ-F-experience-daily-v2.md) | REQ-F | Must | Approved | POST /experience/daily mit Unified Daily Chart Contract — one-pass rendering von Kohärenz, Daily Impulse, aktive Planeten, Driver Evidence |
| [REQ-F-active-planets-frontend](requirements/REQ-F-active-planets-frontend.md) | REQ-F | Must | Approved | Signatur-aligned planet cards im Daily Chart hero — Name, Stärke, "Warum?" expandierbar, höchste Stärke zuerst |
| [REQ-F-coherence-hero-impact-datasource](requirements/REQ-F-coherence-hero-impact-datasource.md) | REQ-F | Must | Approved | Kohärenz-Darstellung trennt stabilen Baseline von positivem Tages-Delta — base_coherence + positive_daily_delta + Driver-Strip mit echten Werten |
| [REQ-USA-daily-chart-responsive-readability](requirements/REQ-USA-daily-chart-responsive-readability.md) | REQ-USA | Must | Approved | Daily Chart hero lesbar und scannable auf 375px + Desktop — kein horizontal scroll, WCAG-kontrast in Bright + Dark |
| [REQ-PERF-impact-active-response-time](requirements/REQ-PERF-impact-active-response-time.md) | REQ-PERF | Must | Implemented | POST /impact/active ≤ 800ms p95 |
| [REQ-PERF-daily-experience-response-time](requirements/REQ-PERF-daily-experience-response-time.md) | REQ-PERF | Must | Implemented | POST /experience/daily ≤ 2s p95 |
| [REQ-F-synastry-partner-management](requirements/REQ-F-synastry-partner-management.md) | REQ-F | Must | Implemented | partner_profiles CRUD with user_id RLS + defence-in-depth delete guard |
| [REQ-F-synastry-aspect-analysis](requirements/REQ-F-synastry-aspect-analysis.md) | REQ-F | Must | Implemented | POST /api/synastry — interaspects with staggered orbs, 5 main aspects, Placidus |
| [REQ-F-synastry-premium-narrative](requirements/REQ-F-synastry-premium-narrative.md) | REQ-F | Must | Implemented | Hybrid narratives: template (free) + Gemini (premium) with zodiac whitelist guard |
| [REQ-F-navigation-redesign](requirements/REQ-F-navigation-redesign.md) | REQ-F | Must | Draft | App-shell navigation redesign — always-visible Dashboard link, active-route highlight, non-confusing mode toggle, both agents exposed |
| [REQ-F-signatur-realtime-triggers](requirements/REQ-F-signatur-realtime-triggers.md) | REQ-F | Must | Draft | Signatur real-time trigger contract + cluster-gate enforcement + reliable Cousto audio mute |
| [REQ-F-signatur-cymatics](requirements/REQ-F-signatur-cymatics.md) | REQ-F | Must | Approved | Canvas2D Chladni/Cymatics engine — BaZi→Chladni bridge, SignaturCymaticsCanvas, CSS fallback, feature-flag gated |
| [REQ-F-i18n-completeness](requirements/REQ-F-i18n-completeness.md) | REQ-F | Must | Approved | Every `t()` call resolves to translated string in DE + EN; automated audit test; quiz overlay dismiss via X / Esc / backdrop |
| [REQ-REL-soulprint-persist-onboarding](requirements/REQ-REL-soulprint-persist-onboarding.md) | REQ-REL | Must | Approved | Bootstrap upsert statt update — soulprint_sectors 100% persistiert + Backfill für 50 existing user |

---

## Assumptions Index

| File | Category | Status | Risk | Summary |
|------|----------|--------|------|---------|
| [ASM-elevenlabs-multi-agent](assumptions/ASM-elevenlabs-multi-agent.md) | Technical | Verified | Medium | ElevenLabs supports multiple agent personas per account |
| [ASM-existing-fusion-sufficient](assumptions/ASM-existing-fusion-sufficient.md) | Technical | Verified | Medium | Existing Fusion/Signatur logic sufficient for Vibes + Weekly Insights |
| [ASM-gemini-text-quality](assumptions/ASM-gemini-text-quality.md) | Technical | Verified | Medium | Gemini produces constraint-compliant insight text (≥80% first-pass) |
| [ASM-ued-metrics-available](assumptions/ASM-ued-metrics-available.md) | Technical | Unverified | Medium | UED metrics (home_base, σ_v, σ_a, instability, rise/recovery rate) derivable from soulprint + transit |
| [ASM-noaa-in-fufre](assumptions/ASM-noaa-in-fufre.md) | Technology | Invalidated | Medium | FuFirE does NOT have NOAA data; server-side pass-through via spaceWeatherCache adopted |

---

## Constraints Index

| File | Category | Status | Summary |
|------|----------|--------|---------|
| [CON-german-ui](constraints/CON-german-ui.md) | Business | Active | UI text in German; code identifiers and comments in English |
| [CON-dark-luxury-aesthetic](constraints/CON-dark-luxury-aesthetic.md) | Business | Active | Dark OLED-first primary + Bright secondary; obsidian/gold palette, Wu-Xing element tokens, both modes themed |
| [CON-no-unexplained-numbers](constraints/CON-no-unexplained-numbers.md) | Business | Active | No numerical value in UI without explanation — hard rule |
| [CON-resource-oriented-framing](constraints/CON-resource-oriented-framing.md) | Business | Active | Possibility-oriented language, no fatalistic framing |
| [CON-mobile-first-readability](constraints/CON-mobile-first-readability.md) | Business | Active | <10s core comprehension on mobile viewport |
| [CON-quiz-signatur-axiome](constraints/CON-quiz-signatur-axiome.md) | Business | Active | 12 Produkt-Axiome für Quiz → Signatur Coupling (append-only, element auf answer-ebene, neutral start, etc.) — Plan-Patch statt Axiom-Aufweichen bei Konflikt |
