# Production Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 7 issues from the production code audit (1 critical security, 2 server hardening, 1 runtime bug, 1 type safety sweep, and 1 env cleanup).

**Architecture:** Targeted patches — no refactoring, no new features. Each fix is self-contained. Task 1 (Gemini proxy) is the only change that spans frontend + backend; all others are single-file.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Express (server.mjs ESM), Supabase JS v2, Vitest

**Base path:** `/Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum`

---

## Task 1: Move Gemini API key to server proxy (CRITICAL)

**Problem:** `vite.config.ts:12` injects `GEMINI_API_KEY` into the browser bundle via Vite `define`. Anyone can see it in DevTools → Network → bundle JS.

**Files:**
- Modify: `vite.config.ts` (remove define block + add proxy route)
- Modify: `server.mjs` (add POST `/api/interpret` endpoint)
- Modify: `src/services/gemini.ts` (call server instead of Gemini directly)
- Modify: `src/App.tsx` (no change needed — calls `generateInterpretation()` which we reroute)

**Step 1: Remove `GEMINI_API_KEY` from vite.config.ts**

In `vite.config.ts`, the current `define` block is:
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
},
```

Delete the entire `define` block (lines 11-13). Also add `/api/interpret` to the dev proxy (inside `server:` → `proxy:`):
```typescript
'/api/interpret': {
  target: 'http://localhost:3001',
  changeOrigin: true,
},
```

Full resulting `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    publicDir: 'public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/calculate': {
          target: env.VITE_BAFE_BASE_URL || 'https://bafe.vercel.app',
          changeOrigin: true,
        },
        '/api/auth': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/profile': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/agent': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/api/interpret': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
```

**Step 2: Add `/api/interpret` endpoint to server.mjs**

Find the line `app.get("*", (_req, res) => {` near the bottom of `server.mjs` (line ~575) and insert this block **before** it:

```javascript
// ── AI Interpretation (Gemini — server-side, key never reaches browser) ──
const { GoogleGenAI } = await import("@google/genai").catch(() => ({ GoogleGenAI: null }));
const geminiClient = GoogleGenAI && process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

function buildGeminiPrompt(data, lang) {
  return `
You are Bazodiac's fusion astrologer — the ONLY system that synthesizes Western astrology, Chinese BaZi, and Wu-Xing Five Elements into one unified reading.

BIRTH DATA (JSON):
${JSON.stringify(data, null, 2)}

TASK: Write a deeply personal ${lang === 'de' ? 'German' : 'English'} horoscope interpretation (400–500 words, 5 paragraphs, Markdown, no bullet points). Address the reader as "${lang === 'de' ? 'du' : 'you'}".

STRUCTURE — each paragraph MUST cross-reference at least two systems:

1. **Your Cosmic Identity**: Start with the Western Sun sign and immediately bridge to the BaZi Day Master. What does THIS specific combination reveal that neither system alone can show?

2. **Emotional Depths**: Connect Moon sign with the BaZi pillars' emotional patterns. How does Wu-Xing's dominant element color these emotional currents?

3. **The Fusion Revelation**: This is the core. Use the fusion data to reveal the UNIQUE intersection — the pattern that emerges ONLY when Western + BaZi + Wu-Xing are layered together. This is what no other app can show. Make this paragraph feel like a discovery.

4. **Wu-Xing Balance**: Which elements are strong, which are weak? How does this elemental map interact with the Western Ascendant? Give one concrete life recommendation based on elemental balance.

5. **Your Path Forward**: Synthesize all three systems into a forward-looking invitation. End with a sentence that makes the reader feel truly seen.

TONE: Warm, precise, mystical but grounded. Never generic. Every sentence must feel like it was written for THIS specific birth chart.
`.trim();
}

app.post("/api/interpret", express.json({ limit: "50kb" }), async (req, res) => {
  const { data, lang = "en" } = req.body || {};
  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "data is required" });
  }

  if (!geminiClient) {
    return res.status(503).json({ error: "Interpretation service unavailable" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await geminiClient.models.generateContent({
      model: "gemini-2.0-flash",
      contents: buildGeminiPrompt(data, lang),
      config: { temperature: 0.75 },
    });
    clearTimeout(timeout);
    const text = response.text?.trim();
    if (!text) return res.status(502).json({ error: "Empty response from AI" });
    res.json({ text });
  } catch (err) {
    console.warn("[interpret] Gemini failed:", err.message);
    res.status(502).json({ error: "AI interpretation failed" });
  }
});
```

**Important:** The `import("@google/genai")` must be a dynamic import at the top of `server.mjs` instead. Add this static import near the top (after the existing imports):
```javascript
import { GoogleGenAI } from "@google/genai";
```
Then use `const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;` at module level.

**Step 3: Rewrite `src/services/gemini.ts` to call the server**

Replace the entire file contents with:
```typescript
import { generateTemplateInterpretation } from "./interpretation-templates";

/**
 * Generates an AI-powered horoscope interpretation.
 * Calls the server-side /api/interpret endpoint — Gemini API key is NEVER in the browser bundle.
 * Falls back to template-based interpretation if server is unavailable.
 */
export async function generateInterpretation(data: unknown, lang: string = "en"): Promise<string> {
  // Template fallback (always available, no API call)
  const templateText = generateTemplateInterpretation(data, lang);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);

    const response = await fetch("/api/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, lang }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Server responded ${response.status}`);
    const json = await response.json() as { text?: string };
    if (json.text) return json.text;
  } catch (err) {
    console.warn("Gemini server proxy failed, using template fallback:", err);
  }

  if (templateText) return templateText;

  return lang === "de"
    ? "## Dein Bazodiac Fusion-Blueprint\n\nDein kosmisches Profil wird berechnet. Die vollständige Interpretation basierend auf deinen Geburtsdaten wird in Kürze verfügbar sein."
    : "## Your Bazodiac Fusion Blueprint\n\nYour cosmic profile is being calculated. The full interpretation based on your birth data will be available shortly.";
}
```

**Step 4: Update .env.example** — rename `VITE_GEMINI_API_KEY` to `GEMINI_API_KEY` (server-only, no VITE_ prefix):

In `.env.example`, change line 2:
- Before: `VITE_GEMINI_API_KEY="MY_GEMINI_API_KEY"`
- After: `GEMINI_API_KEY="MY_GEMINI_API_KEY"`

**Step 5: Verify TypeScript compiles**

```bash
cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum
npx tsc --noEmit
```
Expected: 0 errors

**Step 6: Commit**

```bash
git add vite.config.ts server.mjs src/services/gemini.ts .env.example
git commit -m "fix(security): move Gemini API key to server-side proxy, remove from browser bundle"
```

---

## Task 2: Replace real Supabase URL in .env.example

**Problem:** `.env.example:8,12` contains the actual Supabase project URL `ykoijifgweoapitabgxx.supabase.co` — exposed in git history.

**Files:**
- Modify: `.env.example`

**Step 1: Replace URLs**

In `.env.example`, change:
- Line 8: `VITE_SUPABASE_URL="https://ykoijifgweoapitabgxx.supabase.co"` → `VITE_SUPABASE_URL="https://your-project.supabase.co"`
- Line 12: `SUPABASE_URL="https://ykoijifgweoapitabgxx.supabase.co"` → `SUPABASE_URL="https://your-project.supabase.co"`
- Line 19: `VITE_ELEVENLABS_AGENT_ID="agent_1801kje0zqc8e4b89swbt7wekawv"` → `VITE_ELEVENLABS_AGENT_ID="agent_YOUR_AGENT_ID"`

**Step 2: Commit**

```bash
git add .env.example
git commit -m "fix(security): replace real Supabase URL and ElevenLabs agent ID in .env.example with placeholders"
```

---

## Task 3: Add boot-time env var validation to server.mjs

**Problem:** The server starts even when critical env vars (`SUPABASE_URL`, `STRIPE_SECRET_KEY`) are missing — failing silently at runtime instead of at boot.

**Files:**
- Modify: `server.mjs` (add validation block near top, after imports)

**Step 1: Add validation block**

After the imports block in `server.mjs` (after line 10, before the `const __filename` line), add:

```javascript
// ── Boot-time environment validation ─────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const REQUIRED_ENV_VARS = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_PRICE_ID",
    "STRIPE_WEBHOOK_SECRET",
    "GEMINI_API_KEY",
  ];
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    console.error(`[startup] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("[startup] All required environment variables present.");
}
```

**Step 2: Verify server still starts in dev**

```bash
cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum
node server.mjs &
sleep 2
curl http://localhost:3000/api/health
kill %1
```
Expected: Server starts, health endpoint responds.

**Step 3: Commit**

```bash
git add server.mjs
git commit -m "fix(server): add boot-time env var validation for production"
```

---

## Task 4: Fix double completedIds computation in useFusionRing

**Problem:** `src/hooks/useFusionRing.ts:67` and `:80` both compute `new Set(events.map(e => e.source.moduleId))` independently. If `events` updates between React render cycles, `activeEvents` and `signal` could use different `completedIds` snapshots, causing visual inconsistencies in the Fusion Ring.

**Files:**
- Modify: `src/hooks/useFusionRing.ts`

**Step 1: Hoist completedIds to its own useMemo**

In `useFusionRing.ts`, the current code has two separate `new Set(events.map(...))` calls. Replace the section from line 65 to line 85 with:

```typescript
  // Shared completedIds — computed once, reused by both activeEvents and signal
  const completedIds = useMemo(
    () => new Set(events.map(e => e.source.moduleId)),
    [events],
  );

  // T(s) — only fire events whose cluster is complete (or standalone)
  const activeEvents = useMemo(() => {
    return events.filter(e => {
      const cluster = findClusterForModule(e.source.moduleId);
      if (!cluster) return true; // standalone → immediately active
      return isClusterComplete(cluster, completedIds);
    });
  }, [events, completedIds]);

  const T = useMemo(() => fuseAllEvents(activeEvents), [activeEvents]);

  // Finale Signal-Komposition
  const signal: FusionRingSignal | null = useMemo(() => {
    if (!apiResults) return null;
    const completedClusters = CLUSTER_REGISTRY.filter(c =>
      isClusterComplete(c, completedIds)
    ).length;
    return computeFusionSignal(W, B, X, T, completedClusters, CLUSTER_REGISTRY.length);
  }, [W, B, X, T, apiResults, completedIds]);
```

Also update `completedModules` at line 102-104 to reuse `completedIds` instead of creating a third Set:

```typescript
  // Abgeschlossene Quiz-Module (reuse shared completedIds)
  const completedModules = completedIds;
```

Remove the old `completedModules` useMemo block (the one with `new Set(events.map(...))`).

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

**Step 3: Run existing tests**

```bash
npm test
```
Expected: all tests pass

**Step 4: Commit**

```bash
git add src/hooks/useFusionRing.ts
git commit -m "fix: deduplicate completedIds computation in useFusionRing to prevent render inconsistency"
```

---

## Task 5: Fix cache eviction thread-safety in server.mjs

**Problem:** `server.mjs:88` iterates a `Map` while potentially deleting from it during concurrent requests. Should copy keys first to avoid iterator invalidation.

**Files:**
- Modify: `server.mjs` (lines 85-95, the `setInterval` eviction block)

**Step 1: Fix the eviction loop**

Find this block in `server.mjs`:
```javascript
setInterval(() => {
  const now = Date.now();
  let evicted = 0;
  for (const [key, entry] of bafeCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      bafeCache.delete(key);
      evicted++;
    }
  }
  if (evicted > 0) console.log(`[cache] evicted ${evicted} expired entries, ${bafeCache.size} remaining`);
}, 60 * 60 * 1000);
```

Replace with:
```javascript
setInterval(() => {
  const now = Date.now();
  let evicted = 0;
  // Copy keys before iterating to avoid Map iterator invalidation during deletion
  for (const key of Array.from(bafeCache.keys())) {
    const entry = bafeCache.get(key);
    if (entry && now - entry.timestamp > CACHE_TTL) {
      bafeCache.delete(key);
      evicted++;
    }
  }
  if (evicted > 0) console.log(`[cache] evicted ${evicted} expired entries, ${bafeCache.size} remaining`);
}, 60 * 60 * 1000);
```

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "fix(server): copy Map keys before eviction loop to prevent iterator invalidation"
```

---

## Task 6: Replace `any` types with proper interfaces (6 instances)

**Problem:** 6 uses of `any` in production code reduce type safety. TypeScript can catch real bugs at these boundaries.

**Files:**
- Modify: `src/services/supabase.ts` (2 instances)
- Modify: `src/components/Dashboard.tsx` (2 instances)
- Modify: `src/contexts/LanguageContext.tsx` (2 instances)
- Leave: `PlaceAutocomplete.tsx` and `LocationMap.tsx` — `(window as any).google` is acceptable for Google Maps without the types package

**Step 1: Fix supabase.ts**

Read `src/services/supabase.ts` first to understand context around lines 37 and 95.

The `bafeData: any` parameter appears in functions that store/insert BAFE API results. The actual shape is `ApiResults` from `src/services/api.ts`. Check what fields are used in those functions, then replace `any` with `unknown` (safest when shape isn't fully typed) or import the actual type.

If `ApiResults` is importable without circular deps:
```typescript
import type { ApiResults } from './api';

// Then replace:
// bafeData: any  →  bafeData: ApiResults | unknown
```

If uncertain, use `unknown` which is always safe (requires narrowing before use):
```typescript
export async function saveNatalChart(userId: string, bafeData: unknown): Promise<void> {
```

**Step 2: Fix Dashboard.tsx**

Instance 1 — `resolveSign(val: any)` at line 146:
```typescript
// Before
function resolveSign(val: any): string {

// After
function resolveSign(val: string | number | null | undefined): string {
```

Instance 2 — `apiData: any` in DashboardProps at line 212:
```typescript
// Before
apiData: any;

// After — use the actual type from services/api.ts
import type { ApiResults } from '../services/api';
// ...
apiData: ApiResults;
```

Instance 3 — `houses: Record<string, any>` at line 357:
```typescript
// Before
const houses: Record<string, any> = useMemo(

// After
const houses: Record<string, number | string | null> = useMemo(
```

**Step 3: Fix LanguageContext.tsx**

Lines 49-51:
```typescript
// Before
function deepGet(obj: any, keyPath: string): string {
  let current: any = obj;

// After
function deepGet(obj: Record<string, unknown>, keyPath: string): string {
  let current: unknown = obj;
```

Inside the function, the existing `typeof current === 'object'` guards already handle narrowing — just update the param type.

**Step 4: TypeScript strict check**

```bash
npx tsc --noEmit
```
Expected: 0 errors (fix any new type errors that surface)

**Step 5: Commit**

```bash
git add src/services/supabase.ts src/components/Dashboard.tsx src/contexts/LanguageContext.tsx
git commit -m "refactor: replace any types with proper interfaces in supabase service, Dashboard, LanguageContext"
```

---

## Task 7: Final verification

**Step 1: Full TypeScript check**

```bash
cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum
npx tsc --noEmit
```
Expected: 0 errors

**Step 2: Run all tests**

```bash
npm test
```
Expected: all pass

**Step 3: Production build**

```bash
npm run build
```
Expected: no errors, dist/ created

**Step 4: Verify Gemini key not in bundle**

```bash
grep -r "GEMINI_API_KEY\|AIza" dist/ 2>/dev/null | grep -v "GEMINI_API_KEY.*placeholder"
```
Expected: no output (key is absent from bundle)

**Step 5: Commit if any fixes needed, then ship**

```bash
git status
# If clean:
git push
```

---

## Summary of Changes

| Task | File | Risk |
|------|------|------|
| 1 | vite.config.ts, server.mjs, gemini.ts, .env.example | Medium (behavior change: fetch call in dev needs server running) |
| 2 | .env.example | None (cosmetic) |
| 3 | server.mjs | None (only runs in production) |
| 4 | useFusionRing.ts | Low (same logic, shared reference) |
| 5 | server.mjs | None (cosmetic improvement) |
| 6 | supabase.ts, Dashboard.tsx, LanguageContext.tsx | Low (type-only changes) |

**Important dev workflow note for Task 1:** After this change, AI interpretations in dev require the Express server to be running (`PORT=3001 node server.mjs` in a separate terminal). Without it, interpretation falls back to the template system — which is working and intentional.
