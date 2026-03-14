# Architecture Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the four confirmed architectural issues from the 2026-03-13 architect review: unauthenticated BAFE proxy, volatile cache key, god-component App.tsx, and untyped profile restoration.

**Architecture:** Three independent tracks — server security (Tasks 1–2), frontend refactoring (Task 3), and type safety (Task 4). Each track is fully independent; they can be done in any order. Task 5 is pure docs.

**Tech Stack:** Express.js (server.mjs), React 19 hooks, TypeScript, Supabase JS client, Vitest

---

## Context for Implementor

### What is the BAFE proxy?

`server.mjs` proxies `/api/calculate/:endpoint` through to the external BAFE astrology API. Currently anyone — logged in or not — can call this endpoint. The fix adds a Supabase JWT check before the proxy using `supabaseServer.auth.getUser(token)`, which the server already has set up.

### What is the lme module?

`src/lib/lme/types.ts` defines `ContributionEvent` — the typed event emitted by each quiz when a user completes it. "lme" = Lifecycle Mapping Engine (internal naming). These events flow into `useFusionRing.ts` and adjust the user's Fusion Ring signal.

### What is the Fusion Ring?

A composite visualization computed from BAFE astrology data + quiz results. It lives in `src/lib/fusion-ring/` and is exposed to the whole app via `FusionRingContext`. Quizzes emit `ContributionEvent`s that modify it.

### Why does App.tsx need refactoring?

`App.tsx` owns 14+ state variables, 3 major async handlers (handleSubmit, handleRegenerate, and a profile-loading effect), and all layout rendering. The profile loading logic alone covers 80 lines inside a `.then()` chain. The fix extracts a `useAstroProfile` hook that owns everything except layout and audio.

---

## Task 1: Auth Guard on BAFE Proxy

**Files:**
- Modify: `server.mjs` (around line 355)

**Context:** `supabaseServer` is already set up in `server.mjs` around line 740. `crypto` is already imported on line 4. The `requireUserAuth` middleware uses `supabaseServer.auth.getUser()` which validates the JWT remotely with Supabase.

### Step 1: Write the test

`src/__tests__/api-routes.test.ts` already exists. Add two new test cases at the bottom:

```typescript
describe("BAFE proxy auth guard", () => {
  it("returns 401 when no Authorization header is sent", async () => {
    const res = await fetch("http://localhost:3001/api/calculate/bazi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2000-01-01T12:00:00", tz: "UTC", lat: 52, lon: 13 }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization header has garbage token", async () => {
    const res = await fetch("http://localhost:3001/api/calculate/bazi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer not-a-real-token",
      },
      body: JSON.stringify({ date: "2000-01-01T12:00:00", tz: "UTC", lat: 52, lon: 13 }),
    });
    expect(res.status).toBe(401);
  });
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run src/__tests__/api-routes.test.ts -t "BAFE proxy auth guard"
```

Expected: Tests fail — the proxy currently returns 200 or a BAFE error, not 401.

> **Note:** These are integration tests that require the Express server running on port 3001. If the test runner can't connect, mock the test with a supertest import instead — see the existing test patterns in that file.

### Step 3: Add `requireUserAuth` middleware to server.mjs

Find the section starting with `// ── /calculate/:endpoint` (around line 355). **Before** that section, add the middleware:

```javascript
// ── Auth middleware — validates Supabase JWT ─────────────────────────
async function requireUserAuth(req, res, next) {
  if (!supabaseServer) {
    return res.status(503).json({ error: "Auth service not configured" });
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const { data: { user }, error } = await supabaseServer.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  req.userId = user.id;
  next();
}
```

### Step 4: Apply middleware to the proxy routes

Change the calculate and chart routes to require auth:

```javascript
// Before (line ~358):
app.post("/api/calculate/:endpoint", express.json(), (req, res) => {

// After:
app.post("/api/calculate/:endpoint", requireUserAuth, express.json(), (req, res) => {
```

```javascript
// Before (line ~371):
app.post("/api/chart", express.json(), (req, res) => {

// After:
app.post("/api/chart", requireUserAuth, express.json(), (req, res) => {
```

### Step 5: Send the auth token from the client

In `src/services/api.ts`, the `postCalculation` function needs to include the session token. Add this helper and update the function:

```typescript
// Add this import at the top of api.ts (after existing imports):
import { supabase } from '../lib/supabase';

// Replace the postCalculation function:
async function postCalculation<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetchWithTimeout(`${BASE_URL}/calculate/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const problem: BafeProblemDetail = JSON.parse(text);
      if (problem.detail) detail = problem.detail;
      else if (problem.title) detail = problem.title;
    } catch { /* Not JSON — use raw text */ }
    throw new Error(`Failed to calculate ${endpoint}: ${res.status} ${detail}`);
  }

  return res.json() as Promise<T>;
}
```

### Step 6: Run the tests

```bash
npx vitest run src/__tests__/api-routes.test.ts
```

Expected: auth guard tests pass.

### Step 7: Manual smoke test

```bash
# Terminal 1
PORT=3001 node server.mjs

# Terminal 2 — should return 401
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/calculate/bazi \
  -H "Content-Type: application/json" \
  -d '{"date":"2000-01-01T12:00:00","tz":"UTC","lat":52,"lon":13}'
# Expected: 401
```

### Step 8: Commit

```bash
git add server.mjs src/services/api.ts src/__tests__/api-routes.test.ts
git commit -m "security: require Supabase JWT on BAFE calculate proxy"
```

---

## Task 2: Replace Hash Collision Risk in BAFE Cache

**Files:**
- Modify: `server.mjs` (line ~229)

**Context:** `crypto` is already imported on line 4 of `server.mjs`. The existing `cacheKey()` uses a 32-bit integer hash which can collide. Replacing with SHA-256 (truncated to 32 hex chars) eliminates the risk with near-zero effort.

### Step 1: Update `cacheKey()` in server.mjs

Find the function (around line 229):

```javascript
// Before:
function cacheKey(method, url, reqBody) {
  const raw = `${method}:${url}:${JSON.stringify(reqBody || {})}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return String(h);
}

// After:
function cacheKey(method, url, reqBody) {
  const raw = `${method}:${url}:${JSON.stringify(reqBody || {})}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}
```

### Step 2: Restart server, verify cache still works

```bash
PORT=3001 node server.mjs
# Make a request, check logs for [cache] MISS then [cache] STORED
# Make same request again, check for [cache] HIT
```

### Step 3: Commit

```bash
git add server.mjs
git commit -m "fix: replace collision-prone cache key hash with SHA-256"
```

---

## Task 3: Extract `useAstroProfile` Hook from App.tsx

**Files:**
- Create: `src/hooks/useAstroProfile.ts`
- Modify: `src/App.tsx`
- Create: `src/__tests__/useAstroProfile.test.ts`

**Context:** App.tsx currently owns 14 state variables, 3 async handlers (`handleSubmit`, `handleRegenerate`, `handleReset`), and an 80-line profile loading effect. This task extracts all of that into a hook. App.tsx will be left with only layout rendering and the splash/auth/routing decisions.

The hook signature:
```typescript
useAstroProfile(user: User | null, lang: string) => {
  profileState: ProfileState;
  apiData: ApiData | null;
  apiIssues: ApiIssue[];
  interpretation: string | null;
  tileTexts: TileTexts;
  houseTexts: HouseTexts;
  birthDateStr: string | null;
  isFirstReading: boolean;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (data: BirthData) => Promise<void>;
  handleRegenerate: () => Promise<void>;
  handleReset: () => void;
}
```

### Step 1: Write the test file

Create `src/__tests__/useAstroProfile.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAstroProfile } from '../hooks/useAstroProfile';

// Mock all external services
vi.mock('../services/api', () => ({
  calculateAll: vi.fn().mockResolvedValue({
    bazi: { day_master: 'Jia', zodiac_sign: 'Rat', pillars: undefined },
    western: { zodiac_sign: 'Aries', moon_sign: 'Taurus', ascendant_sign: 'Gemini', houses: {} },
    wuxing: { dominant_element: 'Wood', elements: { Wood: 3, Fire: 2, Earth: 1, Metal: 1, Water: 1 } },
    fusion: {},
    tst: {},
    issues: [],
  }),
}));
vi.mock('../services/gemini', () => ({
  generateInterpretation: vi.fn().mockResolvedValue({
    interpretation: 'Test interpretation',
    tiles: { sun: 'Sun tile' },
    houses: {},
  }),
}));
vi.mock('../services/supabase', () => ({
  fetchAstroProfile: vi.fn().mockResolvedValue(null),
  upsertAstroProfile: vi.fn().mockResolvedValue(undefined),
  insertBirthData: vi.fn().mockResolvedValue(undefined),
  insertNatalChart: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));

const mockUser = { id: 'user-123' } as any;

describe('useAstroProfile', () => {
  it('starts in idle state when no user', () => {
    const { result } = renderHook(() => useAstroProfile(null, 'de'));
    expect(result.current.profileState).toBe('idle');
    expect(result.current.apiData).toBeNull();
  });

  it('transitions to not-found when user has no profile', async () => {
    const { result } = renderHook(() => useAstroProfile(mockUser, 'de'));
    // Wait for profile fetch
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    expect(result.current.profileState).toBe('not-found');
  });

  it('handleReset clears data in not-found state', async () => {
    const { result } = renderHook(() => useAstroProfile(mockUser, 'de'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    act(() => { result.current.handleReset(); });
    expect(result.current.apiData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handleSubmit sets profileState to found after success', async () => {
    const { result } = renderHook(() => useAstroProfile(mockUser, 'de'));
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
    await act(async () => {
      await result.current.handleSubmit({
        date: '2000-01-01T12:00:00',
        tz: 'Europe/Berlin',
        lat: 52.5,
        lon: 13.4,
      });
    });
    expect(result.current.profileState).toBe('found');
    expect(result.current.interpretation).toBe('Test interpretation');
    expect(result.current.isFirstReading).toBe(true);
  });
});
```

### Step 2: Run the test to verify it fails

```bash
npx vitest run src/__tests__/useAstroProfile.test.ts
```

Expected: FAIL — `useAstroProfile` does not exist yet.

### Step 3: Create the hook

Create `src/hooks/useAstroProfile.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { calculateAll, type BirthData, type ApiIssue } from "../services/api";
import { generateInterpretation } from "../services/gemini";
import {
  upsertAstroProfile,
  insertBirthData,
  insertNatalChart,
  fetchAstroProfile,
} from "../services/supabase";
import type { ApiData } from "../types/bafe";
import type { TileTexts, HouseTexts } from "../types/interpretation";
import { trackEvent } from "../lib/analytics";

export type ProfileState =
  | "idle"       // no user logged in
  | "loading"    // fetching from Supabase
  | "found"      // profile loaded → show Dashboard
  | "not-found"  // no profile → show BirthForm
  | "error";     // fetch failed → show BirthForm as fallback

export interface AstroProfileResult {
  profileState: ProfileState;
  apiData: ApiData | null;
  apiIssues: ApiIssue[];
  interpretation: string | null;
  tileTexts: TileTexts;
  houseTexts: HouseTexts;
  birthDateStr: string | null;
  isFirstReading: boolean;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (data: BirthData) => Promise<void>;
  handleRegenerate: () => Promise<void>;
  handleReset: () => void;
}

export function useAstroProfile(user: User | null, lang: string): AstroProfileResult {
  const [profileState, setProfileState] = useState<ProfileState>("idle");
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [apiIssues, setApiIssues] = useState<ApiIssue[]>([]);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [tileTexts, setTileTexts] = useState<TileTexts>({});
  const [houseTexts, setHouseTexts] = useState<HouseTexts>({});
  const [birthDateStr, setBirthDateStr] = useState<string | null>(null);
  const [isFirstReading, setIsFirstReading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileFetchedForRef = useRef<string | null>(null);

  // ── Profile loading ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setProfileState("idle");
      setApiData(null);
      setInterpretation(null);
      setTileTexts({});
      setHouseTexts({});
      setBirthDateStr(null);
      setApiIssues([]);
      setError(null);
      setIsFirstReading(false);
      profileFetchedForRef.current = null;
      return;
    }

    if (profileFetchedForRef.current === user.id) return;
    profileFetchedForRef.current = user.id;
    setProfileState("loading");

    fetchAstroProfile(user.id)
      .then(async (profile) => {
        if (profile?.astro_json) {
          const json = profile.astro_json as any;

          const bazi    = json.bazi    ?? json.bafe?.bazi;
          const western = json.western ?? json.bafe?.western;
          const fusion  = json.fusion  ?? json.bafe?.fusion;
          const wuxing  = json.wuxing  ?? json.bafe?.wuxing;
          const tst     = json.tst     ?? json.bafe?.tst;

          setApiData({ bazi, western, fusion, wuxing, tst });

          const storedInterpretation = json.interpretation ?? json.bafe?.interpretation ?? null;

          if (!storedInterpretation) {
            try {
              const aiResult = await generateInterpretation(
                { bazi, western, fusion, wuxing, tst },
                lang,
              );
              setInterpretation(aiResult.interpretation);
              setTileTexts(aiResult.tiles || {});
              setHouseTexts(aiResult.houses || {});
            } catch {
              setInterpretation(
                lang === "de"
                  ? "Dein kosmisches Profil wird geladen…"
                  : "Loading your cosmic profile…"
              );
            }
          } else {
            const rawTiles = json.tiles;
            setTileTexts(rawTiles && typeof rawTiles === "object" && !Array.isArray(rawTiles)
              ? (rawTiles as TileTexts) : {});
            const rawHouses = json.houses;
            setHouseTexts(rawHouses && typeof rawHouses === "object" && !Array.isArray(rawHouses)
              ? (rawHouses as HouseTexts) : {});
            setInterpretation(storedInterpretation);
          }

          if (profile.birth_date) {
            const time = profile.birth_time || "12:00";
            setBirthDateStr(`${profile.birth_date}T${time}:00`);
          }

          setProfileState("found");
        } else {
          setProfileState("not-found");
        }
      })
      .catch((err) => {
        console.error("Profile load failed:", err);
        setProfileState("error");
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Onboarding submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async (data: BirthData) => {
    if (!user || profileState === "found") return;

    setIsLoading(true);
    setError(null);
    trackEvent("reading_started");

    try {
      const results = await calculateAll(data);
      setApiData(results);
      setApiIssues(results.issues);
      setBirthDateStr(data.date);

      const aiResult = await generateInterpretation(results, lang);
      setInterpretation(aiResult.interpretation);
      setTileTexts(aiResult.tiles || {});
      setHouseTexts(aiResult.houses || {});
      trackEvent("reading_completed");

      try {
        await Promise.all([
          upsertAstroProfile(user.id, data, results, aiResult.interpretation, aiResult.tiles || {}, aiResult.houses || {}),
          insertBirthData(user.id, data),
          insertNatalChart(user.id, results),
        ]);
      } catch (persistErr) {
        console.warn("Supabase persist failed:", persistErr);
      }

      setIsFirstReading(true);
      setProfileState("found");
    } catch (err: unknown) {
      console.error("API Error:", err);
      const msg = err instanceof Error ? err.message : "";
      setError(msg || "Berechnung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  }, [user, profileState, lang]);

  // ── Regenerate interpretation ────────────────────────────────────────
  const handleRegenerate = useCallback(async () => {
    if (!apiData) return;
    setIsLoading(true);
    setError(null);
    try {
      const aiResult = await generateInterpretation(apiData, lang);
      setInterpretation(aiResult.interpretation);
      setTileTexts(aiResult.tiles || {});
      setHouseTexts(aiResult.houses || {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg || "KI-Generierung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  }, [apiData, lang]);

  // ── Reset (blocked if profile is persisted) ──────────────────────────
  const handleReset = useCallback(() => {
    if (profileState === "found") return;
    setApiData(null);
    setInterpretation(null);
    setTileTexts({});
    setHouseTexts({});
    setError(null);
    setApiIssues([]);
  }, [profileState]);

  return {
    profileState,
    apiData,
    apiIssues,
    interpretation,
    tileTexts,
    houseTexts,
    birthDateStr,
    isFirstReading,
    isLoading,
    error,
    handleSubmit,
    handleRegenerate,
    handleReset,
  };
}
```

### Step 4: Run the tests

```bash
npx vitest run src/__tests__/useAstroProfile.test.ts
```

Expected: All 4 tests pass.

### Step 5: Update App.tsx to use the hook

In `App.tsx`, remove the following state declarations and their associated logic:

**Remove these state lines** (lines ~41-53):
```typescript
// DELETE all of these:
const [profileState, setProfileState] = useState<ProfileState>("idle");
const [apiData, setApiData] = useState<ApiData | null>(null);
const [apiIssues, setApiIssues] = useState<ApiIssue[]>([]);
const [interpretation, setInterpretation] = useState<string | null>(null);
const [tileTexts, setTileTexts] = useState<TileTexts>({});
const [houseTexts, setHouseTexts] = useState<HouseTexts>({});
const [error, setError] = useState<string | null>(null);
const [birthDateStr, setBirthDateStr] = useState<string | null>(null);
const [isFirstReading, setIsFirstReading] = useState(false);
const profileFetchedForRef = useRef<string | null>(null);
```

**Remove the ProfileState type declaration** (it moves to the hook file):
```typescript
// DELETE:
type ProfileState = "idle" | "loading" | "found" | "not-found" | "error";
```

**Remove these imports** from App.tsx (they're now inside the hook):
```typescript
// DELETE from imports:
import { calculateAll, BirthData, ApiIssue } from "./services/api";
import { generateInterpretation } from "./services/gemini";
import {
  upsertAstroProfile,
  insertBirthData,
  insertNatalChart,
  fetchAstroProfile,
} from "./services/supabase";
import type { TileTexts, HouseTexts } from "./types/interpretation";
```

**Remove the entire profile-loading useEffect** (lines ~71-161) and the `handleSubmit`, `handleRegenerate`, `handleReset` functions.

**Add the hook call** after the other hook calls:
```typescript
import { useAstroProfile } from "./hooks/useAstroProfile";

// In the component body, replace removed state with:
const {
  profileState,
  apiData,
  apiIssues,
  interpretation,
  tileTexts,
  houseTexts,
  birthDateStr,
  isFirstReading,
  isLoading,
  error,
  handleSubmit,
  handleRegenerate,
  handleReset,
} = useAstroProfile(user, lang);
```

**Keep in App.tsx:** `isLoading` state for the hook return, `showSplash`/`siteVisible` states, `ambiente` hook, `handleEnter`, and all JSX rendering.

### Step 6: Run full test suite

```bash
npm run lint
npx vitest run
```

Expected: No TypeScript errors, all tests pass.

### Step 7: Smoke test the full app flow

```bash
# Terminal 1
npm run dev
# Terminal 2
PORT=3001 node server.mjs
```

Open http://localhost:3000, log in, verify Dashboard loads with profile data.

### Step 8: Commit

```bash
git add src/hooks/useAstroProfile.ts src/App.tsx src/__tests__/useAstroProfile.test.ts
git commit -m "refactor: extract useAstroProfile hook from App.tsx"
```

---

## Task 4: Type the `astro_json` Profile Blob

**Files:**
- Modify: `src/types/bafe.ts`
- Modify: `src/hooks/useAstroProfile.ts`

**Context:** When a user's profile is loaded, `profile.astro_json` is cast to `any` and accessed via dual-path logic (`json.bazi ?? json.bafe?.bazi`). This task adds typed parsing that makes the dual-path explicit and compiler-checked. The "legacy" format (data nested under `bafe` key) was used before 2026-03-01; new profiles use the flat format.

### Step 1: Write the test

Add to `src/__tests__/useAstroProfile.test.ts`:

```typescript
import { parseAstroProfileJson } from '../types/bafe';

describe('parseAstroProfileJson', () => {
  it('parses v1 flat format', () => {
    const input = {
      version: 1 as const,
      bazi: { day_master: 'Jia', zodiac_sign: 'Rat' },
      western: { zodiac_sign: 'Aries', moon_sign: 'Taurus', ascendant_sign: 'Gemini', houses: {} },
      wuxing: { dominant_element: 'Wood', elements: { Wood: 3 } },
      fusion: {},
      tst: {},
      interpretation: 'Hello',
      tiles: { sun: 'Sun' },
      houses: {},
    };
    const result = parseAstroProfileJson(input);
    expect(result?.interpretation).toBe('Hello');
    expect(result?.apiData.bazi?.day_master).toBe('Jia');
    expect(result?.tiles.sun).toBe('Sun');
  });

  it('parses legacy bafe-nested format', () => {
    const input = {
      bafe: {
        bazi: { day_master: 'Yi', zodiac_sign: 'Ox' },
        western: { zodiac_sign: 'Scorpio', moon_sign: 'Leo', ascendant_sign: 'Virgo', houses: {} },
        wuxing: { dominant_element: 'Fire', elements: {} },
        fusion: {},
        tst: {},
        interpretation: 'Legacy text',
      },
    };
    const result = parseAstroProfileJson(input);
    expect(result?.interpretation).toBe('Legacy text');
    expect(result?.apiData.bazi?.day_master).toBe('Yi');
  });

  it('returns null for null input', () => {
    expect(parseAstroProfileJson(null)).toBeNull();
  });
});
```

### Step 2: Run tests to verify they fail

```bash
npx vitest run src/__tests__/useAstroProfile.test.ts -t "parseAstroProfileJson"
```

Expected: FAIL — `parseAstroProfileJson` not exported yet.

### Step 3: Add types and parser to `src/types/bafe.ts`

Append to the end of `src/types/bafe.ts`:

```typescript
// ── AstroProfileJson — versioned storage format ──────────────────────
// v1 (current): flat format, explicit version field
// legacy (pre-2026-03): BAFE data nested under 'bafe' key, no version

export interface AstroProfileJsonV1 {
  version: 1;
  bazi: MappedBazi | undefined;
  western: MappedWestern | undefined;
  fusion: BafeFusionResponse | undefined;
  wuxing: MappedWuxing | undefined;
  tst: BafeTstResponse | undefined;
  interpretation: string;
  tiles: Record<string, string>;
  houses: Record<string, string>;
}

interface AstroProfileJsonLegacy {
  version?: never;
  bafe?: {
    bazi?: unknown;
    western?: unknown;
    fusion?: unknown;
    wuxing?: unknown;
    tst?: unknown;
    interpretation?: string;
  };
  // Pre-legacy: some profiles had these at top level
  bazi?: unknown;
  western?: unknown;
  fusion?: unknown;
  wuxing?: unknown;
  tst?: unknown;
  interpretation?: string;
  tiles?: unknown;
  houses?: unknown;
}

export type AstroProfileJson = AstroProfileJsonV1 | AstroProfileJsonLegacy;

export interface ParsedAstroProfile {
  apiData: ApiData;
  interpretation: string;
  tiles: Record<string, string>;
  houses: Record<string, string>;
}

export function parseAstroProfileJson(raw: unknown): ParsedAstroProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const json = raw as AstroProfileJson;

  let bazi: unknown;
  let western: unknown;
  let fusion: unknown;
  let wuxing: unknown;
  let tst: unknown;
  let interpretation: string;
  let tiles: Record<string, string>;
  let houses: Record<string, string>;

  if ('version' in json && json.version === 1) {
    // V1 flat format
    bazi = json.bazi;
    western = json.western;
    fusion = json.fusion;
    wuxing = json.wuxing;
    tst = json.tst;
    interpretation = json.interpretation || '';
    tiles = json.tiles || {};
    houses = json.houses || {};
  } else {
    // Legacy format — data may be under 'bafe' key or at top level
    const legacy = json as AstroProfileJsonLegacy;
    bazi    = legacy.bazi    ?? legacy.bafe?.bazi;
    western = legacy.western ?? legacy.bafe?.western;
    fusion  = legacy.fusion  ?? legacy.bafe?.fusion;
    wuxing  = legacy.wuxing  ?? legacy.bafe?.wuxing;
    tst     = legacy.tst     ?? legacy.bafe?.tst;
    interpretation = (legacy.interpretation ?? legacy.bafe?.interpretation) || '';
    const rawTiles = legacy.tiles;
    tiles = (rawTiles && typeof rawTiles === 'object' && !Array.isArray(rawTiles))
      ? (rawTiles as Record<string, string>) : {};
    const rawHouses = legacy.houses;
    houses = (rawHouses && typeof rawHouses === 'object' && !Array.isArray(rawHouses))
      ? (rawHouses as Record<string, string>) : {};
  }

  return {
    apiData: {
      bazi: bazi as MappedBazi | undefined,
      western: western as MappedWestern | undefined,
      fusion: fusion as BafeFusionResponse | undefined,
      wuxing: wuxing as MappedWuxing | undefined,
      tst: tst as BafeTstResponse | undefined,
    },
    interpretation,
    tiles,
    houses,
  };
}
```

### Step 4: Use the parser in `useAstroProfile.ts`

In the profile-loading effect inside `useAstroProfile.ts`, replace the `as any` block:

```typescript
// Before:
if (profile?.astro_json) {
  const json = profile.astro_json as any;
  const bazi    = json.bazi    ?? json.bafe?.bazi;
  // ... etc

// After:
if (profile?.astro_json) {
  const parsed = parseAstroProfileJson(profile.astro_json);
  if (!parsed) {
    setProfileState("not-found");
    return;
  }
  const { apiData: restoredData, interpretation: storedInterpretation, tiles: storedTiles, houses: storedHouses } = parsed;
  setApiData(restoredData);
```

Add the import to `useAstroProfile.ts`:
```typescript
import { parseAstroProfileJson } from '../types/bafe';
```

Then adjust the rest of the profile loading to use `restoredData`, `storedInterpretation`, `storedTiles`, `storedHouses` (instead of the old json.* references).

### Step 5: Run all tests

```bash
npx vitest run
```

Expected: All tests pass including the 3 parseAstroProfileJson tests.

### Step 6: Commit

```bash
git add src/types/bafe.ts src/hooks/useAstroProfile.ts
git commit -m "feat: add typed AstroProfileJson parser, remove as-any in profile restore"
```

---

## Task 5: Document `lme` Module in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Context:** `src/lib/lme/types.ts` is the event type boundary between the quiz system and the Fusion Ring engine. "lme" = Lifecycle Mapping Engine. It's imported by `useFusionRing.ts` but not mentioned anywhere in project docs.

### Step 1: Add to Key Modules table in CLAUDE.md

Find the line:
```
| `src/components/QuizOverlay.tsx` | Modal overlay that hosts the quiz system; launched from Dashboard |
```

Add directly after it:
```
| `src/lib/lme/types.ts` | Lifecycle Mapping Engine event types — `ContributionEvent`, `Marker`, `TraitScore`, `Tag`. This is the typed contract between quizzes and the Fusion Ring; quizzes emit `ContributionEvent`s, `useFusionRing` consumes them |
```

### Step 2: Commit

```bash
git add CLAUDE.md
git commit -m "docs: document lme module in CLAUDE.md"
```

---

## Final Verification

After all tasks are complete:

```bash
npm run lint       # Zero TypeScript errors
npx vitest run     # All tests pass
npm run build      # Clean production build
```

Check that the BAFE proxy actually rejects unauthenticated requests in production by checking Railway logs after deploy.
