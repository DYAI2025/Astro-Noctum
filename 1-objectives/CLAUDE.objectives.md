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
| [GOAL-fusion-astrology](goals/GOAL-fusion-astrology.md) | Must | Approved | Fuse Western astrology, Chinese BaZi, and Wu-Xing into a single living system |
| [GOAL-autopoietic-ux](goals/GOAL-autopoietic-ux.md) | Must | Approved | UI adapts to user's elemental signature via three-layer autopoietic model |
| [GOAL-multi-agent-voice](goals/GOAL-multi-agent-voice.md) | Must | Approved | Levi + Eve as two fixed voice agent personas with independent conversation history |

---

## Requirements Index

| File | Type | Priority | Status | Summary |
|------|------|----------|--------|---------|
| [REQ-F-natal-chart-calculation](requirements/REQ-F-natal-chart-calculation.md) | REQ-F | Must | Implemented | Calculate BaZi, Western, Wu-Xing, Fusion from birth data via BAFE |
| [REQ-F-fusion-ring-visualization](requirements/REQ-F-fusion-ring-visualization.md) | REQ-F | Must | Implemented | Interactive 3D Fusion Ring (Signatur) combining all astrological data |
| [REQ-F-quiz-contribution-system](requirements/REQ-F-quiz-contribution-system.md) | REQ-F | Must | Implemented | 22 quizzes across 6 clusters modulating the Fusion Ring |
| [REQ-F-cosmic-encounter-onboarding](requirements/REQ-F-cosmic-encounter-onboarding.md) | REQ-F | Must | Draft | 7-phase onboarding flow with Signatur reveal |
| [REQ-F-space-weather-modulation](requirements/REQ-F-space-weather-modulation.md) | REQ-F | Should | Implemented | Real-time solar weather modulates Fusion Ring intensity |
| [REQ-F-astro-card-detail-view](requirements/REQ-F-astro-card-detail-view.md) | REQ-F | Must | Implemented | Sunsign/BaZi/Wuxing tiles open full detail view (modal/drawer), not anchor scroll |
| [REQ-F-eve-voice-agent](requirements/REQ-F-eve-voice-agent.md) | REQ-F | Must | Implemented | Second ElevenLabs agent Eve with distinct bold/modern persona |
| [REQ-F-agent-architecture-refactor](requirements/REQ-F-agent-architecture-refactor.md) | REQ-F | Must | Implemented | Refactor Levi-specific components into generic multi-agent system |
| [REQ-F-agent-conversation-persistence](requirements/REQ-F-agent-conversation-persistence.md) | REQ-F | Must | Implemented | Store conversation history per (user_id, agent_type) |
| [REQ-F-agent-dashboard-selection](requirements/REQ-F-agent-dashboard-selection.md) | REQ-F | Must | Implemented | Dashboard shows two fixed side-by-side agent tiles (Levi + Eve) |
| [REQ-MNT-agent-extensibility](requirements/REQ-MNT-agent-extensibility.md) | REQ-MNT | Should | Approved | Adding third agent requires config only, no structural code changes |
| [REQ-SEC-eve-brand-safety](requirements/REQ-SEC-eve-brand-safety.md) | REQ-SEC | Must | Approved | Eve persona brand-safe; system prompt reviewed before production |
| [REQ-F-signatur-rendering-engine](requirements/REQ-F-signatur-rendering-engine.md) | REQ-F | Must | Draft | V2 Cousto-frequency spirograph: 7 planets, 4-tier particles, kaleidoscope, emergence, ambient sound |
| [REQ-F-signatur-data-pipeline](requirements/REQ-F-signatur-data-pipeline.md) | REQ-F | Must | Draft | Soulprint→natal weights, quiz→dimensions, transit, space weather, True North caps |
| [REQ-F-signatur-mobile-native](requirements/REQ-F-signatur-mobile-native.md) | REQ-F | Must | Draft | Full 3D spirograph engine on iOS via expo-gl, gesture controls, reduced particles |
| [REQ-PERF-signatur-performance](requirements/REQ-PERF-signatur-performance.md) | REQ-PERF | Must | Draft | 60fps desktop, 30fps mobile/iOS, <2s load, <150MB GPU, <500ms API p95 |

---

## Assumptions Index

| File | Category | Status | Risk | Summary |
|------|----------|--------|------|---------|
<!-- Add rows as assumptions are created. File column: [ASM-kebab-name](assumptions/ASM-kebab-name.md) -->

---

## Constraints Index

| File | Category | Status | Summary |
|------|----------|--------|---------|
| [CON-german-ui](constraints/CON-german-ui.md) | Business | Active | UI text in German; code identifiers and comments in English |
| [CON-dark-luxury-aesthetic](constraints/CON-dark-luxury-aesthetic.md) | Business | Active | Dark OLED-first design with obsidian/gold palette, Wu-Xing element colors |
