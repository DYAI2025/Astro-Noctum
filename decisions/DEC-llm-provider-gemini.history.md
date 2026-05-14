# DEC-llm-provider-gemini: Trail

> Companion to `DEC-llm-provider-gemini.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Google Gemini (chosen)

- Pros: candidate already referenced in the dev brief; Gemini 1.5 Pro is competitive for German + English generation; EU data-residency available for enterprise tier; consolidates with other Google-adjacent operational concerns.
- Cons: vendor lock-in; pricing-tier risk if usage scales rapidly; non-enterprise tier may not satisfy strict EU-residency requirements without explicit configuration.

### Option B: OpenAI (GPT-4.x family)

- Pros: industry baseline quality; mature SDKs; well-known prompt-injection mitigations.
- Cons: separate DPA and consent path; less integrated with the existing operational stack; EU-residency story weaker for non-enterprise tier; additional sub-processor entry needed in the privacy notice.

### Option C: Anthropic Claude

- Pros: strong instruction-following; relatively low susceptibility to common prompt-injection vectors.
- Cons: same DPA / consent overhead as Option B; EU-residency story even weaker for non-enterprise tier; cost.

### Option D: Self-hosted open-weights model (Llama, Mistral)

- Pros: full control; no DPA needed; no per-call vendor cost.
- Cons: serving cost and operational overhead orders of magnitude higher than managed APIs; quality gap for low-latency German + English generation; sprint capacity unaffordable for a single-operator team.

## Reasoning

Gemini is the candidate already referenced in the dev brief. The product is single-operator, so consolidating providers reduces operational and contractual surface.

Determinism is achieved by caching responses per the data model (`daily_pulses` and `daily_interpretations` unique constraints + I-DM-5 invariant), not by relying on the provider — so a "less deterministic" provider's variance is hidden by the cache. This means the choice of provider is more about quality, cost, and DPA than about per-call determinism.

Trade-off accepted: vendor lock-in to Gemini. Mitigation: the gateway pattern (all calls through one module, model version captured per call) makes provider swap feasible — a future supersession decision could replace this with Option B or C without redesigning the data model or contracts.

Invalidating conditions: Gemini DPA proves insufficient for EU GDPR; Gemini service availability becomes a launch blocker; pricing tiering forces a switch at scale; a regulatory ruling prohibits the chosen provider.

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Ben approved during the Design completeness assessment follow-up on 2026-05-13. The dev brief had already referenced Gemini / FuFirE; this decision formalizes Gemini as primary.

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-05-13 | Initial decision | ai-proposed/human-approved |
