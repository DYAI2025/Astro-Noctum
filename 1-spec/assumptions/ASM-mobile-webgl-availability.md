# ASM-mobile-webgl-availability: Target users' mobile devices support WebGL well enough for the 3D signature sphere

**Category**: Technology

**Status**: Unverified

**Risk if wrong**: Medium — A meaningful portion of mobile users would hit `CymaticsFallback` instead of the live 3D sphere; the "core value hook" of `GOAL-discoverable-signature-anchor` would be silently degraded for those users. The fallback path is graceful (per `REQ-REL-signature-error-isolation`), but if it triggers for, say, >20% of mobile users, the goal isn't actually delivering as designed.

## Statement

The target user base accesses Astro-Noctum predominantly on devices that support WebGL 1.0+ with sufficient GPU performance to render `SignatureSphere3D` smoothly (≥30 fps for the cymatics shader loop, no out-of-memory crashes). Modern iPhones (iOS 14+), modern Android (Chrome 90+), and most desktop browsers meet this baseline.

## Rationale

The product's user base is presumably consumer-facing (per the brief's free/premium framing and German consumer language). Modern smartphones from the last 4–5 years universally support WebGL. The renderer was implemented with the assumption that WebGL availability is the norm; the dev brief treats `CymaticsFallback` as an exception path, not the primary path.

## Verification Plan

- **Pre-launch**: instrument the signature surface to fire an analytics event distinguishing (a) full WebGL render success, (b) WebGL-init failure → `CymaticsFallback`, (c) render exception caught by error boundary. Aggregate over the first cohort of users; if WebGL-init failure rate >10%, mark the assumption Invalidated and re-evaluate the dashboard signature anchor strategy.
- **Pre-launch**: smoke-test the 3D sphere on a representative low-end Android device (mid-tier from ~2020) and an iPhone SE/8 to confirm no out-of-memory or render-loop stalls.
- **Post-launch**: continue monitoring the WebGL-init failure rate as part of frontend telemetry.
- **Verification window**: smoke tests before TASK-2.2 ships; analytics-driven verification within 2 weeks of dashboard signature anchor going live.

## Related Artifacts

- [GOAL-discoverable-signature-anchor](../goals/GOAL-discoverable-signature-anchor.md)
- [REQ-REL-signature-error-isolation](../requirements/REQ-REL-signature-error-isolation.md)
- [REQ-PERF-signature-no-direct-embed](../requirements/REQ-PERF-signature-no-direct-embed.md)
