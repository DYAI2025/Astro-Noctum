# CON-no-signatur-v3-rebuild: Signatur V3 renderer is not rebuilt

**Category**: Technical

**Status**: Active

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

The Signatur V3 rendering pipeline — `SignatureSphere3D`, `SignaturRenderer`, the BaZi-to-Chladni params translation in `src/lib/cymatics/bazi-to-chladni.ts`, and supporting modules under `src/lib/signatur-3d/` — is not to be rebuilt or replaced as a new feature. Only its **integration surface** (visibility from the dashboard, error boundaries, performance guards, anchor cards) may change.

## Rationale

The 3D natal-signature sphere is implemented and functional per the dev brief: `SignaturRenderer` imports `SignatureSphere3D` statically, the `/signatur` page exists, the BaZi→Chladni params pipeline is wired up. The actual user-facing problem is **discoverability** — the dashboard does not visibly link to `/signatur`, so users never reach the feature. Rebuilding wastes sprint capacity that should go to dashboard flow. Non-Goal #2 in the dev brief: "Kein Rebuild der Signatur V3 als neues Feature."

## Impact

- TASK-2.1 (codepath verification) and TASK-2.2 (dashboard anchoring) are the in-scope work; both modify the integration surface, not the renderer internals.
- Adding `SignaturAnchorCard`, error boundaries (`SectionErrorBoundary`), and performance guards (no WebGL in dashboard context until proven safe) is permitted.
- Modifying the renderer's shaders, geometry, or material code paths is out of scope.
- The known Wu-Xing DE/EN-drift bug in `bazi-to-chladni.ts` is acknowledged as a renderer-adjacent issue but lives in a separate fix-track per the dev brief (Hinweis #8).
