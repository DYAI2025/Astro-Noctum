# Onboarding-Signatur & Daily-Horoscope-Fusion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Shift user entry from "complex dashboard immediately" to "Signature first, daily reading second" — showing the personal Signature in onboarding, letting a quiz visibly change it, then presenting a fused Daily Horoscope modal on first Dashboard visit.

**Architecture:** FuFirE gets a new `/experience` router with 3 endpoints (bootstrap, signature-delta, daily) that bundle all compute into single responses. Astro-Noctum remains the UI/session/persistence layer — it calls FuFirE, caches results in Supabase, and renders the Signature + Daily Modal. No breaking changes to existing endpoints.

**Tech Stack:** Python/FastAPI (FuFirE), React 19/TypeScript/Tailwind v4 (Astro-Noctum), Supabase (persistence), Vitest (frontend tests), pytest (backend tests)

**Source Specs:**
- `Dev_brief/entwicklungsauftrag_onboarding_signatur_und_daily.md`
- `Dev_brief/4_konkrete_neue_api_contracts_in_fufire_4_1_post_.md`

---

## Codebase Orientation

### FuFirE (Fusion Firmament Engine)
- **Location:** `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/`
- **Git remote:** `DYAI2025/BAFE`
- **Framework:** FastAPI, Python 3.10+, Pydantic v2
- **App factory:** `bazi_engine/app.py` — mounts all routers, registers exception handlers
- **Router dir:** `bazi_engine/routers/` — one file per domain (bazi.py, western.py, fusion.py, transit.py, etc.)
- **Service dir:** `bazi_engine/services/` — currently only auth.py, geocoding.py
- **Core modules:** `bazi_engine/bazi.py`, `bazi_engine/western.py`, `bazi_engine/fusion.py`, `bazi_engine/transit.py`, `bazi_engine/narrative.py`
- **Wu-Xing:** `bazi_engine/wuxing/` subpackage (constants, vector, analysis, calibration, zones)
- **Ephemeris:** `bazi_engine/ephemeris.py` — Swiss Ephemeris wrapper
- **Tests:** `tests/` — 58 test files, snapshots in `tests/snapshots/`
- **OpenAPI:** `spec/openapi/openapi.json` — auto-generated, CI drift-gate
- **Import hierarchy enforced:** Level 0 (constants) → Level 4 (bazi, western, fusion, transit) → Level 5 (app, routers)
- **Affinity tools:** `tools/affinity_math.py`, `tools/affinity_descriptions.json`, `tools/derive_affinity.py`

### Astro-Noctum (Frontend + Server Proxy)
- **Location:** `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/`
- **Git remote:** `DYAI2025/Astro-Noctum`
- **Framework:** React 19, Vite, TypeScript, Tailwind v4, React Router v6
- **Entry point:** `src/App.tsx` — state machine: Splash → AuthGate → BirthForm → Dashboard
- **Server proxy:** `server.mjs` — Express, proxies to FuFirE/BAFE, Supabase admin, Stripe, ElevenLabs
- **Supabase client:** `src/lib/supabase.ts` (browser), `server.mjs` (admin with service role key)
- **BAFE proxy:** `server.mjs` lines 99-200 — 5 parallel requests to `/calculate/{bazi,western,fusion,wuxing,tst}`
- **Fusion Ring:** `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` — Canvas WebGL, 12→32pt interpolation
- **Signal hook:** `src/hooks/useFusionSignal.ts` — polls `/api/transit-state/:userId`
- **Quiz system:** 22 quizzes in `src/components/quizzes/`, contribution via `src/hooks/useQuizContribution.ts`
- **Affinity map:** `src/lib/fusion-ring/affinity-map.ts` — 80+ keywords → 12-sector weights
- **Clusters:** `src/lib/fusion-ring/clusters.ts` — 6 clusters, completion gating
- **Horoscope service:** `src/lib/horoscope/horoscope-service.ts` — existing daily horoscope (transit-based)
- **Horoscope hook:** `src/hooks/useDailyHoroscope.ts` — 24h localStorage cache
- **Tests:** `src/__tests__/`, Vitest
- **Path alias:** `@/*` maps to project root (not src/)

---

## Milestone Overview

| ID | Milestone | Scope | Depends On |
|----|-----------|-------|------------|
| M0 | Hardening Baseline | FuFirE snapshot-drift fix, ephemeris pinning | — |
| M1 | Shared Data Contracts | Canonical affinity map, Pydantic/Zod schemas | M0 |
| M2 | FuFirE Experience API | 3 new endpoints + services + tests | M1 |
| M3 | Supabase Schema Extension | New tables for signature state + daily cache | — |
| M4 | Onboarding Signature Flow | Frontend: signature reveal + quiz delta | M2, M3 |
| M5 | Dashboard Daily Modal | Frontend: first-run modal + persistent widget | M2, M3 |
| M6 | QA & Rollout | e2e tests, feature flags, staged deploy | M4, M5 |

---

## M0: Hardening Baseline (FuFirE)

### Task 0.1: Pin Swiss Ephemeris data in deploy

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/Dockerfile` (or equivalent deploy config)
- Modify: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/ephemeris.py`

**Step 1: Verify current ephemeris data location**

```bash
cd /Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE
grep -r "swe.set_ephe_path" bazi_engine/
```

**Step 2: Ensure ephemeris files are bundled in deploy image**

The deploy image must include Swiss Ephemeris `.se1` files and `tzdata`. Add explicit checks:

```python
# In ephemeris.py, add at module load:
import os
_EPHE_PATH = os.environ.get("SWISSEPH_PATH", str(Path(__file__).parent.parent / "ephe"))
swe.set_ephe_path(_EPHE_PATH)
assert_no_moseph_fallback()  # already exists — ensure it runs at startup
```

**Step 3: Add provenance assertion test**

```python
# tests/test_ephemeris_provenance.py
def test_swiss_ephemeris_not_moshier():
    """Ensure we never silently fall back to Moshier approximation."""
    from bazi_engine.ephemeris import assert_no_moseph_fallback
    assert_no_moseph_fallback()  # raises if fallback detected
```

**Step 4: Run existing test suite, identify snapshot drift**

```bash
cd /Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE
python -m pytest tests/ -v --tb=short 2>&1 | tail -40
```

**Step 5: Fix snapshot drift**

Categorize failures into:
- **Semantically stable** (planetary positions, pillar calculations) → fix if wrong, update golden if precision improved
- **Environment-dependent** (timestamps, version strings) → mark as env-dependent in snapshot config

**Step 6: Commit**

```bash
git add -A && git commit -m "fix(hardening): pin ephemeris data, fix snapshot drift

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 0.2: Regenerate OpenAPI baseline

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/spec/openapi/openapi.json`

**Step 1: Export current OpenAPI**

```bash
cd /Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE
python scripts/export_openapi.py
```

**Step 2: Verify CI drift gate passes**

```bash
python scripts/export_openapi.py --check
```

**Step 3: Commit if changed**

```bash
git add spec/openapi/openapi.json && git commit -m "chore: regenerate openapi baseline

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## M1: Shared Data Contracts

### Task 1.1: Create canonical affinity map as shared JSON in FuFirE

**Files:**
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/data/affinity_map.json`
- Modify: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/services/quiz_affinity.py` (new)
- Modify: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/fusion-ring/affinity-map.ts` (eventually auto-generated)

**Why:** The dev brief explicitly warns against dual-maintained affinity maps. FuFirE must be the single source of truth.

**Step 1: Write the test for affinity loading**

```python
# tests/test_quiz_affinity.py
import json
from pathlib import Path

def test_affinity_map_loads():
    path = Path(__file__).parent.parent / "bazi_engine" / "data" / "affinity_map.json"
    data = json.loads(path.read_text())
    assert "keywords" in data
    assert len(data["keywords"]) > 70
    for key, weights in data["keywords"].items():
        assert len(weights) == 12, f"{key} must have 12 sectors"
        assert abs(sum(weights) - 1.0) < 0.05, f"{key} sum must be ~1.0"

def test_affinity_map_has_tags():
    path = Path(__file__).parent.parent / "bazi_engine" / "data" / "affinity_map.json"
    data = json.loads(path.read_text())
    assert "tags" in data
    for key, weights in data["tags"].items():
        assert len(weights) == 12
```

**Step 2: Run test — expect FAIL**

```bash
python -m pytest tests/test_quiz_affinity.py -v
```

Expected: FAIL (file doesn't exist)

**Step 3: Create the canonical affinity map JSON**

Extract the current TypeScript `AFFINITY_MAP` and `TAG_AFFINITY` from `src/lib/fusion-ring/affinity-map.ts` into:

```json
{
  "version": "affinity_v1",
  "description": "Canonical quiz keyword → 12-sector weight mapping",
  "keywords": {
    "love": [0, 0.1, 0, 0.3, 0, 0, 0.3, 0.3, 0, 0, 0, 0],
    "emotion": [0, 0.2, 0, 0.4, 0.1, 0, 0.1, 0.2, 0, 0, 0, 0],
    ...all 80+ entries from affinity-map.ts...
  },
  "tags": {
    "guardian": [0.2, 0, 0, 0.3, 0, 0, 0, 0, 0, 0.3, 0.1, 0.1],
    "flame": [0.1, 0, 0, 0, 0.3, 0, 0, 0.4, 0, 0, 0, 0.2],
    "healer": [0, 0, 0, 0.2, 0, 0.2, 0, 0, 0, 0, 0, 0.6],
    "trickster": [0, 0, 0.4, 0, 0, 0, 0, 0, 0.3, 0, 0.2, 0.1],
    "warrior": [0.5, 0, 0, 0, 0.2, 0, 0, 0.2, 0, 0.1, 0, 0]
  }
}
```

**Step 4: Run test — expect PASS**

```bash
python -m pytest tests/test_quiz_affinity.py -v
```

**Step 5: Create quiz_affinity.py service**

```python
# bazi_engine/services/quiz_affinity.py
"""Canonical quiz keyword → sector weight resolver."""
from __future__ import annotations
import json
from pathlib import Path
from typing import List

_MAP_PATH = Path(__file__).parent.parent / "data" / "affinity_map.json"
_MAP = json.loads(_MAP_PATH.read_text(encoding="utf-8"))

def resolve_quiz_sectors(keyword: str) -> List[float]:
    """Return 12-sector weights for a quiz keyword. Falls back to uniform."""
    weights = _MAP["keywords"].get(keyword) or _MAP["tags"].get(keyword)
    if weights:
        return weights
    return [1/12] * 12  # uniform fallback
```

**Step 6: Commit**

```bash
git add bazi_engine/data/affinity_map.json bazi_engine/services/quiz_affinity.py tests/test_quiz_affinity.py
git commit -m "feat(M1): canonical affinity map as shared JSON + quiz_affinity service

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.2: Define Pydantic schemas for Experience API contracts

**Files:**
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/routers/experience.py`
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/tests/test_experience_schemas.py`

**Step 1: Write schema validation tests**

```python
# tests/test_experience_schemas.py
from pydantic import ValidationError
import pytest

def test_bootstrap_request_valid():
    from bazi_engine.routers.experience import BootstrapRequest
    req = BootstrapRequest(
        birth={"date": "1990-08-14", "time": "07:42:00", "tz": "Europe/Berlin",
               "lat": 53.5511, "lon": 9.9937, "place_label": "Hamburg, DE"},
        locale="de-DE"
    )
    assert req.birth.lat == 53.5511

def test_bootstrap_request_rejects_invalid_lat():
    from bazi_engine.routers.experience import BootstrapRequest
    with pytest.raises(ValidationError):
        BootstrapRequest(
            birth={"date": "1990-08-14", "time": "07:42:00", "tz": "Europe/Berlin",
                   "lat": 999, "lon": 9.9937},
            locale="de-DE"
        )

def test_signature_delta_request_valid():
    from bazi_engine.routers.experience import SignatureDeltaRequest
    req = SignatureDeltaRequest(
        soulprint_sectors=[0.08]*12,
        signature_blueprint={"seed": "sig_v1_test"},
        quiz_answer={"keyword": "expression"}
    )
    assert req.quiz_answer.keyword == "expression"

def test_daily_request_valid():
    from bazi_engine.routers.experience import DailyRequest
    req = DailyRequest(
        birth={"date": "1990-08-14", "time": "07:42:00", "tz": "Europe/Berlin",
               "lat": 53.5511, "lon": 9.9937},
        soulprint_sectors=[0.08]*12,
        quiz_sectors=[0.0]*12,
        target_date="2026-03-16",
        locale="de-DE"
    )
    assert req.target_date == "2026-03-16"
```

**Step 2: Run test — expect FAIL**

```bash
python -m pytest tests/test_experience_schemas.py -v
```

**Step 3: Create experience.py router with Pydantic models (schemas only, no endpoint logic yet)**

```python
# bazi_engine/routers/experience.py
"""
routers/experience.py — Experience API endpoints.

POST /experience/bootstrap         — Onboarding: birth data → profile + signature
POST /experience/signature-delta   — Quiz answer → signature change
POST /experience/daily             — Daily horoscope bundle
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator

router = APIRouter(prefix="/experience", tags=["Experience"])


# ── Shared sub-models ─────────────────────────────────────────────────────────

class BirthInput(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}:\d{2}$")
    tz: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    place_label: Optional[str] = None

class VisualParams(BaseModel):
    symmetry: float = Field(..., ge=0, le=1)
    curvature: float = Field(..., ge=0, le=1)
    angularity: float = Field(..., ge=0, le=1)
    density: float = Field(..., ge=0, le=1)
    contrast: float = Field(..., ge=0, le=1)
    orbit_count: int = Field(..., ge=1, le=7)

class SignatureBlueprint(BaseModel):
    seed: str
    visual: Optional[VisualParams] = None
    elements: Optional[Dict[str, float]] = None

class ProfileSummary(BaseModel):
    sun_sign: str
    moon_sign: str
    ascendant_sign: str
    day_master: str
    harmony_index: float = Field(..., ge=0, le=1)

class MetaInfo(BaseModel):
    engine_version: str
    generated_at: Optional[str] = None


# ── POST /experience/bootstrap ────────────────────────────────────────────────

class BootstrapRequest(BaseModel):
    birth: BirthInput
    locale: str = "de-DE"

class BootstrapResponse(BaseModel):
    profile: ProfileSummary
    soulprint_sectors: List[float] = Field(..., min_length=12, max_length=12)
    signature_blueprint: SignatureBlueprint
    meta: MetaInfo


# ── POST /experience/signature-delta ──────────────────────────────────────────

class QuizAnswer(BaseModel):
    keyword: str

class SignatureDeltaRequest(BaseModel):
    soulprint_sectors: List[float] = Field(..., min_length=12, max_length=12)
    signature_blueprint: SignatureBlueprint
    quiz_answer: QuizAnswer

class SignatureDelta(BaseModel):
    curvature: float
    contrast: float
    density: float

class SignatureDeltaResponse(BaseModel):
    quiz_sectors: List[float] = Field(..., min_length=12, max_length=12)
    signature_delta: SignatureDelta
    signature_blueprint: SignatureBlueprint


# ── POST /experience/daily ────────────────────────────────────────────────────

class DailyRequest(BaseModel):
    birth: BirthInput
    soulprint_sectors: List[float] = Field(..., min_length=12, max_length=12)
    quiz_sectors: List[float] = Field(..., min_length=12, max_length=12)
    target_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    locale: str = "de-DE"

class DailyEvidence(BaseModel):
    transit_sectors: Optional[List[int]] = None
    natal_focus: Optional[List[str]] = None
    day_master: Optional[str] = None
    daily_pillar: Optional[Dict[str, str]] = None
    relation_to_day_master: Optional[str] = None

class DailySection(BaseModel):
    summary: str
    themes: List[str]
    caution: str
    opportunity: str
    evidence: DailyEvidence

class DailyFusion(BaseModel):
    summary: str
    synthesis: str
    action: str
    pushworthy: bool = False
    push_text: Optional[str] = None

class DailyResponse(BaseModel):
    date: str
    western: DailySection
    eastern: DailySection
    fusion: DailyFusion
    meta: MetaInfo


# ── Endpoint stubs (implemented in M2) ────────────────────────────────────────

@router.post("/bootstrap", response_model=BootstrapResponse)
async def bootstrap(req: BootstrapRequest, request: Request):
    raise NotImplementedError("M2: implement bootstrap endpoint")

@router.post("/signature-delta", response_model=SignatureDeltaResponse)
async def signature_delta(req: SignatureDeltaRequest, request: Request):
    raise NotImplementedError("M2: implement signature-delta endpoint")

@router.post("/daily", response_model=DailyResponse)
async def daily(req: DailyRequest, request: Request):
    raise NotImplementedError("M2: implement daily endpoint")
```

**Step 4: Run tests — expect PASS**

```bash
python -m pytest tests/test_experience_schemas.py -v
```

**Step 5: Register router in app.py**

In `bazi_engine/app.py`, add after the transit router import (line 27):

```python
from .routers import info, bazi, western, fusion, validate, chart, webhooks, transit, experience
```

And add after line 136 (`app.include_router(transit.router)`):

```python
app.include_router(experience.router)
```

And after line 149 (the v1 transit router):

```python
app.include_router(experience.router, prefix="/v1", dependencies=_protected)
```

**Step 6: Commit**

```bash
git add bazi_engine/routers/experience.py bazi_engine/app.py tests/test_experience_schemas.py
git commit -m "feat(M1): experience API contracts — Pydantic schemas + router stubs

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.3: Create Zod schemas for Astro-Noctum (client-side contract)

**Files:**
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/schemas/experience.ts`
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/__tests__/experience-schemas.test.ts`

**Step 1: Write test**

```typescript
// src/__tests__/experience-schemas.test.ts
import { describe, it, expect } from 'vitest';
import { BootstrapResponseSchema, SignatureDeltaResponseSchema, DailyResponseSchema } from '../lib/schemas/experience';

describe('Experience API Schemas', () => {
  it('validates bootstrap response', () => {
    const data = {
      profile: { sun_sign: 'Loewe', moon_sign: 'Waage', ascendant_sign: 'Jungfrau', day_master: 'Xin', harmony_index: 0.78 },
      soulprint_sectors: Array(12).fill(0.083),
      signature_blueprint: { seed: 'sig_v1_test', visual: { symmetry: 0.76, curvature: 0.43, angularity: 0.58, density: 0.61, contrast: 0.47, orbit_count: 3 }, elements: { Holz: 0.22, Feuer: 0.28, Erde: 0.19, Metall: 0.16, Wasser: 0.15 } },
      meta: { engine_version: '1.0.0' }
    };
    const result = BootstrapResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates daily response', () => {
    const data = {
      date: '2026-03-16',
      western: { summary: 'test', themes: ['Ausdruck'], caution: 'test', opportunity: 'test', evidence: { transit_sectors: [4, 8], natal_focus: ['sun'] } },
      eastern: { summary: 'test', themes: ['Disziplin'], caution: 'test', opportunity: 'test', evidence: { day_master: 'Xin', daily_pillar: { stem: 'Bing', branch: 'Wu' }, relation_to_day_master: 'power' } },
      fusion: { summary: 'test', synthesis: 'test', action: 'test', pushworthy: false },
      meta: { engine_version: '1.0.0', generated_at: '2026-03-16T06:00:00Z' }
    };
    const result = DailyResponseSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npx vitest run src/__tests__/experience-schemas.test.ts
```

**Step 3: Create Zod schemas**

```typescript
// src/lib/schemas/experience.ts
import { z } from 'zod';

// ── Shared ──────────────────────────────────────────────────────────
const VisualParamsSchema = z.object({
  symmetry: z.number().min(0).max(1),
  curvature: z.number().min(0).max(1),
  angularity: z.number().min(0).max(1),
  density: z.number().min(0).max(1),
  contrast: z.number().min(0).max(1),
  orbit_count: z.number().int().min(1).max(7),
});

const SignatureBlueprintSchema = z.object({
  seed: z.string(),
  visual: VisualParamsSchema.optional(),
  elements: z.record(z.string(), z.number()).optional(),
});

const ProfileSummarySchema = z.object({
  sun_sign: z.string(),
  moon_sign: z.string(),
  ascendant_sign: z.string(),
  day_master: z.string(),
  harmony_index: z.number().min(0).max(1),
});

const MetaInfoSchema = z.object({
  engine_version: z.string(),
  generated_at: z.string().optional(),
});

const Sectors12 = z.array(z.number()).length(12);

// ── Bootstrap ───────────────────────────────────────────────────────
export const BootstrapResponseSchema = z.object({
  profile: ProfileSummarySchema,
  soulprint_sectors: Sectors12,
  signature_blueprint: SignatureBlueprintSchema,
  meta: MetaInfoSchema,
});
export type BootstrapResponse = z.infer<typeof BootstrapResponseSchema>;

// ── Signature Delta ─────────────────────────────────────────────────
export const SignatureDeltaResponseSchema = z.object({
  quiz_sectors: Sectors12,
  signature_delta: z.object({
    curvature: z.number(),
    contrast: z.number(),
    density: z.number(),
  }),
  signature_blueprint: SignatureBlueprintSchema,
});
export type SignatureDeltaResponse = z.infer<typeof SignatureDeltaResponseSchema>;

// ── Daily ───────────────────────────────────────────────────────────
const DailyEvidenceSchema = z.object({
  transit_sectors: z.array(z.number().int()).optional(),
  natal_focus: z.array(z.string()).optional(),
  day_master: z.string().optional(),
  daily_pillar: z.object({ stem: z.string(), branch: z.string() }).optional(),
  relation_to_day_master: z.string().optional(),
});

const DailySectionSchema = z.object({
  summary: z.string(),
  themes: z.array(z.string()),
  caution: z.string(),
  opportunity: z.string(),
  evidence: DailyEvidenceSchema,
});

const DailyFusionSchema = z.object({
  summary: z.string(),
  synthesis: z.string(),
  action: z.string(),
  pushworthy: z.boolean(),
  push_text: z.string().optional(),
});

export const DailyResponseSchema = z.object({
  date: z.string(),
  western: DailySectionSchema,
  eastern: DailySectionSchema,
  fusion: DailyFusionSchema,
  meta: MetaInfoSchema,
});
export type DailyResponse = z.infer<typeof DailyResponseSchema>;
```

**Step 4: Run test — expect PASS**

```bash
npx vitest run src/__tests__/experience-schemas.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/schemas/experience.ts src/__tests__/experience-schemas.test.ts
git commit -m "feat(M1): Zod schemas for experience API contracts

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## M2: FuFirE Experience API Services

### Task 2.1: Soulprint Service

**Files:**
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/services/soulprint.py`
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/tests/test_soulprint.py`

**Purpose:** Compute 12-sector soulprint vector from natal signals (sun, moon, ascendant, personal planets, wu-xing balance).

**Step 1: Write failing test**

```python
# tests/test_soulprint.py
from bazi_engine.services.soulprint import compute_soulprint

def test_soulprint_returns_12_sectors():
    result = compute_soulprint(
        sun_sign_idx=4,      # Leo
        moon_sign_idx=6,     # Libra
        asc_sign_idx=5,      # Virgo
        personal_planets={"mercury": 4, "venus": 6, "mars": 0},
        wuxing_vector={"Holz": 0.22, "Feuer": 0.28, "Erde": 0.19, "Metall": 0.16, "Wasser": 0.15},
    )
    assert len(result) == 12
    assert abs(sum(result) - 1.0) < 0.01  # normalized

def test_soulprint_different_inputs_differ():
    a = compute_soulprint(sun_sign_idx=0, moon_sign_idx=0, asc_sign_idx=0,
                          personal_planets={}, wuxing_vector={"Holz":0.2,"Feuer":0.2,"Erde":0.2,"Metall":0.2,"Wasser":0.2})
    b = compute_soulprint(sun_sign_idx=6, moon_sign_idx=9, asc_sign_idx=3,
                          personal_planets={}, wuxing_vector={"Holz":0.5,"Feuer":0.1,"Erde":0.1,"Metall":0.2,"Wasser":0.1})
    assert a != b
```

**Step 2: Run — expect FAIL**

**Step 3: Implement soulprint.py**

The soulprint maps natal planetary positions to 12 sectors (each sector = 30 degrees of the zodiac). Sun gets weight 1.0, Moon 0.8, Asc 0.6, personal planets 0.4. Wu-Xing elements distribute across their associated sectors (Holz→3,4; Feuer→4,5; Erde→1,7; Metall→6,9; Wasser→8,11). Normalize to sum=1.0.

```python
# bazi_engine/services/soulprint.py
"""Compute 12-sector soulprint vector from natal signals."""
from __future__ import annotations
from typing import Dict, List, Optional

# Wu-Xing element → associated zodiac sectors (0-indexed, 30° each)
_WUXING_SECTORS: Dict[str, List[int]] = {
    "Holz": [3, 4],    # Cancer, Leo (growth)
    "Feuer": [4, 5],   # Leo, Virgo (heat)
    "Erde": [1, 7],    # Taurus, Scorpio (stability)
    "Metall": [6, 9],  # Libra, Capricorn (structure)
    "Wasser": [8, 11], # Sagittarius, Pisces (flow)
}

def compute_soulprint(
    sun_sign_idx: int,
    moon_sign_idx: int,
    asc_sign_idx: int,
    personal_planets: Dict[str, int],  # planet_name → sector_idx
    wuxing_vector: Dict[str, float],
) -> List[float]:
    """Return normalized 12-sector soulprint vector."""
    sectors = [0.0] * 12

    # Natal placements with weights
    sectors[sun_sign_idx % 12] += 1.0
    sectors[moon_sign_idx % 12] += 0.8
    sectors[asc_sign_idx % 12] += 0.6

    for planet, sector_idx in personal_planets.items():
        sectors[sector_idx % 12] += 0.4

    # Wu-Xing element distribution
    for element, weight in wuxing_vector.items():
        for sector_idx in _WUXING_SECTORS.get(element, []):
            sectors[sector_idx] += weight * 0.5  # scaled contribution

    # Normalize
    total = sum(sectors)
    if total > 0:
        sectors = [s / total for s in sectors]

    return sectors
```

**Step 4: Run — expect PASS**

**Step 5: Commit**

```bash
git add bazi_engine/services/soulprint.py tests/test_soulprint.py
git commit -m "feat(M2): soulprint service — natal 12-sector vector computation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.2: Signature Blueprint Service

**Files:**
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/services/signature_blueprint.py`
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/tests/test_signature_blueprint.py`

**Purpose:** Map soulprint sectors + wu-xing vector + harmony index → visual parameters (symmetry, curvature, angularity, density, contrast, orbit_count).

**Step 1: Write failing test**

```python
# tests/test_signature_blueprint.py
from bazi_engine.services.signature_blueprint import compute_signature_blueprint

def test_blueprint_returns_visual_params():
    result = compute_signature_blueprint(
        soulprint_sectors=[0.08, 0.02, 0.07, 0.10, 0.14, 0.12, 0.09, 0.05, 0.11, 0.10, 0.07, 0.05],
        wuxing_vector={"Holz": 0.22, "Feuer": 0.28, "Erde": 0.19, "Metall": 0.16, "Wasser": 0.15},
        harmony_index=0.78,
    )
    assert "seed" in result
    assert "visual" in result
    assert "elements" in result
    v = result["visual"]
    for key in ("symmetry", "curvature", "angularity", "density", "contrast"):
        assert 0 <= v[key] <= 1, f"{key} must be in [0,1]"
    assert 1 <= v["orbit_count"] <= 7

def test_blueprint_seed_is_deterministic():
    kwargs = dict(
        soulprint_sectors=[0.08]*12,
        wuxing_vector={"Holz": 0.2, "Feuer": 0.2, "Erde": 0.2, "Metall": 0.2, "Wasser": 0.2},
        harmony_index=0.5,
    )
    a = compute_signature_blueprint(**kwargs)
    b = compute_signature_blueprint(**kwargs)
    assert a["seed"] == b["seed"]

def test_different_inputs_produce_different_blueprints():
    a = compute_signature_blueprint([0.2]+[0.072]*11, {"Holz":0.5,"Feuer":0.1,"Erde":0.1,"Metall":0.2,"Wasser":0.1}, 0.3)
    b = compute_signature_blueprint([0.072]*11+[0.2], {"Holz":0.1,"Feuer":0.5,"Erde":0.1,"Metall":0.1,"Wasser":0.2}, 0.9)
    assert a["visual"] != b["visual"]
```

**Step 2: Run — expect FAIL**

**Step 3: Implement**

The visual parameters are derived deterministically:
- **symmetry** = 1 - variance of soulprint sectors (high variance → low symmetry)
- **curvature** = dominant wu-xing element weight (Wasser/Holz → high curvature)
- **angularity** = 1 - curvature (inverse relationship)
- **density** = sum of top-3 sector weights / total (concentration measure)
- **contrast** = max sector - min sector
- **orbit_count** = ceil(harmony_index * 5) + 1, clamped [2, 5]
- **seed** = `sig_v1_{hash of inputs}`

```python
# bazi_engine/services/signature_blueprint.py
"""Map natal profile → visual signature parameters."""
from __future__ import annotations
import hashlib
import json
import math
from typing import Any, Dict, List

def compute_signature_blueprint(
    soulprint_sectors: List[float],
    wuxing_vector: Dict[str, float],
    harmony_index: float,
) -> Dict[str, Any]:
    """Deterministic signature blueprint from natal data."""
    # Seed for reproducibility
    seed_input = json.dumps({"s": soulprint_sectors, "w": wuxing_vector, "h": harmony_index}, sort_keys=True)
    seed = "sig_v1_" + hashlib.sha256(seed_input.encode()).hexdigest()[:16]

    # Symmetry: inverse of sector variance
    mean = sum(soulprint_sectors) / len(soulprint_sectors)
    variance = sum((s - mean) ** 2 for s in soulprint_sectors) / len(soulprint_sectors)
    symmetry = max(0.0, min(1.0, 1.0 - math.sqrt(variance) * 10))

    # Curvature: fluid elements (Wasser + Holz)
    curvature = max(0.0, min(1.0, wuxing_vector.get("Wasser", 0) + wuxing_vector.get("Holz", 0)))

    # Angularity: structured elements (Metall + Feuer)
    angularity = max(0.0, min(1.0, wuxing_vector.get("Metall", 0) + wuxing_vector.get("Feuer", 0)))

    # Density: concentration of top-3 sectors
    sorted_sectors = sorted(soulprint_sectors, reverse=True)
    total = sum(soulprint_sectors) or 1.0
    density = max(0.0, min(1.0, sum(sorted_sectors[:3]) / total))

    # Contrast: max - min sector
    contrast = max(0.0, min(1.0, max(soulprint_sectors) - min(soulprint_sectors)))

    # Orbit count: 2-5 based on harmony
    orbit_count = max(2, min(5, math.ceil(harmony_index * 5) + 1))

    return {
        "seed": seed,
        "visual": {
            "symmetry": round(symmetry, 4),
            "curvature": round(curvature, 4),
            "angularity": round(angularity, 4),
            "density": round(density, 4),
            "contrast": round(contrast, 4),
            "orbit_count": orbit_count,
        },
        "elements": wuxing_vector,
    }
```

**Step 4: Run — expect PASS**

**Step 5: Commit**

```bash
git add bazi_engine/services/signature_blueprint.py tests/test_signature_blueprint.py
git commit -m "feat(M2): signature blueprint service — deterministic visual params

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.3: Daily Western Horoscope Service

**Files:**
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/services/daily_western.py`
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/tests/test_daily_western.py`

**Purpose:** Generate structured western daily horoscope from natal profile + current transits for a target date. Template-based, no LLM.

**Step 1: Write failing test**

```python
# tests/test_daily_western.py
from bazi_engine.services.daily_western import generate_western_daily

def test_western_daily_has_required_fields():
    result = generate_western_daily(
        sun_sign_idx=4,       # Leo
        moon_sign_idx=6,      # Libra
        asc_sign_idx=5,       # Virgo
        soulprint_sectors=[0.08]*12,
        target_date="2026-03-16",
        tz="Europe/Berlin",
        lat=53.5511, lon=9.9937,
        locale="de-DE",
    )
    assert "summary" in result
    assert "themes" in result and len(result["themes"]) >= 1
    assert "caution" in result
    assert "opportunity" in result
    assert "evidence" in result
    assert "transit_sectors" in result["evidence"]

def test_western_daily_different_dates_differ():
    kwargs = dict(sun_sign_idx=4, moon_sign_idx=6, asc_sign_idx=5,
                  soulprint_sectors=[0.08]*12, tz="Europe/Berlin", lat=53.5511, lon=9.9937, locale="de-DE")
    a = generate_western_daily(target_date="2026-03-16", **kwargs)
    b = generate_western_daily(target_date="2026-06-21", **kwargs)
    # At minimum, evidence should differ (different transits)
    assert a["evidence"] != b["evidence"]
```

**Step 2: Run — expect FAIL**

**Step 3: Implement**

Uses existing `compute_transit_now()` from `bazi_engine/transit.py` for the target date's planetary positions. Compares transit sectors against natal soulprint to identify active sectors. Generates German templates.

```python
# bazi_engine/services/daily_western.py
"""Western daily horoscope generator — template-based, deterministic."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from ..transit import compute_transit_now, ZODIAC_SIGNS

# Theme keyword pools per sector
_SECTOR_THEMES_DE = {
    0: ["Identitaet", "Auftreten", "Neubeginn"],
    1: ["Ressourcen", "Werte", "Sicherheit"],
    2: ["Kommunikation", "Austausch", "Lernen"],
    3: ["Familie", "Geborgenheit", "Herkunft"],
    4: ["Ausdruck", "Kreativitaet", "Freude"],
    5: ["Alltag", "Routine", "Gesundheit"],
    6: ["Beziehung", "Partnerschaft", "Harmonie"],
    7: ["Tiefe", "Wandlung", "Macht"],
    8: ["Weite", "Sinn", "Horizonterweiterung"],
    9: ["Karriere", "Verantwortung", "Ziel"],
    10: ["Gemeinschaft", "Zukunft", "Ideale"],
    11: ["Innenwelt", "Intuition", "Loslassen"],
}

def generate_western_daily(
    sun_sign_idx: int,
    moon_sign_idx: int,
    asc_sign_idx: int,
    soulprint_sectors: List[float],
    target_date: str,
    tz: str,
    lat: float,
    lon: float,
    locale: str = "de-DE",
) -> Dict[str, Any]:
    """Generate structured western daily horoscope."""
    # Parse target date at noon local time
    dt = datetime.strptime(target_date, "%Y-%m-%d").replace(
        hour=12, tzinfo=timezone.utc
    )

    # Get transit positions for that date
    transit_data = compute_transit_now(dt)
    transit_sectors = transit_data["sector_intensity"]

    # Find top-2 active sectors (transit intensity × soulprint weight)
    combined = [t * s for t, s in zip(transit_sectors, soulprint_sectors)]
    active_indices = sorted(range(12), key=lambda i: combined[i], reverse=True)[:2]

    # Build themes from active sectors
    themes = []
    for idx in active_indices:
        themes.extend(_SECTOR_THEMES_DE.get(idx, ["Energie"])[:1])

    sun_sign = ZODIAC_SIGNS[sun_sign_idx % 12]

    summary = (
        f"Fuer dich als {sun_sign.title()} stehen heute {', '.join(themes)} im Fokus. "
        f"Die Planetenkonstellation aktiviert deine Sektoren {active_indices[0]+1} und {active_indices[1]+1}."
    )

    caution = f"Achte in Sektor {active_indices[1]+1} auf Ueberanstrengung — hier liegt heute Spannung."

    opportunity = f"Sektor {active_indices[0]+1} bietet dir heute besonderes Potenzial. Nutze die Energie aktiv."

    return {
        "summary": summary,
        "themes": themes,
        "caution": caution,
        "opportunity": opportunity,
        "evidence": {
            "transit_sectors": active_indices,
            "natal_focus": ["sun", "ascendant"],
        },
    }
```

**Step 4: Run — expect PASS**

**Step 5: Commit**

```bash
git add bazi_engine/services/daily_western.py tests/test_daily_western.py
git commit -m "feat(M2): western daily horoscope service — template-based

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.4: Daily Eastern (BaZi) Horoscope Service

**Files:**
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/services/daily_eastern.py`
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/tests/test_daily_eastern.py`

**Purpose:** Generate BaZi daily horoscope from natal Day Master + daily pillar + Jieqi context. Strictly solar-term-based (no lunar shortcuts).

**Step 1: Write failing test**

```python
# tests/test_daily_eastern.py
from bazi_engine.services.daily_eastern import generate_eastern_daily

def test_eastern_daily_has_required_fields():
    result = generate_eastern_daily(
        day_master="Xin",
        natal_pillars={"year": {"stem": "Geng", "branch": "Wu"},
                       "month": {"stem": "Jia", "branch": "Shen"},
                       "day": {"stem": "Xin", "branch": "Chou"},
                       "hour": {"stem": "Ren", "branch": "Chen"}},
        target_date="2026-03-16",
        tz="Europe/Berlin",
        locale="de-DE",
    )
    assert "summary" in result
    assert "themes" in result
    assert "caution" in result
    assert "opportunity" in result
    assert "evidence" in result
    assert result["evidence"]["day_master"] == "Xin"
    assert "daily_pillar" in result["evidence"]
    assert "relation_to_day_master" in result["evidence"]
```

**Step 2: Run — expect FAIL**

**Step 3: Implement**

Uses existing `bazi_engine.bazi` module for daily pillar calculation and `bazi_engine.jieqi` for solar term context. Determines the relationship between natal Day Master and daily Heavenly Stem (Sheng/Ke cycle).

```python
# bazi_engine/services/daily_eastern.py
"""BaZi daily horoscope generator — solar-term-based, deterministic."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any, Dict, List

from ..bazi import compute_bazi_pillars_for_date
from ..jieqi import get_current_jieqi

# Day Master → element mapping
_STEM_ELEMENT = {
    "Jia": "Holz", "Yi": "Holz",
    "Bing": "Feuer", "Ding": "Feuer",
    "Wu": "Erde", "Ji": "Erde",
    "Geng": "Metall", "Xin": "Metall",
    "Ren": "Wasser", "Gui": "Wasser",
}

# Five phases cycle relationships
_SHENG_CYCLE = {"Holz": "Feuer", "Feuer": "Erde", "Erde": "Metall", "Metall": "Wasser", "Wasser": "Holz"}
_KE_CYCLE = {"Holz": "Erde", "Feuer": "Metall", "Erde": "Wasser", "Metall": "Holz", "Wasser": "Feuer"}

def _determine_relation(natal_element: str, daily_element: str) -> str:
    """Determine BaZi relationship type between two elements."""
    if natal_element == daily_element:
        return "companion"
    if _SHENG_CYCLE.get(natal_element) == daily_element:
        return "resource"  # natal produces daily
    if _SHENG_CYCLE.get(daily_element) == natal_element:
        return "output"    # daily produces natal
    if _KE_CYCLE.get(natal_element) == daily_element:
        return "power"     # natal controls daily
    if _KE_CYCLE.get(daily_element) == natal_element:
        return "wealth"    # daily controls natal
    return "neutral"

_RELATION_THEMES_DE = {
    "companion": ["Gleichklang", "Staerkung", "Vertrauen"],
    "resource": ["Unterstuetzung", "Naehrung", "Rueckhalt"],
    "output": ["Ausdruck", "Produktivitaet", "Sichtbarkeit"],
    "power": ["Kontrolle", "Disziplin", "Fokus"],
    "wealth": ["Ressourcen", "Chancen", "Taktung"],
    "neutral": ["Balance", "Beobachtung", "Ruhe"],
}

_RELATION_SUMMARY_DE = {
    "companion": "Der heutige Tag schwingt mit deinem Day Master {dm} in Gleichklang. {element}-Energie verstaerkt dich.",
    "resource": "Heute naehrt der Tag deinen Day Master {dm}. {element} bringt Unterstuetzung von aussen.",
    "output": "Dein Day Master {dm} produziert heute aktiv. Guter Tag fuer sichtbare Ergebnisse.",
    "power": "Dein Day Master {dm} kontrolliert die Tagesenergie. Fokussiere dich und halte Disziplin.",
    "wealth": "Die Tagesenergie fordert deinen Day Master {dm} heraus. Achte auf Ressourcen und Grenzen.",
    "neutral": "Ein ausgeglichener Tag fuer deinen Day Master {dm}. Beobachte und reagiere bewusst.",
}

def generate_eastern_daily(
    day_master: str,
    natal_pillars: Dict[str, Dict[str, str]],
    target_date: str,
    tz: str,
    locale: str = "de-DE",
) -> Dict[str, Any]:
    """Generate structured BaZi daily horoscope."""
    dt = datetime.strptime(target_date, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)

    # Compute daily pillar
    daily_pillar = compute_bazi_pillars_for_date(dt)
    daily_stem = daily_pillar.get("day", {}).get("stem", "Jia")
    daily_branch = daily_pillar.get("day", {}).get("branch", "Zi")

    # Determine element relationship
    natal_element = _STEM_ELEMENT.get(day_master, "Erde")
    daily_element = _STEM_ELEMENT.get(daily_stem, "Erde")
    relation = _determine_relation(natal_element, daily_element)

    # Get jieqi context
    jieqi = get_current_jieqi(dt)

    themes = _RELATION_THEMES_DE.get(relation, ["Energie"])
    summary_template = _RELATION_SUMMARY_DE.get(relation, "Tag fuer {dm}.")
    summary = summary_template.format(dm=day_master, element=daily_element)

    if jieqi:
        summary += f" Solarterm: {jieqi}."

    caution = f"Die {relation.title()}-Dynamik kann heute zu Ueberreaktion fuehren. Bleibe geerdet."
    opportunity = f"{themes[0]} ist heute dein staerkstes Feld. Nutze die {daily_element}-Energie bewusst."

    return {
        "summary": summary,
        "themes": themes,
        "caution": caution,
        "opportunity": opportunity,
        "evidence": {
            "day_master": day_master,
            "daily_pillar": {"stem": daily_stem, "branch": daily_branch},
            "relation_to_day_master": relation,
        },
    }
```

**Step 4: Run — expect PASS** (may need to adjust imports for `compute_bazi_pillars_for_date` and `get_current_jieqi` based on actual function signatures)

**Step 5: Commit**

```bash
git add bazi_engine/services/daily_eastern.py tests/test_daily_eastern.py
git commit -m "feat(M2): eastern daily horoscope service — solar-term-based BaZi

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.5: Daily Fusion Service

**Files:**
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/services/daily_fusion.py`
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/tests/test_daily_fusion.py`

**Purpose:** Synthesize western + eastern daily into an independent fusion reading. NOT just concatenation — must identify shared signal, tension signal, and practical action.

**Step 1: Write failing test**

```python
# tests/test_daily_fusion.py
from bazi_engine.services.daily_fusion import generate_fusion_daily

def test_fusion_has_required_fields():
    western = {"summary": "Leo focus", "themes": ["Ausdruck", "Kreativitaet"],
               "caution": "careful", "opportunity": "go", "evidence": {"transit_sectors": [4, 8]}}
    eastern = {"summary": "Xin companion", "themes": ["Gleichklang", "Staerkung"],
               "caution": "careful", "opportunity": "go",
               "evidence": {"day_master": "Xin", "daily_pillar": {"stem": "Xin", "branch": "Chou"}, "relation_to_day_master": "companion"}}
    result = generate_fusion_daily(western, eastern, locale="de-DE")
    assert "summary" in result
    assert "synthesis" in result
    assert "action" in result
    assert "pushworthy" in result

def test_fusion_is_not_concatenation():
    western = {"summary": "W text", "themes": ["A"], "caution": "W caution", "opportunity": "W opp", "evidence": {}}
    eastern = {"summary": "E text", "themes": ["B"], "caution": "E caution", "opportunity": "E opp", "evidence": {}}
    result = generate_fusion_daily(western, eastern, locale="de-DE")
    # Fusion must not simply be "W text E text"
    assert result["summary"] != western["summary"] + " " + eastern["summary"]
    assert result["synthesis"] != ""
```

**Step 2: Run — expect FAIL**

**Step 3: Implement**

```python
# bazi_engine/services/daily_fusion.py
"""Fusion daily reading — independent synthesis of western + eastern."""
from __future__ import annotations
from typing import Any, Dict

def _find_shared_themes(w_themes: list, e_themes: list) -> list:
    """Find conceptually overlapping themes."""
    # Direct overlap
    shared = list(set(w_themes) & set(e_themes))
    if shared:
        return shared
    # Semantic affinity (simplified mapping)
    _AFFINITIES = {
        "Ausdruck": ["Sichtbarkeit", "Produktivitaet"],
        "Kreativitaet": ["Ausdruck", "Sichtbarkeit"],
        "Fokus": ["Disziplin", "Kontrolle"],
        "Kommunikation": ["Austausch", "Gleichklang"],
        "Gleichklang": ["Harmonie", "Staerkung"],
        "Ressourcen": ["Chancen", "Taktung"],
    }
    for wt in w_themes:
        for et in e_themes:
            if et in _AFFINITIES.get(wt, []) or wt in _AFFINITIES.get(et, []):
                return [f"{wt} + {et}"]
    return [w_themes[0] if w_themes else "Energie"]


def generate_fusion_daily(
    western: Dict[str, Any],
    eastern: Dict[str, Any],
    locale: str = "de-DE",
) -> Dict[str, Any]:
    """Synthesize western + eastern into independent fusion reading."""
    w_themes = western.get("themes", [])
    e_themes = eastern.get("themes", [])
    shared = _find_shared_themes(w_themes, e_themes)

    # Tension: where systems disagree
    all_themes = set(w_themes + e_themes)
    tension_themes = list(all_themes - set(shared))

    shared_str = ", ".join(shared) if shared else "Balancierung"
    tension_str = ", ".join(tension_themes[:2]) if tension_themes else "keine offensichtliche Spannung"

    relation = eastern.get("evidence", {}).get("relation_to_day_master", "neutral")
    day_master = eastern.get("evidence", {}).get("day_master", "")

    summary = (
        f"Dein Fusionstag verbindet {shared_str} aus beiden Systemen. "
        f"Westlich staerkt dein Transitfeld, oestlich arbeitet dein Day Master {day_master} in {relation}-Dynamik."
    )

    synthesis = (
        f"Beide Systeme zeigen heute einen gemeinsamen Impuls: {shared_str}. "
        f"Gleichzeitig entsteht Spannung im Bereich {tension_str}. "
        f"Die Synthese liegt darin, beides bewusst zu halten — "
        f"den {shared_str}-Impuls aktiv zu nutzen und den Spannungsbereich nicht zu verdraengen."
    )

    action = (
        f"Nutze heute gezielt den Bereich {shared_str}. "
        f"Plane eine bewusste Handlung, die beide Energien verbindet."
    )

    # Pushworthy if strong relation and active transits
    pushworthy = relation in ("power", "wealth", "resource")

    push_text = f"Dein {relation.title()}-Tag: {shared_str} ruft." if pushworthy else None

    return {
        "summary": summary,
        "synthesis": synthesis,
        "action": action,
        "pushworthy": pushworthy,
        "push_text": push_text,
    }
```

**Step 4: Run — expect PASS**

**Step 5: Commit**

```bash
git add bazi_engine/services/daily_fusion.py tests/test_daily_fusion.py
git commit -m "feat(M2): fusion daily service — independent synthesis, not concatenation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.6: Wire Experience Router Endpoints

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/bazi_engine/routers/experience.py`
- Create: `/Users/benjaminpoersch/Projects/SaaS/FuFirE/BAFE/tests/test_experience_endpoints.py`

**Purpose:** Replace the `NotImplementedError` stubs with real orchestration logic that calls the services from Tasks 2.1-2.5.

**Step 1: Write integration test**

```python
# tests/test_experience_endpoints.py
import pytest
from fastapi.testclient import TestClient
from bazi_engine.app import app

client = TestClient(app)

BIRTH = {
    "date": "1990-08-14",
    "time": "07:42:00",
    "tz": "Europe/Berlin",
    "lat": 53.5511,
    "lon": 9.9937,
    "place_label": "Hamburg, DE"
}

def test_bootstrap_returns_200():
    resp = client.post("/experience/bootstrap", json={"birth": BIRTH, "locale": "de-DE"})
    assert resp.status_code == 200
    data = resp.json()
    assert "profile" in data
    assert "soulprint_sectors" in data
    assert len(data["soulprint_sectors"]) == 12
    assert "signature_blueprint" in data
    assert data["signature_blueprint"]["seed"].startswith("sig_v1_")

def test_signature_delta_returns_200():
    # First bootstrap to get sectors + blueprint
    boot = client.post("/experience/bootstrap", json={"birth": BIRTH, "locale": "de-DE"}).json()
    resp = client.post("/experience/signature-delta", json={
        "soulprint_sectors": boot["soulprint_sectors"],
        "signature_blueprint": {"seed": boot["signature_blueprint"]["seed"]},
        "quiz_answer": {"keyword": "expression"},
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "quiz_sectors" in data
    assert "signature_delta" in data
    assert "signature_blueprint" in data

def test_daily_returns_200():
    boot = client.post("/experience/bootstrap", json={"birth": BIRTH, "locale": "de-DE"}).json()
    resp = client.post("/experience/daily", json={
        "birth": BIRTH,
        "soulprint_sectors": boot["soulprint_sectors"],
        "quiz_sectors": [0.0]*12,
        "target_date": "2026-03-16",
        "locale": "de-DE",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "western" in data
    assert "eastern" in data
    assert "fusion" in data
    assert data["fusion"]["synthesis"] != ""
```

**Step 2: Run — expect FAIL (NotImplementedError)**

**Step 3: Implement endpoint logic in experience.py**

Replace the three stub endpoints with real orchestration:

For `bootstrap`: call existing `bazi.compute_bazi_chart()` + `western.compute_western_chart()` + `fusion.compute_fusion_analysis()` → feed results into `soulprint.compute_soulprint()` → `signature_blueprint.compute_signature_blueprint()` → return bundled response.

For `signature-delta`: call `quiz_affinity.resolve_quiz_sectors()` → compute visual deltas → return new blueprint.

For `daily`: call `daily_western.generate_western_daily()` + `daily_eastern.generate_eastern_daily()` → `daily_fusion.generate_fusion_daily()` → return bundle.

(Full implementation code is significant — implement step by step, testing each endpoint.)

**Step 4: Run — expect PASS**

**Step 5: Regenerate OpenAPI**

```bash
python scripts/export_openapi.py
```

**Step 6: Commit**

```bash
git add bazi_engine/routers/experience.py tests/test_experience_endpoints.py spec/openapi/openapi.json
git commit -m "feat(M2): wire experience endpoints — bootstrap, signature-delta, daily

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## M3: Supabase Schema Extension (Astro-Noctum)

### Task 3.1: Add new tables for signature state and daily cache

**Files:**
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/supabase-migrations/20260316_experience_tables.sql`

**Step 1: Write migration SQL**

```sql
-- Signature state per user (persists across quiz interactions)
CREATE TABLE IF NOT EXISTS user_signature_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    signature_blueprint_json JSONB NOT NULL,
    soulprint_sectors JSONB NOT NULL,  -- array of 12 floats
    quiz_sectors JSONB DEFAULT '[]'::JSONB,
    quiz_version INTEGER DEFAULT 0,
    signature_version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_signature_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own signature" ON user_signature_state
    FOR ALL USING (auth.uid() = user_id);

-- Daily horoscope cache
CREATE TABLE IF NOT EXISTS daily_horoscope_cache (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    local_date DATE NOT NULL,
    engine_version TEXT NOT NULL,
    signature_version INTEGER NOT NULL DEFAULT 1,
    payload_json JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, local_date, engine_version, signature_version)
);

ALTER TABLE daily_horoscope_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own daily cache" ON daily_horoscope_cache
    FOR SELECT USING (auth.uid() = user_id);

-- Add soulprint_sectors column to astro_profiles if not exists
ALTER TABLE astro_profiles ADD COLUMN IF NOT EXISTS soulprint_sectors JSONB;

-- Track first-run state
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_modal_seen BOOLEAN DEFAULT FALSE;
```

**Step 2: Apply migration on Supabase**

```bash
# Via Supabase CLI or dashboard SQL editor
```

**Step 3: Commit**

```bash
git add supabase-migrations/20260316_experience_tables.sql
git commit -m "feat(M3): Supabase schema — signature state, daily cache, first-run flag

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## M4: Onboarding Signature Flow (Frontend)

### Task 4.1: Add server proxy for experience endpoints

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/server.mjs`

**Purpose:** Add Express proxy routes for `/api/experience/bootstrap`, `/api/experience/signature-delta`, `/api/experience/daily` that forward to FuFirE.

**Step 1: Add proxy endpoints after existing BAFE proxy section**

```javascript
// ── Experience API proxy ──────────────────────────────────────────
app.post('/api/experience/bootstrap', async (req, res) => {
  try {
    const resp = await fetch(`${BAFE_URL}/experience/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error('[experience/bootstrap] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});

app.post('/api/experience/signature-delta', async (req, res) => {
  try {
    const resp = await fetch(`${BAFE_URL}/experience/signature-delta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(10000),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error('[experience/signature-delta] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});

app.post('/api/experience/daily', async (req, res) => {
  try {
    const resp = await fetch(`${BAFE_URL}/experience/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(20000),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error('[experience/daily] Error:', err.message);
    res.status(502).json({ error: 'experience_unavailable' });
  }
});
```

Also add to Vite dev proxy in `vite.config.ts`:

```typescript
'/api/experience': {
  target: 'http://localhost:3001',
  changeOrigin: true,
},
```

**Step 2: Commit**

```bash
git add server.mjs vite.config.ts
git commit -m "feat(M4): server proxy for /api/experience/* endpoints

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.2: Create experience API client service

**Files:**
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/services/experience.ts`

**Step 1: Implement**

```typescript
// src/services/experience.ts
import { BootstrapResponseSchema, SignatureDeltaResponseSchema, DailyResponseSchema } from '../lib/schemas/experience';
import type { BootstrapResponse, SignatureDeltaResponse, DailyResponse } from '../lib/schemas/experience';

export async function bootstrapExperience(birth: {
  date: string; time: string; tz: string; lat: number; lon: number; place_label?: string;
}, locale = 'de-DE'): Promise<BootstrapResponse> {
  const resp = await fetch('/api/experience/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birth, locale }),
  });
  if (!resp.ok) throw new Error(`Bootstrap failed: ${resp.status}`);
  return BootstrapResponseSchema.parse(await resp.json());
}

export async function signatureDelta(
  soulprintSectors: number[],
  signatureBlueprint: { seed: string },
  keyword: string,
): Promise<SignatureDeltaResponse> {
  const resp = await fetch('/api/experience/signature-delta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      soulprint_sectors: soulprintSectors,
      signature_blueprint: signatureBlueprint,
      quiz_answer: { keyword },
    }),
  });
  if (!resp.ok) throw new Error(`Signature delta failed: ${resp.status}`);
  return SignatureDeltaResponseSchema.parse(await resp.json());
}

export async function fetchDailyHoroscope(
  birth: { date: string; time: string; tz: string; lat: number; lon: number },
  soulprintSectors: number[],
  quizSectors: number[],
  targetDate: string,
  locale = 'de-DE',
): Promise<DailyResponse> {
  const resp = await fetch('/api/experience/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth,
      soulprint_sectors: soulprintSectors,
      quiz_sectors: quizSectors,
      target_date: targetDate,
      locale,
    }),
  });
  if (!resp.ok) throw new Error(`Daily horoscope failed: ${resp.status}`);
  return DailyResponseSchema.parse(await resp.json());
}
```

**Step 2: Commit**

```bash
git add src/services/experience.ts
git commit -m "feat(M4): experience API client service with Zod validation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.3: Create SignatureReveal onboarding component

**Files:**
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/onboarding/SignatureReveal.tsx`

**Purpose:** After birth form submission, show the initial Signature visualization with a fade-in animation, then present one quiz question.

**Step 1: Implement component**

This component:
1. Receives `bootstrapData` (from `/experience/bootstrap` response)
2. Renders the FusionRingWebsiteCanvas with `soulProfile` from `soulprint_sectors`
3. Shows a single quiz question (radio buttons, 4 options)
4. On quiz answer, calls `/experience/signature-delta` and animates the ring change
5. After delta animation, calls `onComplete` to redirect to Dashboard

Key UI rules from spec:
- Signature before the big astro info blocks
- Only ONE quiz question in the first step
- Delta must be visible in <300ms

```typescript
// src/components/onboarding/SignatureReveal.tsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FusionRingWebsiteCanvas } from '../fusion-ring-website/FusionRingWebsiteCanvas';
import { signatureDelta } from '../../services/experience';
import type { BootstrapResponse, SignatureDeltaResponse } from '../../lib/schemas/experience';

interface Props {
  bootstrapData: BootstrapResponse;
  onComplete: (deltaData: SignatureDeltaResponse | null) => void;
}

const QUIZ_OPTIONS = [
  { keyword: 'expression', label: 'Ich druecke mich gerne kreativ aus' },
  { keyword: 'analytical', label: 'Ich analysiere gerne komplexe Zusammenhaenge' },
  { keyword: 'harmony', label: 'Harmonie in Beziehungen ist mir sehr wichtig' },
  { keyword: 'adventure', label: 'Ich suche staendig neue Erfahrungen' },
];

export function SignatureReveal({ bootstrapData, onComplete }: Props) {
  const [soulProfile, setSoulProfile] = useState(bootstrapData.soulprint_sectors);
  const [phase, setPhase] = useState<'reveal' | 'quiz' | 'delta' | 'done'>('reveal');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRevealComplete = useCallback(() => {
    setPhase('quiz');
  }, []);

  const handleQuizAnswer = useCallback(async (keyword: string) => {
    setSelectedKeyword(keyword);
    setIsAnimating(true);
    try {
      const delta = await signatureDelta(
        bootstrapData.soulprint_sectors,
        { seed: bootstrapData.signature_blueprint.seed },
        keyword,
      );
      // Animate to new sectors
      setPhase('delta');
      // Blend old → new over 300ms (CSS transition handles this)
      setSoulProfile(delta.quiz_sectors.map((q, i) =>
        bootstrapData.soulprint_sectors[i] * 0.7 + q * 0.3
      ));
      setTimeout(() => {
        setPhase('done');
        onComplete(delta);
      }, 2000);
    } catch {
      // On error, proceed without delta
      onComplete(null);
    } finally {
      setIsAnimating(false);
    }
  }, [bootstrapData, onComplete]);

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      {/* Signature Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="w-64 h-64 sm:w-80 sm:h-80"
        onAnimationComplete={phase === 'reveal' ? handleRevealComplete : undefined}
      >
        <FusionRingWebsiteCanvas soulProfile={soulProfile} />
      </motion.div>

      {/* Profile summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center space-y-1"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-[#8B6914]/60">Deine Signatur</p>
        <p className="text-sm text-[#1E2A3A]/70">
          {bootstrapData.profile.sun_sign} · {bootstrapData.profile.moon_sign} · {bootstrapData.profile.ascendant_sign}
        </p>
        <p className="text-xs text-[#1E2A3A]/50">
          Day Master: {bootstrapData.profile.day_master} · Harmonie: {Math.round(bootstrapData.profile.harmony_index * 100)}%
        </p>
      </motion.div>

      {/* Quiz question */}
      <AnimatePresence>
        {(phase === 'quiz' || phase === 'delta') && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full space-y-3"
          >
            <p className="text-center text-sm font-medium text-[#1E2A3A]/80">
              Was beschreibt dich am besten?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {QUIZ_OPTIONS.map(opt => (
                <button
                  key={opt.keyword}
                  onClick={() => !isAnimating && handleQuizAnswer(opt.keyword)}
                  disabled={isAnimating || phase === 'delta'}
                  className={`p-3 rounded-xl text-left text-sm transition-all border ${
                    selectedKeyword === opt.keyword
                      ? 'border-[#8B6914] bg-[#8B6914]/10 text-[#8B6914]'
                      : 'border-[#1E2A3A]/10 hover:border-[#8B6914]/40 text-[#1E2A3A]/70'
                  } ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {phase === 'delta' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-[#8B6914]/70"
              >
                Deine Signatur passt sich an...
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/onboarding/SignatureReveal.tsx
git commit -m "feat(M4): SignatureReveal onboarding component — ring + quiz + delta animation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.4: Integrate SignatureReveal into App.tsx onboarding flow

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/App.tsx`

**Purpose:** After BirthForm submit, call `/experience/bootstrap`, show SignatureReveal, then proceed to Dashboard.

**Key changes to App.tsx:**
1. Add state: `bootstrapData`, `onboardingPhase` ('form' | 'signature' | 'done')
2. On BirthForm submit: call `bootstrapExperience()` alongside existing `handleSubmit()`
3. After bootstrap response: show `SignatureReveal` component
4. On SignatureReveal complete: persist to Supabase, redirect to Dashboard

**Step 1: Modify the onboarding section (lines 114-131)**

Replace the simple `BirthForm` rendering with a two-phase flow:

```tsx
// In the showOnboarding block:
if (onboardingPhase === 'form') {
  return <BirthForm onSubmit={handleOnboardingSubmit} isLoading={isLoading} />;
}
if (onboardingPhase === 'signature' && bootstrapData) {
  return <SignatureReveal bootstrapData={bootstrapData} onComplete={handleSignatureComplete} />;
}
```

Where `handleOnboardingSubmit` calls both `handleSubmit()` (existing BAFE flow) and `bootstrapExperience()`, then sets `onboardingPhase='signature'`.

`handleSignatureComplete` persists signature state to Supabase and sets `onboardingPhase='done'`.

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(M4): integrate SignatureReveal into onboarding flow

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## M5: Dashboard Daily Modal

### Task 5.1: Create DailyHoroscopeModal component

**Files:**
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/DailyHoroscopeModal.tsx`

**Purpose:** Full-screen modal showing western → eastern → fusion daily horoscope in sequential reveal, with close button.

**Step 1: Implement**

```typescript
// src/components/dashboard/DailyHoroscopeModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, Moon, Sparkles } from 'lucide-react';
import type { DailyResponse } from '../../lib/schemas/experience';

interface Props {
  data: DailyResponse;
  onClose: () => void;
}

export function DailyHoroscopeModal({ data, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'western' | 'eastern' | 'fusion'>('western');

  const tabs = [
    { key: 'western' as const, label: 'Westlich', icon: Sun, data: data.western },
    { key: 'eastern' as const, label: 'BaZi', icon: Moon, data: data.eastern },
    { key: 'fusion' as const, label: 'Fusion', icon: Sparkles, data: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="morning-card max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#1E2A3A]/40 hover:text-[#1E2A3A]/70">
          <X size={20} />
        </button>

        <h2 className="text-lg font-serif text-[#8B6914] mb-1">Dein Tageshoroskop</h2>
        <p className="text-xs text-[#1E2A3A]/50 mb-6">{data.date}</p>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                activeTab === tab.key
                  ? 'bg-[#8B6914]/15 text-[#8B6914] font-medium'
                  : 'text-[#1E2A3A]/50 hover:text-[#1E2A3A]/70'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab !== 'fusion' ? (
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div className="space-y-4">
                <p className="text-sm text-[#1E2A3A]/80 leading-relaxed">
                  {activeTab === 'western' ? data.western.summary : data.eastern.summary}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTab === 'western' ? data.western.themes : data.eastern.themes).map(theme => (
                    <span key={theme} className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B6914]/10 text-[#8B6914]">
                      {theme}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/30">
                    <p className="font-medium text-amber-700 mb-1">Chance</p>
                    <p className="text-[#1E2A3A]/60">{activeTab === 'western' ? data.western.opportunity : data.eastern.opportunity}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50/30 border border-red-200/20">
                    <p className="font-medium text-red-600/70 mb-1">Achtung</p>
                    <p className="text-[#1E2A3A]/60">{activeTab === 'western' ? data.western.caution : data.eastern.caution}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="fusion" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <div className="space-y-4">
                <p className="text-sm text-[#1E2A3A]/80 leading-relaxed">{data.fusion.summary}</p>
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#8B6914]/5 to-[#8B6914]/10 border border-[#8B6914]/20">
                  <p className="text-xs font-medium text-[#8B6914] mb-2">Synthese</p>
                  <p className="text-sm text-[#1E2A3A]/70 leading-relaxed">{data.fusion.synthesis}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#8B6914]/5 border border-[#8B6914]/15">
                  <p className="text-xs font-medium text-[#8B6914] mb-1">Deine Handlung heute</p>
                  <p className="text-sm text-[#1E2A3A]/70">{data.fusion.action}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/DailyHoroscopeModal.tsx
git commit -m "feat(M5): DailyHoroscopeModal — western/eastern/fusion tabs with animations

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.2: Add first-run modal logic to Dashboard

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/Dashboard.tsx`
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useFirstRunDaily.ts`

**Purpose:** On first Dashboard visit, fetch daily horoscope, show modal, then mark as seen.

**Step 1: Create useFirstRunDaily hook**

```typescript
// src/hooks/useFirstRunDaily.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fetchDailyHoroscope } from '../services/experience';
import type { DailyResponse } from '../lib/schemas/experience';

export function useFirstRunDaily(userId: string, birthData: any, soulprintSectors: number[], quizSectors: number[]) {
  const [dailyData, setDailyData] = useState<DailyResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Check if user has already seen daily modal today
        const { data: profile } = await supabase
          .from('profiles')
          .select('daily_modal_seen')
          .eq('id', userId)
          .single();

        if (profile?.daily_modal_seen) {
          setLoading(false);
          return;
        }

        // Check cache first
        const today = new Date().toISOString().split('T')[0];
        const { data: cached } = await supabase
          .from('daily_horoscope_cache')
          .select('payload_json')
          .eq('user_id', userId)
          .eq('local_date', today)
          .maybeSingle();

        if (cached?.payload_json) {
          if (!cancelled) {
            setDailyData(cached.payload_json);
            setShowModal(true);
            setLoading(false);
          }
          return;
        }

        // Fetch fresh from FuFirE
        const daily = await fetchDailyHoroscope(
          { date: birthData.date, time: birthData.time, tz: birthData.tz, lat: birthData.lat, lon: birthData.lon },
          soulprintSectors,
          quizSectors,
          today,
        );

        if (!cancelled) {
          setDailyData(daily);
          setShowModal(true);
          setLoading(false);

          // Cache it (fire-and-forget)
          supabase.from('daily_horoscope_cache').upsert({
            user_id: userId,
            local_date: today,
            engine_version: daily.meta.engine_version,
            signature_version: 1,
            payload_json: daily,
          }).then(() => {});
        }
      } catch (err) {
        console.error('[useFirstRunDaily] Error:', err);
        if (!cancelled) setLoading(false);
      }
    }

    if (userId && birthData && soulprintSectors?.length === 12) {
      check();
    }

    return () => { cancelled = true; };
  }, [userId, birthData, soulprintSectors, quizSectors]);

  const handleClose = async () => {
    setShowModal(false);
    // Mark as seen
    await supabase.from('profiles').update({ daily_modal_seen: true }).eq('id', userId);
  };

  return { dailyData, showModal, loading, handleClose };
}
```

**Step 2: Integrate in Dashboard**

In Dashboard.tsx, add at the top of the component:

```tsx
const { dailyData, showModal, handleClose } = useFirstRunDaily(userId, birthData, soulprintSectors, quizSectors);
```

And at the bottom of the JSX (before closing div):

```tsx
<AnimatePresence>
  {showModal && dailyData && (
    <DailyHoroscopeModal data={dailyData} onClose={handleClose} />
  )}
</AnimatePresence>
```

**Step 3: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts src/components/Dashboard.tsx
git commit -m "feat(M5): first-run daily modal — auto-opens on first Dashboard visit

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.3: Add persistent Signature widget to Dashboard

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/Dashboard.tsx`

**Purpose:** Small always-visible Signature ring in the top section of Dashboard. Click opens "Why does my Signature look like this?" modal.

**Step 1: Add a compact Signature widget**

```tsx
{/* ═══ PERSISTENT SIGNATURE WIDGET ══════════════════════════════ */}
<motion.div className="mb-8 flex justify-center" {...fadeIn(0.05)}>
  <div className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer" onClick={openSignatureExplainer}>
    <FusionRingWebsiteCanvas soulProfile={soulprintSectors || Array(12).fill(1/12)} />
  </div>
</motion.div>
```

The `openSignatureExplainer` function shows a modal explaining the three layers (western, eastern, fusion) that compose the Signature.

**Step 2: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(M5): persistent Signature widget on Dashboard

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## M6: QA & Rollout

### Task 6.1: Add feature flags

**Files:**
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/feature-flags.ts`

**Step 1: Simple localStorage-based feature flags**

```typescript
// src/lib/feature-flags.ts
const FLAGS = {
  signature_onboarding_v1: true,
  daily_modal_v1: true,
} as const;

export function isFeatureEnabled(flag: keyof typeof FLAGS): boolean {
  const override = localStorage.getItem(`ff_${flag}`);
  if (override !== null) return override === 'true';
  return FLAGS[flag];
}
```

**Step 2: Gate new features behind flags**

In App.tsx: wrap SignatureReveal phase behind `isFeatureEnabled('signature_onboarding_v1')`
In Dashboard.tsx: wrap DailyHoroscopeModal behind `isFeatureEnabled('daily_modal_v1')`

**Step 3: Commit**

```bash
git add src/lib/feature-flags.ts src/App.tsx src/components/Dashboard.tsx
git commit -m "feat(M6): feature flags for signature onboarding + daily modal

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6.2: Add analytics events

**Files:**
- Modify: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/onboarding/SignatureReveal.tsx`
- Modify: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/DailyHoroscopeModal.tsx`

**Events to track:**
- `signature_reveal_seen` — when Signature first appears in onboarding
- `signature_delta_applied` — when quiz answer changes Signature
- `daily_modal_opened` — when Daily Horoscope modal opens
- `daily_modal_closed` — when user closes the modal
- `daily_tab_changed` — when user switches between western/eastern/fusion

```typescript
import { trackEvent } from '../../lib/analytics';

// In SignatureReveal:
trackEvent('signature_reveal_seen');
trackEvent('signature_delta_applied', { keyword });

// In DailyHoroscopeModal:
trackEvent('daily_modal_opened');
trackEvent('daily_modal_closed');
trackEvent('daily_tab_changed', { tab: activeTab });
```

**Step 1: Commit**

```bash
git add src/components/onboarding/SignatureReveal.tsx src/components/dashboard/DailyHoroscopeModal.tsx
git commit -m "feat(M6): analytics events for signature + daily modal

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6.3: Write e2e test scenarios

**Files:**
- Create: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/__tests__/onboarding-e2e.test.ts`

**Key scenarios to validate:**

1. After birth data input → initial Signature visible
2. Quiz answer → Signature visually changes
3. First Dashboard open → Daily Modal appears automatically
4. Modal shows western → eastern → fusion in that order
5. After modal close → Dashboard accessible
6. Signature permanently visible on Dashboard
7. Different users get different Signatures and Daily readings

**Step 1: Write test stubs** (implementation depends on testing framework — Vitest + jsdom for unit, Playwright for full e2e)

**Step 2: Commit**

```bash
git add src/__tests__/onboarding-e2e.test.ts
git commit -m "test(M6): e2e test scenarios for onboarding + daily modal

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Acceptance Criteria Checklist

From the dev brief:

- [ ] Nach Eingabe der Geburtsdaten sofort eine initiale Signatur sichtbar (M4 Task 4.3)
- [ ] Eine erste Quizantwort die Signatur sichtbar veraendert (M4 Task 4.3)
- [ ] Beim ersten Oeffnen des Dashboards automatisch Daily-Horoscope-Popup (M5 Task 5.2)
- [ ] Popup zeigt westliches Horoskop, BaZi-Horoskop und Fusion in dieser Reihenfolge (M5 Task 5.1)
- [ ] Fusion inhaltlich eigenstaendig — keine Textverkettung (M2 Task 2.5)
- [ ] Signatur nach dem Popup dauerhaft auf dem Dashboard sichtbar (M5 Task 5.3)

## Risk Register

| Risk | P | I | RE | Mitigation |
|------|---|---|-----|------------|
| Ephemeris/tzdb drift → inconsistent daily data | 0.8 | 9 | 7.2 | M0: pin ephe + tzdata in deploy |
| Two affinity maps diverge | 0.7 | 8 | 5.6 | M1: canonical JSON in FuFirE |
| Frontend stitches 3 endpoints → timing drift | 0.6 | 7 | 4.2 | Bundled `/experience/daily` endpoint |
| Missing birth time → false confidence | 0.4 | 9 | 3.6 | Provisional mode + precision warnings |
| FuFirE unreachable → blank onboarding | 0.5 | 8 | 4.0 | Graceful fallback to existing BAFE flow |

## Implementation Priority

```
M0 (Hardening) → M1 (Contracts) → M2 (FuFirE Services) → M3 (Supabase Schema)
                                                              ↓
                                              M4 (Onboarding) + M5 (Dashboard) [parallel]
                                                              ↓
                                                       M6 (QA & Rollout)
```

M3 can start in parallel with M2 since it's independent Supabase DDL.
M4 and M5 can be developed in parallel once M2 and M3 are complete.
