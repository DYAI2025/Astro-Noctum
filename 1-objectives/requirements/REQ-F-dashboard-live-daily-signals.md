# REQ-F-dashboard-live-daily-signals: Dashboard Live Daily Signals

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md), [GOAL-vibes-weekly-insights](../goals/GOAL-vibes-weekly-insights.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Dashboard must render date-sensitive daily content and influence signals from live runtime data rather than placeholder copy or hardcoded percentages. This includes the daily impulse section and the "Today's Influences" section.

For planetary influence, the system must compute a user-specific field from the relationship between the user's natal / Signatur baseline and the planet's current live daily state. Each displayed planet must communicate two semantic dimensions:

- **Resonance**: harmonic alignment between the user's baseline and the current planetary state
- **Tension**: friction or challenge introduced by the same planetary state

Personal relevance is derived from live intensity in combination with resonance and tension. Because this is a semantic field rather than a generic proportion, the primary UI should favor a field / gradient metaphor over an unexplained raw percentage.

## Acceptance Criteria

- Given a requested calendar day, when the daily impulse is rendered, then the displayed text corresponds to that requested day and is not silently reused from an older date
- Given the daily impulse data source is unavailable, when the section is rendered, then the UI shows a clearly labeled fallback state instead of stale placeholder copy
- Given the "Today's Influences" section is rendered, when live influence data is available, then each displayed planet is computed from runtime signal inputs and the user's natal / Signatur relation to that planet, not from hardcoded default percentages
- Given a planet is displayed, when the user inspects the card, then the UI communicates both resonance and tension either as distinct values or as a clearly explained combined field state
- Given the influence card uses color encoding, when resonance dominates, then the visual state shifts toward cool blue tones; when tension dominates, it shifts toward red tones; intermediate states use a continuous gradient between both poles
- Given the system evaluates all planets for the requested day, when multiple planets exceed the configured visibility threshold, then all qualifying planets are shown; planets below that threshold may be hidden or visually de-emphasized
- Given the UI presents a scalar score, when it is rendered, then the copy explains that the score represents personal relevance / field strength rather than a generic astronomical percentage
- Given live influence data is unavailable, when the section is rendered, then the UI shows a neutral fallback state that is visibly distinguishable from live data
- Given space-weather data is available, when the Dashboard renders influence context, then cosmic weather is shown as a first-class influence using the existing space-weather pipeline
- Given space-weather data is temporarily unavailable, when the Dashboard renders, then the layout remains intact and cosmic weather falls back to a calm or unavailable state without fake event severity
- Given the daily impulse section and the influence section are rendered, when visually inspected, then typography, color usage, and card styling are consistent with the dashboard design system in both Dark and Bright mode

- Given the Dashboard layout is rendered, when a user sees the first viewport, then the content order from top to bottom is: (1) Day Pulse/Trace section — fully expanded, never collapsed, (2) live planet influence cards (Aktive Einflüsse), (3) space weather card if Kp ≥ 4; static natal content (Western chart, BaZi pillars, Wu-Xing) is placed below this live block and collapsed by default
- Given the "Aktive Einflüsse" section is rendered, when live transit data is available, then each planet card displays both a Western block (degree, sign, retrograde status, live speed) and a BaZi fusion block (Wu-Xing element, resonance type, German interpretation sentence) — neither block may be omitted when both data sources are available
- Given the Day Pulse section is rendered for a given day, when transit events from `/transit/state` are available, then the displayed interpretation text is taken verbatim from `events[].description_de` and `events[].personal_context`; the client must not template or rewrite these server-provided texts
- Given no transit events are returned for a day, when the Day Pulse section is rendered, then a neutral German fallback "Heute keine markanten Ereignisse. Nutze die Ruhe." is shown — the section remains visible and expanded
- Given any number is rendered on the Dashboard, when a code reviewer inspects the component, then a comment directly above the render site names the source (BAFE endpoint, hook name, or deterministic formula) — no number may appear without a documented origin

## Related Artifacts

- [REQ-F-signatur-day-night-pulse](REQ-F-signatur-day-night-pulse.md)
- [REQ-F-space-weather-modulation](REQ-F-space-weather-modulation.md)
- [REQ-F-dashboard-bazi-fusion-bridge](REQ-F-dashboard-bazi-fusion-bridge.md)
- [REQ-USA-wcag-contrast](REQ-USA-wcag-contrast.md)
