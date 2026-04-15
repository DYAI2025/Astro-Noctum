# Dashboard Dark Mode Card Contrast Fix

**Status**: Pending — execute as standalone fix if unified Daily Chart hero does not ship atomically

## Observed Behavior

Dashboard cards in Dark / Planetarium mode render with a white or light card background while foreground text remains light/white, causing low or invisible contrast (white-on-white failure).

## Expected Behavior

All dashboard cards in Dark mode use dark-mode card tokens and maintain readable text contrast.

## Reproduction

1. Open the dashboard in Dark / Planetarium mode.
2. Inspect the current coherence / daily area cards.
3. Observe white or light card surfaces with light foreground text.

## Suspected Area

Dashboard top-card token selection, mode-specific card background classes, and shared card styling logic.

## Linked Artifacts

- [REQ-USA-wcag-contrast](../../1-objectives/requirements/REQ-USA-wcag-contrast.md)
- [DEC-design-system-v2](../../2-design/decisions/DEC-design-system-v2.md)

## Note on Scope

This fix is a no-op if the unified `DailyChartHero` ships atomically — the new hero must use dark-mode tokens by its own acceptance criteria (`REQ-F-daily-chart-coherence-hero`). Execute as a standalone patch only if the old cards remain in service during a phased rollout.
