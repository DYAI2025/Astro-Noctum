# Sprint S-DASH-SIGNATUR-GAPS — PO Report

**Status:** Code complete 2026-04-21 · awaiting PR merge + HALT-Gate visual review
**Branch:** `2026-04-20-dashboard-signatur-gaps`
**Goal:** [GOAL-dashboard-signatur-hygiene](../1-objectives/goals/GOAL-dashboard-signatur-hygiene.md) (Approved, Must-have)
**Plan:** `docs/plans/2026-04-20-dashboard-signatur-gaps.md`
**Constraint observed:** [CON-quiz-signatur-axiome](../1-objectives/constraints/CON-quiz-signatur-axiome.md) (inherited — Quiz→Signatur coupling explicitly deferred)

---

## phase

Dashboard-Hygiene-Sprint + 3D-Signatur-Upgrade. Elf Plan-Phasen plus vier out-of-band Feature-Additions und zwei Hotfixes abgeschlossen. Kohärenz-Index liest jetzt den korrekten nested path (pre-sprint carry-over), Dashboard ist auf `coherence-first` reduziert (VibesSection + CosmicInfluence-Duplikat + BigFour-Freestanding-Stack entfernt, Identity-Pills in `NatalSignaturStatic` gewandert, zentrierte `Tagesimpuls`-Headline mit echtem Daily-Horoscope-Text, Shared `ActiveImpactsList`). Space-Weather-Tile zeigt nach dem NOAA-Endpoint-Fix wieder reale Werte. Rate-Limit-Fix verhindert 429 direkt nach Registrierung. 3D-Signatur ist jetzt user-interaktiv (drag-to-rotate) und zeigt das Chladni-Knotenmuster als glühende Filamente auf der Oberfläche mit Hover-Tooltips pro Planeten-Pol.

## Sprint-Scope & Shipped

| # | Commit | Phase / Scope |
|---|--------|---------------|
|  1 | `17ace9e` | Sprint start |
|  2 | `43dfeef` | Phase 1 — Dynamischer Kohärenz-Subtitel (delta-direction: erhöht / gedämpft / neutral) |
|  3 | `8087e33` | Phase 2 — "Tagesfeld"-Pill aus Driver-Strip entfernt |
|  4 | `d1ba8e4` | Phase 3 — Radix Tooltip am Kohärenzring (canonical text from `KOHAERENZ_INDEX.md`) |
|  5 | `c2dda1f` | Phase 4 — Shared `ActiveImpactsList` (compact + full variants) — Dashboard spiegelt Signatur-Page |
|  6 | `ed5e4d4` | Phase 5 — Zentrierte `Tagesimpuls`-Headline + echter `dailyData.fusion.synthesis` + "vertiefen →" Link |
|  7 | `8a0fe28` | Dev-proxy: `/api/chart` → `localhost:3001` (fehlende Vite-Proxy-Regel) |
|  8 | `c5d799c` | `npm run dev:all` (Vite + Express in einem Command via `scripts/dev.sh`) |
|  9 | `a6f62ff` | Phase 6 — VibesSection + VibesModal + `format-cooldown` Helper entfernt (-455 Zeilen) |
| 10 | `d1244fd` | Phase 7 — BigFour → `IdentityPill`-Strip in `NatalSignaturStatic` (-304 netto) |
| 11 | `8bfbed9` | Phase 8 — Duplicate `CosmicInfluenceSection` unter Sky entfernt (-488 Zeilen) |
| 12 | `9ba8737` | Phase 11 — Quiz→Signatur Coupling als deferred doc |
| 13 | `a3c8505` | Phase 9 — **Bug**: NOAA-Endpoint-Drift. `/json/goes_{xray,proton}_flux.json` 404 → `/json/goes/primary/*`; sunspotNumber war nie assigned. Jetzt live xray-class B, proton 0.19, ssn 85.9, f107 130.66. |
| 14 | `975f9ea` | Phase 10 — 3D-Defect-Report (4 Hypothesen, no code fix at this point) |
| 15 | `41c791d` | **Hotfix**: IdentityPill TS2741 (Copilot-Suggestion auf `9df8b04` fügte `id: string` als required ein, Call-Sites hatten es nicht) |
| 16 | `7d1a010` | **Bug**: 429 direkt nach Registrierung. apiLimiter `max: 100/15min` → `max: 2000/15min` + skip für GET auf `/api/transit-state/` + `/api/space-weather`. |
| 17 | `e0300f8` | feat(3D) — 4 frequency-responsive Stellschrauben (Displacement 0.18→0.30, Trail-Threshold 0.35→0.15, Kp-multiplied morph clock, pole-glow ∝ weight) |
| 18 | `b66d428` | feat(3D) — Hover-Tooltips pro Planeten-Pol (DE+EN Archetyp + Influence + Weight-Tier) |
| 19 | `f40eef2` | feat(3D) — drei `<OrbitControls>` Drag-to-rotate + Chladni-Knotenmuster als Vertex-Colors auf der Solid-Sphere + Displacement revert 0.30→0.12 |
| 20 | `4e5f962` | Sprint Changelog-Addendum |
| 21 | (current) | archetype_en in `planets.ts` + PoleTooltip nutzt Sprach-Switch + dieser Report |

**Phase-Abdeckung:** 0–11 alle Done. HALT-Gate #1 (post Phase 3) + HALT-Gate #2 (post Phase 5) wurden in parallelen Sessions abgenommen; Gates #3 (post Phase 8 — kumulativ), #4 (post Phase 9 — Real-Data-Tile), #5 (post Phase 10 — 3D-Review) bleiben bis zum Browser-Review durch Ben offen.

---

## verification

### typecheck
- `npm run typecheck:src` — **passed**, 0 errors in `src/`
- `npx tsc --noEmit` (Monorepo) — **passed**, 0 errors

### tests
- `npx vitest run` — **1947 / 1948 passed**, 1 pre-existing failure
- Pre-existing failure: `src/__tests__/vibes-perf.test.ts` > "response has expected shape" — `/api/vibes` returns `401 Authentication required` ohne Auth-Mock; reproduziert auf `c5d799c` vor Sprint-Start. Nicht durch Sprint-A verursacht.

### new tests added
- `src/__tests__/natal-signatur-static.identity.test.tsx` (4 Tests) — Identity-Strip rendert korrekt bei full / partial / missing data; renders nur wenn accordion expanded.
- `src/components/signatur-3d/__tests__/SignatureSphere3D.test.tsx` — Mocks erweitert um `BufferAttribute`, `setAttribute`, `OrbitControls`, `useLanguage`. Alle 10 Smoke-Tests bleiben grün nach den 3D-Änderungen.

### manual verification (local, pre-prod)
- `npm run dev:all` bestätigt saubere Startup auf `:3000` + `:3001`.
- `curl http://localhost:3001/api/space-weather/extended` — liefert reale NOAA-Daten (xray class B, proton 0.19, ssn 85.9, f107 130.66) nach dem NOAA-Fix.
- 429-Reproduktion nicht mehr auslösbar bei lokaler Registrierung + Dashboard-Polling.

### remaining manual gates (PO-side)
- **HALT-Gate #3** — kumulativer Dashboard-Review (Phasen 1–8 visuell auf prod)
- **HALT-Gate #4** — Cosmic-Weather-Tile zeigt Real-Data auf prod (nach Railway-Deploy)
- **HALT-Gate #5** — 3D Signatur: Drag rotiert, Oberfläche zeigt Chladni-Knotenlinien, Tooltips auf Pol-Hover

---

## remaining risks

- **Phase-10 Defect — H2 (neutral weights), H4 (WebGL init fail)** bleiben offen. Heutige 3D-Arbeit adressiert H1 (default-2D-misread — Cursor-Rotation + Surface-Pattern machen 3D self-explanatory) und H3 (static SVG fallback — Vertex-Color-Muster ersetzt den "tote SVG"-Eindruck). Explicit "3D nicht verfügbar"-Message für H4 noch nicht geshipped.
- **Phase-10 Acceptance-Criteria** aus dem Defect-Report sind weitgehend erfüllt (rotierbar ✅, beleuchtet ✅, planet-coded Pole ✅, weight-driven delta ✅, kein silent degrade ⚠ H4 teilweise offen). Formale Abnahme durch Ben im Browser steht aus.
- **Kp=0 aktuell real** (quiet sun). Kp-responsive Morph-Tempo lässt sich lokal nicht vollständig visuell verifizieren, bis nächster geomagnetic storm. Math + Tests decken das ab.
- **Mobile (`apps/mobile`)** wurde in diesem Sprint nicht angefasst — `useVibes`-Hook + `/api/vibes`-Endpoint bleiben für mobile intakt, aber die mobile Signatur nutzt V2 oder einen eigenen Renderer und wurde nicht auf die neue 2D-Cymatics+3D-Sphere-Doppelspur portiert. Separater Sprint nötig.
- **ElevenLabs Dashboard** hat 5 Tool-URLs, die laut User noch auf Superglue zeigen (`get_user_astro_profile`, `get_daily_horoskop`, `save_conversation_levi`, `save_conversation_eve`, `Agent_eve`). Korrekte Railway-Routes wurden an den PO geliefert, Dashboard-Update ist manueller Schritt.
- **Pre-existing `vibes-perf.test.ts` failure** — nicht durch diesen Sprint verursacht, aber sichtbar in CI. Sollte separat in einem Test-Hygiene-Sprint behoben werden (Auth-Mock hinzufügen oder Endpoint-Path umstellen).

## dependencies unblocked by this sprint

- **Sprint B — Quiz→Signatur Coupling v1** ist jetzt startbar. Der heutige 3D-Oberflächen-Pattern-Foundation (`computeChladniVertexColors` + `writeChladniVertexColors` + `blendedPlanetColor`) ist direkt wiederverwendbar für die Visualisierung des Quiz-Deltas (dominantes Quiz-Dimension verschiebt den Color-Blend + die Knoten-Intensität).
- **ElevenLabs URL-Update** auf prod blockiert nichts in Sprint B.

## confidence

**high** auf den Code-Pfaden. Die drei Bug-Fixes (nested path pre-sprint, NOAA drift, rate-limit) sind reproduzierbar und durch automatisierte Tests + Live-Curl verifiziert. Die 3D-Feature-Additions sind visuell gesichtet lokal (Drag + Tooltip + Vertex-Pattern) und testtechnisch durch die Mocks abgedeckt. **medium** auf der vollständigen Prod-Abnahme — HALT-Gates #3/#4/#5 brauchen Ben's Auge, weil der Wechsel von "funktional korrekt" zu "visuell akzeptabel" Judgment ist, und der Kp=0-Fall die Morph-Modulation heute nicht live zeigen kann.
