# Signatur 3D — "komisches Bild" Defect Report

**Status:** Open — diagnosed, not fixed
**Created:** 2026-04-20
**Sprint:** Dashboard/Signatur Hygiene (docs/plans/2026-04-20-dashboard-signatur-gaps.md)
**Phase:** 10

## Reproduction

On `/signatur` (SignaturPage), the rendered image does not visually read as the intended "real 3D signature". The exact visual artefact needs Ben's one-line description in a follow-up; this report captures what the code actually does today so whoever picks it up can align quickly.

## Current code path

Entry: `src/components/signatur-renderer/SignaturRenderer.tsx`

```
SignaturRenderer (viewMode: '2d' | '3d', default '2d')
├── 2D branch (default)
│   ├── if chladniParams && !cymaticsFailed
│   │   → SignaturCymaticsCanvas (Canvas2D Chladni)
│   └── else
│       → CymaticsFallback (static SVG pattern)
└── 3D branch (opt-in via toggle button)
    → SignatureSphere3D (R3F, real three.js canvas)
        uses: planetWeights ?? NEUTRAL_BAZI_WEIGHTS
```

Data source (from `src/pages/SignaturPage.tsx`):
- `chladniParams = baziToChladniParams(apiData.bazi.pillars, apiData.wuxing.elements, harmony_index)` — returns `undefined` when BaZi pillars or Wu-Xing weights are missing.
- `planetWeights = baziToPlanetWeights(apiData.bazi, apiData.wuxing)` — adapter always returns all 10 keys; falls back to `NEUTRAL_BAZI_WEIGHTS` when inputs are incomplete.

## Hypotheses (ranked by likelihood)

### H1 — 2D Cymatics is what Ben is seeing (not "3D weird", but "2D doesn't feel like a signature")
**Signal**
- Default `viewMode === '2d'`; the 3D sphere requires a deliberate button press.
- Canvas2D Chladni patterns are abstract vibration-node drawings; to an unfamiliar viewer they read as "noise" or "grid".
- The `SignaturCymaticsCanvas` + `CymaticsFallback` both fill the frame with a static-looking Chladni pattern when `chladniParams.dominantElement` doesn't produce strong visual contrast.

**Test**
- Ask Ben to click the **3D** button top-right of the renderer. If the image changes dramatically (sphere, rotation, glyphs), H1 is correct — the complaint was about the 2D default.

**Fix candidate (if H1 correct)**
- Flip default to 3D (`useState<'2d' | '3d'>('3d')`).
- Or: remove the 2D/3D toggle and always render 3D while keeping Cymatics for audio-sync only.

### H2 — `planetWeights` is `NEUTRAL_BAZI_WEIGHTS` (uniform sphere, no identity)
**Signal**
- If `apiData.bazi` or `apiData.wuxing` is missing/incomplete (API slow, cold cache, new user), `baziToPlanetWeights` returns `NEUTRAL_BAZI_WEIGHTS` (all values ≈ 0.5).
- With uniform weights, `chladniDisplacement` produces the same amplitude everywhere → sphere looks like a fuzzy ball, no pole highlights, no trails (weights below `TRAIL_THRESHOLD = 0.35`).
- User reads this as "not a signature, just a generic sphere".

**Test**
- DEV console: print `planetWeights` on SignaturPage. If every value is `0.5` (neutral) while `apiData.bazi` looks populated, `baziToPlanetWeights` has a mapping bug.
- Verify `apiData.bazi?.pillars` and `apiData.wuxing?.elements` are populated in Supabase `astro_profiles` for the affected user.

**Fix candidate (if H2 correct)**
- Debug `baziToPlanetWeights`: audit with a known-good BaZi input → expect non-neutral outputs.
- Ensure the bootstrap / transit-state pipeline always persists `pillars` + `wuxing.elements` before Dashboard renders.

### H3 — `CymaticsFallback` (static SVG) is what renders, and looks broken
**Signal**
- If `chladniParams === undefined` (e.g. BaZi pillars missing), both the 2D canvas AND its Suspense fallback show `CymaticsFallback` — a static SVG pattern by dominant element. No animation, no interaction, no 3D feel.
- This is the current default for any user whose `apiData` is incomplete at render time.

**Test**
- Check DOM: if `[data-testid="cymatics-fallback"]` is present (vs `[data-testid="view-2d-container"] canvas`), you're in fallback land.

**Fix candidate (if H3 correct)**
- Enrich `CymaticsFallback` so it's still visually rich (subtle animation, per-planet glow).
- Or: keep fallback simple but show an explicit "Your signature is loading" caption so users don't think the static image IS the signature.

### H4 — R3F Canvas fails to initialize (WebGL error, extension blocked)
**Signal**
- Safari / Firefox / locked-down enterprise browsers may fail to create a WebGL2 context.
- Suspense fallback shows `CymaticsFallback` — user sees the static SVG even when they toggled 3D, never a visible error.

**Test**
- Browser console: search for WebGL or three.js errors. Check `navigator.userAgent` + `canvas.getContext('webgl2')` status.

**Fix candidate (if H4 correct)**
- Render an explicit "3D not supported" message when `gl.getContext` fails, pointing the user to Chrome/Edge instead of silently degrading.

## Acceptance criteria for "real 3D"

Whichever fix is chosen, "real 3D" must satisfy:

- **Rotatable:** the sphere visibly rotates in world space (or via drag), not just a 2D animation.
- **Lit:** at least one light source casts visible gradient across the sphere surface — not flat shading only.
- **Planet-coded:** the 12 poles show distinct per-planet colors + glyphs (the `PLANETS` table in `src/lib/signatur-3d/planets.ts`).
- **Weight-driven delta:** users with different `apiData.bazi` see visibly different Chladni displacement patterns. A neutral-weighted sphere and a user-specific sphere must be distinguishable at a glance.
- **No silent degradation:** if WebGL is unavailable or `planetWeights` are neutral, the UI must tell the user (caption, badge, or tooltip).

## Recommended next steps

1. **Get a screenshot from Ben** (+ browser + which button was last clicked). That alone will probably collapse H1-H4 to a single hypothesis.
2. **If H1**: flip the default to 3D in this sprint as a one-line change (low risk).
3. **If H2**: create a Signatur data-integrity sprint — audit `baziToPlanetWeights` + add contract tests.
4. **If H3**: redesign `CymaticsFallback` or add a caption.
5. **If H4**: ship a user-facing WebGL-unavailable message.

Decision to defer this sprint: Phase 10 was time-boxed to diagnosis-or-report. A fix requires Ben's product call on which path (H1 default-swap vs. H3 fallback redesign) matches his visual intent, and without a screenshot that is not answerable today.

## Pointers

- `src/components/signatur-renderer/SignaturRenderer.tsx` — main entry + 2D/3D toggle
- `src/components/signatur-cymatics/SignaturCymaticsCanvas.tsx` — 2D Chladni canvas
- `src/components/signatur-cymatics/CymaticsFallback.tsx` — static SVG fallback
- `src/components/signatur-3d/SignatureSphere3D.tsx` — R3F 3D sphere
- `src/lib/signatur-3d/bazi-to-planets.ts` — weight derivation
- `src/lib/cymatics/bazi-to-chladni.ts` — 2D Chladni param derivation
- `NEUTRAL_BAZI_WEIGHTS` — default uniform weights (`src/lib/signatur-3d/bazi-to-planets.ts`)
