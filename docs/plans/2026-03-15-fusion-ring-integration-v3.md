# Fusion Ring Integration v3 — End-to-End Data Pipeline

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect the Signatur (Fusion Ring) canvas to real user data — from quiz completion through Supabase persistence, server proxy to FuFirE, all the way to dynamic ring rendering.

**Architecture:** Three vertical slices executed sequentially: (1) Canvas accepts real user signal data instead of hardcoded `SOUL_PROFILE`, (2) Server proxy rewired from broken GET to correct POST against FuFirE `/transit/state`, (3) Quiz contributions persisted to Supabase and fed into the transit pipeline. Each slice is independently testable and deployable.

**Tech Stack:** React 19, TypeScript, Canvas 2D (WebGL), Express (server.mjs), Supabase (Postgres + RLS), Zod schemas, Vitest

---

## Current State Summary

| Component | Status | Problem |
|-----------|--------|---------|
| `FusionRingWebsiteCanvas` | Hardcoded `SOUL_PROFILE[32]` | Every user sees identical ring |
| `FusionRing3D` → Canvas | `signalData` fetched but never passed | Data flows to a dead end |
| `GET /api/transit-state/:userId` | Calls non-existent BAFE endpoints | Always falls back to synthetic data |
| `POST /api/contribute` | Does not exist | No way to persist quiz results |
| `QuizOverlay` | Defined but never mounted | `onComplete` callback goes nowhere |
| `contribution_events` table | Schema exists in SQL | No API writes to it |

## Slice 1: Canvas Accepts Real Signal Data

### Task 1: Add `soulProfile` prop to FusionRingWebsiteCanvas

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx:1678-1686`

**Step 1: Extend the props interface**

```typescript
// src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx:1678
interface FusionRingWebsiteCanvasProps {
  queuedEffect?: { id: string; type: string } | null;
  showEffectControls?: boolean;
  className?: string;
  soulProfile?: number[] | null; // 12 sector values [0..1]
}
```

**Step 2: Build effectiveSoulProfile inside the wrapper**

Replace the wrapper function at line 1684:

```typescript
export function FusionRingWebsiteCanvas({ soulProfile }: FusionRingWebsiteCanvasProps) {
  const effectiveProfile = useMemo(() => {
    if (soulProfile && soulProfile.length === 12) {
      return Array.from({ length: 32 }, (_, i) => {
        const t = (i / 32) * 12;
        const i0 = Math.floor(t) % 12;
        const i1 = (i0 + 1) % 12;
        const frac = t - Math.floor(t);
        const s = frac * frac * (3 - 2 * frac); // smoothstep
        return (soulProfile[i0] ?? 0.5) * (1 - s) + (soulProfile[i1] ?? 0.5) * s;
      });
    }
    return null; // use built-in SOUL_PROFILE
  }, [soulProfile]);

  return <FusionRingCanvasInner soulProfileOverride={effectiveProfile} />;
}
```

**Step 3: Thread the override into FusionRingCanvasInner**

`FusionRingCanvasInner` (line 1690) needs to accept `soulProfileOverride: number[] | null` as a prop. Store it in a ref so the WebGL draw loop can read it without causing re-init:

```typescript
function FusionRingCanvasInner({ soulProfileOverride }: { soulProfileOverride?: number[] | null }) {
  // ... existing state ...
  const soulProfileRef = useRef<number[] | null>(null);

  useEffect(() => {
    soulProfileRef.current = soulProfileOverride ?? null;
  }, [soulProfileOverride]);
  // ... rest unchanged ...
```

**Step 4: Make `soulNoise()` read from the ref**

The `soulNoise` function (line 51) currently reads from the top-level `SOUL_PROFILE` constant. It needs to read from `soulProfileRef.current` when available, falling back to `SOUL_PROFILE`.

The draw loop that calls `soulNoise` is inside `FusionRingCanvasInner`'s `useEffect` setup (the WebGL init). Since `soulNoise` is a module-level function, the cleanest approach is to pass the profile array into it:

```typescript
// Change soulNoise signature:
function soulNoise(angle: number, seed: number, profile: number[]): number {
  const idx = ((angle / (Math.PI * 2)) * profile.length) % profile.length;
  const i0 = Math.floor(idx) % profile.length;
  const i1 = (i0 + 1) % profile.length;
  const frac = idx - Math.floor(idx);
  const t = frac * frac * (3 - 2 * frac);
  const v0 = profile[i0] ?? 0.5;
  const v1 = profile[i1] ?? 0.5;
  return (v0 * (1 - t) + v1 * t) * seed;
}
```

Then every call site passes `soulProfileRef.current ?? SOUL_PROFILE`.

**Step 5: Verify TypeScript compiles**

Run: `npm run lint`
Expected: No new errors.

**Step 6: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx
git commit -m "feat: accept soulProfile prop in FusionRingWebsiteCanvas"
```

---

### Task 2: Pass signalData from FusionRing3D to Canvas

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx:101-105`

**Step 1: Pass baseSignals as soulProfile**

```typescript
// src/components/fusion-ring-3d/FusionRing3D.tsx:101-105
<FusionRingWebsiteCanvas
  queuedEffect={queuedEffect}
  showEffectControls={isInteractive && !!import.meta.env.DEV}
  className="h-full w-full"
  soulProfile={signalData?.baseSignals ?? null}
/>
```

**Step 2: Verify TypeScript compiles**

Run: `npm run lint`
Expected: No new errors.

**Step 3: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "feat: wire signalData.baseSignals into FusionRing canvas"
```

---

## Slice 2: Fix Transit State Server Proxy

### Task 3: Rewrite GET /api/transit-state to POST to FuFirE

**Files:**
- Modify: `server.mjs:403-547`
- Test: Manual curl verification

**Step 1: Add helper functions above the route handler**

Add `deriveSoulprintSectors()` and `mergeContributions()` utility functions. These extract from existing `fallbackStateFromProfile` logic (lines 419-453) and the `contribution_events` table respectively.

```javascript
// server.mjs — add above the transit-state route (before line 403)

/** Derive 12 soulprint sectors from astro_profiles.astro_json */
function deriveSoulprintSectors(astroJson, userId) {
  const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
  const wuxing = astroJson?.wuxing ?? {};
  const rawElements = Object.values(
    wuxing?.element_percentages || wuxing?.balance || {},
  )
    .map((v) => { const n = Number(v); return Number.isFinite(n) ? clamp01(n > 1 ? n / 100 : n) : null; })
    .filter((v) => v != null);

  if (rawElements.length > 0) {
    return Array.from({ length: 12 }, (_, i) => rawElements[i % rawElements.length]);
  }
  // Stable hash-based fallback
  const hashToUnit = (seed) => {
    const hex = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8);
    return (parseInt(hex, 16) % 1000) / 1000;
  };
  return Array.from({ length: 12 }, (_, i) =>
    0.25 + hashToUnit(`${userId}:soulprint:${i}`) * 0.5
  );
}

/** Merge contribution_events sector_weights into a single 12-element average */
function mergeContributions(contribs) {
  if (!contribs?.length) return Array(12).fill(0.5);
  const sum = Array(12).fill(0);
  let count = 0;
  for (const c of contribs) {
    const weights = c.payload?.sector_weights;
    if (!Array.isArray(weights) || weights.length !== 12) continue;
    for (let i = 0; i < 12; i++) sum[i] += Number(weights[i]) || 0;
    count++;
  }
  if (count === 0) return Array(12).fill(0.5);
  return sum.map((v) => Math.max(0, Math.min(1, v / count)));
}

/** Map FuFirE event format to Astro-Noctum TransitEvent schema */
function mapFufireEvent(ev, generatedAt) {
  return {
    id: `${ev.type || 'event'}:${ev.sector ?? 0}:${generatedAt}`,
    type: ev.type || 'resonance_jump',
    sector: ev.sector ?? 0,
    delta: [0.4, 0.25, 0.15, 0.1][Math.min((ev.priority || 1) - 1, 3)] ?? 0.1,
    trigger_planet: ev.trigger_planet || '',
    trigger_symbol: '',
    sector_domain: '',
    timestamp: Date.parse(generatedAt) || Date.now(),
  };
}
```

**Step 2: Rewrite the route handler**

Replace the entire `app.get("/api/transit-state/:userId", ...)` handler (lines 407-547). Keep the `fallbackStateFromProfile` function (lines 419-453) as the fallback path. The new handler:

1. Loads astro_profile from Supabase
2. Loads contribution_events from Supabase
3. POSTs to FuFirE `/transit/state` with `soulprint_sectors` + `quiz_sectors`
4. Maps FuFirE response to client schema (adds `soulprint`, `resolution`, maps events)
5. Falls back to `fallbackStateFromProfile` on any error

```javascript
app.get("/api/transit-state/:userId", async (req, res) => {
  const userId = String(req.params.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  res.set("Cache-Control", "no-store");

  // Keep existing fallback logic inline
  const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const hashToUnit = (seed) => {
    const hex = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 8);
    return (parseInt(hex, 16) % 1000) / 1000;
  };

  const fallbackStateFromProfile = (uid, profile) => {
    const soulprint = deriveSoulprintSectors(profile?.astro_json, uid);
    const ring = soulprint.map((v, i) => {
      const drift = (hashToUnit(`${uid}:drift:${i}`) - 0.5) * 0.12;
      return clamp01(v + drift);
    });
    return {
      ring: { sectors: ring },
      soulprint: { sectors: soulprint },
      transit_contribution: { transit_intensity: 0.35 },
      delta: { vs_30day_avg: { avg_sectors: soulprint } },
      events: [],
      resolution: 33,
    };
  };

  const respondWithFallback = async (reason) => {
    let profile = null;
    if (supabaseServer) {
      const { data } = await supabaseServer
        .from("astro_profiles")
        .select("user_id, sun_sign, moon_sign, astro_json")
        .eq("user_id", userId)
        .single();
      profile = data;
    }
    console.warn("[transit-state] fallback:", reason);
    return res
      .status(200)
      .set("X-Transit-Fallback", profile ? "profile-derived" : "neutral")
      .json(fallbackStateFromProfile(userId, profile));
  };

  try {
    if (!supabaseServer) {
      return respondWithFallback("no supabase");
    }

    // Step 1: Load user profile
    const { data: profile } = await supabaseServer
      .from("astro_profiles")
      .select("user_id, sun_sign, moon_sign, astro_json")
      .eq("user_id", userId)
      .single();

    const soulprintSectors = deriveSoulprintSectors(profile?.astro_json, userId);

    // Step 2: Load quiz contributions
    const { data: contribs } = await supabaseServer
      .from("contribution_events")
      .select("payload")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const quizSectors = mergeContributions(contribs ?? []);

    // Step 3: POST to FuFirE
    const bafePrimaryUrl = process.env.BAFE_INTERNAL_URL
      || process.env.VITE_BAFE_BASE_URL
      || "https://bafe-production.up.railway.app";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const fufireRes = await fetch(`${bafePrimaryUrl}/transit/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        soulprint_sectors: soulprintSectors,
        quiz_sectors: quizSectors,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!fufireRes.ok) {
      return respondWithFallback(`FuFirE ${fufireRes.status}`);
    }

    const fufireData = await fufireRes.json();

    // Step 4: Map response to client schema
    const generatedAt = fufireData.generated_at || new Date().toISOString();
    const resolution = Math.min(100, 33 + (contribs?.length ?? 0) * 4);

    const response = {
      ring: fufireData.ring ?? { sectors: soulprintSectors },
      soulprint: { sectors: soulprintSectors },
      transit_contribution: {
        transit_intensity: fufireData.transit_contribution?.transit_intensity ?? 0.35,
      },
      delta: {
        vs_30day_avg: {
          avg_sectors: fufireData.delta?.vs_30day_avg?.avg_sectors ?? soulprintSectors,
        },
      },
      events: (fufireData.events ?? []).map((ev) => mapFufireEvent(ev, generatedAt)),
      resolution,
    };

    return res.status(200).json(response);
  } catch (err) {
    return respondWithFallback(err?.message || "unexpected error");
  }
});
```

**Step 3: Verify build**

Run: `npm run build`
Expected: No errors. `server.mjs` is plain ESM, not compiled by Vite, but the build confirms nothing else broke.

**Step 4: Test with curl**

```bash
# Terminal 1: PORT=3001 node server.mjs
# Terminal 2:
curl -s http://localhost:3001/api/transit-state/test-user-id | jq '.ring.sectors | length'
# Expected: 12
curl -s http://localhost:3001/api/transit-state/test-user-id | jq '.soulprint.sectors | length'
# Expected: 12
```

**Step 5: Commit**

```bash
git add server.mjs
git commit -m "feat: rewrite transit-state proxy to POST to FuFirE /transit/state"
```

---

## Slice 3: Quiz Contribution Pipeline

### Task 4: Add POST /api/contribute endpoint

**Files:**
- Modify: `server.mjs` (add new route after the transit-state handler)
- Modify: `vite.config.ts` (add proxy entry for dev)

**Step 1: Add the endpoint to server.mjs**

```javascript
// server.mjs — add after the transit-state handler

app.post("/api/contribute", express.json(), async (req, res) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  // Verify auth
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Missing authorization" });
  }

  const { data: { user }, error: authErr } = await supabaseServer.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { source, sector_weights, confidence } = req.body;

  // Validate
  if (typeof source !== "string" || !source) {
    return res.status(400).json({ error: "Missing source" });
  }
  if (!Array.isArray(sector_weights) || sector_weights.length !== 12) {
    return res.status(400).json({ error: "sector_weights must be number[12]" });
  }
  if (sector_weights.some((v) => typeof v !== "number" || v < 0 || v > 1)) {
    return res.status(400).json({ error: "sector_weights values must be [0..1]" });
  }

  const eventId = `${source}:${user.id}:${Date.now()}`;

  const { error: insertErr } = await supabaseServer
    .from("contribution_events")
    .upsert({
      user_id: user.id,
      event_id: eventId,
      module_id: source,
      occurred_at: new Date().toISOString(),
      payload: {
        sector_weights,
        confidence: typeof confidence === "number" ? Math.max(0, Math.min(1, confidence)) : 0.7,
      },
    }, {
      onConflict: "user_id,module_id",
    });

  if (insertErr) {
    console.error("[contribute] insert error:", insertErr.message);
    return res.status(500).json({ error: "Failed to save contribution" });
  }

  return res.status(201).json({ ok: true });
});
```

**Step 2: Add Vite proxy for dev**

```typescript
// vite.config.ts — add inside the proxy object:
'/api/contribute': {
  target: 'http://localhost:3001',
  changeOrigin: true,
},
```

**Step 3: Verify build**

Run: `npm run lint && npm run build`

**Step 4: Commit**

```bash
git add server.mjs vite.config.ts
git commit -m "feat: add POST /api/contribute endpoint for quiz sector weights"
```

---

### Task 5: Create client-side contribute service

**Files:**
- Create: `src/services/contribute.ts`

**Step 1: Write the service**

```typescript
// src/services/contribute.ts
import { supabase } from '@/src/lib/supabase';

/**
 * Fire-and-forget: persist quiz sector weights to Supabase via server proxy.
 * Never throws — logs errors silently. Must not block user flow.
 */
export async function contributeQuizResult(
  source: string,
  sectorWeights: number[],
  confidence = 0.7,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.warn('[contribute] no session, skipping');
      return;
    }

    const res = await fetch('/api/contribute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        source,
        sector_weights: sectorWeights,
        confidence,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[contribute] failed:', res.status, body);
    }
  } catch (err) {
    console.warn('[contribute] network error:', (err as Error).message);
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/services/contribute.ts
git commit -m "feat: add contributeQuizResult client service"
```

---

### Task 6: Wire QuizOverlay onComplete to persist contributions

**Files:**
- Modify: `src/components/QuizOverlay.tsx` (no changes needed — it already passes `onComplete` through)
- Create or modify: The parent that mounts `QuizOverlay` — this is where the `onComplete` handler needs to call `contributeQuizResult`

**Important context:** `QuizOverlay` is currently orphaned — not imported by any component. The mounting and `onComplete` handler need to be added wherever the quiz system is launched (likely `Dashboard.tsx` or a page component). This task focuses only on creating the handler logic; mounting QuizOverlay is a separate UI task.

**Step 1: Create a reusable hook for quiz completion handling**

```typescript
// src/hooks/useQuizContribution.ts
import { useCallback } from 'react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';
import { contributeQuizResult } from '@/src/services/contribute';
import { findClusterForModule, isClusterComplete } from '@/src/lib/fusion-ring/clusters';

/**
 * Returns a handler for quiz onComplete that:
 * 1. Converts ContributionEvent → sector weights via AFFINITY_MAP
 * 2. Checks cluster completion gate
 * 3. POSTs to /api/contribute (fire-and-forget)
 *
 * @param completedModuleIds - Set of already-completed module IDs for this user
 */
export function useQuizContribution(completedModuleIds: Set<string>) {
  return useCallback((event: ContributionEvent) => {
    const moduleId = event.source?.moduleId;
    if (!moduleId) return;

    const sectorWeights = eventToSectorSignals(event);
    if (!sectorWeights || sectorWeights.length !== 12) return;

    // Check cluster gate — only contribute if entire cluster is complete
    const cluster = findClusterForModule(moduleId);
    if (cluster) {
      const updatedCompleted = new Set(completedModuleIds);
      updatedCompleted.add(moduleId);
      if (!isClusterComplete(cluster, updatedCompleted)) {
        console.log('[quiz] cluster incomplete, deferring contribution');
        return;
      }
    }

    // Fire and forget — never blocks UI
    void contributeQuizResult(moduleId, sectorWeights, 0.75);
  }, [completedModuleIds]);
}
```

**Step 2: Verify `eventToSectorSignals` exists and works**

Check: `src/lib/fusion-ring/test-signal.ts` should export `eventToSectorSignals`. If it doesn't exist, check `quiz-to-event.ts` for the equivalent function and adjust the import.

**Step 3: Verify TypeScript compiles**

Run: `npm run lint`

**Step 4: Commit**

```bash
git add src/hooks/useQuizContribution.ts
git commit -m "feat: add useQuizContribution hook with cluster gate"
```

---

### Task 7: Write tests for the contribution pipeline

**Files:**
- Create: `src/__tests__/contribute-pipeline.test.ts`

**Step 1: Test deriveSoulprintSectors (server logic, tested via exported-like logic)**

Since `server.mjs` is plain ESM and can't easily be imported in Vitest, test the equivalent TypeScript logic:

```typescript
// src/__tests__/contribute-pipeline.test.ts
import { describe, it, expect } from 'vitest';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';
import { findClusterForModule, isClusterComplete } from '@/src/lib/fusion-ring/clusters';
import type { ContributionEvent } from '@/src/lib/lme/types';

describe('Contribution Pipeline', () => {
  describe('eventToSectorSignals', () => {
    it('returns 12-element array from a valid ContributionEvent', () => {
      // Create a minimal ContributionEvent with markers
      const event: ContributionEvent = {
        schema: 'sp.contribution.v1',
        source: { moduleId: 'quiz.krafttier.v1', label: 'Krafttier' },
        occurredAt: new Date().toISOString(),
        markers: [{ id: 'marker.instinct.fight_or_flight', weight: 0.8 }],
        tags: [],
      };
      const result = eventToSectorSignals(event);
      expect(result).toHaveLength(12);
      result.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Cluster gate', () => {
    it('returns false for incomplete kinky cluster', () => {
      const cluster = findClusterForModule('quiz.kinky_01.v1');
      expect(cluster).not.toBeNull();
      const completed = new Set(['quiz.kinky_01.v1', 'quiz.kinky_02.v1']);
      expect(isClusterComplete(cluster!, completed)).toBe(false);
    });

    it('returns true when all kinky modules are complete', () => {
      const cluster = findClusterForModule('quiz.kinky_01.v1');
      expect(cluster).not.toBeNull();
      const completed = new Set(cluster!.quizModuleIds);
      expect(isClusterComplete(cluster!, completed)).toBe(true);
    });

    it('returns null for unknown module', () => {
      expect(findClusterForModule('quiz.nonexistent.v1')).toBeNull();
    });
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/__tests__/contribute-pipeline.test.ts`
Expected: All pass.

**Step 3: Commit**

```bash
git add src/__tests__/contribute-pipeline.test.ts
git commit -m "test: add contribution pipeline and cluster gate tests"
```

---

## Dependency Graph

```
Task 1 (Canvas soulProfile prop)
  └→ Task 2 (Wire FusionRing3D → Canvas)

Task 3 (Rewrite transit-state proxy)   ← independent of Tasks 1-2

Task 4 (POST /api/contribute endpoint)
  └→ Task 5 (Client contribute service)
    └→ Task 6 (useQuizContribution hook)
      └→ Task 7 (Tests)
```

Tasks 1-2 and Task 3 can be executed in parallel.
Tasks 4-7 are sequential and depend on Task 3 (transit proxy reads contributions).

## What This Plan Does NOT Cover

- **Mounting QuizOverlay in Dashboard/App.tsx** — the component exists but is orphaned. A separate UI task should mount it and pass the `useQuizContribution` handler as `onComplete`.
- **Ringwetter Panel** (weather panel beside the ring) — described in Dev Brief v2, separate feature.
- **Timeline Scrubber** — Dev Brief v2 feature, requires stored transit state history.
- **Equilibrium Line / Divergenz-Spikes rendering** — canvas-internal rendering improvements, separate from the data pipeline.
- **FuFirE `/transit/state` endpoint verification** — assumes the endpoint exists at `POST /transit/state` on the BAFE server. If it doesn't, Task 3 gracefully falls back.
