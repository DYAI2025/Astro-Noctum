# P2 Cleanup: Analytics Dead Events + CLAUDE.md Flag Description

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove 3 dead event names from the analytics type union and update the `daily_modal_v1` description in CLAUDE.md to reflect the current "Day-Pulse/Trace modal" naming.

**Architecture:** Two independent file edits. No tests needed for the analytics type change (TypeScript compiler + lint enforces correctness). CLAUDE.md is documentation-only.

**Tech Stack:** TypeScript, Vitest

---

## TASK 1: Remove dead analytics event names

**Files:**
- Modify: `src/lib/analytics.ts:15-17`

**Background:** `DailyHoroscopeModal` was deleted. Its event names (`daily_modal_opened`, `daily_modal_closed`, `daily_tab_changed`) were never ported to `DayModeModal`. They exist only in the `EventName` union, with zero call sites. Dead types are misleading.

### Step 1: Delete the 3 dead lines

In `src/lib/analytics.ts`, remove these three lines from the `EventName` union:
```typescript
  | 'daily_modal_opened'
  | 'daily_modal_closed'
  | 'daily_tab_changed'
```

Result — the union should be:
```typescript
type EventName =
  | 'signup'
  | 'login'
  | 'reading_started'
  | 'reading_completed'
  | 'upgrade_clicked'
  | 'payment_completed'
  | 'share_clicked'
  | 'signature_reveal_seen'
  | 'signature_delta_applied'
  | 'day_mode_modal_opened'
  | 'day_mode_modal_closed';
```

### Step 2: Verify no callers were missed

```bash
grep -rn "daily_modal_opened\|daily_modal_closed\|daily_tab_changed" src/ --include="*.ts" --include="*.tsx"
```
Expected: **no output** (zero matches).

### Step 3: TypeScript lint check

```bash
npm run lint
```
Expected: no errors.

### Step 4: Run tests

```bash
npx vitest run
```
Expected: 800+ passed.

### Step 5: Commit

```bash
git add src/lib/analytics.ts
git commit -m "fix(analytics): remove dead daily_modal_* event names superseded by day_mode_modal_*"
```

---

## TASK 2: Update `daily_modal_v1` description in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (~line 320)

**Background:** The feature flag table entry for `daily_modal_v1` says "daily modal" — should say "Day-Pulse/Trace modal" to match the renamed component.

### Step 1: Update the description

In `CLAUDE.md` line ~320, the feature flags table row reads:
```
| `src/lib/feature-flags.ts` | Feature flag module with localStorage override. Three flags: `signature_onboarding_v1` (onboarding flow), `daily_modal_v1` (daily modal), `signature_engine_v2` (V2 spirograph engine, default true) |
```

Change `daily_modal_v1` (daily modal) → `daily_modal_v1` (Day-Pulse/Trace modal):
```
| `src/lib/feature-flags.ts` | Feature flag module with localStorage override. Three flags: `signature_onboarding_v1` (onboarding flow), `daily_modal_v1` (Day-Pulse/Trace modal), `signature_engine_v2` (V2 spirograph engine, default true) |
```

### Step 2: Commit

```bash
git add CLAUDE.md
git commit -m "docs: update daily_modal_v1 description to Day-Pulse/Trace modal"
```

---

## Final Verification

```bash
npm run build && npx vitest run
```
Expected: Build succeeds, 800+ tests passed.
