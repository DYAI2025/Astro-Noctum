# ASM-noaa-in-fufre: FuFirE Has Access to NOAA Solar Pressure Data

**Category**: Technology

**Status**: Unverified

**Risk if wrong**: Medium — If FuFirE does not have NOAA data, `harmony_index` cannot include the `solar_pressure` component (0.35 weight). The formula would fall back to `harmony * 1.0`, degrading the accuracy of the Kohärenzindex and making `solar_pressure`-driven cosmic weather invisible in the hero section.

## Statement

FuFirE's backend already ingests NOAA solar pressure data as part of its transit or harmony computation pipeline. Specifically, `solar_pressure` (a normalised 0–1 value derived from Kp-index and/or X-ray flux) is available as an internal variable that can be included in the `ACTIVE_IMPACTS_v1` response or used within the `harmony_index` formula without requiring a new external data source integration.

## Rationale

The Bazodiac frontend already integrates NOAA data via `/api/space-weather/extended` (5-min cached, fetched from NOAA SWPC and NASA DONKI). It is reasonable to assume that FuFirE, as the backend engine, has access to the same or equivalent data given that it computes transit resonance which is inherently sensitive to solar conditions.

## Verification Plan

1. Review FuFirE's `/impact/active` or transit endpoint documentation (or ask the FuFirE maintainer) for whether `solar_pressure` is already a named internal variable.
2. Make a test call to FuFirE's impact endpoint and inspect the response for any solar pressure, Kp, or space-weather field.
3. If absent: assess whether FuFirE can accept `solar_pressure` as an input parameter from the Bazodiac server, rather than computing it internally.

**Verify before:** starting implementation of `REQ-F-impact-active-endpoint` or `REQ-F-coherence-hero-impact-datasource`.

## Related Artifacts

- [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)
- [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md)
- [REQ-F-coherence-hero-impact-datasource](../requirements/REQ-F-coherence-hero-impact-datasource.md)
