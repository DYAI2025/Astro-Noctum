---
id: DEC-daily-pulse-naming
status: Active
date: 2026-04-04
trigger: Naming the daily horoscope/impulse section on the Dashboard
---

# DEC-daily-pulse-naming

## Decision

The daily horoscope section uses **"Daily Pulse"** (EN) / **"Tagesimpuls"** (DE) as its canonical UI title.

## Context

Three names were in use across the codebase, creating inconsistency:

1. **Daily Pulse** — clear, intuitive, action-oriented
2. **Daytrace** — implies a tracking/log metaphor
3. **Date Trace** — ambiguous (date as in calendar? dating?)

Additionally, the `CosmicWeatherCard` component was titled "Cosmic Weather" which describes the data source, not the user-facing concept.

## Choice: "Daily Pulse" / "Tagesimpuls"

### Rationale

- Most intuitive for non-astrology users — "pulse" implies a quick daily check-in
- Aligns with the existing `tagesImpuls` i18n namespace already in translations.ts
- "Cosmic Weather" is a data source concept, not a user-facing feature name
- Keeps the door open for sub-modes (e.g., "Today's Trace" as a subtitle when trace mode is active)

### Sub-modes

If different trigger states exist (Pulse vs Trace), they appear as a **subtitle or mode badge** beneath the main title, not as a replacement title. Example:

```
Daily Pulse
↳ Active Mode: Trace
```

## Consequences

- Rename `cosmicWeather.title` → use `tagesImpuls.sectionTitle` as canonical title
- `CosmicWeatherCard` component can keep its internal name (code identifier ≠ UI label)
- All UI text, i18n keys, and documentation use "Daily Pulse" / "Tagesimpuls"
