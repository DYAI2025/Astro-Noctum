Phase-specific instructions for the **Design** phase. Extends [../CLAUDE.md](../CLAUDE.md).

## Purpose

This phase defines **how** we're building the system. Focus on architecture, data models, APIs, and key technical decisions.

## Files in This Phase

| File | Purpose |
|------|---------|
| [`architecture.md`](architecture.md) | System architecture overview and diagrams |
| [`data-model.md`](data-model.md) | Data structures, schemas, and relationships |
| [`api-design.md`](api-design.md) | API specifications and contracts |
| [`decisions/`](decisions/) | Decision Records (`DEC-kebab-name`) |

---

## Decisions Relevant to This Phase

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When designing data storage, auth flows, or new tables |
| [DEC-swiss-ephemeris](decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE for all astrological calculations | When designing any feature that needs astrological data |
| [DEC-wuxing-ui-mapping](decisions/DEC-wuxing-ui-mapping.md) | Wu-Xing elements drive UI physics via centralized mapping | When designing any visualization using element data or colors |
| [DEC-master-signal-weights](decisions/DEC-master-signal-weights.md) | Master Signal formula locked: 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost | When proposing changes to signal weights, fusion formula, or adding new signal sources |

---

## Linking to Other Phases

- Reference requirements from `1-objectives/` to justify design choices
- Design documents guide implementation in `3-code/`
- Infrastructure design informs deployment in `4-deploy/`
