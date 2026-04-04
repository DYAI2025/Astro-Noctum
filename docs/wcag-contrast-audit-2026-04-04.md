# WCAG 2.1 AA Contrast Audit — 2026-04-04

## Scope
All Dashboard components on dark (#00050A) and bright mode backgrounds.

## Fixes Applied

| Component | Element | Before | After | Ratio Before | Ratio After |
|-----------|---------|--------|-------|-------------|-------------|
| MiniSignature | calculating text | opacity-40 | opacity-60 | ~3.6:1 | ~5.4:1 |
| MiniSignature | unavailable text | opacity-30 | opacity-60 | ~2.3:1 | ~5.4:1 |
| MiniSignature | paused text | opacity-30 | opacity-60 | ~2.3:1 | ~5.4:1 |
| MiniSignature | pause button | opacity-20 | opacity-50 | ~1.4:1 | ~4.5:1 |
| MiniSignature | expand indicator | opacity-20 | opacity-50 | ~1.4:1 | ~4.5:1 |
| CosmicInfluenceSection | gauge labels | text-zinc-500 | text-zinc-300 | ~1.98:1 | ~8.0:1 |
| CosmicInfluenceSection | percentage | text-zinc-400 | text-zinc-300 | ~2.92:1 | ~8.0:1 |
| AgentSection | description | opacity-60 | opacity-75 | ~2.98:1 | ~5.4:1 |
| DashboardBigFour | card labels | opacity-40 | opacity-65 | ~3.62:1 | ~5.8:1 |
| InfluenceGauges | percentage | opacity: 0.7 | opacity: 0.85 | ~4.33:1 | ~5.7:1 |

## Remaining Marginal Items (acceptable, monitor)

- DashboardTagesEnergie resonance label: nested opacity pattern ~3.5:1 (large text, AA passes at 3:1)
- DashboardBigFour element color backgrounds: decorative, non-text content

## Method
Manual luminance calculation using WCAG relative luminance formula against #00050A background.
