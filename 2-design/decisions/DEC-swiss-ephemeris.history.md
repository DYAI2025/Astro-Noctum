# DEC-swiss-ephemeris: Trail

> Companion to `DEC-swiss-ephemeris.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: BAFE with Swiss Ephemeris (chosen)
- Pros: Astronomical precision (±0.001°); deterministic results; unified API for BaZi + Western + Wu-Xing; maintained as separate microservice; pinned ephemeris data eliminates drift
- Cons: External dependency; BAFE not always reachable from dev/CI environments; no contract tests; German response keys require mapping

### Option B: Client-side JavaScript astrology libraries
- Pros: No external dependency; works offline; lower latency
- Cons: Insufficient precision for professional astrology; JavaScript floating-point limits; would need separate libraries for Western and Chinese systems; no Jieqi/LiChun precision

### Option C: Third-party astrology APIs (AstroAPI, Prokerala, etc.)
- Pros: Managed service; documentation; SDKs
- Cons: Rate limits; cost per request; no BaZi support; no Wu-Xing integration; vendor lock-in without precision guarantees; non-deterministic results across API versions

## Reasoning

The "Obsidian Core" principle from TRUENORTH demands that the natal calculation layer is immutable and deterministic. Swiss Ephemeris is the gold standard for astronomical computation, and BAFE wraps it with a unified interface that covers both Western and Chinese astrological systems. The external dependency trade-off is accepted because no client-side alternative offers the required precision.

This decision would be invalidated if: BAFE becomes permanently unavailable; a JavaScript library achieves Swiss Ephemeris-level precision; or the app drops the determinism requirement.

## Human involvement

**Type**: ai-proposed/human-approved

**Notes**: Decision was implicit from project inception; formalized as DEC record during scaffold migration (2026-03-23).

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-03-23 | Initial decision (formalized from existing practice) | ai-proposed/human-approved |
