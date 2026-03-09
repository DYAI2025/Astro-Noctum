# BAFE Contract Alignment — Bazodiac Consumer-Side Hardening

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bazodiac's BAFE-Integration typsicher und contract-aware machen, abgestimmt auf BAFE's Stabilisierungsplan (C0-C3).

**Architecture:** Schrittweises Hardening der Consumer-Seite: Zuerst BAFE-Response-Typen aus aktuellen Daten ableiten (characterization), dann Error-Handling standardisieren, dann auf generierten Client umsteigen sobald BAFE's OpenAPI steht. Jede Task ist unabhaengig deploybar.

**Tech Stack:** TypeScript, Vite, Express (server.mjs), Vitest (neu), openapi-typescript (spaeter)

**Abgleich BAFE-Stabilisierung vs. Bazodiac Status:**

| BAFE Iteration | Was BAFE macht | Bazodiac heute | Was Bazodiac braucht |
|---|---|---|---|
| C0 (OpenAPI Baseline) | OpenAPI exportieren + CI-Gate | Kein Bezug zum Spec | Nichts — rein BAFE-seitig |
| C1 (/validate typisieren) | /validate in OpenAPI referenziert | /validate wird nicht genutzt | Nichts — kein Bazodiac-Endpoint |
| C2 (Response Schemas) | Typed ResponseModels fuer alle Endpoints, standardisierte Fehler (422/503/500) | `ApiResults` hat `unknown` fuer alle 5 Endpoints, Mapper hand-rolled, keine Fehlertypen | **Typen definieren, Error-Handling vorbereiten** |
| C3 (Codegen + Contract Tests) | TS-Client generierbar, Contract-Tests in CI | Kein generierter Client, keine Contract-Tests | **Generierten Client einbinden, Snapshot-Tests** |

**Was jetzt schon geht (vor BAFE C2/C3):**
- Task 1-3: Response-Typen aus Characterization ableiten, `unknown` ersetzen
- Task 4: Error-Handling fuer BAFE's kuenftige Error-Envelope vorbereiten
- Task 5: Vitest + Snapshot-Tests fuer BAFE-Mapper

**Was auf BAFE wartet:**
- Task 6: Generierten TS-Client aus OpenAPI einbinden (braucht C2+C3)

---

## Task 1: BAFE Response Types definieren (Characterization)

**Ziel:** Die 5 `unknown` Types in `ApiResults` durch echte Interfaces ersetzen, basierend auf den aktuellen BAFE-Responses.

**Files:**
- Create: `src/types/bafe.ts`
- Modify: `src/services/api.ts`

**Step 1: Response-Typen aus aktuellen BAFE-Daten ableiten**

Erstelle `src/types/bafe.ts` mit Interfaces fuer alle 5 Endpoints. Diese bilden die BAFE-Responses ab **wie sie heute ankommen** (German keys), plus die gemappten Varianten:

```typescript
// src/types/bafe.ts
// Characterization types — derived from actual BAFE responses (2026-03).
// Will be replaced by generated types once BAFE OpenAPI (C2/C3) is stable.

// ── Raw BAFE shapes (German keys as BAFE returns them) ──────────────

export interface BafePillarRaw {
  stamm?: string;
  zweig?: string;
  tier?: string;
  element?: string;
  // English fallbacks (BAFE may switch)
  stem?: string;
  branch?: string;
  animal?: string;
}

export interface BafeBaziResponse {
  pillars?: {
    year: BafePillarRaw;
    month: BafePillarRaw;
    day: BafePillarRaw;
    hour: BafePillarRaw;
  };
  chinese?: {
    day_master?: string;
    year?: { animal?: string };
  };
  [key: string]: unknown; // allow extra fields we don't map yet
}

export interface BafeWesternBody {
  zodiac_sign?: number; // 0-based index
  longitude?: number;
  latitude?: number;
  speed?: number;
}

export interface BafeWesternResponse {
  bodies?: Record<string, BafeWesternBody>;
  angles?: { Ascendant?: number; MC?: number; [key: string]: number | undefined };
  houses?: Record<string, number | string>;
  [key: string]: unknown;
}

export interface BafeWuxingResponse {
  wu_xing_vector?: Record<string, number>; // {Holz: x, Feuer: x, ...}
  dominant_element?: string;
  [key: string]: unknown;
}

export interface BafeFusionResponse {
  theme?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface BafeTstResponse {
  [key: string]: unknown; // TST shape not yet characterized
}

// ── Mapped shapes (what Dashboard consumes after api.ts transforms) ──

export interface MappedPillar {
  stem: string;
  branch: string;
  animal: string;
  element: string;
}

export interface MappedBazi {
  pillars?: {
    year: MappedPillar;
    month: MappedPillar;
    day: MappedPillar;
    hour: MappedPillar;
  };
  day_master: string;
  zodiac_sign: string;
  [key: string]: unknown;
}

export interface MappedWestern {
  zodiac_sign?: string;  // English name
  moon_sign?: string;    // English name
  ascendant_sign?: string;
  houses: Record<string, string>;
  bodies?: Record<string, BafeWesternBody>;
  angles?: Record<string, number | undefined>;
  [key: string]: unknown;
}

export interface MappedWuxing {
  elements: Record<string, number>;
  dominant_element: string;
  wu_xing_vector?: Record<string, number>;
  [key: string]: unknown;
}
```

**Step 2: ApiResults typisieren**

In `src/services/api.ts` die Imports hinzufuegen und `unknown` ersetzen:

```typescript
// api.ts — replace the unknown types
import type {
  BafeBaziResponse,
  BafeWesternResponse,
  BafeFusionResponse,
  BafeWuxingResponse,
  BafeTstResponse,
  MappedBazi,
  MappedWestern,
  MappedWuxing,
} from '@/src/types/bafe';

export interface ApiResults {
  bazi: MappedBazi;
  western: MappedWestern;
  fusion: BafeFusionResponse;
  wuxing: MappedWuxing;
  tst: BafeTstResponse;
  issues: ApiIssue[];
  _reading_id?: number | null;
}
```

Und die Funktionssignaturen anpassen:
- `calculateBazi`: Return-Type `Promise<MappedBazi>`
- `calculateWestern`: Return-Type `Promise<MappedWestern>`
- `calculateWuxing`: Return-Type `Promise<MappedWuxing>`
- `calculateFusion`: Return-Type `Promise<BafeFusionResponse>`
- `calculateTst`: Return-Type `Promise<BafeTstResponse>`

**Step 3: Type-Check**

Run: `npx tsc --noEmit`
Expected: PASS — alle Dashboard-Komponenten sollten kompatibel sein dank `[key: string]: unknown` Escape-Hatch.

**Step 4: Commit**

```
feat: add BAFE response types (characterization-based)
```

---

## Task 2: MOCK_DATA typsicher machen

**Ziel:** Fallback-Daten matchen die neuen Typen, kein silent type mismatch.

**Files:**
- Modify: `src/services/api.ts`

**Step 1: MOCK_DATA an Mapped-Types anpassen**

```typescript
const MOCK_DATA: {
  bazi: MappedBazi;
  western: MappedWestern;
  wuxing: MappedWuxing;
  fusion: BafeFusionResponse;
  tst: BafeTstResponse;
} = {
  bazi: {
    day_master: "",
    zodiac_sign: "",
    pillars: undefined,
  },
  western: {
    zodiac_sign: "",
    moon_sign: "",
    ascendant_sign: "",
    houses: {},
  },
  wuxing: {
    dominant_element: "",
    elements: {},
  },
  fusion: {},
  tst: {},
};
```

**Step 2: Type-Check**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```
fix: type-safe MOCK_DATA for BAFE fallback responses
```

---

## Task 3: postCalculation generisch typisieren

**Ziel:** `postCalculation` gibt typisierte Responses zurueck statt `any`.

**Files:**
- Modify: `src/services/api.ts`

**Step 1: Generic Type Parameter hinzufuegen**

```typescript
async function postCalculation<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const res = await fetchWithTimeout(`${BASE_URL}/calculate/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "No response body");
    throw new Error(`Failed to calculate ${endpoint}: ${res.status} ${details}`);
  }

  return res.json() as Promise<T>;
}
```

**Step 2: Aufrufe typisieren**

```typescript
// In calculateBazi:
const raw = await postCalculation<BafeBaziResponse>("bazi", { ... });

// In calculateWestern:
const raw = await postCalculation<BafeWesternResponse>("western", { ... });

// In calculateWuxing:
const raw = await postCalculation<BafeWuxingResponse>("wuxing", { ... });

// In calculateFusion:
return postCalculation<BafeFusionResponse>("fusion", { ... });

// In calculateTst:
return postCalculation<BafeTstResponse>("tst", { ... });
```

**Step 3: mapPillar typisieren**

```typescript
const mapPillar = (p: BafePillarRaw | undefined): MappedPillar => ({
  stem: p?.stamm || p?.stem || "",
  branch: p?.zweig || p?.branch || "",
  animal: p?.tier || p?.animal || "",
  element: p?.element || "",
});
```

**Step 4: Type-Check**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```
feat: generic-typed postCalculation + typed BAFE mappers
```

---

## Task 4: Standardisierte BAFE-Fehler vorbereiten (Error Envelope)

**Ziel:** Wenn BAFE C2 standardisierte Fehler liefert (422/503/500 mit Problem+JSON), kann Bazodiac sie parsen und dem User sinnvolle Meldungen zeigen. Bis dahin: graceful fallback.

**Files:**
- Modify: `src/types/bafe.ts`
- Modify: `src/services/api.ts`

**Step 1: Error-Type definieren**

In `src/types/bafe.ts` ergaenzen:

```typescript
// RFC 9457 Problem Details — BAFE will adopt this in C2
export interface BafeProblemDetail {
  type?: string;    // URI reference
  title?: string;   // Short summary
  status?: number;  // HTTP status
  detail?: string;  // Human-readable explanation
  instance?: string;
}
```

**Step 2: postCalculation Error-Handling erweitern**

```typescript
async function postCalculation<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const res = await fetchWithTimeout(`${BASE_URL}/calculate/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;

    // Try parsing as Problem+JSON (BAFE C2 format)
    try {
      const problem: BafeProblemDetail = JSON.parse(text);
      if (problem.detail) detail = problem.detail;
      else if (problem.title) detail = problem.title;
    } catch {
      // Not JSON — use raw text
    }

    throw new Error(`Failed to calculate ${endpoint}: ${res.status} ${detail}`);
  }

  return res.json() as Promise<T>;
}
```

**Step 3: Type-Check**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```
feat: prepare for BAFE Problem+JSON error responses (C2 alignment)
```

---

## Task 5: server.mjs — BAFE Error Handling + Cache-Bypass fuer Fehler

**Ziel:** Server-seitige Proxy-Logik haertet Error-Handling. Stellt sicher, dass nur 2xx gecacht wird (schon der Fall) und dass Error-Responses sauber weitergereicht werden.

**Files:**
- Modify: `server.mjs`

**Step 1: Debug-BAFE Endpoint um Cache-Status erweitern**

Im `/api/debug-bafe` Handler zusaetzliche Info zurueckgeben:

```javascript
res.json({
  bafe_public_url: BAFE_PUBLIC_URL,
  bafe_internal_url: BAFE_INTERNAL_URL,
  bafe_active: BAFE_BASE_URL,
  cache: {
    size: bafeCache.size,
    ttl_hours: CACHE_TTL / (60 * 60 * 1000),
  },
  probes: results,
});
```

**Step 2: Type-Check**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```
feat: expose cache stats in /api/debug-bafe
```

---

## Task 6: [WARTET AUF BAFE C2+C3] Generierten TypeScript-Client einbinden

**Vorbedingung:** BAFE hat OpenAPI 3.1 Spec exportiert (C0) und alle Response-Schemas geschlossen (C2).

**Ziel:** Characterization-Types aus Task 1 durch generierte Types ersetzen.

**Files:**
- Modify: `package.json` (neues devDependency: `openapi-typescript`)
- Create: `src/types/bafe-generated.ts` (generiert)
- Modify: `src/types/bafe.ts` (re-export aus generated)
- Modify: `src/services/api.ts` (Mapper ggf. anpassen)

**Step 1: openapi-typescript installieren**

```bash
npm install -D openapi-typescript
```

**Step 2: npm script hinzufuegen**

In `package.json`:
```json
"scripts": {
  "generate:bafe-types": "npx openapi-typescript https://bafe-production.up.railway.app/openapi.json -o src/types/bafe-generated.ts"
}
```

**Step 3: Generierte Types erzeugen**

```bash
npm run generate:bafe-types
```

**Step 4: bafe.ts auf generated umstellen**

```typescript
// src/types/bafe.ts
// Re-export from generated types (BAFE OpenAPI C2+C3)
export type {
  components,
  paths,
} from './bafe-generated';

// Mapped types bleiben hier — die sind Bazodiac-spezifisch
export interface MappedPillar { ... }
export interface MappedBazi { ... }
// etc.
```

**Step 5: Mapper in api.ts anpassen falls BAFE Keys sich aendern**

Wenn BAFE in C2 von German auf English Keys wechselt, werden die `stamm/zweig/tier`-Mapper obsolet. Dann:
- Mapper vereinfachen (kein DE→EN mehr noetig)
- Oder entfernen wenn 1:1

**Step 6: Type-Check + Commit**

```
feat: use generated BAFE types from OpenAPI spec (C2/C3)
```

---

## Zusammenfassung

| Task | Abhaengigkeit | Was passiert |
|------|---------------|-------------|
| 1 | Keine | BAFE Response Types definieren (Characterization) |
| 2 | Task 1 | MOCK_DATA typsicher machen |
| 3 | Task 1 | postCalculation generisch typisieren |
| 4 | Task 1 | Problem+JSON Error-Handling vorbereiten |
| 5 | Keine | Cache-Stats in /api/debug-bafe |
| 6 | BAFE C2+C3 | Generierte Types einbinden (spaeter) |

**Tasks 1-5 sind jetzt implementierbar.** Task 6 wartet auf BAFE.
