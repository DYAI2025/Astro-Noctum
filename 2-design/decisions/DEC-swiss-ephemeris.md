# DEC-swiss-ephemeris: Swiss Ephemeris via BAFE for all astrological calculations

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: n/a (foundational decision predating scaffold)

**Last updated**: 2026-03-23

## Context

Bazodiac's core value proposition ("Obsidian Core") requires deterministic astrological calculations: identical birth data must always produce identical results, with astronomical precision (±0.001°). The system calculates BaZi Four Pillars, Western radix charts, Wu-Xing element balances, fusion interpretations, and transit timing — each requiring precise planetary positions, Julian Date conversion, Delta T corrections, and solar term (Jieqi) alignment.

## Decision

All astrological calculations go through the **BAFE** microservice, which uses **Swiss Ephemeris** (pinned, no Moshier fallback in production) for planetary position computation. Bazodiac never calculates planetary positions client-side or in its own backend — BAFE is the single source of astronomical truth.

## Enforcement

### Trigger conditions

- **Design phase**: when designing any feature that needs astrological data
- **Code phase**: when writing code that consumes or transforms chart data

### Required patterns

- All chart calculations route through BAFE endpoints: `/calculate/{bazi,western,fusion,wuxing,tst}` and `/chart`
- BAFE responses are consumed via the proxy in `server.mjs` (production) or `vite.config.ts` proxy (dev)
- Response transformation happens in `src/services/api.ts` (German keys → English, 0-based zodiac index → name strings)
- BAFE response types are characterized in `src/types/bafe.ts`
- Each BAFE endpoint has independent fallback to empty data on failure (graceful degradation, never crash)

### Required checks

1. No planetary position calculations in TypeScript/JavaScript application code (the JS fallback mode is for resilience only, not primary use)
2. BAFE response format changes require updating mappers in `api.ts`
3. New astrological features must use existing BAFE endpoints or request new ones

### Prohibited patterns

- Client-side ephemeris calculations
- Alternative astrology APIs alongside or replacing BAFE
- Hardcoding astrological constants (zodiac boundaries, element mappings) that should come from BAFE
