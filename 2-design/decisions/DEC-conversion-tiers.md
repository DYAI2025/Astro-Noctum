# DEC-conversion-tiers: Three-Tier Conversion Architecture (Landing / Free / Premium)

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: n/a

**Last updated**: 2026-04-10

## Context

Bazodiac's brand is exclusive and introspective — not transactional. The conversion funnel must reflect this: no trial periods, no countdown timers, no feature comparison tables on first view. The architecture has three distinct spaces, each complete in itself.

## Decision

Implement a three-tier conversion architecture:

### Tier 0 — Landing Page (no account)
- User enters birth date, time, and location
- Receives: a single dense paragraph activating their sun sign
- Fusion Signature renders with one sector illuminated, the rest veiled
- Single CTA: "Dein vollständiges Bild existiert — willst du es sehen?"
- Birth data is captured pre-registration → registration only requires email

### Tier 1 — Free Account (permanent freemium)
- Full natal chart + full Fusion Ring
- Base Signatur (N-component)
- Daily Day-Pulse (reduced depth)
- General quizzes (Q-component)
- Registration styled as initiation, not quick-signup

### Tier 2 — Premium (subscription, no trial)
- GCB deep analysis (G-component)
- Full partnership / synastry
- Composite & combination charts
- Extended transits with push notifications
- Gemini-generated narratives
- House deep-analysis & Axis 2/8

**Guiding principle**: Free is not a castrated Premium. Free is a complete first room. Premium is a different room — relationship, shadow, time.

## Enforcement

### Trigger conditions

- **Design phase**: when designing any new feature — always assign it to a tier
- **Code phase**: when adding any UI element, endpoint, or data access — always check tier gate
- **Code phase**: when implementing the landing page or registration flow

### Required patterns

- Landing page has exactly one form (date/time/location) and one CTA — no pricing, no feature list
- Pre-fill registration form with birth data captured on landing page (store in `sessionStorage` until account created)
- Tier gates are enforced server-side (not just hidden in UI)
- Premium gate UI: show teaser/locked card, never empty space
- No trial periods, no countdown timers, no "upgrade now" FOMO copy
- Registration copy is introspective/invitational (e.g., "Beginne dein Bild")

### Prohibited patterns

- Feature comparison table on landing page
- FOMO-driven copy ("Only 3 spots left", countdown timers)
- Trial periods or time-limited premium access
- Showing premium features to free users without a clear locked/upgrade state
- Calling any Gemini or GCB endpoint for free-tier users
