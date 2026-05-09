# Coherence data sources — audit (TASK-4.2)

**Date:** 2026-05-07
**Branch:** 2026-05-07-dashboard-stability-hotfixes
**HEAD at start of audit:** `40d3901`
**Scope:** Trace `baseCoherence`, `positiveDailyDelta`, `displayedCoherence` from rendering site to source.
**Method:** Read-only — no source files modified.

---

## Field-by-field chain

### `baseCoherence`

- **Render:** `src/components/dashboard/DailyChartHero.tsx:122` (numeric label inside ring) and `:304` (passed to `SplitCoherenceRing`)
  - Inner consumer: `SplitCoherenceRing` at `:73, :78, :85` (drives the gold baseline arc via `baseOffset`)
- **Local fallback:** `DailyChartHero.tsx:231` — `const base = baseCoherence ?? displayed;` (defaults to displayed when base is null but displayed is present — never observed in practice; server emits both together or both null)
- **Pass-through:** `src/components/Dashboard.tsx:378` (`baseCoherence={impactBaseCoherence}`)
- **Dashboard variable:** `Dashboard.tsx:269` — destructured from `useActiveImpacts()` as `impactBaseCoherence`
- **Hook:** `src/hooks/useActiveImpacts.ts:25` (interface), `:69` / `:83` / `:96` / `:132` (state assignments) — returns `baseCoherence: number | null`, sourced from `parsed.data.base_coherence ?? null`
- **Schema:** `src/lib/schemas/active-impacts.ts:30` — `base_coherence: z.number().min(0).max(100).optional()`
- **Server endpoint:** `POST /api/impact/active` — handler at `server.mjs:2198`
- **Server source:** `server.mjs:2151–2153` — computed locally on the Express server:
  ```
  baseCoherence = hasFusionData
    ? Math.min(100, Math.max(0, Math.round(baseHarmony * 100)))
    : null
  ```
  where `baseHarmony = profile.astro_json?.fusion?.harmony_index?.harmony_index` (0–1 float from FuFirE `/calculate/fusion`, persisted into Supabase `astro_profiles.astro_json`). When `fusion.harmony_index.harmony_index` is missing on the profile, `server.mjs:2104–2143` runs a **self-heal**: live-call FuFirE `/calculate/fusion` (via `fetchFusionForBirth`) and persist the result into `astro_json` fire-and-forget. If self-heal also fails, `hasFusionData = false` and `baseCoherence` becomes `null` (drives the "Derzeit nicht verfügbar" UI branch at `DailyChartHero.tsx:254`).

### `positiveDailyDelta`

- **Render:** `DailyChartHero.tsx:129` (`+{positiveDailyDelta}` label) and `:305` (passed to `SplitCoherenceRing` as `positiveDailyDelta`)
  - Inner consumer: `SplitCoherenceRing` at `:79, :95, :124` — gates the lighter delta-overlay arc behind `positiveDailyDelta > 0`
- **Local fallback:** `DailyChartHero.tsx:232` — `const delta = positiveDailyDelta ?? 0;`
- **Pass-through:** `Dashboard.tsx:379` (`positiveDailyDelta={impactPositiveDailyDelta}`)
- **Dashboard variable:** `Dashboard.tsx:270` — destructured from `useActiveImpacts()` as `impactPositiveDailyDelta`
- **Hook:** `useActiveImpacts.ts:26, :70, :84, :97, :133` — returns `positiveDailyDelta: number | null`, sourced from `parsed.data.positive_daily_delta ?? null`
- **Schema:** `active-impacts.ts:31` — `positive_daily_delta: z.number().min(0).max(100).optional()`
- **Server endpoint:** `POST /api/impact/active` (same handler)
- **Server source:** `server.mjs:2154–2158` — computed as a clamped solar-pressure-weighted activation:
  ```
  solarDelta = hasFusionData
    ? Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * sWeight * 100)))
    : null
  positiveDailyDelta = solarDelta
  ```
  where `solarPressure = spaceWeatherCache?.payload?.solar_pressure_score ?? 0` (NOAA SWPC aggregate from the 5-min `extendedSpaceWeatherCache`) and `sWeight = process.env.HARMONY_INDEX_SOLAR_WEIGHT ?? 0.35`. The `Math.min(100 - baseCoherence, …)` clamp is what guarantees `displayed_coherence ≤ 100`.

### `displayedCoherence`

- **Render:** `DailyChartHero.tsx:122` (`{displayedCoherence}` — the big number in the centre of the ring) and `:306` (passed to `SplitCoherenceRing` as `displayedCoherence`)
  - Inner consumer: `SplitCoherenceRing` at `:80, :86` — drives the lighter delta-overlay arc via `deltaOffset = circumference * (1 - displayedCoherence / 100)` (which fills _to_ the displayed total, not just the delta segment, then renders behind the gold base arc)
- **Local fallback:** `DailyChartHero.tsx:230` — `const displayed = displayedCoherence ?? (baseCoherence ?? 0);`
- **Unavailable gate:** `DailyChartHero.tsx:254` — `const isUnavailable = displayedCoherence == null && baseCoherence == null;`
- **Pass-through:** `Dashboard.tsx:380` (`displayedCoherence={impactDisplayedCoherence}`)
- **Dashboard variable:** `Dashboard.tsx:271` — destructured from `useActiveImpacts()` as `impactDisplayedCoherence`
- **Hook:** `useActiveImpacts.ts:27, :71, :85, :98, :134` — returns `displayedCoherence: number | null`, sourced from `parsed.data.displayed_coherence ?? null`
- **Schema:** `active-impacts.ts:32` — `displayed_coherence: z.number().min(0).max(100).optional()`
- **Server endpoint:** `POST /api/impact/active` (same handler)
- **Server source:** `server.mjs:2157` — `displayedCoherence = hasFusionData ? baseCoherence + solarDelta : null;`
  Computed server-side as `baseCoherence + positiveDailyDelta`. **Not** independently sourced — the server simply pre-adds the two siblings before sending the response so the client never has to.

---

## Single source of truth — verdict

**✅ Single source.** All three values flow through exactly one chain:

```
Supabase astro_profiles.astro_json.fusion.harmony_index.harmony_index   (natal harmony, 0–1)
                            +
NOAA SWPC solar_pressure_score (via extendedSpaceWeatherCache)
                            ↓
     server.mjs `computeActiveImpacts` (lines 2151–2158, single block)
                            ↓
            POST /api/impact/active (ACTIVE_IMPACTS_v1 schema)
                            ↓
            useActiveImpacts() — sessionStorage cache, 15-min TTL
                            ↓
            Dashboard.tsx → DailyChartHero → SplitCoherenceRing
```

There is no parallel client-side computation, no fallback path that derives any of the three fields differently, and no second hook that produces fields with the same names. The only client-side arithmetic is the null-coalesce defaults at `DailyChartHero.tsx:230–232`, which only kick in if the server returns one field but not the others (currently impossible — server always emits all three together or all three null).

`displayedCoherence` being `baseCoherence + positiveDailyDelta` is **structural, not divergent**: the addition happens once on the server (`server.mjs:2157`), the client trusts it. The schema even allows the three fields to be independent `0–100` integers — it does not enforce the additive invariant. That invariant is asserted only by the contract test `src/__tests__/contract-impact.test.ts:306–333` and by the production server code path. A mis-implementation in a future server version that broke `displayed = base + delta` would not be caught at runtime by the Zod schema.

`harmony_index` (a separate top-level field at `server.mjs:2160–2162`) is a backward-compat scalar that defaults to `displayedCoherence` when fusion data is present, and falls back to a different blended formula when it isn't. It is unrelated to the three coherence fields audited here — `DailyChartHero` does not consume it. (`Dashboard.tsx:268` does destructure `harmonyIndex: impactHarmonyIndex` from the same hook, but only uses it at `:377` to gate the loading state.)

---

## Findings

### F1 — Schema does not enforce the additive invariant

**What:** `ActiveImpactsSchema` validates each of `base_coherence`, `positive_daily_delta`, `displayed_coherence` independently as `[0, 100]` integers. Nothing rejects a payload where `displayed != base + delta`.

**Why it might matter:** If a future server change (or a stub/mock in tests) emits inconsistent values, the client will render a ring whose gold baseline arc and total displayed value disagree visually — base could be 80 with delta 5 but displayed shown as 30, and the ring would look broken without any error logged. The Zod safeParse at `useActiveImpacts.ts:120` would happily accept it.

**Suggested follow-up:** Add a `z.refine` to `ActiveImpactsSchema` enforcing `displayed_coherence === base_coherence + positive_daily_delta` when all three are present. Cost: ~3 lines of code, breaks no current production payloads (server always satisfies the invariant).

### F2 — Server-side null contract is implicit

**What:** When `hasFusionData = false`, the server emits `base_coherence = null`, `positive_daily_delta = null`, `displayed_coherence = null` (server.mjs:2151–2157). The schema marks all three as `.optional()` (interpreted as "may be omitted"), but the server actually sends explicit nulls.

**Why it might matter:** Zod's `.optional()` permits `undefined`, not `null`. The current `safeParse` succeeds because the JSON parse turns `null` into `null`, and the schema treats absent (no key) and `null` (key with null value) as both passing the optional check — but only because the schema is `z.number().min(0).max(100).optional()` _without_ `.nullable()`. **Verified at `contract-impact.test.ts:117–134`**: the test reads `parsed.base_coherence` after passing a payload without those fields (line 130), which confirms the optional-as-missing interpretation. The test does **not** cover the `null`-valued case the server actually emits. This is mostly fine in practice (`useActiveImpacts.ts:69` writes `cached?.base_coherence ?? null` so undefined/null both collapse to null), but a stricter Zod could break here.

**Suggested follow-up:** Either tighten the server to omit the keys when fusion is absent (cheaper), or change the schema to `.nullable().optional()` to match what the server emits (more honest). Either way, add a contract test for the null-fusion case.

### F3 — `harmonyIndex` and `displayed_coherence` overlap

**What:** Server emits both `harmony_index` (top-level, always a number) and `displayed_coherence` (optional). When fusion data is present, they hold the same value (`server.mjs:2160` — `displayedCoherence ?? …`). When fusion data is absent, `harmony_index` falls back to a different formula (`baseHarmony * 0.65 + solarPressure * sWeight`, with `baseHarmony = 0.5`), while `displayed_coherence` is null.

**Why it might matter:** Two consumers reading "the coherence" from the same response can get different answers in the unavailable state. `DailyChartHero` consumes the split fields and renders "Derzeit nicht verfügbar"; any other consumer reading `harmony_index` directly would get a synthetic 50 + solar-modulation value that misrepresents the user's actual signal absence. No such second consumer exists today (verified by grep — only `Dashboard.tsx:268` destructures `harmonyIndex` from the hook, and only uses it at line 377 to gate the loading state, not to display a number).

**Suggested follow-up:** Document the contract that `harmony_index` is a legacy backward-compat field and new consumers should read `displayed_coherence` (if present) or render an unavailable state. Consider deprecating `harmony_index` once no consumer reads it as a displayed number. Out of scope for the current sprint.

---

## Recommendations

These are suggestions for a future sprint — not decisions:

- **Add Zod refinement for the additive invariant** (F1). Lowest-effort hardening; would catch any future server regression at the runtime contract boundary instead of at the visual layer.
- **Decide between explicit-null and key-omission for fusion-absent state** (F2), then align server, schema, and contract tests. Currently the three sources of truth (server emits null, schema says optional, hook coalesces both) all happen to agree, but the alignment is accidental rather than designed.
- **No action required for the verdict itself.** The single-source-of-truth structure is clean. The three fields are computed in one block, on one server, from one Supabase row plus one cached NOAA payload. No client-side recomputation, no parallel hook, no divergent fallback.
