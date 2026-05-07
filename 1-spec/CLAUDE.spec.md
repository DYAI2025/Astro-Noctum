Phase-specific instructions for the **Specification** phase. Extends [../CLAUDE.md](../CLAUDE.md).

## Purpose

This phase defines **what** we're building and **why**. Focus on clarity, measurability, and alignment with stakeholder needs.

## Phase artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Stakeholders | [`stakeholders.md`](stakeholders.md) | Roles with interests and influence |
| Goals | [`goals/`](goals/) | High-level outcomes |
| User Stories | [`user-stories/`](user-stories/) | User-facing capabilities |
| Requirements | [`requirements/`](requirements/) | Testable system requirements |
| Assumptions | [`assumptions/`](assumptions/) | Beliefs taken as true but not verified |
| Constraints | [`constraints/`](constraints/) | Hard limits on design and implementation |

---

## AI Guidelines

### Per-artifact guidance

**Stakeholders**: ask who uses, funds, operates, or is affected by the system. Record influence level honestly — it drives conflict resolution. Add entries to [`stakeholders.md`](stakeholders.md).

**Goals**: decompose vague ideas into concrete, measurable outcomes. Use MoSCoW priority consistently.
Status lifecycle: `Draft → Approved → Achieved → Deprecated`. Only a human can approve or deprecate. The agent marks `Achieved` when all success criteria are met (linked requirements implemented).

**User Stories**: use "As a [role], I want [capability], so that [benefit]." The role must be an existing stakeholder ID. Acceptance criteria at the story level are high-level; detailed criteria live in requirements.
Status lifecycle: `Draft → Approved → Implemented → Deprecated`. Only a human can approve or deprecate. The agent marks `Implemented` when all linked requirements reach `Implemented`.

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

1. **Identify**: note conflicting requirement IDs, source stakeholders, influence levels, and why they are incompatible.
2. **Ask the user**: present what makes them incompatible, stakeholders and influence levels, two or more resolution options, and a recommended option if one is clearly better.
3. **Wait for explicit approval** before modifying any file.
4. **Apply**: update affected requirement files and index rows. Update dependent user stories or goals if affected. Record a decision if the resolution imposes a recurring constraint.
5. **Verify**: no artifacts remain in a conflicting state after resolution.

### Assumption invalidation

When an assumption is found to be wrong or no longer holds:

1. **Identify impact**: list all artifacts (requirements, user stories, decisions) that depend on the invalidated assumption.
2. **Ask the user**: present the invalidated assumption, the affected artifacts, and proposed adjustments or alternatives.
3. **Wait for explicit approval** before modifying any file.
4. **Apply**: change the assumption's Status to `Invalidated`. Update or flag all dependent artifacts as directed.
5. **Verify**: no artifacts remain based on the invalidated assumption without acknowledgment.

### Artifact deprecation

When an artifact (goal, user story, requirement) is no longer relevant:

1. Propose deprecation to the user with rationale and downstream impact.
2. Wait for explicit approval.
3. Change Status to `Deprecated` in the artifact file. Update its index row.
4. Check for dependent artifacts — flag any that reference the deprecated item.

---

## Decisions Relevant to This Phase

| File | Title | Trigger |
|------|-------|---------|
| _(none yet)_ | | |
<!-- Add rows as decisions are recorded. File column: [DEC-kebab-name](../decisions/DEC-kebab-name.md) -->

---

## Linking to Other Phases

- Goals, user stories, constraints, assumptions, and requirements are referenced in design documents (`2-design/`)
- Requirements determine the development tasks in `3-code/tasks.md`; each task references the requirements it fulfills
- Acceptance criteria inform test cases (`3-code/`)

---

## Goals Index

| File | Priority | Status | Summary |
|------|----------|--------|---------|
| [GOAL-reliable-daily-orientation](goals/GOAL-reliable-daily-orientation.md) | Must-have | Approved | Dashboard delivers stable daily framing on every visit; first-viewport answers what's today / what does it mean / what can I do; degraded states visibly marked |
| [GOAL-discoverable-signature-anchor](goals/GOAL-discoverable-signature-anchor.md) | Must-have | Approved | 3D natal-signature sphere reachable from dashboard's first viewport for completed profiles; explicit empty-state path; section error boundary isolates renderer failures |
| [GOAL-aphorism-personalized-interpretation](goals/GOAL-aphorism-personalized-interpretation.md) | Should-have | Approved | Deterministic per-user-and-date aphorism + mode classification, plus Council-of-Six figure choice with cached per-figure LLM interpretation; feature-flag-gated |
| [GOAL-clean-upgrade-funnel](goals/GOAL-clean-upgrade-funnel.md) | Must-have | Approved | Free user sees exactly one primary upgrade CTA → exactly one Stripe Checkout call with explicit error states; premium has zero upgrade CTAs |
| [GOAL-sustainable-client-polling](goals/GOAL-sustainable-client-polling.md) | Should-have | Approved | All polling hooks within explicit budget (~1000 req / 15 min / mount); one poller per data source; visibility-aware intervals |
| [GOAL-gdpr-compliant-data-handling](goals/GOAL-gdpr-compliant-data-handling.md) | Must-have | Approved | EU users can exercise Art. 15–22 rights; consent + lawful basis per purpose; analytics PII-free; sub-processors covered by DPAs |
<!-- Add rows as goals are created. File column: [GOAL-kebab-name](goals/GOAL-kebab-name.md) -->


---

## User Stories Index

| File | Role | Priority | Status | Summary |
|------|------|----------|--------|---------|
| _(none yet)_ | | | | |
<!-- Add rows as user stories are created. File column: [US-kebab-name](user-stories/US-kebab-name.md) -->

---

## Requirements Index

| File | Type | Priority | Status | Summary |
|------|------|----------|--------|---------|
| [REQ-F-tour-overlay-state](requirements/REQ-F-tour-overlay-state.md) | Functional | Must-have | Draft | Tour overlay strictly tied to tourStep state; hidden when tourStep === 'done' |
| [REQ-USA-fallback-indicator](requirements/REQ-USA-fallback-indicator.md) | Usability | Must-have | Draft | Visible fallback indicator when daily content uses v1-local-fallback engine_version |
| [REQ-USA-profile-incomplete-cta](requirements/REQ-USA-profile-incomplete-cta.md) | Usability | Must-have | Draft | Daily-pulse section shows profile-completion CTA when birth data missing |
| [REQ-F-impact-active-contract](requirements/REQ-F-impact-active-contract.md) | Functional | Must-have | Draft | /api/impact/active contract documented; no dual-source for coherence values |
| [REQ-USA-dashboard-section-order](requirements/REQ-USA-dashboard-section-order.md) | Usability | Should-have | Draft | Dashboard sections in agreed information hierarchy: TagespulsCard/DailyChartHero → Signatur → Active Influences → Daily Impulse → Agents → Blueprint |
| [REQ-USA-signature-first-viewport](requirements/REQ-USA-signature-first-viewport.md) | Usability | Must-have | Draft | Signature anchor reachable from dashboard's first viewport for completed profiles |
| [REQ-USA-signature-empty-state](requirements/REQ-USA-signature-empty-state.md) | Usability | Must-have | Draft | Incomplete-profile signature anchor shows explicit empty state, not blank |
| [REQ-REL-signature-error-isolation](requirements/REQ-REL-signature-error-isolation.md) | Reliability | Must-have | Draft | Signature renderer failures contained by SectionErrorBoundary; rest of dashboard unaffected |
| [REQ-PERF-signature-no-direct-embed](requirements/REQ-PERF-signature-no-direct-embed.md) | Performance | Should-have | Draft | No direct SignaturRenderer in dashboard until perf measured + decision recorded |
| [REQ-F-aphorism-approval-gate](requirements/REQ-F-aphorism-approval-gate.md) | Functional | Should-have | Draft | Phase T blocked until aphorisms.json has ≥15 approved with mode coverage |
| [REQ-F-daily-pulse-determinism](requirements/REQ-F-daily-pulse-determinism.md) | Functional | Should-have | Draft | daily-pulse endpoint deterministic per (userId, date, locale) |
| [REQ-F-council-interpretation-cache](requirements/REQ-F-council-interpretation-cache.md) | Functional | Should-have | Draft | daily-interpretation cached per (user, date, daily_pulse_id, archetype); no duplicate LLM calls |
| [REQ-F-useDailyPulse-null-guard](requirements/REQ-F-useDailyPulse-null-guard.md) | Functional | Should-have | Draft | useDailyPulse handles birthData === null with explicit zero-value shape |
| [REQ-F-tagespuls-feature-flag](requirements/REQ-F-tagespuls-feature-flag.md) | Functional | Should-have | Draft | Tagespuls Neu-Architektur gated by tagespuls_neu_v1; flag-off behavior unchanged |
| [REQ-USA-tagespuls-card-phases](requirements/REQ-USA-tagespuls-card-phases.md) | Usability | Should-have | Draft | TagespulsCard renders Phase 1 (aphorism + Council) and Phase 2 (interpretation + back) |
| [REQ-USA-cta-singular](requirements/REQ-USA-cta-singular.md) | Usability | Must-have | Draft | Free user dashboard exactly one primary upgrade CTA; premium zero |
| [REQ-F-checkout-single-trigger](requirements/REQ-F-checkout-single-trigger.md) | Functional | Must-have | Draft | One POST /api/checkout per CTA click; button disabled during request |
| [REQ-F-checkout-stripe-redirect](requirements/REQ-F-checkout-stripe-redirect.md) | Functional | Must-have | Draft | Successful checkout response sets window.location.href to Stripe URL |
| [REQ-USA-checkout-error-categories](requirements/REQ-USA-checkout-error-categories.md) | Usability | Must-have | Draft | Distinct user messages per checkout error class (401/403/503/200-no-url/network/not-logged-in) |
| [REQ-F-agent-card-no-checkout](requirements/REQ-F-agent-card-no-checkout.md) | Functional | Must-have | Draft | Agent cards don't trigger /api/checkout independently; lock-hint or callback only |
| [REQ-F-manage-subscription](requirements/REQ-F-manage-subscription.md) | Functional | Must-have | Draft | Premium user can view + manage subscription via Stripe Customer Portal (cancel, payment method, billing history) |
| [REQ-PERF-polling-budget](requirements/REQ-PERF-polling-budget.md) | Performance | Should-have | Draft | Aggregate client polling < ~1000 req / 15 min / dashboard mount |
| [REQ-PERF-polling-visibility](requirements/REQ-PERF-polling-visibility.md) | Performance | Should-have | Draft | Polling hooks respect document.visibilityState; hidden = pause or ≥60s interval |
| [REQ-MNT-single-poller-per-source](requirements/REQ-MNT-single-poller-per-source.md) | Maintainability | Should-have | Draft | Each external data source has exactly one poller per dashboard mount |
| [REQ-COMP-consent-record](requirements/REQ-COMP-consent-record.md) | Compliance | Must-have | Draft | Active consent record per user per processing purpose with version + timestamp |
| [REQ-COMP-data-export](requirements/REQ-COMP-data-export.md) | Compliance | Must-have | Draft | User can request machine-readable JSON export per Art. 20 portability |
| [REQ-COMP-rtbf](requirements/REQ-COMP-rtbf.md) | Compliance | Must-have | Draft | Art. 17 RTBF flow purges all per-user records across Supabase + Stripe within target window |
| [REQ-COMP-analytics-pii-free](requirements/REQ-COMP-analytics-pii-free.md) | Compliance | Must-have | Draft | Analytics events PII-free; identifiers hashed/pseudonymized at boundary |
| [REQ-COMP-llm-purpose-consent](requirements/REQ-COMP-llm-purpose-consent.md) | Compliance | Must-have | Draft | LLM calls covered by user consent for the specific purpose; cross-purpose rejected |
| [REQ-COMP-privacy-notice](requirements/REQ-COMP-privacy-notice.md) | Compliance | Must-have | Draft | Public privacy notice describes purposes, retention, sub-processors, data-subject rights |
<!-- Add rows as requirements are created. File column: [REQ-CLASS-kebab-name](requirements/REQ-CLASS-kebab-name.md) -->


---

## Assumptions Index

| File | Category | Status | Risk | Summary |
|------|----------|--------|------|---------|
| [ASM-llm-determinism-acceptable](assumptions/ASM-llm-determinism-acceptable.md) | Technology | Unverified | Medium | LLM Slot 2/3 + Council interpretation output is consistent enough that user perception isn't affected by re-runs |
| [ASM-mobile-webgl-availability](assumptions/ASM-mobile-webgl-availability.md) | Technology | Unverified | Medium | Target users' mobile devices support WebGL well enough for SignatureSphere3D (≥30 fps, no OOM) |
| [ASM-stripe-uptime-acceptable](assumptions/ASM-stripe-uptime-acceptable.md) | Environment | Unverified | Low | Stripe Checkout availability meets revenue SLOs; outage handling via REQ-USA-checkout-error-categories suffices |
| [ASM-supabase-fits-personal-data-scale](assumptions/ASM-supabase-fits-personal-data-scale.md) | Technology | Unverified | High | Supabase suitable for personal-data load + GDPR obligations (RTBF cascade timing, Art. 20 export, EU residency, DPA) |
| [ASM-german-primary-user-base](assumptions/ASM-german-primary-user-base.md) | User | Unverified | Medium | Primary user base is German-speaking (DACH); English is secondary and does not drive content prioritization |
<!-- Add rows as assumptions are created. File column: [ASM-kebab-name](assumptions/ASM-kebab-name.md) -->


---

## Constraints Index

| File | Category | Status | Summary |
|------|----------|--------|---------|
| [CON-no-formula-changes](constraints/CON-no-formula-changes.md) | Technical | Active | Astrological formulas, scoring, ephemeris, BaZi, Wu-Xing calculations are immutable; only presentation/orchestration layers may change |
| [CON-stripe-payment-stack](constraints/CON-stripe-payment-stack.md) | Technical | Active | Stripe Checkout is the sole payment processor; payment architecture (`POST /api/checkout` → redirect, webhooks as state truth) is not rebuilt |
| [CON-no-signatur-v3-rebuild](constraints/CON-no-signatur-v3-rebuild.md) | Technical | Active | Signatur V3 renderer (`SignatureSphere3D`, `SignaturRenderer`, BaZi→Chladni pipeline) is not rebuilt; only its dashboard integration changes |
| [CON-aphorisms-human-approved](constraints/CON-aphorisms-human-approved.md) | Operational | Active | Aphorisms entering production require Ben's manual `draft → approved` per file; no agent or LLM may auto-promote |
| [CON-greenops-polling-budget](constraints/CON-greenops-polling-budget.md) | Operational | Active | Client polling respects ~1000 req / 15 min / user; visibility-aware intervals; one poller per data source per dashboard mount |
| [CON-degraded-state-transparency](constraints/CON-degraded-state-transparency.md) | Operational | Active | Fallback / stale / unavailable data must be visibly marked in UI; never presented as live personalized output |
| [CON-gdpr-applies](constraints/CON-gdpr-applies.md) | Operational | Active | EU GDPR applies; lawful basis is consent (Art. 6(1)(a)) or contract; Art. 15–22 data-subject rights operationally supported; purpose limitation and data minimization enforced |
<!-- Add rows as constraints are created. File column: [CON-kebab-name](constraints/CON-kebab-name.md) -->

