# ASM-german-primary-user-base: Primary user base is German-speaking

**Category**: User

**Status**: Unverified

**Risk if wrong**: Medium — Astro-Noctum's UI text, brand voice, content templates, and aphorism translations prioritize German. Localization scaffolding (DE/EN switching) exists per dev brief references but the depth of English content (curated aphorisms, prompt copy, council names) is presumably less mature. If a meaningful share of users are English-first, the English experience may underdeliver against the goal expectations — particularly `GOAL-aphorism-personalized-interpretation` where translation quality and tone matter.

## Statement

The primary user base for Astro-Noctum at launch (and through the foreseeable product roadmap) is German-speaking users in DACH (Germany, Austria, Switzerland) markets. English is a secondary locale to support the rare non-German user but does not drive product decisions, content prioritization, or feature timing.

## Rationale

The dev brief is written in German throughout. UI strings, error copy, and aphorism vault structure (`text_de` is mandatory; `text_en` is supported but secondary) all signal German-first. The product name conventions ("Tagespuls", "Rat der sechs", "Spannung") are German. The Bazodiac-Mobile sister project follows the same pattern.

## Verification Plan

- **Post-launch**: instrument locale-detection (browser language, manual override) at dashboard mount; report locale distribution monthly.
- **Trigger to invalidate**: if observed English-locale share exceeds 30% sustained for 2+ months, re-evaluate — may require uplifting English aphorism / interpretation quality, or rethinking product framing for English-first users.
- **Verification window**: passive post-launch; not a blocker for Spec → Design transition.

## Related Artifacts

- [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md) — German aphorism quality is the assumption-dependent path
- [REQ-USA-checkout-error-categories](../requirements/REQ-USA-checkout-error-categories.md) — DE baseline copy with EN equivalents
- [REQ-USA-fallback-indicator](../requirements/REQ-USA-fallback-indicator.md) — locale-aware fallback messaging
