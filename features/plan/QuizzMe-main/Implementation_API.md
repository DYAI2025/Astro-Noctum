Hier ist ein vollständiger, fail-closed API-Contract (v1) für deine astro_precision SSOT-Engine, konsumierbar von CosmicEngine/Backend (Quizme) und indirekt vom AstroDashboard. Er ist so entworfen, dass kein Client/keine LLM rechnen darf, sondern nur validierte Fakten übernimmt – und bei validation.status != ok|warn (oder bei mode=strict schon bei warn) hart stoppt.

Faktisch korrekt sage ich, ## Contract-Regeln (Guardrails, die der Vertrag erzwingt)

Fail-Closed Default

mode=strict: Nur validation.status="ok" ist erlaubt → sonst Error (kein data).

mode=preview: validation.status="ok" | "warn" erlaubt, aber:

warn muss konkrete warnings[] liefern.

Sensible Outputs (Angles/Houses) dürfen nicht geliefert werden, wenn Inputs dafür nicht präzise genug sind (z.B. time_accuracy="unknown").

Output-Gating (Feature→Input-Abhängigkeiten)

angles/houses benötigen: birth.date + birth.time.local + tz.iana + lat/lon und DST-Disambiguierung (fold falls nötig).

planets (Moon etc.) benötigen Zeit + TZ + lat/lon (je nach Planet/Option).

chinese.yearPillar benötigt mindestens Datum (+ TZ wenn Li-Chun Zeitpunkt grenznah ist).

LLM darf nur orchestrieren

Response enthält orchestratorPolicy.mustStop und allowedOutputs als maschinenlesbares Gate.

Clients müssen: wenn mustStop=true → kein UI/keine Interpretation/kein “Best Effort”.

Faktisch korrekt sage ich, ## OpenAPI 3.1 (YAML) – Precision Engine v1

yaml
Code kopieren
openapi: 3.1.0
info:
  title: Astro Precision API
  version: "1.0.0"
  description: >
    Deterministic, fail-closed astrology computation SSOT (Swiss Ephemeris etc.).
    Clients must not compute. Clients must stop when orchestratorPolicy.mustStop=true.

servers:
  - url: https://precision.internal
    description: Internal service (called server-to-server only)

security:
  - BearerAuth: []

paths:
  /v1/astro/precision/compute:
    post:
      summary: Compute precision horoscope (SSOT) with audit + validation
      operationId: computePrecision
      parameters:
        - in: header
          name: X-Request-Id
          required: false
          schema: { type: string }
        - in: header
          name: Idempotency-Key
          required: false
          schema: { type: string }
        - in: header
          name: X-Client
          required: false
          schema:
            type: string
            enum: [quizme, dashboard, internal]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PrecisionComputeRequest"
            examples:
              strict_ok:
                summary: Strict compute (full)
                value:
                  input:
                    birth:
                      date: "1991-02-04"
                      time: { local: "09:42:00", accuracy: "exact", fold: 0 }
                    location:
                      lat: 48.8566
                      lon: 2.3522
                      altMeters: 35
                      accuracy: gps
                    timezone:
                      iana: "Europe/Paris"
                      source: geo
                  options:
                    mode: strict
                    houseSystem: P
                    zodiac: tropical
                    include:
                      angles: true
                      houses: true
                      planets: true
                      aspects: false
                      chinese: true
                      bazi: false
      responses:
        "200":
          description: Success (strict: only ok; preview: ok|warn)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionSuccessResponse"
        "409":
          description: Conflict (DST ambiguity or contradictory TZ/offset)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionErrorResponse"
        "422":
          description: Input invalid/missing required fields for requested outputs
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionErrorResponse"
        "503":
          description: Ephemeris/DeltaT unavailable in strict mode
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionErrorResponse"
        "500":
          description: Internal error (contains errorId)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionErrorResponse"

  /v1/astro/precision/validate:
    post:
      summary: Validate inputs only (DST/TZ resolvability, completeness, strict readiness)
      operationId: validatePrecision
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PrecisionValidateRequest"
      responses:
        "200":
          description: Validation result (no computed data)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionValidateResponse"
        "409":
          description: Conflict (DST ambiguity)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionErrorResponse"
        "422":
          description: Input invalid
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionErrorResponse"

  /v1/astro/precision/capabilities:
    get:
      summary: Service capabilities (strict readiness, supported systems)
      operationId: getCapabilities
      responses:
        "200":
          description: Capabilities
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionCapabilitiesResponse"

  /v1/astro/precision/health:
    get:
      summary: Liveness/readiness
      operationId: getHealth
      security: []   # often public inside cluster; optional
      responses:
        "200":
          description: Health
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PrecisionHealthResponse"

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    PrecisionComputeRequest:
      type: object
      required: [input, options]
      properties:
        input:
          $ref: "#/components/schemas/PrecisionInput"
        options:
          $ref: "#/components/schemas/PrecisionOptions"

    PrecisionValidateRequest:
      type: object
      required: [input, options]
      properties:
        input:
          $ref: "#/components/schemas/PrecisionInput"
        options:
          $ref: "#/components/schemas/PrecisionValidateOptions"

    PrecisionInput:
      type: object
      required: [birth, location, timezone]
      properties:
        birth:
          $ref: "#/components/schemas/BirthSpec"
        location:
          $ref: "#/components/schemas/LocationSpec"
        timezone:
          $ref: "#/components/schemas/TimezoneSpec"

    BirthSpec:
      type: object
      required: [date, time]
      properties:
        date:
          type: string
          format: date
        time:
          $ref: "#/components/schemas/TimeSpec"

    TimeSpec:
      type: object
      required: [accuracy]
      properties:
        local:
          type: string
          format: time
          description: Local wall clock time. Required when angles/houses or Moon etc. are requested.
        accuracy:
          type: string
          enum: [exact, approx, unknown]
        fold:
          type: integer
          enum: [0, 1]
          description: Required when local time is ambiguous due to DST transition.
      additionalProperties: false

    LocationSpec:
      type: object
      required: [lat, lon]
      properties:
        lat:
          type: number
          minimum: -90
          maximum: 90
        lon:
          type: number
          minimum: -180
          maximum: 180
        altMeters:
          type: number
          minimum: -500
          maximum: 10000
        accuracy:
          type: string
          enum: [gps, city, manual, unknown]
      additionalProperties: false

    TimezoneSpec:
      type: object
      required: [iana]
      properties:
        iana:
          type: string
          description: IANA TZ name (e.g. Europe/Berlin). Required in strict mode.
        source:
          type: string
          enum: [user, geo, system]
        providedOffsetMinutes:
          type: integer
          description: Optional. If provided and contradicts resolved offset -> 409 TIMEZONE_CONFLICT.
      additionalProperties: false

    PrecisionOptions:
      type: object
      required: [mode, include]
      properties:
        mode:
          type: string
          enum: [strict, preview]
        houseSystem:
          type: string
          enum: [P, K, O, R, C, E, W]   # extend as needed
          default: P
        zodiac:
          type: string
          enum: [tropical, sidereal]
          default: tropical
        include:
          $ref: "#/components/schemas/IncludeSpec"
        precision:
          $ref: "#/components/schemas/PrecisionTolerances"
      additionalProperties: false

    PrecisionValidateOptions:
      type: object
      required: [mode, include]
      properties:
        mode:
          type: string
          enum: [strict, preview]
        include:
          $ref: "#/components/schemas/IncludeSpec"
      additionalProperties: false

    IncludeSpec:
      type: object
      required: [angles, houses, planets, chinese, bazi]
      properties:
        angles: { type: boolean }
        houses: { type: boolean }
        planets: { type: boolean }
        aspects: { type: boolean, default: false }
        chinese: { type: boolean }
        bazi: { type: boolean }
      additionalProperties: false

    PrecisionTolerances:
      type: object
      properties:
        ascToleranceDeg:
          type: number
          minimum: 0
          default: 0.02
        planetToleranceDeg:
          type: number
          minimum: 0
          default: 0.05
        deltaTToleranceSec:
          type: number
          minimum: 0
          default: 5
      additionalProperties: false

    PrecisionSuccessResponse:
      type: object
      required: [requestId, meta, validation, orchestratorPolicy]
      properties:
        requestId: { type: string }
        meta:
          $ref: "#/components/schemas/MetaBlock"
        data:
          $ref: "#/components/schemas/PrecisionData"
          description: Present only when validation.status is ok or warn (and warn allowed by mode).
        validation:
          $ref: "#/components/schemas/ValidationBlock"
        orchestratorPolicy:
          $ref: "#/components/schemas/OrchestratorPolicy"
      additionalProperties: false

    PrecisionErrorResponse:
      type: object
      required: [requestId, error]
      properties:
        requestId: { type: string }
        error:
          $ref: "#/components/schemas/ErrorBlock"
      additionalProperties: false

    MetaBlock:
      type: object
      required: [engine, models, inputFingerprint, computedAt]
      properties:
        engine:
          type: object
          required: [name, version, build]
          properties:
            name: { type: string }
            version: { type: string }
            build: { type: string, description: "e.g. git:abcd1234" }
        models:
          type: object
          required: [ephemeris, timeScale]
          properties:
            ephemeris: { type: string, enum: [SwissEphemeris, Moshier] }
            ephemerisVersion: { type: string }
            deltaTSource: { type: string }
            iau: { type: string }
            timeScale: { type: string, description: "UTC→UT1→TT" }
        inputFingerprint:
          type: string
          description: sha256 of canonicalized input JSON
        computedAt:
          type: string
          format: date-time

    PrecisionData:
      type: object
      properties:
        resolvedTime:
          $ref: "#/components/schemas/ResolvedTime"
        angles:
          $ref: "#/components/schemas/AnglesBlock"
        houses:
          $ref: "#/components/schemas/HousesBlock"
        planets:
          $ref: "#/components/schemas/PlanetsBlock"
        chinese:
          $ref: "#/components/schemas/ChineseBlock"
        audit:
          $ref: "#/components/schemas/AuditBlock"
      additionalProperties: false

    ResolvedTime:
      type: object
      required: [utcInstant, offsetMinutes, dst, jdUt]
      properties:
        utcInstant: { type: string, format: date-time }
        offsetMinutes: { type: integer, description: "Minutes east of UTC (+120 for CEST)" }
        dst: { type: boolean }
        fold: { type: integer, enum: [0, 1] }
        jdUt: { type: number }
        jdTt: { type: number }
        deltaTSec: { type: number }

    AnglesBlock:
      type: object
      required: [asc, mc]
      properties:
        asc: { $ref: "#/components/schemas/AngleValue" }
        mc:  { $ref: "#/components/schemas/AngleValue" }

    AngleValue:
      type: object
      required: [deg, sign, degInSign]
      properties:
        deg: { type: number, minimum: 0, maximum: 360 }
        sign: { type: string }
        degInSign: { type: number, minimum: 0, maximum: 30 }

    HousesBlock:
      type: object
      required: [system, cuspsDeg]
      properties:
        system: { type: string }
        cuspsDeg:
          type: array
          minItems: 12
          maxItems: 12
          items: { type: number, minimum: 0, maximum: 360 }

    PlanetsBlock:
      type: object
      additionalProperties:
        $ref: "#/components/schemas/PlanetValue"

    PlanetValue:
      type: object
      required: [lonDeg, latDeg, sign, degInSign]
      properties:
        lonDeg: { type: number, minimum: 0, maximum: 360 }
        latDeg: { type: number, minimum: -90, maximum: 90 }
        speedDegPerDay: { type: number }
        sign: { type: string }
        degInSign: { type: number, minimum: 0, maximum: 30 }

    ChineseBlock:
      type: object
      properties:
        yearFromLiChun:
          type: object
          properties:
            stemBranch: { type: string }
            animal: { type: string }
            element: { type: string }
            yinYang: { type: string }
        yearFromTable:
          type: object
          properties:
            animal: { type: string }
            validFrom: { type: string, format: date }
            validTo: { type: string, format: date }

    AuditBlock:
      type: object
      properties:
        swe:
          type: object
          properties:
            houseSystem: { type: string }
            flags: { type: array, items: { type: string } }

    ValidationBlock:
      type: object
      required: [status, checks, warnings]
      properties:
        status:
          type: string
          enum: [ok, warn]
        checks:
          type: array
          items:
            $ref: "#/components/schemas/ValidationCheck"
        warnings:
          type: array
          items:
            $ref: "#/components/schemas/WarningItem"

    ValidationCheck:
      type: object
      required: [id, status]
      properties:
        id:
          type: string
          enum:
            - INPUT_COMPLETE
            - TZ_RESOLVED
            - DST_DISAMBIGUATED
            - EPHEMERIS_READY
            - DELTA_T_READY
            - ANGLE_NORMALIZED
            - SANITY_SUNSIGN
            - SANITY_CHINESE_YEAR
        status:
          type: string
          enum: [ok, warn, fail]
        details:
          type: object

    WarningItem:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          enum:
            - TIME_APPROX
            - TIME_UNKNOWN
            - DST_ASSUMED
            - LOW_LOCATION_ACCURACY
            - PREVIEW_ONLY_PARTIAL_OUTPUT
        message: { type: string }
        details: { type: object }

    OrchestratorPolicy:
      type: object
      required: [mustStop, allowedOutputs]
      properties:
        mustStop:
          type: boolean
          description: >
            Clients/LLM must stop and must not show results when true.
        allowedOutputs:
          type: object
          properties:
            angles: { type: boolean }
            houses: { type: boolean }
            planets: { type: boolean }
            chinese: { type: boolean }
            bazi: { type: boolean }
        rationale:
          type: string

    PrecisionValidateResponse:
      type: object
      required: [requestId, meta, validation, orchestratorPolicy]
      properties:
        requestId: { type: string }
        meta: { $ref: "#/components/schemas/MetaBlock" }
        validation: { $ref: "#/components/schemas/ValidationBlock" }
        orchestratorPolicy: { $ref: "#/components/schemas/OrchestratorPolicy" }

    ErrorBlock:
      type: object
      required: [code, message]
      properties:
        code:
          type: string
          enum:
            - MISSING_FIELD
            - INVALID_FORMAT
            - INVALID_LAT_LON
            - TIMEZONE_NOT_RESOLVABLE
            - TIMEZONE_CONFLICT
            - AMBIGUOUS_LOCAL_TIME
            - EPHEMERIS_UNAVAILABLE
            - DELTA_T_UNAVAILABLE
            - OUT_OF_SUPPORTED_RANGE
            - STRICT_DISALLOWS_WARN
            - INTERNAL_ERROR
        message: { type: string }
        details: { type: object }
        errorId:
          type: string
          description: present on INTERNAL_ERROR

    PrecisionCapabilitiesResponse:
      type: object
      required: [engine, strictAvailable, ephemeris]
      properties:
        engine:
          type: object
          properties:
            name: { type: string }
            version: { type: string }
            build: { type: string }
        strictAvailable: { type: boolean }
        ephemeris:
          type: object
          properties:
            provider: { type: string }
            filesPresent: { type: boolean }
            seEphePathSet: { type: boolean }
        supported:
          type: object
          properties:
            houseSystems: { type: array, items: { type: string } }
            zodiacs: { type: array, items: { type: string } }
            planets: { type: array, items: { type: string } }

    PrecisionHealthResponse:
      type: object
      required: [status, time]
      properties:
        status: { type: string, enum: [ok] }
        time: { type: string, format: date-time }
        uptimeSeconds: { type: integer }
Logisch scheint mir, ## HTTP-Status → Error-Code Mapping (praktisch fürs Client-Handling)

409 Conflict

AMBIGUOUS_LOCAL_TIME: fold fehlt; details.candidates[] enthält Offset-Optionen

TIMEZONE_CONFLICT: providedOffsetMinutes widerspricht IANA-Resolution

422 Unprocessable Entity

MISSING_FIELD, INVALID_FORMAT, INVALID_LAT_LON

OUT_OF_SUPPORTED_RANGE (z.B. Ephemeris Range)

503 Service Unavailable (strict)

EPHEMERIS_UNAVAILABLE (SE_EPHE_PATH/Files fehlen)

DELTA_T_UNAVAILABLE

200 ok/warn

mode=strict → nur ok

mode=preview → ok oder warn (mit Warnliste + eingeschränkten allowedOutputs)

500

INTERNAL_ERROR mit errorId

Faktisch korrekt sage ich, ## Integrationsregeln für Quizme ↔ Precision ↔ Dashboard

Quizme (Backend/Next)

Ruft /compute serverseitig auf (Service Token / interner JWT).

Persistiert in Supabase:

immer: meta, validation, orchestratorPolicy, inputFingerprint

optional: data (oder nur angles/chinese als „Anchors“, Planeten on-demand)

UI darf nur rendern, wenn orchestratorPolicy.mustStop=false und (prod) mode=strict.

AstroDashboard (UI)

Ruft Precision niemals direkt auf.

Rendert aus Supabase Snapshot / Profile-Payload.

LLM/Agent

Darf nur:

validation lesen,

warnings erklären,

data interpretieren nur wenn mustStop=false.

Muss bei mustStop=true eine „Stop“-Antwort geben (keine Zahlen, keine abgeleiteten Werte).

Rein subjektiv, aus meinem Denken ergibt sich, ## Kleine sinnvolle Ergänzung (optional, aber sehr hilfreich)
Füge in Responses noch ein Feld hinzu:

meta.contractVersion: "v1"

meta.canonicalInput: optional die normalisierte Inputform (z.B. UTC-Instant, resolved offset)

Das macht Debugging + Repro-Berechnungen in CI deutlich einfacher.

Wenn du willst, erstelle ich dir daraus als nächsten Schritt zwei konkrete Artefakte:

TypeScript Types (Request/Response + Error Unions) für Quizme

FastAPI Pydantic Models (strict validation + auto OpenAPI) für den Precision-Service





Du:
ja


3.PHASE-PLAN_Superpowers - Project Plan Generator sagte:

Nachgedacht für 15s
Faktisch korrekt sage ich, hier sind zwei direkt nutzbare Artefakte:

TypeScript Types + Unions + Type Guards (für Quizme / CosmicEngine Node-Host)

FastAPI + Pydantic Models (für deinen Precision-Service, inkl. fail-closed Response-Formate)

Alles ist so gebaut, dass Clients/LLM nur lesen dürfen und bei orchestratorPolicy.mustStop=true hart stoppen müssen.

Faktisch korrekt sage ich, ## 1) TypeScript: Contract Types (drop-in)

Empfohlener Pfad in Quizme: src/lib/astro-precision/contract.ts

ts
Code kopieren
/* src/lib/astro-precision/contract.ts
 * Astro Precision API Contract (v1)
 * Deterministic SSOT. Clients must not compute.
 */

export const CONTRACT_VERSION = "v1" as const;

// ─────────────────────────────────────────────────────────────
// Enums / literals
// ─────────────────────────────────────────────────────────────

export type Mode = "strict" | "preview";

export type TimeAccuracy = "exact" | "approx" | "unknown";

export type LocationAccuracy = "gps" | "city" | "manual" | "unknown";

export type TimezoneSource = "user" | "geo" | "system";

export type HouseSystem = "P" | "K" | "O" | "R" | "C" | "E" | "W";

export type Zodiac = "tropical" | "sidereal";

export type ValidationStatus = "ok" | "warn";

export type CheckStatus = "ok" | "warn" | "fail";

export type ValidationCheckId =
  | "INPUT_COMPLETE"
  | "TZ_RESOLVED"
  | "DST_DISAMBIGUATED"
  | "EPHEMERIS_READY"
  | "DELTA_T_READY"
  | "ANGLE_NORMALIZED"
  | "SANITY_SUNSIGN"
  | "SANITY_CHINESE_YEAR";

export type WarningCode =
  | "TIME_APPROX"
  | "TIME_UNKNOWN"
  | "DST_ASSUMED"
  | "LOW_LOCATION_ACCURACY"
  | "PREVIEW_ONLY_PARTIAL_OUTPUT";

export type ErrorCode =
  | "MISSING_FIELD"
  | "INVALID_FORMAT"
  | "INVALID_LAT_LON"
  | "TIMEZONE_NOT_RESOLVABLE"
  | "TIMEZONE_CONFLICT"
  | "AMBIGUOUS_LOCAL_TIME"
  | "EPHEMERIS_UNAVAILABLE"
  | "DELTA_T_UNAVAILABLE"
  | "OUT_OF_SUPPORTED_RANGE"
  | "STRICT_DISALLOWS_WARN"
  | "INTERNAL_ERROR";

// ─────────────────────────────────────────────────────────────
// Request Models
// ─────────────────────────────────────────────────────────────

export interface PrecisionComputeRequest {
  input: PrecisionInput;
  options: PrecisionOptions;
}

export interface PrecisionValidateRequest {
  input: PrecisionInput;
  options: PrecisionValidateOptions;
}

export interface PrecisionInput {
  birth: BirthSpec;
  location: LocationSpec;
  timezone: TimezoneSpec;
}

export interface BirthSpec {
  date: string; // YYYY-MM-DD
  time: TimeSpec;
}

export interface TimeSpec {
  local?: string; // HH:MM:SS (required for angles/houses/planets where time matters)
  accuracy: TimeAccuracy;
  fold?: 0 | 1; // required if DST ambiguous, else omitted
}

export interface LocationSpec {
  lat: number; // -90..90
  lon: number; // -180..180
  altMeters?: number;
  accuracy?: LocationAccuracy;
}

export interface TimezoneSpec {
  iana: string; // IANA name
  source?: TimezoneSource;
  providedOffsetMinutes?: number; // optional; if contradicts resolved offset -> TIMEZONE_CONFLICT
}

export interface PrecisionOptions {
  mode: Mode;
  houseSystem?: HouseSystem;
  zodiac?: Zodiac;
  include: IncludeSpec;
  precision?: PrecisionTolerances;
}

export interface PrecisionValidateOptions {
  mode: Mode;
  include: IncludeSpec;
}

export interface IncludeSpec {
  angles: boolean;
  houses: boolean;
  planets: boolean;
  aspects?: boolean;
  chinese: boolean;
  bazi: boolean;
}

export interface PrecisionTolerances {
  ascToleranceDeg?: number;
  planetToleranceDeg?: number;
  deltaTToleranceSec?: number;
}

// ─────────────────────────────────────────────────────────────
// Response Models
// ─────────────────────────────────────────────────────────────

export interface PrecisionSuccessResponse {
  requestId: string;
  meta: MetaBlock;
  validation: ValidationBlock;
  orchestratorPolicy: OrchestratorPolicy;
  data?: PrecisionData; // present only if allowed by policy+mode
}

export interface PrecisionErrorResponse {
  requestId: string;
  error: ErrorBlock;
}

export type PrecisionResponse = PrecisionSuccessResponse | PrecisionErrorResponse;

export interface MetaBlock {
  contractVersion: typeof CONTRACT_VERSION;
  engine: {
    name: string;
    version: string;
    build: string; // e.g. git:abcd1234
  };
  models: {
    ephemeris: "SwissEphemeris" | "Moshier";
    ephemerisVersion?: string;
    deltaTSource?: string;
    iau?: string;
    timeScale: string; // "UTC→UT1→TT"
  };
  inputFingerprint: string; // sha256:...
  computedAt: string; // ISO
}

export interface PrecisionData {
  resolvedTime?: ResolvedTime;
  angles?: AnglesBlock;
  houses?: HousesBlock;
  planets?: PlanetsBlock;
  chinese?: ChineseBlock;
  audit?: AuditBlock;
}

export interface ResolvedTime {
  utcInstant: string; // ISO
  offsetMinutes: number; // minutes east of UTC
  dst: boolean;
  fold?: 0 | 1;
  jdUt: number;
  jdTt?: number;
  deltaTSec?: number;
}

export interface AnglesBlock {
  asc: AngleValue;
  mc: AngleValue;
}

export interface AngleValue {
  deg: number; // 0..360
  sign: string;
  degInSign: number; // 0..30
}

export interface HousesBlock {
  system: HouseSystem;
  cuspsDeg: number[]; // 12 entries
}

export type PlanetsBlock = Record<string, PlanetValue>;

export interface PlanetValue {
  lonDeg: number; // 0..360
  latDeg: number; // -90..90
  speedDegPerDay?: number;
  sign: string;
  degInSign: number; // 0..30
}

export interface ChineseBlock {
  yearFromLiChun?: {
    stemBranch?: string;
    animal?: string;
    element?: string;
    yinYang?: string;
  };
  yearFromTable?: {
    animal?: string;
    validFrom?: string; // YYYY-MM-DD
    validTo?: string;   // YYYY-MM-DD
  };
}

export interface AuditBlock {
  swe?: {
    houseSystem?: HouseSystem;
    flags?: string[];
  };
}

export interface ValidationBlock {
  status: ValidationStatus;
  checks: ValidationCheck[];
  warnings: WarningItem[];
}

export interface ValidationCheck {
  id: ValidationCheckId;
  status: CheckStatus;
  details?: Record<string, unknown>;
}

export interface WarningItem {
  code: WarningCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface OrchestratorPolicy {
  mustStop: boolean;
  allowedOutputs: {
    angles: boolean;
    houses: boolean;
    planets: boolean;
    chinese: boolean;
    bazi: boolean;
  };
  rationale?: string;
}

export interface ErrorBlock {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  errorId?: string; // present on INTERNAL_ERROR
}

// ─────────────────────────────────────────────────────────────
// Type Guards + Fail-Closed helpers (clients MUST use)
// ─────────────────────────────────────────────────────────────

export function isErrorResponse(r: PrecisionResponse): r is PrecisionErrorResponse {
  return (r as PrecisionErrorResponse).error !== undefined;
}

export function isSuccessResponse(r: PrecisionResponse): r is PrecisionSuccessResponse {
  return (r as PrecisionSuccessResponse).meta !== undefined && (r as any).error === undefined;
}

/**
 * Fail-closed gate for UI/LLM orchestration:
 * - If mustStop => throw
 * - If mode=strict and validation.status != ok => throw
 */
export function assertUsableForDisplay(
  res: PrecisionResponse,
  mode: Mode
): asserts res is PrecisionSuccessResponse {
  if (isErrorResponse(res)) {
    throw new Error(`Precision error: ${res.error.code} - ${res.error.message}`);
  }
  if (res.orchestratorPolicy.mustStop) {
    throw new Error(`Precision mustStop=true: ${res.orchestratorPolicy.rationale ?? "no rationale"}`);
  }
  if (mode === "strict" && res.validation.status !== "ok") {
    throw new Error(`Strict disallows status=${res.validation.status}`);
  }
}

/**
 * Helper: prevents accidental rendering of gated blocks.
 */
export function pickAllowedData(res: PrecisionSuccessResponse): PrecisionData {
  const allowed = res.orchestratorPolicy.allowedOutputs;
  const d = res.data ?? {};
  return {
    resolvedTime: d.resolvedTime,
    angles: allowed.angles ? d.angles : undefined,
    houses: allowed.houses ? d.houses : undefined,
    planets: allowed.planets ? d.planets : undefined,
    chinese: allowed.chinese ? d.chinese : undefined,
    audit: d.audit,
  };
}
Faktisch korrekt sage ich, ## 2) Python FastAPI + Pydantic Models (fail-closed, OpenAPI out-of-the-box)

Empfohlene Struktur im Precision-Service Repo:

app/models.py

app/main.py

app/models.py
python
Code kopieren
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator, conint, confloat

CONTRACT_VERSION = "v1"

Mode = Literal["strict", "preview"]
TimeAccuracy = Literal["exact", "approx", "unknown"]
LocationAccuracy = Literal["gps", "city", "manual", "unknown"]
TimezoneSource = Literal["user", "geo", "system"]
HouseSystem = Literal["P", "K", "O", "R", "C", "E", "W"]
Zodiac = Literal["tropical", "sidereal"]

ValidationStatus = Literal["ok", "warn"]
CheckStatus = Literal["ok", "warn", "fail"]

ValidationCheckId = Literal[
    "INPUT_COMPLETE",
    "TZ_RESOLVED",
    "DST_DISAMBIGUATED",
    "EPHEMERIS_READY",
    "DELTA_T_READY",
    "ANGLE_NORMALIZED",
    "SANITY_SUNSIGN",
    "SANITY_CHINESE_YEAR",
]

WarningCode = Literal[
    "TIME_APPROX",
    "TIME_UNKNOWN",
    "DST_ASSUMED",
    "LOW_LOCATION_ACCURACY",
    "PREVIEW_ONLY_PARTIAL_OUTPUT",
]

ErrorCode = Literal[
    "MISSING_FIELD",
    "INVALID_FORMAT",
    "INVALID_LAT_LON",
    "TIMEZONE_NOT_RESOLVABLE",
    "TIMEZONE_CONFLICT",
    "AMBIGUOUS_LOCAL_TIME",
    "EPHEMERIS_UNAVAILABLE",
    "DELTA_T_UNAVAILABLE",
    "OUT_OF_SUPPORTED_RANGE",
    "STRICT_DISALLOWS_WARN",
    "INTERNAL_ERROR",
]


class TimeSpec(BaseModel):
    local: Optional[str] = Field(default=None, description="HH:MM:SS local wall time")
    accuracy: TimeAccuracy
    fold: Optional[Literal[0, 1]] = None


class BirthSpec(BaseModel):
    date: str = Field(description="YYYY-MM-DD")
    time: TimeSpec


class LocationSpec(BaseModel):
    lat: confloat(ge=-90, le=90)
    lon: confloat(ge=-180, le=180)
    altMeters: Optional[confloat(ge=-500, le=10000)] = None
    accuracy: Optional[LocationAccuracy] = None


class TimezoneSpec(BaseModel):
    iana: str
    source: Optional[TimezoneSource] = None
    providedOffsetMinutes: Optional[int] = None


class PrecisionInput(BaseModel):
    birth: BirthSpec
    location: LocationSpec
    timezone: TimezoneSpec


class IncludeSpec(BaseModel):
    angles: bool
    houses: bool
    planets: bool
    aspects: bool = False
    chinese: bool
    bazi: bool


class PrecisionTolerances(BaseModel):
    ascToleranceDeg: float = 0.02
    planetToleranceDeg: float = 0.05
    deltaTToleranceSec: float = 5.0


class PrecisionOptions(BaseModel):
    mode: Mode
    houseSystem: HouseSystem = "P"
    zodiac: Zodiac = "tropical"
    include: IncludeSpec
    precision: Optional[PrecisionTolerances] = None


class PrecisionValidateOptions(BaseModel):
    mode: Mode
    include: IncludeSpec


class PrecisionComputeRequest(BaseModel):
    input: PrecisionInput
    options: PrecisionOptions

    @model_validator(mode="after")
    def enforce_fail_closed_contract(self) -> "PrecisionComputeRequest":
        inc = self.options.include
        t = self.input.birth.time
        tz = self.input.timezone

        # Strict always requires IANA
        if self.options.mode == "strict" and not tz.iana:
            raise ValueError("timezone.iana is required in strict mode")

        # If angles/houses/planets requested, local time must be provided (fail-closed)
        needs_time = inc.angles or inc.houses or inc.planets
        if needs_time:
            if not t.local:
                raise ValueError("birth.time.local is required when angles/houses/planets are requested")

        # If time is unknown, angles/houses must not be requested (precision rule)
        if t.accuracy == "unknown" and (inc.angles or inc.houses):
            raise ValueError("Cannot compute angles/houses with time_accuracy=unknown")

        return self


class PrecisionValidateRequest(BaseModel):
    input: PrecisionInput
    options: PrecisionValidateOptions


class MetaBlock(BaseModel):
    contractVersion: Literal["v1"] = CONTRACT_VERSION
    engine: Dict[str, str]
    models: Dict[str, Any]
    inputFingerprint: str
    computedAt: str


class AngleValue(BaseModel):
    deg: confloat(ge=0, lt=360)
    sign: str
    degInSign: confloat(ge=0, lt=30)


class AnglesBlock(BaseModel):
    asc: AngleValue
    mc: AngleValue


class HousesBlock(BaseModel):
    system: HouseSystem
    cuspsDeg: List[confloat(ge=0, lt=360)] = Field(min_length=12, max_length=12)


class PlanetValue(BaseModel):
    lonDeg: confloat(ge=0, lt=360)
    latDeg: confloat(ge=-90, le=90)
    speedDegPerDay: Optional[float] = None
    sign: str
    degInSign: confloat(ge=0, lt=30)


class ChineseBlock(BaseModel):
    yearFromLiChun: Optional[Dict[str, Any]] = None
    yearFromTable: Optional[Dict[str, Any]] = None


class ResolvedTime(BaseModel):
    utcInstant: str
    offsetMinutes: int
    dst: bool
    fold: Optional[Literal[0, 1]] = None
    jdUt: float
    jdTt: Optional[float] = None
    deltaTSec: Optional[float] = None


class AuditBlock(BaseModel):
    swe: Optional[Dict[str, Any]] = None


class PrecisionData(BaseModel):
    resolvedTime: Optional[ResolvedTime] = None
    angles: Optional[AnglesBlock] = None
    houses: Optional[HousesBlock] = None
    planets: Optional[Dict[str, PlanetValue]] = None
    chinese: Optional[ChineseBlock] = None
    audit: Optional[AuditBlock] = None


class ValidationCheck(BaseModel):
    id: ValidationCheckId
    status: CheckStatus
    details: Optional[Dict[str, Any]] = None


class WarningItem(BaseModel):
    code: WarningCode
    message: str
    details: Optional[Dict[str, Any]] = None


class ValidationBlock(BaseModel):
    status: ValidationStatus
    checks: List[ValidationCheck]
    warnings: List[WarningItem]


class OrchestratorPolicy(BaseModel):
    mustStop: bool
    allowedOutputs: Dict[str, bool]
    rationale: Optional[str] = None


class PrecisionSuccessResponse(BaseModel):
    requestId: str
    meta: MetaBlock
    validation: ValidationBlock
    orchestratorPolicy: OrchestratorPolicy
    data: Optional[PrecisionData] = None


class ErrorBlock(BaseModel):
    code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None
    errorId: Optional[str] = None


class PrecisionErrorResponse(BaseModel):
    requestId: str
    error: ErrorBlock


class PrecisionValidateResponse(BaseModel):
    requestId: str
    meta: MetaBlock
    validation: ValidationBlock
    orchestratorPolicy: OrchestratorPolicy


class CapabilitiesResponse(BaseModel):
    engine: Dict[str, str]
    strictAvailable: bool
    ephemeris: Dict[str, Any]
    supported: Dict[str, Any]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    time: str
    uptimeSeconds: int
app/main.py
python
Code kopieren
from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .models import (
    CapabilitiesResponse,
    HealthResponse,
    PrecisionComputeRequest,
    PrecisionErrorResponse,
    PrecisionSuccessResponse,
    PrecisionValidateRequest,
    PrecisionValidateResponse,
)

START_TIME = time.time()
app = FastAPI(title="Astro Precision API", version="1.0.0")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def error_response(request_id: str, code: str, message: str, details=None, status_code: int = 422):
    payload = PrecisionErrorResponse(
        requestId=request_id,
        error={"code": code, "message": message, "details": details or {}},
    ).model_dump()
    return JSONResponse(status_code=status_code, content=payload)


@app.get("/v1/astro/precision/health", response_model=HealthResponse)
def health():
    return HealthResponse(time=now_iso(), uptimeSeconds=int(time.time() - START_TIME))


@app.get("/v1/astro/precision/capabilities", response_model=CapabilitiesResponse)
def capabilities():
    # TODO: detect SE_EPHE_PATH + files, strict readiness, supported house systems, etc.
    return CapabilitiesResponse(
        engine={"name": "cosmic-precision", "version": "1.0.0", "build": "git:TODO"},
        strictAvailable=False,
        ephemeris={"provider": "SwissEphemeris", "filesPresent": False, "seEphePathSet": False},
        supported={"houseSystems": ["P"], "zodiacs": ["tropical"], "planets": ["Sun", "Moon"]},
    )


@app.post(
    "/v1/astro/precision/validate",
    response_model=PrecisionValidateResponse,
    responses={409: {"model": PrecisionErrorResponse}, 422: {"model": PrecisionErrorResponse}},
)
def validate(req: PrecisionValidateRequest, x_request_id: str | None = Header(default=None)):
    request_id = x_request_id or str(uuid.uuid4())

    # TODO: timezone resolution, DST ambiguity detection, ephemeris readiness checks
    # Fail-closed contract: if ambiguity detected and fold missing -> 409
    # return error_response(request_id, "AMBIGUOUS_LOCAL_TIME", "...", details, status_code=409)

    meta = {
        "contractVersion": "v1",
        "engine": {"name": "cosmic-precision", "version": "1.0.0", "build": "git:TODO"},
        "models": {"ephemeris": "SwissEphemeris", "timeScale": "UTC→UT1→TT"},
        "inputFingerprint": "sha256:TODO",
        "computedAt": now_iso(),
    }

    validation = {
        "status": "ok",
        "checks": [{"id": "INPUT_COMPLETE", "status": "ok"}],
        "warnings": [],
    }

    orchestrator = {
        "mustStop": False,
        "allowedOutputs": {
            "angles": bool(req.options.include.angles),
            "houses": bool(req.options.include.houses),
            "planets": bool(req.options.include.planets),
            "chinese": bool(req.options.include.chinese),
            "bazi": bool(req.options.include.bazi),
        },
        "rationale": "Inputs syntactically valid (semantic checks TODO).",
    }

    return PrecisionValidateResponse(
        requestId=request_id, meta=meta, validation=validation, orchestratorPolicy=orchestrator
    )


@app.post(
    "/v1/astro/precision/compute",
    response_model=PrecisionSuccessResponse,
    responses={
        409: {"model": PrecisionErrorResponse},
        422: {"model": PrecisionErrorResponse},
        503: {"model": PrecisionErrorResponse},
        500: {"model": PrecisionErrorResponse},
    },
)
def compute(req: PrecisionComputeRequest, x_request_id: str | None = Header(default=None)):
    request_id = x_request_id or str(uuid.uuid4())

    # 1) Strict readiness checks (fail-closed)
    # TODO: if strict and ephemeris files missing:
    # return error_response(request_id, "EPHEMERIS_UNAVAILABLE", "Swiss Ephemeris files missing", status_code=503)

    # 2) Resolve TZ + detect DST ambiguity
    # TODO: if ambiguous and fold missing -> 409 with candidates
    # return error_response(request_id, "AMBIGUOUS_LOCAL_TIME", "...", details, status_code=409)

    # 3) Compute via astro_precision SSOT (Swiss Ephemeris)
    # TODO: call your deterministic core here; NEVER compute in client/LLM.
    # result = astro_precision.compute(...)

    # 4) Build meta + validation + policy + data (only if allowed)
    meta = {
        "contractVersion": "v1",
        "engine": {"name": "cosmic-precision", "version": "1.0.0", "build": "git:TODO"},
        "models": {"ephemeris": "SwissEphemeris", "timeScale": "UTC→UT1→TT"},
        "inputFingerprint": "sha256:TODO",
        "computedAt": now_iso(),
    }

    # Example minimal validation - replace with real validation output
    validation = {
        "status": "ok",
        "checks": [
            {"id": "INPUT_COMPLETE", "status": "ok"},
            {"id": "EPHEMERIS_READY", "status": "ok"},
        ],
        "warnings": [],
    }

    # Fail-closed in strict: forbid warn
    if req.options.mode == "strict" and validation["status"] != "ok":
        return error_response(
            request_id,
            "STRICT_DISALLOWS_WARN",
            f"Strict mode disallows validation.status={validation['status']}",
            status_code=422,
        )

    # Orchestrator policy
    allowed = {
        "angles": bool(req.options.include.angles),
        "houses": bool(req.options.include.houses),
        "planets": bool(req.options.include.planets),
        "chinese": bool(req.options.include.chinese),
        "bazi": bool(req.options.include.bazi),
    }

    # mustStop can be triggered by any fail-closed semantic validation
    must_stop = False

    orchestrator = {
        "mustStop": must_stop,
        "allowedOutputs": allowed,
        "rationale": "ok",
    }

    # Only include data when not mustStop
    data = None
    if not must_stop:
        # TODO: fill with real computed SSOT data, but gate by allowedOutputs
        data = {
            "angles": None,
            "houses": None,
            "planets": None,
            "chinese": None,
            "resolvedTime": None,
            "audit": None,
        }

    return PrecisionSuccessResponse(
        requestId=request_id,
        meta=meta,
        validation=validation,
        orchestratorPolicy=orchestrator,
        data=data,
    )
Faktisch korrekt sage ich, ## Wie du das sofort in Quizme nutzt (minimal)

Quizme ruft POST /v1/astro/precision/compute serverseitig auf.

Danach im Code immer:

ts
Code kopieren
import { assertUsableForDisplay, pickAllowedData } from "@/lib/astro-precision/contract";

// res: PrecisionResponse
assertUsableForDisplay(res, "strict"); // throws => stop
const safe = pickAllowedData(res);
// safe enthält nur erlaubte Blöcke
So ist technisch garantiert, dass UI/LLM nie „durchrutscht“.

Rein subjektiv, aus meinem Denken ergibt sich, nächster sinnvoller Schritt: Ich kann dir als Ergänzung noch zwei kleine „Glue“-Snippets geben:

Next.js API Route in Quizme, die intern zum Precision-Service proxied (Service-to-service Auth),

plus eine Supabase-Persistenzstruktur (natal_reports.report_json) die exakt PrecisionSuccessResponse speichert (meta+validation+data), damit dein CI/Regression-Check immer reproduzierbar bleibt.