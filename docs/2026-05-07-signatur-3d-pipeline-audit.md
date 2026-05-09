# 3D Signatur pipeline audit — chladniParams data flow + DE/EN risk (TASK-2.1)

**Date:** 2026-05-07
**Branch:** `2026-05-07-dashboard-3d-anchor`
**Scope:** Trace `chladniParams` from `SignaturPage` → `SignaturRenderer` → `bazi-to-chladni.ts` to assess whether Wu-Xing DE/EN key drift causes a meaningful fraction of users to see the Water-default sphere.
**Pre-req:** HOTFIX-A landed (commit `40d3901`) — page no longer crashes; this audit is the secondary investigation.
**Method:** Code-inspection only. Supabase prod data not checked (per task scope).

---

## Pipeline trace

The 3D Signatur visualization is fed by a four-stage pipeline. All file:line references are `HEAD` of `2026-05-07-dashboard-3d-anchor`.

### Stage 1 — BAFE → `apiData` (mapping)

`src/services/api.ts:354-388` (`calculateWuxing`) and `src/services/api.ts:485-518` (the unified `/chart` mapper) both normalize the BAFE response. BAFE returns `wu_xing_vector` with **German keys** (`Holz/Feuer/Erde/Metall/Wasser`). Both mappers explicitly write **both German and English keys** into `MappedWuxing.elements`:

```ts
elements: {
  Wood:  vec.Holz   ?? vec.Wood  ?? 0,
  Fire:  vec.Feuer  ?? vec.Fire  ?? 0,
  Earth: vec.Erde   ?? vec.Earth ?? 0,
  Metal: vec.Metall ?? vec.Metal ?? 0,
  Water: vec.Wasser ?? vec.Water ?? 0,
  // …and German keys preserved for downstream lookup:
  Holz, Feuer, Erde, Metall, Wasser,
}
```

So `apiData.wuxing.elements` is a 10-key dict (5 EN + 5 DE) with identical values under both spellings.

`dominant_element` (a separate top-level field) is normalized via `resolveDominantElement()` (`src/services/api.ts:125-141`) which contains an explicit DE→EN lookup table — but **this field is not consumed by `baziToChladniParams()`** (see Stage 3).

### Stage 2 — `SignaturPage` derives `chladniParams`

`src/pages/SignaturPage.tsx:115-122`:

```ts
const chladniParams = useMemo(() => {
  const pillars = apiData?.bazi?.pillars;
  const wuxingWeights = apiData?.wuxing?.elements;   // 10-key DE+EN dict
  if (!pillars || !wuxingWeights) return undefined;
  const rawHarmony = apiData?.wuxing?.['harmony_index'];
  const harmonyIndex = Number.isFinite(rawHarmony as number) ? (rawHarmony as number) : 0.5;
  return baziToChladniParams(pillars, wuxingWeights, harmonyIndex);
}, [apiData?.bazi?.pillars, apiData?.wuxing]);
```

Guard: returns `undefined` only when `pillars` OR `wuxingWeights` is missing. For any user who completed onboarding successfully, both are present (BAFE `/chart` throws if `wuxing` is missing — `api.ts:416-418`).

### Stage 3 — `baziToChladniParams` resolves the dominant element

`src/lib/cymatics/bazi-to-chladni.ts:158-181`. The function is **defensively bilingual**:

- `dominantElementFromWeights()` (line 74-98) iterates first over `CANONICAL_WUXING_ELEMENTS` (`'Wood', 'Fire', 'Earth', 'Metal', 'Water'`), then a second pass uses `normalizeWuxingElementKey()` (line 51-72) which accepts **both German and English** spellings (`'feuer' → 'Fire'`, `'holz' → 'Wood'`, etc., case-insensitive after `.trim().toLowerCase()`).

Stem-name lookup (`STEM_NAME_TO_INDEX`, line 119-143) is also bilingual: accepts both Chinese characters (`'甲', '乙'…`) and Pinyin (`'jia', 'yi'…`), case-insensitive via the `Proxy`.

**Conclusion:** `baziToChladniParams` cannot be defeated by DE/EN key drift on `wuxingWeights`. Even if the mapper somehow only emitted German keys, the second loop in `dominantElementFromWeights` would still find the max and return the canonical English `WuxingElement`.

### Stage 4 — `SignaturRenderer` consumes `chladniParams`

`src/components/signatur-renderer/SignaturRenderer.tsx:109-124`:

```tsx
{chladniParams ? (
  <SignatureSphere3D
    weights={effectivePlanetWeights}
    dominantElement={chladniParams.dominantElement}
    …
  />
) : (
  <CymaticsFallback planetariumMode={planetariumMode} className="h-full w-full" />
)}
```

`CymaticsFallback` defaults `dominantElement = 'Water'` (`src/components/signatur-cymatics/CymaticsFallback.tsx:18`). This is the suspected "everyone-sees-Water-sphere" failure mode — but it only triggers when `chladniParams` itself is `undefined`, which per Stage 2 only happens when BAFE data is incomplete.

---

## Wu-Xing key shape

| Layer | Key shape on the wire |
|------|------------------------|
| BAFE response (`raw.wu_xing_vector`) | German: `Holz / Feuer / Erde / Metall / Wasser` |
| BAFE response (`raw.dominant_element`) | German per latest BAFE schema (e.g. `"Feuer"`) — sometimes empty string |
| `services/api.ts` mapper | Emits **both** EN and DE keys into `MappedWuxing.elements`; `dominant_element` is normalized DE→EN via `resolveDominantElement` |
| `MappedWuxing.elements` (passed to `baziToChladniParams`) | 10-key dict (EN + DE, identical values) |
| `baziToChladniParams` input expectation | Tolerant — accepts EN, DE, or both; uses `normalizeWuxingElementKey` |
| `ChladniParams.dominantElement` (output) | Canonical English `'Wood'/'Fire'/'Earth'/'Metal'/'Water'` |

Dictionary keys recognized by `normalizeWuxingElementKey()`: `wood/holz, fire/feuer, earth/erde, metal/metall, water/wasser` (case-insensitive).

---

## Failure modes

For each path that could produce `undefined chladniParams` and trigger the Water-default `CymaticsFallback`:

| # | Trigger | Likelihood for typical user | Visible result |
|---|---------|----------------------------|----------------|
| F1 | `apiData` is `null` (initial render before `useAstroProfile` resolves) | Transient (sub-second) on every page load | Loading overlay then sphere — not the persistent symptom |
| F2 | `apiData.bazi.pillars` missing | Only if BAFE `/chart` succeeded but bazi block was empty — `api.ts` doesn't throw on this, but in practice always present when BAFE returns 200 | Water-default sphere |
| F3 | `apiData.wuxing.elements` missing | `/chart` throws if `raw.wuxing` is missing entirely (`api.ts:416-418`); partial wuxing without `wu_xing_vector` would still build `elements: {Wood: 0, Fire: 0, …}` (zeros — not missing) | Water-default sphere — but only if mapper short-circuits, which it doesn't |
| F4 | All weights are 0 (zero-element profile) | Possible but should never happen for real birth data | Sphere renders, but `dominantElementFromWeights` returns the loop's first match — **the seed value `'Water'` (line 75)**, biasing zero-data profiles to Water |
| F5 | Wu-Xing DE/EN drift in `wuxingWeights` | **Impossible** given current mapper (always writes both) and the `normalizeWuxingElementKey` second-pass loop | n/a |

---

## Verdict

✅ **Pipeline is robust.** The DE/EN key drift hypothesis is **not** the cause of users seeing the Water-default sphere. The mapper at `services/api.ts:373-385` writes both German and English keys into `elements`, and `baziToChladniParams` itself is bilingual via `normalizeWuxingElementKey` — so even in the hypothetical scenario where the mapper only emitted German keys, the function would still resolve the dominant element correctly.

The user-reported symptom "User findet die Kugel nicht" is, after HOTFIX-A, primarily explained by:

1. **F1 (transient loading)** — sphere appears after `useAstroProfile` resolves, but the perceived "missing sphere" may be the brief loading overlay window.
2. **F4 (zero-weights edge case)** — a profile with all-zero `elements` produces `'Water'` because `dominantElementFromWeights` initializes `best = 'Water'` (line 75) and never updates if all values tie at `Number.NEGATIVE_INFINITY`. This is rare but worth flagging.
3. **Genuine "no birth data" users** — falls cleanly to `CymaticsFallback` (Water), which is the intended behavior.

The most surprising finding: the codebase has **defense-in-depth** for DE/EN drift that pre-empts the very bug the audit was looking for. Both the `services/api.ts` mapper AND the `baziToChladniParams` function independently handle bilingual input. The `normalizeWuxingElementKey` switch (line 51-72) reads like a battle-scar from prior schema instability.

---

## Recommendations (for a separate fix-track per brief Hinweis #8)

**No action needed for DE/EN drift.** The pipeline is already overengineered against this exact failure mode.

Two minor observations that could be hardened, but are NOT urgent:

1. **F4 cosmetic improvement (`bazi-to-chladni.ts:74-98`):** The `best = 'Water'` initial value silently biases zero-weight profiles to a Water sphere. Consider initializing to `'Earth'` (more visually neutral, matches `NEUTRAL_PREVIEW.dominantElement`) or returning `null` for the caller to handle. Effort: 1 line. Impact: cosmetic only — affects the rare zero-weight case.

2. **`harmony_index` is read via dynamic key access (`SignaturPage.tsx:119`):** The field is not on the `MappedWuxing` type, so this will silently fall back to `0.5` even if BAFE adds the field later. If BAFE emits `harmony_index` today, we're missing it. Worth a 5-minute check against a real BAFE response, but won't change the Water-vs-coloured-sphere question.

**Recommendation: do NOT spawn a fix-track sprint.** The DE/EN risk hypothesis is refuted; the hotfix queue can stay focused on more impactful items.

---

## Production data (optional)

Not checked — code-inspection-only audit. Supabase MCP access is available (toolset visible in this environment) but per task scope ("Don't run a query without confirming the connection — just note in the doc whether the data is present") and the verdict reached purely from code, a SQL probe would not change the conclusion.

If a future session wants to corroborate empirically, the relevant queries on `astro_profiles` would be:

- Count rows where `astro_json->'wuxing'->>'dominant_element'` is empty/null (would estimate F4 prevalence).
- Count rows where `astro_json->'wuxing'->'elements'` has all-zero values (would estimate F4 directly).

Both are read-only and safe.
