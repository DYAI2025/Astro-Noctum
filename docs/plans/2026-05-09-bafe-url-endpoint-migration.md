# S-1: BAFE URL + Endpoint Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Migrate Astro-Noctum's BAFE wiring from the legacy Vercel/Railway URL + `/chart`-Endpoint to the documented production Fly.io URL + `/v1/fusion` (or `/v1/experience/bootstrap`) endpoint set, so the onboarding chart calculation actually hits the production engine instead of a stale fallback host with non-existent routes.

**Architecture:** Two-phase rollout — Phase 1 swaps URL defaults across `.env.example`, `server.mjs`, `vite.config.ts`, CLAUDE.md without touching call shapes (zero functional risk). Phase 2 introduces a parallel `/v1/fusion`-based call path behind feature flag `bafe_v1_fusion_endpoint`, runs A/B against current `/chart` path until green, then deletes the legacy path.

**Tech Stack:** Node.js, Express (server.mjs), Vite, React 19/TypeScript (web), Vitest. Zero new dependencies.

**Source context:**
- Audit findings: `docs/2026-05-09-tageshoroskop-placeholder-audit.md` Cluster C (CRIT-4, CRIT-5, CRIT-WIR-6, CRIT-WIR-7, IMP-WIR-1).
- BAFE API Reference: external snapshot at `2-design/external-context/bafe-api-reference.md` in the Waitinglist.bazodiac.space repo, captured 2026-05-08.
- Reference truth: production BAFE = `https://bafe-2u0e2a.fly.dev` (Fly.io). Fallback `bafe-production.up.railway.app` (Railway, Signatur-App-only). NOT `bafe.vercel.app` (CLAUDE.md is stale).

---

## Pre-Flight: Live BAFE Verification (manual, before plan execution)

These steps require **you** to run from a shell with internet — Claude cannot reach the live engine. Capture outputs and paste them into a comment on the GitHub issue tracking S-1 (or save to `docs/plans/2026-05-09-bafe-verification-output.md`). Without this, Phase 2 cannot proceed because the response shape of `/v1/fusion` is unknown.

**Step 0.1: Health check both candidate hosts**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://bafe-2u0e2a.fly.dev/health
curl -s -o /dev/null -w "%{http_code}\n" https://bafe-production.up.railway.app/health
curl -s -o /dev/null -w "%{http_code}\n" https://bafe.vercel.app/health
```

**Expected:** Fly.io returns `200`. Railway may return `200` or `503` (fallback). Vercel may return `404` or DNS-fail (deprecated).

**Step 0.2: Confirm `/chart` is dead on Fly.io**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://bafe-2u0e2a.fly.dev/chart \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${BAFE_API_KEY}" \
  -d '{"local_datetime":"1990-07-04T12:00:00","tz":"Europe/Berlin","lon":13.405,"lat":52.52}'
```

**Expected:** `404` (or `405`). Confirms CRIT-WIR-6 / CRIT-5.

**Step 0.3: Capture `/v1/fusion` response shape**

```bash
curl -s -X POST https://bafe-2u0e2a.fly.dev/v1/fusion \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${BAFE_API_KEY}" \
  -d '{"local_datetime":"1990-07-04T12:00:00","tz":"Europe/Berlin","lon":13.405,"lat":52.52}' \
  | tee /tmp/bafe-v1-fusion-sample.json | jq 'keys'
```

**Expected:** JSON with at minimum `bazi`, `western`, `wuxing`, `fusion` top-level keys (mirroring current `/chart` semantics per the Reference snapshot Section 1.4). If the shape differs significantly, update Phase 2 mapper code accordingly.

**Step 0.4: Capture `/v1/experience/bootstrap` response shape**

```bash
curl -s -X POST https://bafe-2u0e2a.fly.dev/v1/experience/bootstrap \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${BAFE_API_KEY}" \
  -d '{"birth":{"date":"1990-07-04","time":"12:00:00","tz":"Europe/Berlin","lat":52.52,"lon":13.405,"place_label":"Berlin"},"locale":"de-DE"}' \
  | tee /tmp/bafe-bootstrap-sample.json | jq 'keys'
```

**Expected:** JSON with `profile`, `soulprint_sectors`, `signature_blueprint`, `meta`. If both endpoints work, **prefer `/v1/fusion` for the migration** because its shape is closer to current `/chart` consumers — `/v1/experience/bootstrap` is richer but requires Dashboard refactor.

**Step 0.5: Document decision**

Save to `docs/plans/2026-05-09-bafe-verification-output.md`:
- Status codes from 0.1
- `/chart` 404-confirmation from 0.2
- Top-level keys + nested `bazi.pillars` / `western.bodies` / `wuxing.from_planets` shapes from 0.3
- Top-level keys from 0.4
- Decision: `/v1/fusion` vs `/v1/experience/bootstrap`

**Halt-Gate:** if Step 0.3 shows that `/v1/fusion` is missing fields the current Dashboard relies on (e.g. `bazi.pillars.year.tier`, `wuxing.from_planets.Holz`), STOP and revisit the design. The plan below assumes `/v1/fusion` matches `/chart`'s consumer surface.

---

## Phase 1: URL Swap (no functional change)

Six bite-sized tasks. All in one branch `S-1-bafe-url-migration`. Tests must stay 1947/1948 green throughout. Each task = one commit.

### Task 1: Bump `.env.example` default

**Files:**
- Modify: `.env.example` (line 5: `VITE_BAFE_BASE_URL`)

**Step 1.1: Read current line**

```bash
grep -n "BAFE_BASE_URL\|BAFE_INTERNAL_URL" .env.example
```

Confirm line ~5 reads: `VITE_BAFE_BASE_URL="https://bafe-production.up.railway.app"`.

**Step 1.2: Edit**

Use Edit tool — change `https://bafe-production.up.railway.app` → `https://bafe-2u0e2a.fly.dev` in the value of `VITE_BAFE_BASE_URL`. Keep the surrounding comments unchanged. Update the comment block at line 4-5 to add: `# Updated 2026-05-09 from Railway fallback to Fly.io production per BAFE API Reference`.

**Step 1.3: Verify nothing else changed**

```bash
git diff .env.example
```

Expected: 1-2 line change, only the URL value + comment.

**Step 1.4: Commit**

```bash
git add .env.example
git commit -m "$(cat <<'EOF'
fix(env): point default BAFE_BASE_URL at Fly.io production (S-1 Task 1)

Migrates VITE_BAFE_BASE_URL default from Railway fallback to the
canonical Fly.io production host per the 2026-05-08 BAFE API Reference
snapshot. No functional change yet — server.mjs / vite.config.ts still
hold their own Railway defaults; those are addressed in Tasks 2 + 3.

Audit: docs/2026-05-09-tageshoroskop-placeholder-audit.md (CRIT-4 / IMP-WIR-1).
EOF
)"
```

### Task 2: Bump `server.mjs` URL fallbacks

**Files:**
- Modify: `server.mjs` lines 401-403, 1507-1508, 1858-1859 (three identical fallback blocks)

**Step 2.1: Read all three blocks**

```bash
grep -n "bafe-production.up.railway.app" server.mjs
```

Confirm exactly 3 hits (or note if more, from CSP whitelist line 298 — that one stays for now).

**Step 2.2: Edit all three to `https://bafe-2u0e2a.fly.dev`**

Use `Edit` tool with `replace_all: true` if the literal string is unique. If multiple hits include the CSP line (line 298), use targeted `Edit` with surrounding context per occurrence to avoid touching CSP.

**Step 2.3: Update CSP whitelist (line 298)**

Add `https://bafe-2u0e2a.fly.dev` to the `connectSrc` array. Keep `https://bafe-production.up.railway.app` AND `https://bafe.vercel.app` in the list temporarily — they get removed in Phase 2 cleanup once the new endpoint is verified live. Order: put Fly.io first.

**Step 2.4: Run server-affecting tests**

```bash
npx vitest run src/__tests__/middleware-ordering.test.ts src/__tests__/bafe-determinism.test.ts
```

**Expected:** Both pass. If `bafe-determinism.test.ts` mocks the URL via env, it should still pass because the test passes its own URL via env.

**Step 2.5: Commit**

```bash
git add server.mjs
git commit -m "$(cat <<'EOF'
fix(server): point default BAFE host at Fly.io production (S-1 Task 2)

Updates the three BAFE_PUBLIC_URL fallback blocks in server.mjs from
Railway to Fly.io. CSP connectSrc gains Fly.io; Railway and Vercel
hosts stay temporarily until Phase 2 cleanup confirms no production
traffic flows to them.

Still no functional /chart→/v1/fusion change — that's Phase 2.

Audit: CRIT-4 / IMP-WIR-1.
EOF
)"
```

### Task 3: Bump `vite.config.ts` proxy targets

**Files:**
- Modify: `vite.config.ts` lines 22, 28 (two `target:` lines)

**Step 3.1: Read**

```bash
grep -n "bafe-production\|target:" vite.config.ts | head -10
```

**Step 3.2: Edit both `target:` defaults**

Change `'https://bafe-production.up.railway.app'` → `'https://bafe-2u0e2a.fly.dev'` on lines 22 and 28. The `env.VITE_BAFE_BASE_URL || ...`-fallback semantics stay intact.

**Step 3.3: Smoke-test dev server**

```bash
npm run dev &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
kill %1
```

**Expected:** `200`. Vite serves the SPA. (We're NOT testing the proxy yet — that's wider integration work for Phase 2.)

**Step 3.4: Commit**

```bash
git add vite.config.ts
git commit -m "$(cat <<'EOF'
fix(vite): proxy default to Fly.io BAFE host (S-1 Task 3)

vite.config.ts proxy targets for /api/calculate and /api/chart now
default to the Fly.io BAFE host instead of Railway. env.VITE_BAFE_BASE_URL
override semantics unchanged.

Audit: CRIT-4 / IMP-WIR-1.
EOF
)"
```

### Task 4: Update CLAUDE.md to reflect Fly.io reality

**Files:**
- Modify: `CLAUDE.md` (search for `bafe.vercel.app` and `bafe-production.up.railway.app`)

**Step 4.1: Find every BAFE-URL mention**

```bash
grep -n "bafe.vercel.app\|bafe-production.up.railway.app\|bafe-2u0e2a" CLAUDE.md
```

**Step 4.2: Update the "External Dependencies" section**

Replace `Default: \`https://bafe.vercel.app\`` → `Default: \`https://bafe-2u0e2a.fly.dev\` (Fly.io production per BAFE API Reference 2026-05-08; Railway \`bafe-production.up.railway.app\` retained as Signatur-App fallback only).`

**Step 4.3: Update Deployment section**

Find the section describing "BAFE routing with fallback from Railway internal networking (IPv6, often unreliable) to public URL". Update to clarify Fly.io is canonical, Railway is legacy fallback.

**Step 4.4: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): update CLAUDE.md to reflect Fly.io as canonical BAFE host (S-1 Task 4)

CLAUDE.md previously listed bafe.vercel.app as the default BAFE host —
that entry has been stale since BAFE migrated to Fly.io. Updated
External Dependencies + Deployment sections to reference
bafe-2u0e2a.fly.dev as canonical, Railway as legacy fallback.

Audit: CRIT-4 / IMP-WIR-1.
EOF
)"
```

### Task 5: Phase 1 verification — full test suite

**Files:** none modified.

**Step 5.1: Run full suite**

```bash
npm run test 2>&1 | tail -20
```

**Expected:** 1947 pass, 1 pre-existing fail (`vibes-perf.test.ts` 401-shape-check, unrelated per CLAUDE.md), 0 new fails. Total runtime ~30-60s.

**Step 5.2: Lint**

```bash
npm run lint
```

**Expected:** 0 errors, 0 warnings beyond pre-existing.

**Step 5.3: Verify the only diff is URL changes**

```bash
git log --oneline main..HEAD
```

**Expected:** 4 commits, all S-1 Phase 1.

If anything goes red, STOP and surface to Ben — Phase 1 is supposed to be zero functional impact.

---

## Phase 2: Endpoint Migration (`/chart` → `/v1/fusion`)

This phase touches behavior. **Do not start until Phase 1 is green AND Pre-Flight Step 0.5 has been completed and committed.** The endpoint mapping below assumes `/v1/fusion` returns the consumer surface documented in BAFE API Reference Section 1.4. If actual response shape differs (Step 0.3), revise mapper code accordingly.

### Task 6: Write contract tests for new `/v1/fusion` mapper (RED)

**Files:**
- Create: `src/__tests__/api-v1-fusion-mapping.test.ts`

**Step 6.1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { mapV1FusionToApiResults } from '../services/api';

// Sample shape captured from /tmp/bafe-v1-fusion-sample.json in Pre-Flight Step 0.3.
// PASTE the actual structure here once captured. Below is the EXPECTED shape
// per BAFE API Reference Section 1.4 — adjust to reality.
const SAMPLE_V1_FUSION_RESPONSE = {
  bazi: {
    pillars: {
      year:  { stamm: "Geng", zweig: "Wu",  tier: "Pferd", element: "Metall" },
      month: { stamm: "Ren",  zweig: "Wu",  tier: "Pferd", element: "Wasser" },
      day:   { stamm: "Geng", zweig: "Wu",  tier: "Pferd", element: "Metall" },
      hour:  { stamm: "Ren",  zweig: "Wu",  tier: "Pferd", element: "Wasser" },
    },
    chinese: { day_master: "Geng", year: { animal: "Pferd" } },
  },
  western: {
    bodies: [
      { name: "Sun",  sign_index: 3,  longitude_deg: 102.3 },
      { name: "Moon", sign_index: 1,  longitude_deg: 45.7  },
    ],
    angles: { Ascendant: 192.5 },
    houses: { "1": 192.5, "2": 220.1 },
  },
  wuxing: {
    wu_xing_vector: { Holz: 0.18, Feuer: 0.24, Erde: 0.20, Metall: 0.22, Wasser: 0.16 },
    dominant_element: "Feuer",
    harmony_index: 0.7342,
  },
  fusion: { /* whatever is returned */ },
};

describe('/v1/fusion → ApiResults mapping', () => {
  it('maps Sun sign from sign_index correctly', () => {
    const result = mapV1FusionToApiResults(SAMPLE_V1_FUSION_RESPONSE as any);
    expect(result.western.zodiac_sign).toBe('Cancer');  // index 3 = Cancer
  });

  it('maps Moon sign from sign_index correctly', () => {
    const result = mapV1FusionToApiResults(SAMPLE_V1_FUSION_RESPONSE as any);
    expect(result.western.moon_sign).toBe('Taurus');  // index 1 = Taurus
  });

  it('maps Ascendant from degrees', () => {
    const result = mapV1FusionToApiResults(SAMPLE_V1_FUSION_RESPONSE as any);
    expect(result.western.ascendant_sign).toBe('Libra');  // 192.5° = Libra
  });

  it('maps BaZi day_master', () => {
    const result = mapV1FusionToApiResults(SAMPLE_V1_FUSION_RESPONSE as any);
    expect(result.bazi.day_master).toBe('Geng');
  });

  it('maps BaZi zodiac_sign from year.animal', () => {
    const result = mapV1FusionToApiResults(SAMPLE_V1_FUSION_RESPONSE as any);
    expect(result.bazi.zodiac_sign).toBe('Pferd');
  });

  it('maps Wu-Xing dominant_element from German to English', () => {
    const result = mapV1FusionToApiResults(SAMPLE_V1_FUSION_RESPONSE as any);
    expect(result.wuxing.dominant_element).toBe('Fire');
  });

  it('exposes elements with both German and English keys', () => {
    const result = mapV1FusionToApiResults(SAMPLE_V1_FUSION_RESPONSE as any);
    expect(result.wuxing.elements.Wood).toBeCloseTo(0.18);
    expect(result.wuxing.elements.Holz).toBeCloseTo(0.18);
  });

  it('throws BAFE_SCHEMA_MISMATCH when bazi.pillars is missing', () => {
    expect(() => mapV1FusionToApiResults({ bazi: {} } as any))
      .toThrow(/BAFE_SCHEMA_MISMATCH/);
  });
});
```

**Step 6.2: Run to verify it fails**

```bash
npx vitest run src/__tests__/api-v1-fusion-mapping.test.ts
```

**Expected:** All 8 tests fail with `mapV1FusionToApiResults is not a function`.

**Step 6.3: Commit RED state**

```bash
git add src/__tests__/api-v1-fusion-mapping.test.ts
git commit -m "test(api): add /v1/fusion mapping contract tests (RED) (S-1 Task 6)"
```

### Task 7: Implement `mapV1FusionToApiResults` (GREEN)

**Files:**
- Modify: `src/services/api.ts` (add new exported function near `mapChartToApiResults` at line ~406)

**Step 7.1: Implement the mapper**

Append to `src/services/api.ts` (before the final closing of the module). Reuse existing helpers `signFromIndex`, `signFromDegrees`, `signFromBody`, `normalizeBodies`, `resolveDominantElement`. The function body is structurally similar to existing `mapChartToApiResults` but **must throw `BAFE_SCHEMA_MISMATCH` instead of silently filling defaults** when required fields are missing — this is the Cluster G fail-loud preview. Full implementation:

```typescript
export class BafeSchemaMismatchError extends Error {
  constructor(public readonly missingField: string, public readonly received?: unknown) {
    super(`BAFE_SCHEMA_MISMATCH: missing field "${missingField}" in /v1/fusion response`);
    this.name = 'BafeSchemaMismatchError';
  }
}

export function mapV1FusionToApiResults(
  raw: V1FusionResponse,
): Omit<ApiResults, 'issues' | '_reading_id'> {
  if (!raw?.bazi?.pillars) throw new BafeSchemaMismatchError('bazi.pillars', raw?.bazi);
  if (!raw?.western) throw new BafeSchemaMismatchError('western', raw);
  if (!raw?.wuxing?.wu_xing_vector) throw new BafeSchemaMismatchError('wuxing.wu_xing_vector', raw?.wuxing);

  // Reuse existing mappers — see mapChartToApiResults for the pattern.
  const mapPillar = (p: BafePillarRaw | undefined): MappedPillar => ({
    stem:    p?.stamm   ?? (p as any)?.stem   ?? '',
    branch:  p?.zweig   ?? (p as any)?.branch ?? '',
    animal:  p?.tier    ?? (p as any)?.animal ?? '',
    element: p?.element ?? '',
  });

  const bazi: MappedBazi = {
    ...raw.bazi,
    pillars: {
      year:  mapPillar(raw.bazi.pillars.year),
      month: mapPillar(raw.bazi.pillars.month),
      day:   mapPillar(raw.bazi.pillars.day),
      hour:  mapPillar(raw.bazi.pillars.hour),
    },
    day_master:
      (raw.bazi as any).day_master ??
      raw.bazi.chinese?.day_master ??
      raw.bazi.pillars.day?.stamm ??
      (raw.bazi.pillars.day as any)?.stem ??
      '',
    zodiac_sign:
      (raw.bazi as any).zodiac_sign ??
      raw.bazi.chinese?.year?.animal ??
      (raw.bazi.pillars.year as any)?.animal ??
      raw.bazi.pillars.year?.tier ??
      '',
  };

  const bodiesSource = normalizeBodies(raw.western.bodies);
  if (!bodiesSource) throw new BafeSchemaMismatchError('western.bodies', raw.western);

  const sunSign       = signFromBody(bodiesSource.Sun);
  const moonSign      = signFromBody(bodiesSource.Moon);
  const ascendantSign = signFromDegrees(raw.western.angles?.Ascendant);

  const western: MappedWestern = {
    ...raw.western,
    bodies:         bodiesSource,
    angles:         raw.western.angles,
    zodiac_sign:    sunSign,
    moon_sign:      moonSign,
    ascendant_sign: ascendantSign,
    houses:         normalizeHousesFromV1Fusion(raw.western.houses),
  };

  const vec = raw.wuxing.wu_xing_vector;
  const wuxing: MappedWuxing = {
    ...raw.wuxing,
    elements: {
      Wood:   vec.Holz   ?? vec.Wood   ?? 0,
      Fire:   vec.Feuer  ?? vec.Fire   ?? 0,
      Earth:  vec.Erde   ?? vec.Earth  ?? 0,
      Metal:  vec.Metall ?? vec.Metal  ?? 0,
      Water:  vec.Wasser ?? vec.Water  ?? 0,
      Holz:   vec.Holz   ?? vec.Wood   ?? 0,
      Feuer:  vec.Feuer  ?? vec.Fire   ?? 0,
      Erde:   vec.Erde   ?? vec.Earth  ?? 0,
      Metall: vec.Metall ?? vec.Metal  ?? 0,
      Wasser: vec.Wasser ?? vec.Water  ?? 0,
    },
    dominant_element: resolveDominantElement(raw.wuxing as Record<string, unknown>),
  };

  const fusion: BafeFusionResponse = raw.fusion ?? {};
  const tst: BafeTstResponse = (raw as any).time_scales ?? {};

  return { bazi, western, wuxing, fusion, tst };
}

function normalizeHousesFromV1Fusion(houses: unknown): Record<string, string> {
  if (!houses || typeof houses !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, deg] of Object.entries(houses as Record<string, unknown>)) {
    if (typeof deg === 'number') out[key] = signFromDegrees(deg) ?? '';
    else if (typeof deg === 'string') out[key] = deg;
  }
  return out;
}
```

Type `V1FusionResponse` goes into `src/types/bafe.ts` — define as `Partial<ChartResponse>` initially; tighten once Step 0.3 captures the actual shape.

**Step 7.2: Run the contract tests**

```bash
npx vitest run src/__tests__/api-v1-fusion-mapping.test.ts
```

**Expected:** All 8 tests pass.

**Step 7.3: Run lint + full suite**

```bash
npm run lint && npm run test 2>&1 | tail -5
```

**Expected:** 1947+8 = 1955 pass (modulo pre-existing fail), 0 new fails.

**Step 7.4: Commit GREEN state**

```bash
git add src/services/api.ts src/types/bafe.ts
git commit -m "feat(api): add mapV1FusionToApiResults + BafeSchemaMismatchError (GREEN) (S-1 Task 7)"
```

### Task 8: Wire `/api/chart-v2` proxy in server.mjs

**Files:**
- Modify: `server.mjs` (add new route alongside existing `/api/chart` at line ~690)

**Step 8.1: Add the new route**

```js
// ── /v1/fusion (S-1 Phase 2) ───────────────────────────────────────
// Parallel path to /api/chart while migration is feature-flagged.
// Targets BAFE Fly.io /v1/fusion directly; emits BAFE_ENDPOINT_MISSING
// (502) if the upstream returns 404.
app.post('/api/chart-v2', requireUserAuth, async (req, res) => {
  const upstream = `${BAFE_BASE_URL}/v1/fusion`;
  try {
    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: bafeDirectHeaders(),
      body: JSON.stringify(req.body),
    });
    if (upstreamRes.status === 404) {
      return res.status(502).json({
        error: 'BAFE_ENDPOINT_MISSING',
        upstream,
        status: 404,
      });
    }
    if (!upstreamRes.ok) {
      const text = await upstreamRes.text().catch(() => '');
      return res.status(502).json({
        error: 'BAFE_UPSTREAM_ERROR',
        upstream,
        status: upstreamRes.status,
        detail: text.slice(0, 500),
      });
    }
    const body = await upstreamRes.json();
    // Forward X-Request-ID for client-side correlation (CRIT-WIR-7 preview).
    const requestId = upstreamRes.headers.get('X-Request-ID');
    if (requestId) res.setHeader('X-BAFE-Request-Id', requestId);
    res.json(body);
  } catch (err) {
    res.status(502).json({
      error: 'BAFE_NETWORK_ERROR',
      upstream,
      message: (err as Error).message,
    });
  }
});
```

**Step 8.2: Run server-side route tests**

```bash
npx vitest run src/__tests__/middleware-ordering.test.ts src/__tests__/contract-experience.test.ts
```

**Expected:** Pass.

**Step 8.3: Commit**

```bash
git add server.mjs
git commit -m "feat(server): add /api/chart-v2 → BAFE /v1/fusion proxy (S-1 Task 8)"
```

### Task 9: Add Vite proxy for `/api/chart-v2`

**Files:**
- Modify: `vite.config.ts` (add new entry next to `/api/chart` at line ~67)

**Step 9.1: Add proxy entry**

```ts
'/api/chart-v2': {
  target: 'http://localhost:3001',
  changeOrigin: false,
},
```

**Step 9.2: Commit**

```bash
git add vite.config.ts
git commit -m "fix(vite): proxy /api/chart-v2 to local Express in dev (S-1 Task 9)"
```

### Task 10: Add feature flag `bafe_v1_fusion_endpoint`

**Files:**
- Modify: `src/lib/feature-flags.ts` (add new flag, default `false`)

**Step 10.1: Read current flag file**

```bash
grep -n "FEATURE_FLAGS\|signature_engine_v2" src/lib/feature-flags.ts | head
```

**Step 10.2: Add the flag**

In the `FEATURE_FLAGS` object (or equivalent), add:

```typescript
bafe_v1_fusion_endpoint: false,  // S-1: enables /api/chart-v2 (BAFE /v1/fusion) instead of /api/chart
```

Update the `FeatureFlagKey` union type to include `'bafe_v1_fusion_endpoint'`.

**Step 10.3: Commit**

```bash
git add src/lib/feature-flags.ts
git commit -m "feat(flags): add bafe_v1_fusion_endpoint flag (default false) (S-1 Task 10)"
```

### Task 11: Branch `calculateAll()` on the flag

**Files:**
- Modify: `src/services/api.ts` (modify `calculateAll` to branch)

**Step 11.1: Modify `calculateAll`**

Inside `calculateAll(data: BirthData)` near line 538 — wrap the existing `/api/chart` POST in a branch:

```typescript
import { isFeatureEnabled } from '../lib/feature-flags';

// ... inside calculateAll:
const useV1Fusion = isFeatureEnabled('bafe_v1_fusion_endpoint');
const endpoint = useV1Fusion ? '/api/chart-v2' : '/api/chart';
const payload = useV1Fusion
  ? buildV1FusionPayload(data)   // see helper below
  : buildLegacyChartPayload(data);

const res = await fetchWithTimeout(`${BASE_URL}${endpoint.replace('/api', '')}`, {
  method: 'POST',
  headers,
  body: JSON.stringify(payload),
});
// ... existing handling, then mapping branches:
const raw = await res.json();
const mapped = useV1Fusion
  ? mapV1FusionToApiResults(raw)
  : mapChartToApiResults(raw);
return { ...mapped, issues: [] };
```

Add the two helper functions `buildV1FusionPayload` and `buildLegacyChartPayload` at the top of the module — extract from the existing inline payload construction.

**Step 11.2: Add a test that flips the flag and asserts the right endpoint is hit**

```typescript
// src/__tests__/api-v1-fusion-flag.test.ts
import { describe, it, expect, vi } from 'vitest';
import { calculateAll } from '../services/api';
import * as flags from '../lib/feature-flags';

describe('calculateAll endpoint routing', () => {
  it('hits /api/chart when flag is off', async () => {
    vi.spyOn(flags, 'isFeatureEnabled').mockReturnValue(false);
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ bazi: { pillars: { year: {}, month: {}, day: {}, hour: {} } }, western: {}, wuxing: {} }), { status: 200 }),
    );
    await calculateAll({ date: '1990-07-04T12:00:00', tz: 'Europe/Berlin', lat: 52.52, lon: 13.405 });
    expect(fetchSpy.mock.calls[0][0]).toMatch(/\/api\/chart$/);
  });

  it('hits /api/chart-v2 when flag is on', async () => {
    vi.spyOn(flags, 'isFeatureEnabled').mockReturnValue(true);
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ bazi: { pillars: { year: {}, month: {}, day: {}, hour: {} } }, western: { bodies: [] }, wuxing: { wu_xing_vector: {} } }), { status: 200 }),
    );
    await calculateAll({ date: '1990-07-04T12:00:00', tz: 'Europe/Berlin', lat: 52.52, lon: 13.405 });
    expect(fetchSpy.mock.calls[0][0]).toMatch(/\/api\/chart-v2$/);
  });
});
```

**Step 11.3: Run all tests**

```bash
npm run test 2>&1 | tail -5
```

**Expected:** Pass count increased by 2; pre-existing fails unchanged.

**Step 11.4: Commit**

```bash
git add src/services/api.ts src/__tests__/api-v1-fusion-flag.test.ts
git commit -m "feat(api): branch calculateAll on bafe_v1_fusion_endpoint flag (S-1 Task 11)"
```

### Task 12: Manual A/B verification + flag flip

**Files:** none modified initially.

**Step 12.1: Local manual smoke (flag OFF)**

```bash
npm run dev &
sleep 5
# In browser at http://localhost:3000, complete onboarding with real birth data.
# Watch network tab — should see POST /api/chart succeed.
kill %1
```

**Step 12.2: Local manual smoke (flag ON)**

```bash
# In browser console:
# localStorage.setItem('ff_bafe_v1_fusion_endpoint', 'true')
# Reload, retry onboarding.
# Network tab should show POST /api/chart-v2 succeed; Dashboard renders the same chart.
```

**Step 12.3: If both succeed AND chart values match between v1 and v2**

Set `bafe_v1_fusion_endpoint: true` as the new default in `src/lib/feature-flags.ts`. Commit:

```bash
git add src/lib/feature-flags.ts
git commit -m "feat(flags): flip bafe_v1_fusion_endpoint to ON by default (S-1 Task 12)"
```

**Step 12.4: If chart values DIFFER between v1 and v2**

STOP. Surface the diff to Ben — Step 0.3 missed a schema mismatch. Investigate `mapV1FusionToApiResults` against actual `/tmp/bafe-v1-fusion-sample.json` and patch.

### Task 13: Cleanup — delete legacy `/chart` path

**Only after Task 12 has been live for ≥48h with no rollback.**

**Files:**
- Modify: `src/services/api.ts` (remove `useV1Fusion` branch; inline v1 path)
- Modify: `server.mjs` (remove `/api/chart` route + `bafeFallbackUrls('/chart')` helper if unused)
- Modify: `vite.config.ts` (remove `/api/chart` proxy entry, keep `/api/chart-v2` or rename to `/api/chart`)
- Modify: `src/lib/feature-flags.ts` (remove the flag)
- Modify: CLAUDE.md (remove `/chart` from External Dependencies routes list)
- Optionally: rename `/api/chart-v2` → `/api/chart` for cleanliness in a follow-up commit.

Each delete = one commit with message `chore: remove legacy /chart path now that /v1/fusion is default (S-1 Task 13.x)`.

Run `npm run test` after each delete; fail-loud if anything regresses.

---

## Out of scope (deferred to other sprints)

- **`/api/experience/{bootstrap,signature-delta,daily}` proxies** — they also call `/chart` legacy. Cluster D / S-3 territory.
- **Removing `bafe.vercel.app` and `bafe-production.up.railway.app` from CSP whitelist** — defer to S-3 or post-Task-13.
- **Replacing `bafeDirectHeaders()` with strict `^ff_pro_`-Tier validation** — CRIT-WIR-7, S-3.
- **Introducing `ApiError` class with `code` discriminator across all callers** — Cluster G, S-3.

S-1 is intentionally narrow: kill the URL ambiguity and the `/chart` 404-risk on the onboarding path. Everything else stays untouched until S-3.

---

## Summary

| Phase | Tasks | Commits | Risk | Tests |
|---|---|---|---|---|
| Pre-Flight | 0.1–0.5 (manual verification) | 0 (plus 1 doc commit) | Read-only | n/a |
| Phase 1: URL swap | 1–5 | 5 | Zero functional impact | full suite green |
| Phase 2: Endpoint migration | 6–13 | 8 | Behind feature flag, A/B verified | +10 new tests |

**Total: 13 commits, ~10 new tests, 0 dependencies added, 0 production code deleted until 48h-stable.**
