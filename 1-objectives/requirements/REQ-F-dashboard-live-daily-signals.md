# REQ-F-dashboard-live-daily-signals: Dashboard Live Daily Signals

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md), [GOAL-vibes-weekly-insights](../goals/GOAL-vibes-weekly-insights.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Dashboard must render date-sensitive daily content and influence signals from live runtime data rather than placeholder copy or hardcoded percentages. This includes the daily impulse section and the "Today's Influences" section. Planetary influence values must come from current signal inputs, and the Dashboard must expose cosmic weather as a user-visible influence using the existing space-weather pipeline.

## Acceptance Criteria

- Given a new calendar day is requested, when the daily impulse is rendered, then the displayed text corresponds to that requested day and is not silently reused from an older date
- Given the daily impulse data source is unavailable, when the section is rendered, then the UI shows a clearly labeled fallback state instead of stale placeholder copy
- Given the "Today's Influences" section is rendered, when live influence data is available, then displayed values come from runtime signal inputs and not from hardcoded default percentages
- Given live influence data is unavailable, when the section is rendered, then the UI shows a neutral fallback state that is visibly distinguishable from live data
- Given space-weather data is available, when the Dashboard renders influence context, then cosmic weather is shown as a first-class influence using the existing NOAA/NASA DONKI-derived signal pipeline
- Given space-weather data is temporarily unavailable, when the Dashboard renders, then the layout remains intact and cosmic weather falls back to a calm or unavailable state without fake event severity
- Given the daily impulse section and the influence section are rendered, when visually inspected, then typography, color usage, and card styling are consistent with the dashboard design system in both Dark and Bright mode

## Related Artifacts

- [REQ-F-signatur-day-night-pulse](REQ-F-signatur-day-night-pulse.md)
- [REQ-F-space-weather-modulation](REQ-F-space-weather-modulation.md)
- [REQ-USA-wcag-contrast](REQ-USA-wcag-contrast.md)
