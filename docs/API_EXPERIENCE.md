# Experience API Reference

## Overview

The Experience API is a high-level layer on top of FuFirE (the astrology calculation backend) that orchestrates the full user lifecycle: profile bootstrap from birth data, incremental signature updates from quiz interactions, and daily horoscope generation combining Western, BaZi, and Fusion perspectives.

All three endpoints are deterministic and template-based (no LLM calls). Responses are structured data suitable for direct UI rendering.

## Base URL

- **Production (via proxy):** `/api/experience/*` -- requests are proxied by `server.mjs` to FuFirE
- **Direct FuFirE:** `{BAFE_BASE_URL}/experience/*`

The proxy adds a 10-20s timeout per endpoint, a 10KB payload size limit, and returns `502` with `{"error": "experience_unavailable"}` when FuFirE is unreachable.

---

## Endpoints

### POST /experience/bootstrap

**Purpose:** Full profile bootstrap from birth data. Computes BaZi pillars, Western chart, Fusion analysis, then derives the 12-sector soulprint vector and a deterministic signature blueprint used to drive the Signatur ring visualization.

**Rate limit (via proxy):** 100 requests per 15 minutes per IP, shared across all `/api/*` endpoints (enforced by `server.mjs`).

**Proxy timeout:** 15s

**Request:**

```json
{
  "birth": {
    "date": "1990-07-15",
    "time": "14:30:00",
    "tz": "Europe/Berlin",
    "lat": 53.5511,
    "lon": 9.9937,
    "place_label": "Hamburg, Germany"
  },
  "locale": "de-DE"
}
```

**Request fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `birth.date` | `string` | Yes | Birth date in `YYYY-MM-DD` format. Validated as a real calendar date. |
| `birth.time` | `string` | Yes | Birth time in `HH:MM:SS` format. |
| `birth.tz` | `string` | Yes | IANA timezone identifier (e.g. `Europe/Berlin`). |
| `birth.lat` | `float` | Yes | Latitude, range `[-90, 90]`. |
| `birth.lon` | `float` | Yes | Longitude, range `[-180, 180]`. |
| `birth.place_label` | `string` | No | Human-readable place name (not used in computation). |
| `locale` | `string` | No | Locale for sign name translation. Default: `de-DE`. When `de-*`, zodiac signs are returned in German. |

**Response:**

```json
{
  "profile": {
    "sun_sign": "Krebs",
    "moon_sign": "Skorpion",
    "ascendant_sign": "Waage",
    "day_master": "Geng",
    "harmony_index": 0.6234
  },
  "soulprint_sectors": [0.0412, 0.0891, 0.0523, 0.1847, 0.1203, 0.0634, 0.1156, 0.0789, 0.0445, 0.0312, 0.0978, 0.0810],
  "signature_blueprint": {
    "seed": "sig_v1_a3f8c2e91b4d7056",
    "visual": {
      "symmetry": 0.7123,
      "curvature": 0.4500,
      "angularity": 0.3800,
      "density": 0.3956,
      "contrast": 0.1435,
      "orbit_count": 4
    },
    "elements": {
      "Holz": 0.2100,
      "Feuer": 0.1800,
      "Erde": 0.2200,
      "Metall": 0.1900,
      "Wasser": 0.2000
    }
  },
  "meta": {
    "engine_version": "2.4.0",
    "generated_at": "2026-03-16T10:30:00Z"
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `profile.sun_sign` | `string` | Sun sign name (localized if `de-*` locale). |
| `profile.moon_sign` | `string` | Moon sign name (localized). |
| `profile.ascendant_sign` | `string` | Ascendant sign name (localized). |
| `profile.day_master` | `string` | BaZi Day Master Heavenly Stem (e.g. `Jia`, `Yi`, `Geng`). |
| `profile.harmony_index` | `float` | Calibrated Kohärenz-Index `[0, 1]`. Derived from the Fusion analysis wu-xing balance. |
| `soulprint_sectors` | `float[12]` | Normalized 12-sector natal vector. Each value `[0, 1]`, sums to ~1. Sectors map to zodiac signs (0=Aries..11=Pisces). Weighted by Sun (1.0), Moon (0.8), Ascendant (0.6), personal planets (0.4 each), and Wu-Xing element affinities (0.5 weight). |
| `signature_blueprint.seed` | `string` | Deterministic hash seed (`sig_v1_` prefix + SHA-256 fragment). Same input always produces the same seed. |
| `signature_blueprint.visual.symmetry` | `float` | Ring symmetry `[0, 1]`. Derived from sector variance (lower variance = higher symmetry). |
| `signature_blueprint.visual.curvature` | `float` | Ring curvature `[0, 1]`. Sum of Wasser + Holz element weights. |
| `signature_blueprint.visual.angularity` | `float` | Ring angularity `[0, 1]`. Sum of Metall + Feuer element weights. |
| `signature_blueprint.visual.density` | `float` | Ring density `[0, 1]`. Ratio of top-3 sector values to total. |
| `signature_blueprint.visual.contrast` | `float` | Ring contrast `[0, 1]`. Spread between max and min sector values. |
| `signature_blueprint.visual.orbit_count` | `int` | Number of ring orbits `[1, 7]`. Derived from Kohärenz-Index. |
| `signature_blueprint.elements` | `object` | Wu-Xing element weights (averaged from Western and BaZi systems). |
| `meta.engine_version` | `string` | FuFirE engine version. |
| `meta.generated_at` | `string` | ISO 8601 UTC timestamp. |

**Error responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 413 | Payload > 10KB (proxy) | `{"error": "payload_too_large"}` |
| 422 | Invalid birth data (bad date, lat out of range, etc.) | `{"error": "computation_error", "message": "BaZi calculation failed: ..."}` |
| 500 | Western chart or Fusion calculation failure | `{"error": "computation_error", "message": "..."}` |
| 502 | FuFirE unreachable (proxy timeout) | `{"error": "experience_unavailable"}` |

---

### POST /experience/signature-delta

**Purpose:** Incremental signature update from a single quiz answer. Blends the existing soulprint with quiz-derived sector weights (70/30 ratio), recomputes the signature blueprint, and returns the visual deltas for animation.

**Rate limit:** 60/min (per IP)

**Proxy timeout:** 10s

**Request:**

```json
{
  "soulprint_sectors": [0.0412, 0.0891, 0.0523, 0.1847, 0.1203, 0.0634, 0.1156, 0.0789, 0.0445, 0.0312, 0.0978, 0.0810],
  "signature_blueprint": {
    "seed": "sig_v1_a3f8c2e91b4d7056",
    "visual": {
      "symmetry": 0.7123,
      "curvature": 0.4500,
      "angularity": 0.3800,
      "density": 0.3956,
      "contrast": 0.1435,
      "orbit_count": 4
    },
    "elements": {
      "Holz": 0.2100,
      "Feuer": 0.1800,
      "Erde": 0.2200,
      "Metall": 0.1900,
      "Wasser": 0.2000
    }
  },
  "quiz_answer": {
    "keyword": "expression"
  }
}
```

**Request fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `soulprint_sectors` | `float[12]` | Yes | Current 12-sector soulprint (from bootstrap). Each value must be `[0, 1]`. |
| `signature_blueprint` | `object` | Yes | Current signature blueprint (from bootstrap or previous delta). |
| `signature_blueprint.seed` | `string` | Yes | Current blueprint seed. |
| `signature_blueprint.visual` | `object` | No | Current visual parameters. If absent, deltas are absolute values rather than differences. |
| `signature_blueprint.elements` | `object` | No | Wu-Xing elements. Falls back to uniform `0.2` each if absent. |
| `quiz_answer.keyword` | `string` | Yes | Quiz keyword mapped via `affinity_map.json`. Known keywords include: `expression`, `analytical`, `harmony`, `adventure`. Unknown keywords fall back to uniform sector distribution. |

**Response:**

```json
{
  "quiz_sectors": [0.0833, 0.0833, 0.0833, 0.0833, 0.2500, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833],
  "signature_delta": {
    "curvature": 0.0234,
    "contrast": -0.0112,
    "density": 0.0089
  },
  "signature_blueprint": {
    "seed": "sig_v1_f7d2a1c83e9b4510",
    "visual": {
      "symmetry": 0.6890,
      "curvature": 0.4734,
      "angularity": 0.3650,
      "density": 0.4045,
      "contrast": 0.1323,
      "orbit_count": 4
    },
    "elements": {
      "Holz": 0.2100,
      "Feuer": 0.1800,
      "Erde": 0.2200,
      "Metall": 0.1900,
      "Wasser": 0.2000
    }
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `quiz_sectors` | `float[12]` | Raw sector weights resolved from the quiz keyword via `affinity_map.json`. |
| `signature_delta.curvature` | `float` | Change in curvature from old to new blueprint. Positive = more curved. |
| `signature_delta.contrast` | `float` | Change in contrast. |
| `signature_delta.density` | `float` | Change in density. |
| `signature_blueprint` | `object` | Recomputed blueprint after blending soulprint (70%) with quiz sectors (30%). This becomes the new current blueprint. |

**Blending algorithm:**

1. `blended[i] = soulprint[i] * 0.7 + quiz[i] * 0.3` for each of 12 sectors
2. Normalize blended to sum to 1.0
3. Recompute blueprint from blended sectors + existing Wu-Xing elements

**Error responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 413 | Payload > 10KB (proxy) | `{"error": "payload_too_large"}` |
| 422 | Sector values outside `[0, 1]` or array length != 12 | Pydantic validation error |
| 502 | FuFirE unreachable (proxy timeout) | `{"error": "experience_unavailable"}` |

---

### POST /experience/daily

**Purpose:** Generate a daily horoscope combining Western transits, BaZi day-pillar analysis, and a Fusion synthesis. All content is template-based and deterministic (same inputs + date = same output).

**Rate limit (via proxy):** 100 requests per 15 minutes per IP, shared across all `/api/*` endpoints (enforced by `server.mjs`).

**Proxy timeout:** 20s

**Request:**

```json
{
  "birth": {
    "date": "1990-07-15",
    "time": "14:30:00",
    "tz": "Europe/Berlin",
    "lat": 53.5511,
    "lon": 9.9937
  },
  "soulprint_sectors": [0.0412, 0.0891, 0.0523, 0.1847, 0.1203, 0.0634, 0.1156, 0.0789, 0.0445, 0.0312, 0.0978, 0.0810],
  "quiz_sectors": [0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833, 0.0833],
  "target_date": "2026-03-16",
  "locale": "de-DE"
}
```

**Request fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `birth` | `object` | Yes | Same `BirthInput` as bootstrap. Used to recompute natal chart for transit overlay. |
| `soulprint_sectors` | `float[12]` | Yes | User's soulprint (from bootstrap). Values must be `[0, 1]`. |
| `quiz_sectors` | `float[12]` | Yes | Quiz-derived sectors (from signature-delta, or uniform `[1/12, ...]` if no quiz taken). Values must be `[0, 1]`. |
| `target_date` | `string` | Yes | Date for the horoscope in `YYYY-MM-DD` format. |
| `locale` | `string` | No | Default: `de-DE`. Affects theme and summary language. |

**Response:**

```json
{
  "date": "2026-03-16",
  "western": {
    "summary": "Fuer dich als Krebs stehen heute Tiefe, Karriere im Fokus. Die Planetenkonstellation aktiviert deine Sektoren 8 und 10.",
    "themes": ["Tiefe", "Karriere"],
    "caution": "Achte in Sektor 10 auf Ueberanstrengung — hier liegt heute Spannung.",
    "opportunity": "Sektor 8 bietet dir heute besonderes Potenzial. Nutze die Energie aktiv.",
    "evidence": {
      "transit_sectors": [7, 9],
      "natal_focus": ["sun", "ascendant"]
    }
  },
  "eastern": {
    "summary": "Der heutige Tag schwingt mit deinem Day Master Geng in Gleichklang. Metall-Energie verstaerkt dich. Solarterm: Jingzhe.",
    "themes": ["Gleichklang", "Staerkung", "Vertrauen"],
    "caution": "Die Companion-Dynamik kann heute zu Ueberreaktion fuehren. Bleibe geerdet.",
    "opportunity": "Gleichklang ist heute dein staerkstes Feld. Nutze die Metall-Energie bewusst.",
    "evidence": {
      "day_master": "Geng",
      "daily_pillar": {
        "stem": "Geng",
        "branch": "Yin"
      },
      "relation_to_day_master": "companion"
    }
  },
  "fusion": {
    "summary": "Dein Fusionstag verbindet Tiefe aus beiden Systemen. Westlich staerkt dein Transitfeld, oestlich arbeitet dein Day Master Geng in companion-Dynamik.",
    "synthesis": "Beide Systeme zeigen heute einen gemeinsamen Impuls: Tiefe. Gleichzeitig entsteht Spannung im Bereich Karriere, Gleichklang, Staerkung, Vertrauen. Die Synthese liegt darin, beides bewusst zu halten.",
    "action": "Nutze heute gezielt den Bereich Tiefe. Plane eine bewusste Handlung, die beide Energien verbindet.",
    "pushworthy": false,
    "push_text": null,
    "harmony_index": 0.52,
    "day_mode": "trace"
  },
  "meta": {
    "engine_version": "2.4.0",
    "generated_at": "2026-03-16T10:45:00Z"
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | Echo of `target_date`. |
| `western` | `DailySection` | Western astrology reading based on planetary transits overlaid on the user's soulprint. |
| `western.summary` | `string` | Personalized summary mentioning the user's sun sign and active sectors. |
| `western.themes` | `string[]` | 1-2 active themes derived from the highest-scoring transit x soulprint sectors. |
| `western.caution` | `string` | Area of tension for the day. |
| `western.opportunity` | `string` | Area of potential for the day. |
| `western.evidence.transit_sectors` | `int[]` | Indices of the two most active sectors (0-based). |
| `western.evidence.natal_focus` | `string[]` | Which natal points were used (e.g. `["sun", "ascendant"]`). |
| `eastern` | `DailySection` | BaZi reading based on the sexagenary day pillar and its relationship to the user's Day Master. |
| `eastern.themes` | `string[]` | Themes derived from the Day Master / daily stem relationship (companion, resource, output, power, wealth, neutral). |
| `eastern.evidence.day_master` | `string` | User's natal Day Master. |
| `eastern.evidence.daily_pillar` | `object` | Today's sexagenary pillar (`stem` + `branch`). |
| `eastern.evidence.relation_to_day_master` | `string` | One of: `companion`, `resource`, `output`, `power`, `wealth`, `neutral`. |
| `fusion` | `DailyFusion` | Synthesis of Western and Eastern readings. |
| `fusion.summary` | `string` | Combined narrative finding shared themes between both systems. |
| `fusion.synthesis` | `string` | Deeper synthesis highlighting both shared impulses and tension areas. |
| `fusion.action` | `string` | Actionable daily impulse. |
| `fusion.pushworthy` | `boolean` | Whether this day warrants a push notification. `true` when relation is `power`, `wealth`, or `resource`. |
| `fusion.push_text` | `string?` | Short push notification text. `null` when `pushworthy` is `false`. |
| `fusion.harmony_index` | `number` | Cosine similarity between Western and Eastern Wu-Xing vectors, range 0-1. 0.45 = random baseline, >= 0.50 = convergence day. |
| `fusion.day_mode` | `string` | `"pulse"` when `harmony_index` < 0.50 (calm day), `"trace"` when `harmony_index` >= 0.50 (convergence day). |
| `meta` | `object` | Engine version and generation timestamp. |

**Error responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 413 | Payload > 10KB (proxy) | `{"error": "payload_too_large"}` |
| 422 | Invalid birth data, sector values out of range, or bad target_date | Pydantic validation error |
| 500 | Chart computation failure | `{"error": "computation_error", "message": "..."}` |
| 502 | FuFirE unreachable (proxy timeout) | `{"error": "experience_unavailable"}` |

---

## Data Models

### BirthInput

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `date` | `string` | `YYYY-MM-DD`, valid calendar date | Birth date |
| `time` | `string` | `HH:MM:SS`, valid time | Birth time |
| `tz` | `string` | IANA timezone | Timezone identifier |
| `lat` | `float` | `[-90, 90]`, no inf/NaN | Latitude |
| `lon` | `float` | `[-180, 180]`, no inf/NaN | Longitude |
| `place_label` | `string?` | Optional | Display name for the location |

### ProfileSummary

| Field | Type | Description |
|-------|------|-------------|
| `sun_sign` | `string` | Localized sun sign name |
| `moon_sign` | `string` | Localized moon sign name |
| `ascendant_sign` | `string` | Localized ascendant sign name |
| `day_master` | `string` | BaZi Day Master stem (Pinyin) |
| `harmony_index` | `float [0,1]` | Kohärenz-Index: calibrated coherence between Western and BaZi systems |

### VisualParams

All values `[0, 1]` except `orbit_count`.

| Field | Type | Derivation |
|-------|------|------------|
| `symmetry` | `float` | `1 - sqrt(variance(sectors)) * 10`, clamped |
| `curvature` | `float` | `Wasser + Holz` element weights, clamped |
| `angularity` | `float` | `Metall + Feuer` element weights, clamped |
| `density` | `float` | Sum of top-3 sectors / total |
| `contrast` | `float` | `max(sectors) - min(sectors)` |
| `orbit_count` | `int [1,7]` | `ceil(harmony * 5) + 1` (theoretical range `[1, 7]`), clamped to effective range `[2, 5]` |

### SignatureBlueprint

| Field | Type | Description |
|-------|------|-------------|
| `seed` | `string` | Deterministic hash: `sig_v1_` + SHA-256(sectors + wuxing + harmony)[:16] |
| `visual` | `VisualParams?` | Visual rendering parameters |
| `elements` | `Record<string, float>?` | Wu-Xing element weights (Holz, Feuer, Erde, Metall, Wasser) |

### SignatureDelta

| Field | Type | Description |
|-------|------|-------------|
| `curvature` | `float` | Signed change in curvature |
| `contrast` | `float` | Signed change in contrast |
| `density` | `float` | Signed change in density |

### DailySection

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string` | Personalized daily summary |
| `themes` | `string[]` | Active themes for the day |
| `caution` | `string` | Area of caution |
| `opportunity` | `string` | Area of opportunity |
| `evidence` | `DailyEvidence` | Supporting data points |

### DailyEvidence

| Field | Type | Description |
|-------|------|-------------|
| `transit_sectors` | `int[]?` | Active sector indices (Western) |
| `natal_focus` | `string[]?` | Which natal points contributed (Western) |
| `day_master` | `string?` | Day Master stem (Eastern) |
| `daily_pillar` | `{stem, branch}?` | Sexagenary day pillar (Eastern) |
| `relation_to_day_master` | `string?` | Five-relation type (Eastern) |

### DailyFusion

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string` | Fusion narrative |
| `synthesis` | `string` | Shared themes + tension analysis |
| `action` | `string` | Actionable daily impulse |
| `pushworthy` | `boolean` | Whether to send a push notification |
| `push_text` | `string?` | Push notification copy (null if not pushworthy) |

---

## Feature Flags

The client-side feature flag module (`src/lib/feature-flags.ts`) controls two flags:

| Flag | Default | Description |
|------|---------|-------------|
| `signature_onboarding_v1` | `true` | Enables the Signatur onboarding flow (bootstrap call + SignatureReveal phase). When `false`, the app falls through to the legacy BAFE-only flow. |
| `daily_modal_v1` | `true` | Enables the DailyHoroscopeModal on first Dashboard visit. |

**Override via browser console:**

```javascript
// Disable signature onboarding
localStorage.setItem('ff_signature_onboarding_v1', 'false');

// Re-enable
localStorage.removeItem('ff_signature_onboarding_v1');
```

Override is read at call time (no page reload needed for subsequent checks, but the initial check in `App.tsx` runs once per mount).

---

## Zod Schemas (Client)

The client validates all Experience API responses with Zod schemas defined in `src/lib/schemas/experience.ts`:

- `BootstrapResponseSchema` -- validates `/experience/bootstrap` responses
- `SignatureDeltaResponseSchema` -- validates `/experience/signature-delta` responses
- `DailyResponseSchema` -- validates `/experience/daily` responses

Exported types: `BootstrapResponse`, `SignatureDeltaResponse`, `DailyResponse`.
