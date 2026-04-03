# SDLC-fix Handoff: dashboard-daily-widgets-static

## Summary
The dashboard daily widgets appear static instead of live. The Day-Pulse / Day-Trace text appears unchanged across multiple days, and the "Today's Influences" section may be displaying placeholder values rather than live signal values.

## Observed Behavior
The daily impulse text appears unchanged for several days. The "Today's Influences" section shows the same planet set and may keep the same percentages. The card styling also appears visually detached from the rest of the dashboard.

## Expected Behavior
The daily impulse must change with the requested date and current input state. The influence section must display live runtime values and clearly distinguish fallback states from real data.

## Reproduction
1. Open the Dashboard on multiple days or after a date boundary
2. Compare the Day-Pulse / Day-Trace content across days
3. Inspect the "Today's Influences" values and planet set
4. Reload and compare against current runtime data availability

## Suspected Area
- `src/hooks/useFirstRunDaily.ts` — localStorage cache key may not rotate correctly at date boundaries
- `src/components/dashboard/DayModeModal.tsx` — daily modal rendering
- `src/components/dashboard/InfluenceGauges.tsx` — confirmed hardcoded defaults: `Mars 0.82`, `Jupiter 0.65`, `Venus 0.45`, `Saturn 0.30` used as permanent fallback when no weights arrive
- `src/services/experience.ts` — `fetchDailyExperience()` call and error handling
- `/api/experience/daily` — FuFirE proxy endpoint
- `/api/space-weather/extended` — space weather signal pipeline

## Linked Artifacts
- [REQ-F-signatur-day-night-pulse](../../1-objectives/requirements/REQ-F-signatur-day-night-pulse.md)
- [REQ-F-space-weather-modulation](../../1-objectives/requirements/REQ-F-space-weather-modulation.md)
- [REQ-F-dashboard-live-daily-signals](../../1-objectives/requirements/REQ-F-dashboard-live-daily-signals.md)

## Notes
This fix should remove fake-live behavior. If runtime data is missing, show a labeled fallback state rather than silently using static defaults as if they were current values. The `InfluenceGauges.tsx` hardcoded defaults are a confirmed code smell — the fix must wire live data or explicitly render an unavailable state.
