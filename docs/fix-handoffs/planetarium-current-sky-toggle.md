# SDLC-fix Handoff: planetarium-current-sky-toggle

## Summary
Switching from birth sky to current sky in the planetarium does not update the rendered sky immediately. The view remains on the birth sky even after the user selects the current sky option.

## Observed Behavior
After selecting the current sky mode, the rendered planetarium still shows the birth sky.

## Expected Behavior
Selecting the current sky mode must immediately switch the render basis from birth date to current date/time.

## Reproduction
1. Open the Dashboard or planetarium section
2. Start in birth sky mode
3. Click or select the current sky option
4. Observe that the sky remains unchanged instead of switching to today/current time

## Suspected Area
- `src/contexts/PlanetariumContext.tsx` — `skyMode` state
- Parent component that passes `skyMode` into `BirthChartOrrery` — prop wiring may be missing or stale
- `src/components/BirthChartOrrery.tsx` — already contains `currentSky` code path; check if it is actually receiving a changed prop

## Linked Artifacts
- No requirement directly linked; behavioral regression against existing feature

## Notes
The renderer already contains a `currentSky` code path. Prioritize checking state propagation before modifying orbital math or rendering internals. This is likely a prop wiring bug, not a rendering logic bug.
