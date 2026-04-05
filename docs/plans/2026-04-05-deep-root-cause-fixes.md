# Deep Bug Analysis Fix Plan — Real Root Causes

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 real root causes found through end-to-end code tracing of BUG-15/16, BUG-17, BUG-18, BUG-19.

**Architecture:** Each bug has a distinct root cause that prior fixes missed. Prior fixes addressed symptoms (null guards, fallback labels) but not the underlying data flow bugs.

**Tech Stack:** React 19, TypeScript, Three.js, Vitest

---

## Root Cause Summary

| Bug | Reported Symptom | Real Root Cause |
|-----|-----------------|-----------------|
| BUG-15 | Birth/current sky look same | Planetarium stars use `currentDate` (React state), but animation loop mutates `simTimeRef` (ref) without updating state. Stars never move. |
| BUG-17 | Gauges show 0% | Actually shows 25-85% with synthetic data. NOT 0%. Prior label fix ("GESCHÄTZT") is correct. **No further code fix needed.** |
| BUG-18 | Vibe text not visible | User is not premium → PremiumGate hides button. This is **by design** per REQ-F-vibes-core. Prior retry fix is valid for premium users. **No further code fix needed.** |
| BUG-19 | Tagesimpuls text missing | `useFirstRunDaily` only fetches dailyData during modal flow. When `alreadySeen=true`, hook returns early → `dailyData=null` → inline DashboardTagesEnergie doesn't render. |

## Task 1: Fix Planetarium star positions not updating for current sky (BUG-15)

The animation loop (line 688) sets `simTimeRef.current = daysSinceJ2000(new Date())` but the planetarium star calculation (line 766) uses `currentDate` which derives from `simTime` React STATE — never updated by the ref mutation.

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx:766`

The fix: Use `simTimeRef.current` to compute a local date inside the animation loop, instead of the stale `currentDate` from React state.

---

## Task 2: Fix Tagesimpuls not showing for returning users (BUG-19)

`useFirstRunDaily` returns early when `alreadySeen=true`, leaving `dailyData=null`. The inline DashboardTagesEnergie needs dailyData regardless of modal status.

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

The fix: Always fetch daily data (for inline display). Only skip the MODAL auto-open when alreadySeen.

---
