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
| [REQ-F-signatur-determinism](requirements/REQ-F-signatur-determinism.md) | REQ-F | Must | Draft | Identische Inputs → bit-identische Pol-Positionen auf allen Plattformen |
| [REQ-F-signatur-density-field](requirements/REQ-F-signatur-density-field.md) | REQ-F | Should | Draft | 128×128 Float-Raster als numerische Signatur-Repräsentation für Vergleich + Matching |
| [REQ-F-signatur-ios-swift](requirements/REQ-F-signatur-ios-swift.md) | REQ-F | Must | Draft | Native Swift/SwiftUI Signatur — ersetzt deprecated expo-gl Ansatz |
| [REQ-F-signatur-shared-bridge](requirements/REQ-F-signatur-shared-bridge.md) | REQ-F | Must | Draft | DIMENSION_DEFS als Single Source of Truth in @bazodiac/shared + Swift-Konstanten |
| [REQ-F-signatur-day-night-pulse](requirements/REQ-F-signatur-day-night-pulse.md) | REQ-F | Must | Draft | Day-Pulse/Trace + Night-Pulse/Trace Modulation der Signatur |
| [REQ-F-quiz-generator-pipeline](requirements/REQ-F-quiz-generator-pipeline.md) | REQ-F | Must | Approved | Reusable quiz generator with formal mapping to 12-sector zodiac, 6D Signatur V3, 5D Master Signal |
| [REQ-F-vibes-core](requirements/REQ-F-vibes-core.md) | REQ-F | Must | Approved | On-demand Vibe insight from Signatur + transit (2–3h horizon, deterministic) |
| [REQ-F-vibes-output-structure](requirements/REQ-F-vibes-output-structure.md) | REQ-F | Must | Approved | 3-level output: Kurzsignal → Treiber → Erklärung |
| [REQ-F-weekly-insights-engine](requirements/REQ-F-weekly-insights-engine.md) | REQ-F | Must | Approved | Weekly insights across 7 life areas with tendency labels |
| [REQ-F-weekly-area-prioritization](requirements/REQ-F-weekly-area-prioritization.md) | REQ-F | Should | Approved | Top-3 life area highlighting with additional depth |
| [REQ-F-transparency-rule](requirements/REQ-F-transparency-rule.md) | REQ-F | Must | Approved | System-wide: no number without explanation |
| [REQ-F-explainability-layer](requirements/REQ-F-explainability-layer.md) | REQ-F | Must | Approved | "Warum sehe ich das?" for every insight |
| [REQ-USA-mobile-first-readability](requirements/REQ-USA-mobile-first-readability.md) | REQ-USA | Must | Approved | <10s comprehension on mobile, mobile-first layout |
| [REQ-PERF-vibes-response-time](requirements/REQ-PERF-vibes-response-time.md) | REQ-PERF | Must | Approved | Vibes result <2s p95, Gemini fallback within 1.5s |

---

## Assumptions Index

| File | Category | Status | Risk | Summary |
|------|----------|--------|------|---------|
| [ASM-elevenlabs-multi-agent](assumptions/ASM-elevenlabs-multi-agent.md) | Technical | Verified | Medium | ElevenLabs supports multiple agent personas per account |
| [ASM-existing-fusion-sufficient](assumptions/ASM-existing-fusion-sufficient.md) | Technical | Verified | Medium | Existing Fusion/Signatur logic sufficient for Vibes + Weekly Insights |
| [ASM-gemini-text-quality](assumptions/ASM-gemini-text-quality.md) | Technical | Verified | Medium | Gemini produces constraint-compliant insight text (≥80% first-pass) |

---

## Constraints Index

| File | Category | Status | Summary |
|------|----------|--------|---------|
| [CON-german-ui](constraints/CON-german-ui.md) | Business | Active | UI text in German; code identifiers and comments in English |
| [CON-dark-luxury-aesthetic](constraints/CON-dark-luxury-aesthetic.md) | Business | Active | Dark OLED-first design with obsidian/gold palette, Wu-Xing element colors |
| [CON-no-unexplained-numbers](constraints/CON-no-unexplained-numbers.md) | Business | Active | No numerical value in UI without explanation — hard rule |
| [CON-resource-oriented-framing](constraints/CON-resource-oriented-framing.md) | Business | Active | Possibility-oriented language, no fatalistic framing |
| [CON-mobile-first-readability](constraints/CON-mobile-first-readability.md) | Business | Active | <10s core comprehension on mobile viewport |
