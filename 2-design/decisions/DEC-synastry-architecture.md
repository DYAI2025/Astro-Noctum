# DEC-synastry-architecture: Synastry as Separate System, Not 4th Signal

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: n/a

**Last updated**: 2026-04-10

## Context

The question was whether synastry should feed into the Master Signal as a 4th signal, or exist as a separate analytical system. A 4th signal would alter every user's daily Master Signal once a partner is added — creating hard-to-explain fluctuations in the core experience. A separate system keeps the Master Signal deterministic while still delivering partnership insights.

## Decision

Synastry is a **separate system** that generates its own narratives and charts. It does **not** feed into the Master Signal formula.

Additionally:
- Partner birth data can be entered **manually** — no partner account required
- The invitation flow (email partner to create account) exists as an **upgrade path**, not a prerequisite
- Synastry is a **Premium feature**

## Enforcement

### Trigger conditions

- **Design phase**: when designing synastry endpoints or data models
- **Code phase**: when implementing partnership chart calculations or narrative generation
- **Code phase**: when adding synastry to navigation/UI

### Required patterns

- Store partner birth data in a `partner_profiles` table linked to the user's `profiles.id`
- Synastry charts are computed on demand via FuFirE, not cached in the Master Signal
- Narrative outputs live in their own response object, not mixed with the daily experience payload
- Free users see a locked/teaser synastry card; premium users see full analysis

### Prohibited patterns

- Including synastry results in `master_signal` computation
- Requiring partner account creation before synastry can be computed
- Showing synastry output to free users without a clear upgrade gate
