# US-QSC-0-baseline-research — Sprint B Phase 0: Baseline & Research

**Phase**: 0 (non-blocking, research-only)
**Scope**: kein Code-Change; Sichtung des bestehenden Quiz- und Signatur-Pfades vor Sprint-B Implementation
**Axiome berührt**: 0 (pure Recherche)
**Axiome die nicht verletzt werden dürfen**: n/a

## Verifikation (Output-Contract)

### phase

Sprint-B Phase 0 Baseline abgeschlossen. Typecheck grün, Code-Karte erstellt, Axiome 1–12 aus `CON-quiz-signatur-axiome` re-gelesen und im Kopf. Sprint-Branch `2026-04-20-quiz-signatur-sprint-1` angelegt mit initialem Sprint-Start-Commit.

### verification

- **typecheck**: passed (`npm run typecheck:src` — No TypeScript errors in `src/`)
- **lint**: not run (Phase-0 macht keinen Code-Change, Lint-Check erfolgt ab Phase 1)
- **tests**: not run (kein Code-Change)

### code-karte: Quiz-Pfad (Modell A, live)

Single-source-of-truth für Quiz-Scoring, Contribution-Aggregation und Persistenz (Stand 2026-04-24, main):

**Quiz-Definitionen + Scoring:**
- `packages/shared/src/quizzes/schema.ts` — `QuizDefinition`-Typ (Union über 3 Scoring-Modelle)
- `packages/shared/src/quizzes/scoring.ts` — `scoreQuiz()` universal engine
- `packages/shared/src/quizzes/definitions/` — 22 Quiz-Objekte + ConversationAnalysis
- `packages/shared/src/quizzes/__tests__/scoring.test.ts` — Scoring-Tests

**Contribution → Ring-Pipeline (Modell A):**
- `src/lib/lme/types.ts` — `ContributionEvent`, `Marker`, `TraitScore`, `Tag` typed contract
- `src/components/quizzes/` (22 Komponenten) — shared props `{onComplete: (event: ContributionEvent) => void, onClose: () => void}`
- `src/components/quizzes/quiz-to-event.ts` — `loveLangToEvent()`, `kinkySeriesQuizToEvent()` etc. pro Quiz-Slug
- `src/hooks/useQuizContribution.ts` — `onComplete`-Handler: `eventToSectorSignals()` + `AFFINITY_MAP` → 12-Sektoren-Gewichte → Cluster-Gate → fire-and-forget `POST /api/contribute`
- `src/components/QuizOverlay.tsx` — Master-Router, `QUIZ_MAP` lazy-loaded
- `server.mjs` — `/api/contribute` Endpoint, upsert auf `contribution_events` per `(user_id, module_id)`
- `src/lib/fusion-ring/clusters.ts` — 6 Cluster-Definitionen (naturkind/mentalist/stratege/mystiker/kinky/partner_match)

**Cluster-Gate:**
- `src/hooks/useQuizContribution.ts` — ein Cluster wird erst persistiert wenn ALLE Quizzes im Cluster complete sind
- `src/__tests__/cluster-gate-enforcement.test.ts` — Enforcement-Tests

**Server-Side Transit-State-Pipeline (liest `contribution_events`):**
- `server.mjs :/api/transit-state/:userId` (line 1418ff.) — lädt `contribution_events`, POSTet `soulprint_sectors` + `quiz_sectors` an FuFirE `/transit/state`
- `src/hooks/useSignaturSignal.ts` — Frontend-Poller (800ms), `TransitStateSchema` Zod-parse
- `src/lib/schemas/transit-state.ts` — Contract

### code-karte: Signatur-Render (2D/3D)

**Top-Level Renderer:**
- `src/components/signatur-renderer/SignaturRenderer.tsx` — 2D/3D-Toggle, Suspense-Lazy-Loader für beide Canvases

**2D-Branch (Cymatics):**
- `src/components/signatur-cymatics/SignaturCymaticsCanvas.tsx` — Canvas2D Chladni-Renderer
- `src/components/signatur-cymatics/CymaticsFallback.tsx` — SVG-Fallback bei Canvas-Fail oder missing `chladniParams`
- `src/lib/cymatics/bazi-to-chladni.ts` — `baziToChladniParams()` Bridge (Pinyin-Stem-Support, `PLANET_FREQUENCIES`, `ELEMENT_COLORS`, `STEM_NAME_TO_INDEX`)

**3D-Branch (R3F Chladni-Sphäre):**
- `src/components/signatur-3d/SignatureSphere3D.tsx` — R3F Canvas, OrbitControls, vertex-colour Chladni-Knotenmuster auf Solid-Sphere, per-Planeten-Pol-Marker + Hover-Tooltips
- `src/lib/signatur-3d/sphere-chladni.ts` — `chladniDisplacement`, `computeChladniVertexColors`, `writeChladniVertexColors`, `chladniNodeIntensity`, `blendedPlanetColor`, `hexToNormalisedRgb`, `getPolePositions`, `getPolePairs`, `buildTrailPath`
- `src/lib/signatur-3d/planets.ts` — 10 Cousto-Planeten (name, name_de, symbol, baseFrequency, color, archetype_de/en, wuxing_element, dimension, poleIndex)
- `src/lib/signatur-3d/planet-tooltips.ts` — Hover-Tooltip Copy DE+EN + tier-threshold (dominant ≥0.6, aktiv ≥0.3, leise <0.3)
- `src/lib/signatur-3d/bazi-to-planets.ts` — `baziToPlanetWeights()` adapter BaZi+WuXing → 10 planet weights; `NEUTRAL_BAZI_WEIGHTS`

**Seite:**
- `src/pages/SignaturPage.tsx` — Composition, `SignaturRenderer` einbetten, `TransitSourceBadge` fallback-aware

**Transparenz-Badge (2026-04-23 Addition):**
- `src/components/signatur/TransitSourceBadge.tsx` — No-placeholder-fake Badge wenn `_meta.source !== 'live'`

### axiome re-gelesen (kritisch für Phase 1–9)

1. Immutable + Append-only → Phase 1 Schema `user_quiz_answers` ohne UPDATE/DELETE-Grant.
2. Cluster-Set wächst → `quiz_id` als text column, kein Enum-Constraint.
3. Rhythmus 1/2 pro Tag → Server-side rate-limit per `user_quiz_answers` count WHERE `completed_at >= user_local_midnight`.
4. Sofort sichtbar → Phase 8 optimistic UI, <500ms.
5. Maturation visuell → Fibonacci tier, keine Zahl.
6. Verstärker, kein eigener Ton → Kranz additiv, nicht Ring-ersetzend.
7. Zeitskalen-Trennung → Quiz und Membrane NICHT in derselben Schicht.
8. Element auf Antwort-Ebene → Phase 4 `AnswerOption.elementContrib[5]` zwingend.
9. Kranz ⊥ Sektor-Frequenz → beide Vektoren pro Answer, additive Aggregation unabhängig.
10. Agenten-Goldmine → `user_quiz_answers` direkt query-bar für Agent-APIs.
11. Neutral-Start → alle 5 Kranz-Segmente = 0 bei Account-Creation.
12. Paar-Signatur als Langfrist-Vektor → Schema JETZT nicht blockieren.

### remaining risks

- `CON-quiz-signatur-axiome`, 4 Sprint-B-REQs und 9 US-QSC-Slots existieren **auf Branch `chore/spec-sprint-b-preparation` (PR #301)**, nicht auf main. Wenn PR #301 nicht gemergt wird bevor Sprint-B-Phasen 1+ auf main landen, läuft das Scaffold leer — Requirements ohne Back-Referenz im Scaffold. Empfehlung: #301 vor Phase-1-Start mergen oder dieser Branch via rebase auf #301 draufsetzen.
- 22 Bestandsquizze tragen keine `elementContrib`-Vektoren (akzeptierter Produkt-Zustand per DEC-quiz-data-model-migration) — Kranz zeigt für Altdaten 0 bis zum Editorial-Backfill. Ehrliches Null-Display ist UX-Aufgabe in Phase 6/7, nicht Axiom-Bruch.

### confidence

**high** — Code-Karte vollständig, Axiome klar, Sprint-B-Scope via DEC + REQs + Plan eindeutig. Einzige Unsicherheit: PR #301 Merge-Timing (siehe Remaining Risks). Phase 1 (Types & Schemas) kann mit Annahme starten, dass #301 landet, oder defensive direkt gegen die Plan-doc + CON-Axiome kodieren.
