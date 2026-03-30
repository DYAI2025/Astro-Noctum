# Review Fixes + Dashboard Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix code review findings from Vibes cooldown review, then complete Phase C Dashboard Polish (TagesEnergie hero, Levi knowledge base, daily home port).

**Architecture:** Two independent batches — Batch 1 (review fixes) is quick defensive code, Batch 2 (Phase C) implements the approved Dashboard V2 wireframe sections. TagesEnergie replaces CosmicWeatherCard as always-visible hero section.

**Tech Stack:** TypeScript, Vitest, Express (server.mjs), React 19, Tailwind v4, Framer Motion

---

## Batch 1: Code Review Findings (3 tasks)

### Task 1: Add `generated_at` column to vibes_cache for L2 cooldown persistence

**Files:**
- Create: `supabase-migrations/20260330_vibes_cache_generated_at.sql`
- Modify: `server.mjs` — L2 read path in `/api/vibes` handler

**Step 1: Create migration**

```sql
ALTER TABLE vibes_cache ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();
```

**Step 2: Update L2 cache read to check cooldown**

In `server.mjs`, after the L2 cache SELECT, add a cooldown check using `generated_at`:

```javascript
if (dbCached?.payload_json) {
  const generatedAt = new Date(dbCached.generated_at).getTime();
  const elapsed = Date.now() - generatedAt;
  if (elapsed < cooldownMs) {
    // Still in cooldown — return cached with cooldown info
    vibesCache.set(cacheKey, { data: dbCached.payload_json, timestamp: generatedAt });
    const nextAvailableAt = new Date(generatedAt + cooldownMs).toISOString();
    return res.json({
      ...dbCached.payload_json,
      meta: { ...dbCached.payload_json.meta, cached: true },
      cooldown: { active: true, next_available_at: nextAvailableAt, remaining_ms: cooldownMs - elapsed },
    });
  }
  // Cooldown expired — fall through to generation
}
```

Also update the L2 upsert to include `generated_at: new Date().toISOString()`.

**Step 3: Run lint**

```bash
npm run lint
```

**Step 4: Commit**

```bash
git commit -m "fix(vibes): persist generated_at in L2 cache for cooldown across redeploys"
```

---

### Task 2: Add formatCooldown unit test

**Files:**
- Modify: `src/components/dashboard/VibesSection.tsx` — export `formatCooldown`
- Create: `src/__tests__/vibes-cooldown.test.ts`

**Step 1: Export the helper**

Move `formatCooldown` to a named export (or extract to `src/lib/format-cooldown.ts` if preferred).

**Step 2: Write tests**

```typescript
describe('formatCooldown', () => {
  it('shows hours + minutes for >1h', () => {
    expect(formatCooldown(2 * 60 * 60 * 1000 + 15 * 60 * 1000, 'de')).toBe('2h 15min');
  });
  it('shows only minutes for <1h', () => {
    expect(formatCooldown(45 * 60 * 1000, 'de')).toBe('45 Min.');
  });
  it('shows 1 Min. for very small values', () => {
    expect(formatCooldown(30 * 1000, 'de')).toBe('1 Min.');
  });
});
```

**Step 3: Run test**

```bash
npx vitest run src/__tests__/vibes-cooldown.test.ts
```

**Step 4: Commit**

```bash
git commit -m "test(vibes): add formatCooldown unit tests"
```

---

### Task 3: Add API-level cooldown response shape test

**Files:**
- Modify: `src/__tests__/vibes-perf.test.ts` — add shape assertion for cooldown field

**Step 1: Add test**

```typescript
it('cooldown response has correct shape when active', () => {
  // When server returns cached data with cooldown, validate:
  // cooldown.active (boolean), cooldown.next_available_at (ISO string), cooldown.remaining_ms (number)
  // This is validated when the server is reachable and returns a cached response
});
```

**Step 2: Run test**

```bash
npx vitest run src/__tests__/vibes-perf.test.ts
```

**Step 3: Commit**

```bash
git commit -m "test(vibes): add cooldown response shape validation"
```

---

## Batch 2: Phase C Dashboard Polish (4 tasks)

### Task 4: Complete TASK-dashboard-layout-redesign (In Progress)

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Reference: `docs/wireframes/dashboard-v2.md`

**Context:** This task is already `In Progress` from another session. Check what's already implemented vs the wireframe, then complete any missing sections.

The wireframe specifies this order:
1. Big Four (DashboardBigFour) + MiniSignature
2. Tages-Energie (DashboardTagesEnergie) — Task 5
3. InfluenceGauges
4. Vibes button (already done)
5. Levi + Eve agent tiles
6. Upgrade banner (for freemium)
7. Kosmischer Blueprint (accordion)
8. KI-Synthese (premium)
9. ShareCard + LegalFooter

**Step 1:** Read current `Dashboard.tsx` and compare to wireframe. Identify missing/out-of-order sections.

**Step 2:** Reorder existing sections to match wireframe. Create `DashboardBigFour.tsx` if it doesn't exist (replaces DashboardHeroNav).

**Step 3: Run lint + tests**

**Step 4: Commit**

```bash
git commit -m "feat(dashboard): reorder sections per V2 wireframe (Big Four, TagesEnergie, Vibes, Agents)"
```

---

### Task 5: Complete TASK-tagesenergie-hero

**Files:**
- Create or modify: `src/components/dashboard/DashboardTagesEnergie.tsx`
- Modify: `src/components/Dashboard.tsx` — replace CosmicWeatherCard mount

**Context:** Per wireframe F3, this is the hero section showing:
- Element icon + headline (from DailyResponse)
- Body narrative (fusion.synthesis, 2-3 sentences)
- Day-Trace friction context (italic, when isTrace)
- PremiumGate around fusion.action
- Kosmoswetter strip (event icons: storm, flare, CME, HSS, SEP, transit)
- Resonance indicator (bar + text)
- DayModeModal opened only via "vertiefen" link (not auto-open)

**Step 1:** Check if `DashboardTagesEnergie.tsx` already exists (another session may have started it).

**Step 2:** If exists, verify against wireframe F3 spec and fix gaps. If not, create it following the spec in `docs/wireframes/dashboard-v2.md` lines 92-160.

**Step 3:** Replace `CosmicWeatherCard` in Dashboard with `DashboardTagesEnergie`.

**Step 4: Run lint + tests**

**Step 5: Commit**

```bash
git commit -m "feat(dashboard): DashboardTagesEnergie hero section per wireframe F3"
```

---

### Task 6: TASK-levi-system-prompt (Deferred → execute)

**Files:**
- Reference: `docs/LEVI_SIGNATUR_V2_KNOWLEDGE.md` (if exists)
- Modify: `server.mjs` — ElevenLabs tool endpoint `/api/profile/:userId`

**Context:** The Levi voice agent calls `/api/profile/:userId` to get user context. Currently returns soulprint_sectors + natal_weights. Enhance with Signatur V2 knowledge: dominant element interpretation, bipolar dimension descriptions, current day-mode.

**Step 1:** Read `server.mjs` `/api/profile/:userId` handler.

**Step 2:** Enhance the response to include:
- `dominant_element` with German description
- `signatur_dimensions` (6 bipolar dimensions with current weights + labels)
- `day_mode` (pulse/trace with explanation)
- `vibes_summary` (last Vibes Kurzsignal if cached)

**Step 3: Run lint**

**Step 4: Commit**

```bash
git commit -m "feat(levi): enhance /api/profile with Signatur V2 knowledge base"
```

---

### Task 7: TASK-levi-auto-summary (depends on Task 6)

**Files:**
- Modify: `server.mjs` — add `/api/agent/summary` endpoint
- Modify: Supabase `agent_conversations` table (may need migration for summary count)

**Context:** After 3 Levi sessions, auto-generate a profile summary from conversation topics.

**Step 1:** Add endpoint `POST /api/agent/summary` that:
1. Counts conversations for user (`agent_conversations` WHERE user_id = X)
2. If count >= 3, aggregates topics from last 3 conversations
3. Calls Gemini to synthesize a 2-sentence user profile summary
4. Stores in `astro_profiles.agent_summary` (new column)

**Step 2:** Create migration: `supabase-migrations/20260330_agent_summary.sql`

**Step 3: Run lint**

**Step 4: Commit**

```bash
git commit -m "feat(agent): auto-summarize user profile after 3 sessions via Gemini"
```

---

## Summary

| Task | Batch | Type | Files |
|------|-------|------|-------|
| 1 | Review Fix | L2 cooldown persistence | server.mjs, migration |
| 2 | Review Fix | formatCooldown test | VibesSection.tsx, test |
| 3 | Review Fix | Cooldown shape test | vibes-perf.test.ts |
| 4 | Phase C | Dashboard layout reorder | Dashboard.tsx |
| 5 | Phase C | TagesEnergie hero | DashboardTagesEnergie.tsx |
| 6 | Phase C | Levi Signatur V2 knowledge | server.mjs |
| 7 | Phase C | Levi auto-summary | server.mjs, migration |

**Dependency chain:** Tasks 1-3 independent. Task 4 before 5. Task 6 before 7.
