# Supabase Hardening — Fix All Issues

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 7 concrete Supabase issues: missing RLS policy, redundant round-trips, unsafe client init, unoptimized server client, stale CLAUDE.md, and double-query inserts.

**Architecture:** All changes are isolated — each task touches 1-2 files max. No feature changes, no UI changes. Pure data-layer hardening.

**Tech Stack:** Supabase JS v2, TypeScript, Express (server.mjs), PostgreSQL RLS

---

## Issue Reference

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | Missing UPDATE RLS policy on `contribution_events` | **Bug** — upsert silently fails | `supabase-migration-contribution-events.sql` |
| 2 | Double round-trips on write-once inserts | **Perf** — 2x DB calls per save | `src/services/supabase.ts` |
| 3 | Client created with empty strings when env vars missing | **DX** — silent broken client | `src/lib/supabase.ts` |
| 4 | Server client missing auth optimization | **Minor** — unnecessary auth listeners | `server.mjs` |
| 5 | CLAUDE.md references non-existent `/api/auth/signup` | **Docs** — misleading | `CLAUDE.md` |
| 6 | `usePremium` realtime has no error handling | **Resilience** — stale state | `src/hooks/usePremium.ts` |
| 7 | `contribution_events` table missing from main schema file | **Docs** — schema drift | `supabase-schema.sql` |

---

### Task 1: Add UPDATE RLS policy for contribution_events

The `upsert()` call in `src/services/contribution-events.ts:22` requires UPDATE permission, but only SELECT, INSERT, and DELETE policies exist. The upsert silently fails for quiz retakes.

**Files:**
- Modify: `supabase-migration-contribution-events.sql:34` (append after last policy)

**Step 1: Add the UPDATE policy**

Append to `supabase-migration-contribution-events.sql` after line 40 (the anon_insert_events policy):

```sql
-- Update own events (required for upsert on quiz retake)
create policy "users_update_own_events"
on public.contribution_events for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

**Step 2: Verify the file**

Run: `grep -c 'policy' supabase-migration-contribution-events.sql`
Expected: `5` (was 4, now 5 with the new UPDATE policy)

**Step 3: Commit**

```bash
git add supabase-migration-contribution-events.sql
git commit -m "fix: add UPDATE RLS policy for contribution_events upsert"
```

**⚠️ IMPORTANT:** This SQL must also be run manually in the Supabase SQL Editor against the production database. The file is a reference — Astro-Noctum has no automated migration runner.

---

### Task 2: Remove redundant pre-check queries from write-once inserts

`src/services/supabase.ts` does a SELECT count query before every INSERT for `birth_data`, `natal_charts`, and `astro_profiles`. All three already handle `23505` (unique_violation) as a no-op. The pre-checks are redundant network round-trips.

**Files:**
- Modify: `src/services/supabase.ts`

**Step 1: Simplify `upsertAstroProfile`**

Remove the `hasAstroProfile()` call and the early return. The function already catches `23505`. Replace lines 49-95 with:

```typescript
export async function upsertAstroProfile(
  userId: string,
  birth: BirthInput,
  bafeData: any,
  interpretation: string,
) {
  const sunSign = bafeData.western?.zodiac_sign || null;
  const moonSign = bafeData.western?.moon_sign || null;
  const ascSign = bafeData.western?.ascendant_sign || null;

  const { error } = await supabase.from("astro_profiles").insert({
    user_id: userId,
    birth_date: birth.date.split("T")[0],
    birth_time: birth.date.includes("T")
      ? birth.date.split("T")[1]?.slice(0, 5)
      : null,
    iana_time_zone: birth.tz,
    birth_lat: birth.lat,
    birth_lng: birth.lon,
    birth_place_name: birth.place || null,
    sun_sign: sunSign,
    moon_sign: moonSign,
    asc_sign: ascSign,
    astro_json: {
      bazi:    bafeData.bazi,
      western: bafeData.western,
      fusion:  bafeData.fusion,
      wuxing:  bafeData.wuxing,
      tst:     bafeData.tst,
      interpretation,
    },
    astro_computed_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") return;  // already exists — expected
    console.error("insertAstroProfile error:", error);
    throw error;
  }
}
```

**Step 2: Simplify `insertBirthData`**

Remove the count pre-check. Replace lines 101-123 with:

```typescript
export async function insertBirthData(userId: string, birth: BirthInput) {
  const { error } = await supabase.from("birth_data").insert({
    user_id: userId,
    birth_utc: birth.date,
    lat: birth.lat,
    lon: birth.lon,
    place_label: birth.place || null,
  });

  if (error) {
    if (error.code === "23505") return;  // already exists
    console.error("insertBirthData error:", error);
    throw error;
  }
}
```

**Step 3: Simplify `insertNatalChart`**

Remove the count pre-check. Replace lines 128-150 with:

```typescript
export async function insertNatalChart(userId: string, bafeData: any) {
  const { error } = await supabase.from("natal_charts").insert({
    user_id: userId,
    payload: bafeData,
    engine_version: "bafe-1.0",
    zodiac: "tropical",
    house_system: "placidus",
  });

  if (error) {
    if (error.code === "23505") return;  // already exists
    console.error("insertNatalChart error:", error);
    throw error;
  }
}
```

**Step 4: Remove unused `hasAstroProfile` function**

Delete `hasAstroProfile` (lines 32-43). It was only used by `upsertAstroProfile`. The `fetchAstroProfile` function (lines 16-28) remains — it's used elsewhere for reading.

**Step 5: Verify**

Run: `cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum && npx tsc --noEmit`
Expected: No new errors (pre-existing errors in `allquizzes/quizzme-module-loader.ts` are OK)

**Step 6: Commit**

```bash
git add src/services/supabase.ts
git commit -m "perf: remove redundant pre-check queries from write-once inserts"
```

---

### Task 3: Fail fast when Supabase env vars are missing

`src/lib/supabase.ts` creates a client with empty-string URL/key when env vars are missing. This produces a broken client that fails silently on every call.

**Files:**
- Modify: `src/lib/supabase.ts`

**Step 1: Replace the entire file**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill values.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Step 2: Verify**

Run: `cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum && npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "fix: fail fast when Supabase env vars are missing"
```

---

### Task 4: Optimize server-side Supabase client

The server-side client in `server.mjs` uses service role key but doesn't disable auth features it doesn't need (auto-refresh, session persistence). These are no-ops in a Node.js server context but add unnecessary overhead.

**Files:**
- Modify: `server.mjs:241-244`

**Step 1: Add auth options**

Replace lines 241-244:

```javascript
const supabaseServer =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
```

**Step 2: Verify server starts**

Run: `cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum && node -e "import('./server.mjs')" 2>&1 | head -5`
Expected: No crash (may warn about missing env vars — that's fine)

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "perf: disable auth auto-refresh on server-side Supabase client"
```

---

### Task 5: Add visibility change refetch to usePremium

The realtime subscription in `usePremium.ts` has no error handling. If the connection drops, `isPremium` is stale. Since premium upgrades are rare (user returns from Stripe checkout), a simple visibility-change refetch is more reliable.

**Files:**
- Modify: `src/hooks/usePremium.ts`

**Step 1: Replace the entire file**

```typescript
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    if (!user) { setIsPremium(false); setLoading(false); return; }

    const { data } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();
    setIsPremium(data?.tier === 'premium');
    setLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => { fetchTier(); }, [fetchTier]);

  // Re-fetch when tab becomes visible (catches Stripe redirect return)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchTier();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [fetchTier]);

  // Realtime subscription for instant update (best-effort)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-tier')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        setIsPremium(payload.new.tier === 'premium');
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Premium tier realtime subscription failed — using polling fallback');
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { isPremium, loading };
}
```

**Step 2: Verify**

Run: `cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum && npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit**

```bash
git add src/hooks/usePremium.ts
git commit -m "fix: add visibility-change refetch and error handling to usePremium"
```

---

### Task 6: Consolidate contribution_events into main schema file

The `contribution_events` table definition only exists in a separate migration file (`supabase-migration-contribution-events.sql`) but not in `supabase-schema.sql`. This causes schema drift — anyone reading the main schema file doesn't see this table.

**Files:**
- Modify: `supabase-schema.sql` (append at end)

**Step 1: Append contribution_events section**

Add at the end of `supabase-schema.sql` (after line 121):

```sql

-- === Contribution Events (Quiz results for Fusion Ring) ===
CREATE TABLE IF NOT EXISTS public.contribution_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  event_id text unique not null,
  module_id text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_contribution_events_user_id ON public.contribution_events(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_events_module_id ON public.contribution_events(module_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_contribution_user_module ON public.contribution_events(user_id, module_id);

ALTER TABLE public.contribution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_events" ON public.contribution_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_events" ON public.contribution_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_events" ON public.contribution_events
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_events" ON public.contribution_events
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "anon_insert_events" ON public.contribution_events
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);
```

**Step 2: Commit**

```bash
git add supabase-schema.sql
git commit -m "docs: consolidate contribution_events table into main schema file"
```

---

### Task 7: Fix CLAUDE.md — remove reference to non-existent server-side signup

The project CLAUDE.md states: *"Signup hits server-side `/api/auth/signup` (auto-confirm), falls back to client-side Supabase signup if server unreachable"*. This endpoint does not exist in `server.mjs`. Signup is handled entirely client-side in `AuthContext.tsx`.

**Files:**
- Modify: `CLAUDE.md:47`

**Step 1: Fix the AuthContext description**

Replace line 47:

```
| `src/contexts/AuthContext.tsx` | Supabase auth provider (signIn/signUp/signOut). Signup hits server-side `/api/auth/signup` (auto-confirm), falls back to client-side Supabase signup if server unreachable |
```

With:

```
| `src/contexts/AuthContext.tsx` | Supabase auth provider (signIn/signUp/signOut). Signup is client-side via Supabase SDK. Detects existing users via empty `identities` array and auto-redirects to sign-in |
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: fix CLAUDE.md — signup is client-side, not server-side"
```

---

## Execution Order

Tasks are independent and can be done in any order. Recommended sequence for safety:

1. **Task 1** (RLS policy) — fixes a real bug, deploy SQL to prod immediately
2. **Task 2** (remove double queries) — biggest perf win
3. **Task 3** (fail-fast client) — catches misconfig early
4. **Task 4** (server client opts) — trivial, low risk
5. **Task 5** (usePremium resilience) — improves Stripe flow
6. **Task 6** (schema consolidation) — docs only
7. **Task 7** (CLAUDE.md fix) — docs only

## Post-Deployment

After committing all tasks, **manually run the Task 1 SQL** in the Supabase Dashboard SQL Editor:

```sql
create policy "users_update_own_events"
on public.contribution_events for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

Verify with:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'contribution_events';
```
Expected: 5 policies (SELECT, INSERT, UPDATE, DELETE, anon INSERT).
