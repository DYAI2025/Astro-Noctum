# Quiz → Signatur Coupling (Deferred)

**Status:** Deferred to next sprint
**Created:** 2026-04-20
**Sprint anchor:** `GOAL-quiz-signatur-coupling-v1` (1-objectives/goals/)
**Related plan (own sprint):** `docs/plans/2026-04-20-quiz-signatur-coupling.md`
**Related constraint:** `CON-quiz-signatur-axiome.md` (12 axioms)

## Why this is deferred

The Dashboard/Signatur Hygiene sprint (2026-04-20) cleaned up the coherence-first Dashboard and consolidated active-impact rendering, but intentionally did **not** couple quiz answers to the visual Signatur. The backend already persists `quiz_sectors` / `quiz_effective` on `user_signature_state`, yet the frontend's 3D/2D signature visualization ignores them. Closing that loop is a self-contained piece of work that deserves its own plan, its own QA, and its own HALT-gates.

## What runs today

**Backend (live):**
- Quiz completion → `POST /api/contribute` → upserts `contribution_events` row (sector weights per cluster).
- `GET /api/transit-state/:userId` loads `astro_profiles.soulprint_sectors` + `contribution_events` and POSTs both as `soulprint_sectors` + `quiz_sectors` to FuFirE `/transit/state`. The resulting `quiz_effective` / `quiz_sectors` land on `user_signature_state` (see `KOHAERENZ_INDEX.md` §4).
- `useFusionSignal` hook pulls the shape back into the React tree as `FusionSignalData.baseSignals`.

**Frontend (missing):**
- V2 engine (`FusionRingCanvasV2` + `bazodiac-engine`) accepts `quizWeights` (6 dimensions via `quizSectorsToQuizWeights`), but the render pipeline does not yet modulate geometry / color / amplitude visibly when quizzes are answered.
- V1 fallback (`FusionRingWebsiteCanvas`) uses only soul-profile sectors; quiz influence is absent.
- No test asserts a "before/after quiz" visual delta.

## Acceptance criteria (for the next sprint)

- **Visible delta:** a user with 0 completed clusters and the same user with 1 completed cluster must produce a reproducibly different Signatur frame (pixel-level diff via snapshot test or numeric delta in the geometry buffer).
- **Progressive reveal:** each additional completed cluster increases either amplitude, color weight, or spatial coverage — the relationship is monotonic and documented in the axioms (`CON-quiz-signatur-axiome.md`).
- **Axiom compliance:** the 12 axioms in `CON-quiz-signatur-axiome.md` are satisfied (append-only, answer-level elements, neutral start, etc.).
- **Performance:** 3D Canvas re-render on quiz completion stays under 16ms/frame on a mid-range laptop (60fps budget).
- **Reset path:** a manual reset of `quiz_effective` (e.g. via dev-tooling or account flush) returns the Signatur to its neutral soulprint-only shape.

## Inputs the next sprint will work with

| Input | Source | Shape |
|---|---|---|
| Soulprint sectors | `astro_profiles.soulprint_sectors` | 12-number array, time-stable |
| Quiz sectors | `user_signature_state.quiz_sectors` (raw) | 12-number array, append-only |
| Quiz effective | `user_signature_state.quiz_effective` | 12-number array (weighted, decayed) |
| Transit signal | FuFirE `/transit/state` response | `FusionSignalData` |

## Open questions (must resolve during planning)

- **Amplitude vs. hue vs. geometry:** which of the three visual channels should carry the quiz delta as the *primary* signal? Plan recommends amplitude (most perceptible on a slowly-rotating sphere), but Ben's call.
- **Monotonicity guarantee:** should completing a new cluster always strictly increase the visible delta, even if the underlying sector weights happen to cancel each other? If yes, a non-linear remap is needed.
- **Mobile parity:** the iOS app (`apps/mobile`) has no real 3D yet; should it mirror the 2D spirograph adapter, or simply display a progress indicator until a native renderer lands?

## Risks

- **Performance regression** if the V2 engine recomputes its 28K-particle buffer on every React state change. Needs memoization / off-main-thread generation.
- **Silent backend drift** — if FuFirE changes its `quiz_effective` shape, the visualization will silently render stale data. Add a schema contract test before the next sprint ships.
- **Axiom conflicts** — the "append-only, neutral start" axioms combined with the "visible delta after 1 cluster" acceptance criterion are tight; naive implementations may accidentally break one or the other.

## Out of scope for the next sprint

- Algorithmic redesign of the Signatur shape language (stays with V2 spirograph + Chladni engine).
- New quiz clusters or new axioms (those belong in a product sprint).
- Backend changes to `contribution_events` / `user_signature_state` schemas.
- The 3D-defect investigation from Phase 10 of the Dashboard hygiene sprint (tracked separately in `docs/requirements/2026-04-20-signatur-3d-defect.md` if opened).

## Pointer

The actual implementation plan lives at `docs/plans/2026-04-20-quiz-signatur-coupling.md`. Start there after this sprint merges.
