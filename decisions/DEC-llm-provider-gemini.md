# DEC-llm-provider-gemini: Google Gemini is the primary LLM provider

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: [REQ-F-daily-pulse-determinism](../1-spec/requirements/REQ-F-daily-pulse-determinism.md), [REQ-F-council-interpretation-cache](../1-spec/requirements/REQ-F-council-interpretation-cache.md), [REQ-COMP-llm-purpose-consent](../1-spec/requirements/REQ-COMP-llm-purpose-consent.md), [REQ-SEC-llm-gateway-hardening](../1-spec/requirements/REQ-SEC-llm-gateway-hardening.md)

**Last updated**: 2026-05-13

## Context

The Daily Pulse Engine (AS-3) generates `slot_2`, `slot_3`, and per-figure `daily_interpretations.text` via an LLM provider. The dev brief mentions "Gemini/FuFirE" as candidates. A formal decision pins which provider the design assumes so consent text, gateway implementation, DPA, and prompt-injection regression tests target a specific service.

## Decision

Google Gemini is the primary LLM provider for daily-pulse slot 2 / slot 3 generation and Council interpretation generation. The exact model version (e.g., `gemini-1.5-pro-002`) is recorded in `daily_pulses.engine_version` (or an adjacent column) and in `daily_interpretations.llm_model` so historical responses remain traceable to a specific model. A second provider (FuFirE, OpenAI, Anthropic) may be added as a fallback under a separate decision; pending such a decision, fallback on LLM failure is a deterministic local-fallback response (the `is_fallback: true` pattern), not a different provider.

## Enforcement

### Trigger conditions

- **Specification phase**: when adding a new requirement that involves LLM-generated text.
- **Design phase**: when adding a new feature that requires LLM output — it routes through the existing Gemini-backed gateway (CC-1 LLM gateway) and is consent-gated per [REQ-COMP-llm-purpose-consent](../1-spec/requirements/REQ-COMP-llm-purpose-consent.md).
- **Code phase**: when implementing LLM calls — use the Google Gemini SDK behind the centralized LLM gateway. Prompts use structured templating with delimiters (per [REQ-SEC-llm-gateway-hardening](../1-spec/requirements/REQ-SEC-llm-gateway-hardening.md) prompt-injection mitigation).
- **Deploy phase**: Gemini API key stored as a server-side environment variable, never in client bundles (per [REQ-SEC-no-secrets-in-client](../1-spec/requirements/REQ-SEC-no-secrets-in-client.md)). DPA with Google in place.

### Required patterns

- All LLM calls go through a single gateway module (e.g., `lib/llm-gateway/`).
- Model version is captured in the persistence layer (`daily_pulses.engine_version` or adjacent column, `daily_interpretations.llm_model`).
- Consent check happens at the gateway, not at each call site.
- Prompts use structured templating: user-controlled inputs are wrapped in delimiters with a system-level instruction telling the model to treat them as data.

### Required checks

1. Every new LLM call site routes through the gateway — no direct `googleapis.gemini` calls from feature code.
2. DPA with Google covers the relevant data classes and processing purposes; documented in the privacy notice's sub-processors list.
3. Prompt-injection regression-test suite passes before merge.

### Prohibited patterns

- Direct calls to the Gemini API from outside the gateway.
- Embedding Gemini API keys in client-bundled code.
- Adding a new LLM provider as a fallback or alternative without recording a separate decision.
- Long-term storage of LLM prompts containing user data (per REQ-SEC-llm-gateway-hardening, logs retained ≤ 7 days, access-controlled).
