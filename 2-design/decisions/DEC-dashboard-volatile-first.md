# DEC-dashboard-volatile-first: Dashboard Volatile Content Starts with One Unified Daily Chart Hero

**Status**: Active

**Category**: Architecture

**Scope**: frontend, api-server

**Source**: [GOAL-daily-chart-coherence-first](../../1-objectives/goals/GOAL-daily-chart-coherence-first.md), [REQ-F-daily-chart-coherence-hero](../../1-objectives/requirements/REQ-F-daily-chart-coherence-hero.md), [REQ-F-experience-daily-v2](../../1-objectives/requirements/REQ-F-experience-daily-v2.md)

**Last updated**: 2026-04-14

## Context

The previous volatile-first decision correctly prioritized live content above static natal content, but it still split that volatile value across multiple adjacent cards. This diluted scanability, created duplicate visual weight, and made key daily values feel disconnected. The requested product direction is one Daily Chart hero that merges coherence, daily impulse, active planets, and compact driver evidence into one top-level card.

## Decision

The dashboard must render content in this top-to-bottom order:

1. `DailyChartHero` — one unified live card containing coherence, daily impulse, active planets, and compact driver/evidence strip
2. `AgentContextSection` — explainer/orientation layer for agents and follow-on guidance
3. Lower static dashboard zones, including Planetarium and Cosmic Blueprint, preserving mobile readability and consistent card hierarchy

Additional rules:
- `DailyChartHero` must always be the first rendered child; no accordion, no collapse mechanism
- The on-demand Vibes feature (2–3h short-horizon layer) remains a separate action trigger and is not merged into `DailyChartHero`
- Dark mode and Bright mode must both apply their respective token sets to the hero card — no shared white background fallback
- New live sections are inserted inside or after `DailyChartHero`; static sections remain in the lower zone

## Enforcement

### Trigger conditions

- **Design phase**: when designing any new Dashboard section — determine where it belongs in the order before creating the component
- **Code phase**: when modifying `Dashboard.tsx` render order — verify the unified hero is first; when adding a new Dashboard section — place it in the appropriate tier

### Required patterns

```tsx
// Dashboard.tsx — correct ordering
<DashboardLayout>
  <DailyChartHero />        {/* always first, always fully expanded */}
  <AgentContextSection />   {/* orientation / follow-on guidance */}
  {/* lower static zones */}
  <NatalSignaturStatic />   {/* collapsed by default, always last */}
</DashboardLayout>
```

Static sections must carry a `defaultCollapsed` prop or equivalent. New static sections are always appended inside the lower zone.

### Required checks

1. Confirm `DailyChartHero` is the first child in the render tree and has no collapse mechanism
2. Confirm the hero uses dark-mode card tokens in Dark mode (no white-card / white-text combination)
3. Confirm `NatalSignaturStatic` is the last section and renders collapsed by default

### Prohibited patterns

- Rendering any static astrological data above `DailyChartHero`
- Wrapping `DailyChartHero` in an accordion or collapsible section
- Using the same card background token in both Dark and Bright mode
- Merging the Vibes on-demand flow into the daily impulse section of `DailyChartHero`
