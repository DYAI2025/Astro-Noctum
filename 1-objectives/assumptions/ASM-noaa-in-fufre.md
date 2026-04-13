# ASM-noaa-in-fufre: FuFirE Has Access to NOAA Solar Pressure Data

**Category**: Technology

**Status**: Invalidated

**Risk if wrong**: Medium — If FuFirE does not have NOAA data, `harmony_index` cannot include the `solar_pressure` component (0.35 weight). The formula would fall back to `harmony * 1.0`, degrading the accuracy of the Kohärenzindex and making `solar_pressure`-driven cosmic weather invisible in the hero section.

## Statement

FuFirE's backend already ingests NOAA solar pressure data as part of its transit or harmony computation pipeline. Specifically, `solar_pressure` (a normalised 0–1 value derived from Kp-index and/or X-ray flux) is available as an internal variable that can be included in the `ACTIVE_IMPACTS_v1` response or used within the `harmony_index` formula without requiring a new external data source integration.

## Rationale

The Bazodiac frontend already integrates NOAA data via `/api/space-weather/extended` (5-min cached, fetched from NOAA SWPC and NASA DONKI). It is reasonable to assume that FuFirE, as the backend engine, has access to the same or equivalent data given that it computes transit resonance which is inherently sensitive to solar conditions.

## Verification Result (2026-04-13)

**Invalidated.** FuFirE does NOT have NOAA solar pressure data or an `/impact/active` endpoint.

**Evidence:**
1. `POST https://bafe-production.up.railway.app/impact/active` → **404 Not Found**
2. FuFirE's documented endpoints are: `/chart`, `/transit/state`, `/experience/bootstrap`, `/experience/daily`, `/experience/signature-delta` — none include solar pressure fields
3. FuFirE's `harmony_index` (from `/experience/bootstrap`) is purely "cosine similarity between Western and Eastern Wu-Xing vectors" — no solar component

**Mitigation — server-side pass-through approach:**
Solar pressure data IS available in server.mjs via `spaceWeatherCache.payload.solar_pressure_score` (sourced from NOAA SWPC, 5-min cache). The `/api/impact/active` endpoint will be built entirely in server.mjs (not proxied to FuFirE) by:
1. Loading the user's natal chart from Supabase `astro_profiles`
2. Computing transit aspects against natal chart using `/calculate/western` (existing BAFE endpoint)
3. Filtering to orb ≤ 8°
4. Reading `solar_pressure_score` from `spaceWeatherCache`
5. Computing `harmony_index = round((harmony * 0.65 + solar_pressure * 0.35) * 100)` where `harmony` comes from the existing FuFirE bootstrap data and `solar_pressure` from NOAA cache
6. Returning the `ACTIVE_IMPACTS_v1` schema

This approach reuses existing infrastructure and requires no FuFirE changes.

## Related Artifacts

- [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)
- [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md)
- [REQ-F-coherence-hero-impact-datasource](../requirements/REQ-F-coherence-hero-impact-datasource.md)
