# SDLC-fix Handoff: dashboard-theme-parity-defects

## Summary
The current dashboard/navigation shell shows visual quality defects: menu items are not cleanly aligned, some labels are too gray against the background, Bright mode styling is inconsistent, and some cards use typography/color/size patterns that feel detached from the established dashboard system.

## Observed Behavior
The top menu appears visually misaligned, some labels have insufficient contrast, Bright mode surfaces do not share one consistent token system, and at least one dashboard card appears to use a different visual language than the rest.

## Expected Behavior
Navigation and dashboard surfaces should use one coherent visual system with stable alignment, readable contrast, and consistent typography/card styling across Dark and Bright mode.

## Reproduction
1. Open the current dashboard/navigation shell on besodiac.space
2. Inspect the top menu alignment and label contrast on the active background
3. Switch or compare to Bright mode
4. Compare "Today's Influences" and related cards against the surrounding dashboard card family

## Suspected Area
Frontend navigation shell, dashboard card tokens, Bright mode theme tokens, and typography token application

## Linked Artifacts
- [REQ-USA-wcag-contrast](../../1-objectives/requirements/REQ-USA-wcag-contrast.md)
- [REQ-F-depth-navigation](../../1-objectives/requirements/REQ-F-depth-navigation.md)
- [DEC-spiritual-tech-interactions](../../2-design/decisions/DEC-spiritual-tech-interactions.md)
- [DEC-design-system-v2](../../2-design/decisions/DEC-design-system-v2.md)

## Linked Decisions
- [DEC-navigation-shell](../../2-design/decisions/DEC-navigation-shell.md)

## Notes
Treat the visual defects as a targeted fix. Desktop nav scope is resolved (DEC-navigation-shell): top horizontal bar preserved, 3 primary items (Astro-Agents, Planetarium, Signatur) + Settings. Do not add a side/guide nav or restructure primary items here. Typography: Sora + Cormorant Garamond are the only brand fonts — no others.
