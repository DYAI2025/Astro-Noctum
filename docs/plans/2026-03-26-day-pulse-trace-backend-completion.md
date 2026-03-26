# Day-Pulse/Trace Backend Completion Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Day-Pulse/Trace daily horoscope feature: wire Supabase DB caching, enable daily recurrence (modal re-shows each day), clean up deprecated code, and fix stale documentation.

**Architecture:** 7 tasks batched by concern. Tasks 1-2 are the P0 backend work (DB cache + recurrence). Tasks 3-7 are cleanup. All tasks within each tier are independent.

**Tech Stack:** TypeScript, Express (server.mjs), Supabase, React 19, Zod, Vitest

---

## TASK 1 (P0): Wire Supabase `daily_horoscope_cache` DB persistence

**Files:**
- Modify: `server.mjs` (daily endpoint, ~lines 1245-1375)

**Background:** The `daily_horoscope_cache` table exists in Supabase (created by `supabase-migrations/20260316_experience_tables.sql`) with PK `(user_id, local_date, engine_version, signature_version)`. But `server.mjs` only caches in an in-memory `Map` (24h TTL, lost on redeploy). Wire the DB as the durable cache layer, keeping the in-memory Map as L1.

### Steps

1. Read the current caching code in `server.mjs`. Find the `horoscopeCache` Map (~line 889) and the cache-check logic in the daily endpoint (~line 1245).

2. After the in-memory cache miss (line ~1248), add a Supabase lookup before calling Gemini/FuFirE:
   ```javascript
   // L2: Check Supabase cache
   const { data: dbCached } = await supabaseAdmin
     .from('daily_horoscope_cache')
     .select('payload_json')
     .eq('user_id', req.userId)
     .eq('local_date', targetDate)
     .eq('engine_version', 'v1-gemini-daily')
     .maybeSingle();

   if (dbCached?.payload_json) {
     // Backfill L1 cache
     horoscopeCache.set(cacheKey, { data: dbCached.payload_json, ts: Date.now() });
     return res.json(dbCached.payload_json);
   }
   ```

3. After successfully generating a response (both Gemini and proxy paths), upsert to Supabase — fire-and-forget:
   ```javascript
   // Persist to L2 (fire-and-forget)
   supabaseAdmin
     .from('daily_horoscope_cache')
     .upsert({
       user_id: req.userId,
       local_date: targetDate,
       engine_version: 'v1-gemini-daily',
       signature_version: 1,
       payload_json: result,
     }, { onConflict: 'user_id,local_date,engine_version,signature_version' })
     .then(({ error }) => { if (error) console.warn('[daily] DB cache upsert failed:', error.message); });
   ```

4. Run build to verify no syntax errors:
   ```bash
   npm run build
   ```

5. Run tests:
   ```bash
   npx vitest run
   ```
   Expected: 800+ passed

6. Commit:
   ```bash
   git add server.mjs
   git commit -m "feat(daily): wire Supabase daily_horoscope_cache as L2 behind in-memory Map"
   ```

---

## TASK 2 (P0): Enable daily recurrence — boolean → date-based seen flag

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts` (~lines 82-91, 129-139)
- Modify: `server.mjs` (if `daily_modal_seen` handling exists there)

**Background:** `profiles.daily_modal_seen` is a boolean — once `true`, the modal never shows again. The design intent is daily recurrence: the modal should re-appear each new day. The hook at line 90 has a comment: "Future: change to `daily_modal_seen_date` for daily recurrence."

### Steps

1. Read `useFirstRunDaily.ts` fully to understand the seen-check flow.

2. Change the Supabase query (line ~84) from checking `daily_modal_seen` (boolean) to `daily_modal_seen_date` (date string):
   ```typescript
   const { data: profile } = await supabase
     .from('profiles')
     .select('daily_modal_seen_date')
     .eq('id', userId)
     .maybeSingle();

   // Skip if already seen TODAY
   const today = todayKey(); // YYYY-MM-DD
   if (profile?.daily_modal_seen_date === today) return;
   ```

3. Update the `handleClose` callback (line ~130) to write today's date instead of `true`:
   ```typescript
   supabase
     .from('profiles')
     .update({ daily_modal_seen_date: new Date().toISOString().slice(0, 10) })
     .eq('id', userId)
     .then(({ error }) => {
       if (error) console.warn('[useFirstRunDaily] Failed to mark seen:', error);
     });
   ```

4. Create a Supabase migration to add the column. Write to `supabase-migrations/20260326_daily_modal_seen_date.sql`:
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_modal_seen_date DATE;
   -- Migrate existing boolean: if daily_modal_seen is true, set date to yesterday
   -- so users who already dismissed it won't see it again until tomorrow
   UPDATE profiles SET daily_modal_seen_date = (CURRENT_DATE - INTERVAL '1 day')::DATE
     WHERE daily_modal_seen = TRUE AND daily_modal_seen_date IS NULL;
   ```

5. Keep `daily_modal_seen` boolean in the schema for now (backward compat with mobile app). The hook should check `daily_modal_seen_date` first, fall back to `daily_modal_seen` boolean:
   ```typescript
   if (profile?.daily_modal_seen_date === today) return;
   if (profile?.daily_modal_seen === true && !profile?.daily_modal_seen_date) return;
   ```

6. Run tests:
   ```bash
   npx vitest run
   ```
   Expected: 800+ passed

7. Commit:
   ```bash
   git add src/hooks/useFirstRunDaily.ts supabase-migrations/20260326_daily_modal_seen_date.sql
   git commit -m "feat(daily): enable daily recurrence — seen flag boolean → date-based"
   ```

---

## TASK 3 (P1): Add SVG fallback for canvas-unavailable case

**Files:**
- Modify: `src/components/dashboard/DayModeModal.tsx` (~line 29)

**Background:** DayModeModal.tsx:29 has a comment about SVG fallback but it's not implemented. If `<canvas>` is unavailable (e.g., very old browsers, SSR), nothing renders.

### Steps

1. Read `DayModeModal.tsx` to find the `ModeSnapshot` component and its canvas ref.

2. Add a `canvasSupported` check and render an SVG fallback when canvas is unavailable:
   ```tsx
   {!canvasSupported && (
     <svg viewBox="0 0 200 200" className="w-full h-full">
       {mode === 'pulse' ? (
         <>
           <circle cx="100" cy="100" r="60" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
           <circle cx="100" cy="100" r="40" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.3" />
           <circle cx="100" cy="100" r="20" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.2" />
         </>
       ) : (
         <>
           <line x1="40" y1="40" x2="160" y2="160" stroke="#D4AF37" strokeWidth="0.5" opacity="0.4" />
           <line x1="160" y1="40" x2="40" y2="160" stroke="#00B4D8" strokeWidth="0.5" opacity="0.4" />
         </>
       )}
     </svg>
   )}
   ```

3. Run tests:
   ```bash
   npx vitest run
   ```

4. Commit:
   ```bash
   git add src/components/dashboard/DayModeModal.tsx
   git commit -m "fix(daily): add SVG fallback when canvas is unavailable in DayModeModal"
   ```

---

## TASK 4 (P1): Delete deprecated DailyHoroscopeModal

**Files:**
- Delete: `src/components/dashboard/DailyHoroscopeModal.tsx`
- Modify: any test files that reference the old modal

### Steps

1. Verify no production code imports the old modal:
   ```bash
   grep -r "DailyHoroscopeModal" src/ --include="*.ts" --include="*.tsx" -l
   ```
   Expected: only test files and maybe stale imports.

2. Delete the old file:
   ```bash
   rm src/components/dashboard/DailyHoroscopeModal.tsx
   ```

3. Fix any test file references — replace with `DayModeModal` references or remove the mock.

4. Run tests:
   ```bash
   npx vitest run
   ```

5. Commit:
   ```bash
   git add -A
   git commit -m "refactor(daily): delete deprecated DailyHoroscopeModal — replaced by DayModeModal"
   ```

---

## TASK 5 (P1): Fix stale API documentation

**Files:**
- Modify: `docs/API_EXPERIENCE.md` (~lines 296-306)
- Modify: `docs/ARCHITECTURE_EXPERIENCE.md` (~line 15)

### Steps

1. In `docs/API_EXPERIENCE.md`, find the `/experience/daily` response example (lines ~296-306). Add the missing `harmony_index` and `day_mode` fields to the fusion section:
   ```json
   "fusion": {
     "summary": "...",
     "synthesis": "...",
     "action": "...",
     "pushworthy": false,
     "push_text": null,
     "harmony_index": 0.52,
     "day_mode": "trace"
   }
   ```

2. In `docs/ARCHITECTURE_EXPERIENCE.md`, replace any reference to `DailyHoroscopeModal` with `DayModeModal`.

3. Commit:
   ```bash
   git add docs/API_EXPERIENCE.md docs/ARCHITECTURE_EXPERIENCE.md
   git commit -m "docs(daily): update API docs with harmony_index/day_mode fields, fix modal name"
   ```

---

## TASK 6 (P2): Fix analytics event name mismatch

**Files:**
- Modify: `src/lib/analytics.ts` (~lines 15-16)

**Background:** `analytics.ts` defines old event names `daily_modal_opened`/`daily_modal_closed`, but `DayModeModal.tsx` uses `day_mode_modal_opened`/`day_mode_modal_closed`. The type union needs updating.

### Steps

1. Read `src/lib/analytics.ts` and find the event type union.

2. Replace `daily_modal_opened` → `day_mode_modal_opened` and `daily_modal_closed` → `day_mode_modal_closed`.

3. Grep for any other references to the old event names:
   ```bash
   grep -r "daily_modal_opened\|daily_modal_closed" src/ --include="*.ts" --include="*.tsx"
   ```
   Fix any remaining references.

4. Run tests:
   ```bash
   npx vitest run
   ```

5. Commit:
   ```bash
   git add src/lib/analytics.ts
   git commit -m "fix(analytics): update daily modal event names to day_mode_modal_*"
   ```

---

## TASK 7 (P2): Update feature flag name in documentation

**Files:**
- Modify: `CLAUDE.md` (if it references `daily_modal_v1` as "Daily Horoscope Modal")

### Steps

1. In CLAUDE.md, find references to `daily_modal_v1` and ensure the description says "Day-Pulse/Trace modal" not "Daily Horoscope Modal".

2. Commit:
   ```bash
   git add CLAUDE.md
   git commit -m "docs: update daily_modal_v1 description to Day-Pulse/Trace"
   ```

---

## Final Verification

```bash
npm run build && npx vitest run
```
Expected: Build succeeds, 800+ tests passed.

---

**Branch Strategy:**

Create a feature branch from current:
```bash
git checkout -b feature/day-pulse-backend-completion
```

After all tasks complete, PR against `feature/sprint-s07-dashboard-polish` or `main` depending on merge state.
