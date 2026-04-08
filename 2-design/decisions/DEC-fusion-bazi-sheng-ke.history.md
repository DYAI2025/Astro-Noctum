# DEC-fusion-bazi-sheng-ke: Trail

> Companion to `DEC-fusion-bazi-sheng-ke.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Machine-learning-derived planet-element mappings
- Pros: Could be tuned to user feedback over time
- Cons: Non-deterministic; not grounded in tradition; destroys the "authentic fusion" brand promise

### Option B: Multiple competing mapping traditions (Hellmut Wilhelm vs. Raymond Lo vs. others)
- Pros: More academically complete
- Cons: Produces conflicting results; unresolvable without domain expert; not needed for MVP

### Option C: Traditional Chinese astronomy mappings (chosen)
- Pros: Grounded in documented tradition; deterministic; explainable to users; consistent across platforms
- Cons: Does not account for all academic variants; some mappings (e.g. Merkur=Wasser) differ from Western astrological intuitions

## Reasoning

The product's brand promise is an authentic fusion of Western and Chinese traditions. Using traditional Chinese astronomical associations grounds the product in an existing body of knowledge, makes the mapping explainable, and produces consistent results. The specific sources (Hellmut Wilhelm, Raymond Lo) were selected as widely-cited references in English-language Chinese astrology literature. Locking the mapping prevents drift across releases.

The 4-type resonance model (gleichklang, naehrung, kontrolle, neutral) is preferred over a 5-type model including `spannung` because "spannung" in German implies psychological distress, which conflicts with `CON-resource-oriented-framing`. Ke-cycle relationships are labeled `kontrolle` (structural, neutral) rather than `spannung` (adversarial).

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Mappings sourced from the foundation plan (2026-04-06). `spannung` removal decided during decision recording.

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-04-08 | Initial decision; `spannung` type removed in favour of `kontrolle` for both Ke directions | ai-proposed/human-approved |
