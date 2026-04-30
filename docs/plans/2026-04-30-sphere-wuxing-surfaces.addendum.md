# Sphere Wuxing Surfaces — Plan Addendum

> Companion to `2026-04-30-sphere-wuxing-surfaces.md`. Resolves preflight findings F2/F3/F4 from `2026-04-30-sphere-wuxing-preflight.md` without touching the main plan body.

## F2 — Missing mockup `outputs/preview-3d-wuxing.html`

The main plan (Architecture section) refers to `outputs/preview-3d-wuxing.html` as a Phase-1 mockup that "already validated" the heightfield/albedo logic. **That file does not exist in this repo.** The GLSL in main-plan Task 3 is therefore the **single source of truth** for both vertex and fragment shaders.

**Implication for execution:** there is no reference render to A/B against. Visual verification falls entirely on Task 8 (Storybook) and Task 10 (real-profile smoke). If a future iteration needs a mockup, generate it from the GLSL — not the other way round.

## F3 — Scope decision

| Task | Status | Reason |
|------|--------|--------|
| 0–4 | Required | Foundation: types, constants, palettes, shaders, material builder |
| 5    | Required | API surface — `dominantElement` prop |
| 5b   | **Required** | Self-described as "Coverage-Gap 1 aus dem externen Implementierungsprompt" — gold wireframe is a stated visual requirement |
| 5c   | **Required** | Self-described as "Coverage-Gap 2" — halo wireframe for line readability is a stated requirement |
| 6    | Required | The actual visual swap |
| 7    | Required | Glue from `SignaturRenderer` |
| 8    | Required | Storybook stories — primary visual verification gate |
| 9    | Required | Performance smoke |
| 9b   | **Deferred** | "Variante B" — explicit alternative (Partikel-Layer). Out of scope for this iteration; track as follow-up if Task 9 perf budget allows |
| 10   | Required | Real BaZi-profile smoke |
| 11   | Required | PR prep |

Subagent dispatch order is therefore: 1, 2, 3, 4, 5, 5b, 5c, 6, 7, 8, 9, 10, 11.

## F4 — WebGL / GLSL compatibility

Verified versions (from `package.json` at HEAD):
- `three`: `^0.175.0`
- `@react-three/fiber`: `^9.5.0`
- `@react-three/drei`: `^10.7.7`
- `react`: `^19.0.0`
- `vitest`: `^4.0.18`
- `typescript`: `~5.8.2`

The main plan's GLSL uses GLSL 1.0 conventions (`gl_FragColor`, no `#version` directive). With Three.js r150+ and the default `ShaderMaterial` (not `RawShaderMaterial`), Three.js prepends the appropriate GLSL preamble and translates legacy syntax for WebGL2 contexts. **No GLSL changes required.**

If a future change introduces `RawShaderMaterial` or sets `glslVersion: THREE.GLSL3`, the shaders will need rewriting (`out vec4 outColor;` etc.). Out of scope for this iteration.

## F1 — Plan portability (worked around in preflight P3)

The main plan file is committed to `2026-04-20-quiz-signatur-sprint-1` by preflight Task P1. The worktree branched from `origin/main` will not contain it natively until either (a) the new branch merges with main, or (b) preflight Task P3 copies the two plan documents in. We do (b).
