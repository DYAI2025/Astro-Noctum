# DEC-dashboard-volatile-first: Dashboard Content Ordering — Volatile First

**Status**: Active

**Category**: Architecture

**Scope**: frontend

**Source**: [REQ-F-dashboard-live-daily-signals](../../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md), [GOAL-autopoietic-ux](../../1-objectives/goals/GOAL-autopoietic-ux.md)

**Last updated**: 2026-04-08

## Context

The Dashboard was a static silo layout with no reason for users to return daily. Day Pulse, active planetary influences, and space weather are time-sensitive and change every day. Static natal data (Western chart, BaZi pillars, Wu-Xing balance) does not change. Mixing them at the same visual level destroyed the daily-use value proposition.

## Decision

The Dashboard must render content in this fixed top-to-bottom order:

1. `DayPulseExpanded` — today's transit events and Day Pulse/Trace mode (always visible, always fully expanded — no accordion, no collapse)
2. `AktiveEinfluesseFusion` — live planet cards with Western + BaZi fusion block (always visible)
3. `MagnetsturmKarte` — geomagnetic storm card (self-hides when Kp < 4)
4. `NatalSignaturStatic` — static natal content: Western chart, BaZi pillars, Wu-Xing (collapsed by default)

This ordering is a **product contract**, not a style preference. Inverting it or promoting static content above live content is a regression.

## Enforcement

### Trigger conditions

- **Design phase**: when designing any new Dashboard section — determine where it belongs in the order before creating the component
- **Code phase**: when modifying `Dashboard.tsx` render order — verify the volatile-first sequence is preserved; when adding a new Dashboard section — place it in the appropriate tier (live vs. static)

### Required patterns

```tsx
// Dashboard.tsx — correct ordering
<DashboardLayout>
  <DayPulseExpanded />           {/* always expanded, always first */}
  <AktiveEinfluesseFusion />     {/* always visible */}
  <MagnetsturmKarte />           {/* self-hides if kp < 4 */}
  <NatalSignaturStatic />        {/* collapsed by default, always last */}
</DashboardLayout>
```

Static natal sections must carry a `defaultCollapsed` prop or equivalent. New live sections are inserted between position 2 and 3. New static sections are always appended inside `NatalSignaturStatic`.

### Required checks

1. Confirm `DayPulseExpanded` is the first child in the render tree and has no collapse mechanism
2. Confirm `NatalSignaturStatic` is the last section and renders collapsed by default
3. If Kp < 4 in the test environment, confirm `MagnetsturmKarte` renders nothing (no empty card placeholder)

### Prohibited patterns

- Rendering `NatalSignaturStatic` or any static astrological data above `DayPulseExpanded`
- Wrapping `DayPulseExpanded` in an accordion or collapsible section
- Showing a `MagnetsturmKarte` placeholder card when Kp < 4
