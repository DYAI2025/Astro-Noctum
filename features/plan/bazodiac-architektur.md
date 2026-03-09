# BAZODIAC — Systemarchitektur

> Stand: März 2026
> Autor: Architektur-Review aus Repo-Analyse aller 4 Codebases

---

## 1. Überblick

Bazodiac ist ein Persönlichkeitsprofiling-System mit astrologischem Framing. Es fusioniert drei Datenschichten — westliche Astrologie, chinesisches BaZi, und Persönlichkeitstests — zu einem einzigartigen visuellen Fingerabdruck (dem "Bazahuawa Ring"). Das System besteht aus vier eigenständigen Services, einer gemeinsamen Datenbank, und drei externen API-Abhängigkeiten.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              ASTRO-NOCTUM (Frontend SPA)                     │   │
│  │  Vite + React 19 + TypeScript + Tailwind v4 + Three.js      │   │
│  │                                                              │   │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │BirthForm │ │ Dashboard │ │ Quizzes  │ │ Fusion Ring  │  │   │
│  │  │          │ │           │ │ (3 MVP)  │ │ (Bazahuawa)  │  │   │
│  │  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └──────┬───────┘  │   │
│  │       │             │            │               │          │   │
│  │       │    ┌────────┴────────────┴───────────────┘          │   │
│  │       │    │  useFusionRing Hook                            │   │
│  │       │    │  W(s) + B(s) + X(s) + T(s) → Signal[12]       │   │
│  │       │    └────────┬───────────────────────────────        │   │
│  └───────┼─────────────┼───────────────────────────────────────┘   │
│          │             │                                           │
└──────────┼─────────────┼───────────────────────────────────────────┘
           │             │
     ┌─────▼─────┐  ┌───▼──────────┐  ┌────────────┐  ┌───────────┐
     │   BAFE    │  │  Supabase    │  │  Gemini    │  │ElevenLabs │
     │  (API)    │  │  (DB+Auth)   │  │  (AI Text) │  │  (Voice)  │
     └───────────┘  └──────────────┘  └────────────┘  └───────────┘
```

---

## 2. Die vier Services

### 2.1 Astro-Noctum (Frontend)

**Repo:** `DYAI2025/Astro-Noctum`
**Tech:** Vite, React 19, TypeScript, Tailwind CSS v4, Three.js, Framer Motion
**Deploy:** Railway (nixpacks)
**URL:** Railway-generiert
**Node:** 20.19+

**Was es tut:** Single-Page App. Kein Router. State-driven Flow: Splash → Auth → BirthForm → Dashboard. Sammelt Geburtsdaten, ruft BAFE für Astro-Berechnungen, Gemini für Text, zeigt 3D-Planetarium, Fusion Ring, Quizzes, und ElevenLabs Voice Agent.

**Architektur-Eigenheiten:**
- Pfad-Alias `@/*` mappt auf Project Root (nicht `src/`)
- Zwei Server-Kontexte: Vite Dev Proxy (`:3000`) + Express Production (`server.mjs`)
- `server.mjs` handled BAFE-Proxy, Auth-Signup (Supabase Service Role), ElevenLabs-Endpoints
- Static Assets aus `media/` (nicht `public/`)
- Morning-Theme (heller Gradient) — nicht das ursprünglich geplante Obsidian-Dark

**Datenfluss:**
```
BirthForm → api.ts.calculateAll()
  ├→ POST /calculate/bazi     → MappedBazi
  ├→ POST /calculate/western  → MappedWestern (Sun/Moon/Asc als Strings)
  ├→ POST /calculate/fusion   → BafeFusionResponse
  ├→ POST /calculate/wuxing   → MappedWuxing (Element-Vektor)
  └→ POST /calculate/tst      → BafeTstResponse

Parallel:
  gemini.ts → Gemini Flash → Interpretation (400-500 Wörter)
  supabase.ts → Upsert astro_profiles, birth_data
  useFusionRing → W(s) + B(s) + X(s) + T(s) → FusionRingSignal
```

**Schlüssel-Module:**

| Pfad | Funktion |
|------|----------|
| `src/App.tsx` | Root State, Flow-Orchestrierung |
| `src/services/api.ts` | BAFE Client, Response-Mapper (DE→EN Keys) |
| `src/services/gemini.ts` | Gemini Flash, Prompt-Builder, Fallback-Texte |
| `src/services/supabase.ts` | Persistence (astro_profiles, birth_data, natal_charts) |
| `src/services/contribution-events.ts` | Quiz-Event CRUD (Supabase) |
| `src/lib/fusion-ring/` | Signal Engine (12 Module) |
| `src/hooks/useFusionRing.ts` | Orchestration: W+B+X+T → Signal |
| `src/components/FusionRing.tsx` | Canvas 2D Visualisierung |
| `src/components/BirthChartOrrery.tsx` | Three.js 3D Planetarium |
| `src/components/quizzes/` | 3 portierte Quizzes (Love, Krafttier, Personality) |
| `src/components/QuizOverlay.tsx` | Modal-Container, Lazy-Loading |
| `src/contexts/AuthContext.tsx` | Supabase Auth Provider |
| `server.mjs` | Express Production: BAFE Proxy, Auth, ElevenLabs |

---

### 2.2 BAFE (Astrology Calculation Engine)

**Repo:** `DYAI2025/BAFE`
**Tech:** Python 3.12+, FastAPI, Swiss Ephemeris
**Deploy:** Vercel (primary), Fly.io (ams), Railway (backup)
**URL:** `https://bafe.vercel.app`
**Port:** 8080

**Was es tut:** Berechnet astrologische Daten aus Geburtsdatum/-ort. Western Zodiac über Ephemeriden (Swiss Ephemeris), BaZi über chinesischen Lunarkalender, Wu-Xing über Planet-Element-Mapping. Liefert JSON. Keine UI.

**Architektur:** 4-Level Schichtung:
```
Level 1: bazi.py        — BaZi Pillar-Berechnung (Stems, Branches, Animals)
Level 2: western.py     — Western Chart (Ephemeris, Planets, Houses, Angles)
Level 2: solar_time.py  — True Solar Time (Equation of Time)
Level 3: wuxing/        — Wu-Xing Domain Package (Vector, Analysis, Zones, Harmony)
Level 4: fusion.py      — Orchestrator (Western + BaZi → Wu-Xing Fusion)
Router:  routers/       — FastAPI Endpoints (kein Business-Logic in Routern)
```

**Endpoints (13, frozen per CONTRACT.md):**

| Method | Path | Funktion |
|--------|------|----------|
| GET | `/` | Root Info |
| GET | `/health` | Health Check |
| GET | `/build` | Build Info |
| GET | `/api` | Legacy Compat |
| GET | `/info/wuxing-mapping` | Wu-Xing Zuordnungstabelle |
| POST | `/validate` | Input-Validierung (Draft-07 Schema) |
| POST | `/calculate/bazi` | BaZi Chart (4 Säulen, Tiere, Elemente) |
| POST | `/calculate/western` | Western Chart (Planeten, Häuser, Aspekte) |
| POST | `/calculate/fusion` | Wu-Xing Fusion (Western + BaZi Harmonie) |
| POST | `/calculate/wuxing` | Wu-Xing Vektor aus Planeten |
| POST | `/calculate/tst` | True Solar Time |
| POST | `/chart` | Kombiniertes Chart |
| POST | `/api/webhooks/chart` | ElevenLabs Webhook |

**Contract:** OpenAPI 3.1 in `spec/openapi/openapi.json`. CI Drift-Check verhindert undokumentierte Schema-Änderungen.

**Test-Abdeckung:** 20+ Testmodule, pytest. Golden Vectors, Calibration, Integration, Property-Based, Contract-Tests.

---

### 2.3 QuizzMe (Quiz-Plattform — Quelle, wird portiert)

**Repo:** `DYAI2025/QuizzMe`
**Tech:** Next.js 16, React 19, TypeScript, Tailwind, Supabase
**Deploy:** Vercel (`quizz-me-six.vercel.app`)
**Status:** Standalone-App. Quizzes werden nach Astro-Noctum portiert. QuizzMe bleibt als eigenständiges Produkt bestehen.

**Was es liefert (portiert nach Astro-Noctum):**
- ContributionEvent Spec (`src/lib/lme/types.ts`)
- Marker Registry (47 Marker, 9 Kategorien)
- Contribution Validators (Shape + ID + Module Rules)
- Ingestion Pipeline (Event → Psyche → Traits → Snapshot)
- 14 Quiz-Komponenten (3 portiert: Love Languages, Krafttier, Personality)
- Profile System, Cluster Progress, Trait System

**Was NICHT portiert wird:**
- Next.js App Router, Middleware, SSG
- Onboarding Flows
- Altar Dashboard / Character Sheet
- Cosmic Engine

**Architektonische Rolle im Gesamtsystem:** QuizzMe definiert die ContributionEvent-Spec und das Marker-Format (`marker.domain.keyword`). Diese Spec ist der Vertrag zwischen Quiz-Erstellung und Ring-Mapping. Neue Quizzes — egal wo sie gebaut werden — müssen dieses Format liefern.

---

### 2.4 LeanDeep-annotator (Semantische NLP Engine)

**Repo:** `DYAI2025/LeanDeep-annotator`
**Tech:** Python 3.12+, FastAPI, Pure Regex (kein LLM)
**Deploy:** Fly.io, Docker
**Port:** 8420
**Latenz:** ~1ms pro Analyse

**Was es tut:** Deterministische semantische Annotation von Text. 848 Marker in 4 Schichten:
```
ATO (Atomic)   → Regex Pattern-Match, rohe Signale
SEM (Semantic) → ATO + Kontext = Bedeutung
CLU (Cluster)  → Verhaltensmuster über Zeitfenster
MEMA (Meta)    → Abwesenheit, Trends, Zyklen, Archetypen
```

Jeder Marker hat:
- VAD-Profil (Valence/Arousal/Dominance) — emotionaler Fingerabdruck
- effect_on_state (trust/conflict/deesc) — Wirkung auf Beziehungsdynamik
- Compositionality (deterministic/contextual/emergent)
- Positive/Negative Examples

**Besondere Fähigkeiten:**
- VAD Congruence Gate (Resonanz-Filter: unterdrückt kontextfremde Marker)
- Shadow Buffer (verzögerte Bedeutungsreserve)
- Prosody-basierte Emotion-Erkennung (6 Ekman-Emotionen, 17 Textstruktur-Features)
- UED Metrics (Utterance Emotion Dynamics: Variabilität, Instabilität, Rise/Recovery)
- Persona Profiles (EWMA-basierte Baseline pro Sprecher)

**Endpoints (14):**

| Method | Path | Funktion |
|--------|------|----------|
| POST | `/v1/analyze` | Einzeltext → ATO+SEM Detections + VAD |
| POST | `/v1/analyze/conversation` | Multi-Message → Alle 4 Layer + UED + State |
| POST | `/v1/analyze/dynamics` | Volle Dynamik + Persona Warm-Start |
| POST | `/v1/upload` | .txt/.md/.docx → Textextraktion |
| POST | `/v1/personas` | Persona erstellen |
| GET | `/v1/personas/{token}` | Persona lesen (EWMA, Episoden, Predictions) |
| GET | `/v1/personas/{token}/predict` | Shift Prediction (Repair/Escalation) |
| GET | `/v1/markers` | Marker suchen/filtern |
| GET | `/v1/markers/{id}` | Marker-Detail |
| GET | `/v1/engine/config` | Engine Config |
| GET | `/v1/health` | Health Check |
| GET | `/playground` | Interaktive UI |
| GET | `/analysis` | Emotions-Dynamik UI |

**MCP Server:** `mcp_server.py` — direkte Integration in Claude Desktop/Cursor ohne HTTP.

---

## 3. Externe Abhängigkeiten

| Service | Zweck | Integration | Kritikalität |
|---------|-------|-------------|-------------|
| **Supabase** | Auth + Postgres DB | REST API, Client SDK | Hoch — Auth, Persistence |
| **Gemini** (Google) | KI-Textgenerierung | `@google/genai` SDK, Model: `gemini-2.0-flash` | Mittel — Fallback-Texte vorhanden |
| **ElevenLabs** | Voice Agent "Levi Bazi" | Convai Widget + Webhook-Endpoints | Niedrig — Feature, nicht Core |
| **Stripe** | Zahlungen (Premium) | Checkout Sessions | Niedrig — Freemium funktioniert ohne |
| **Swiss Ephemeris** | Astronomische Berechnungen | C-Library via Python Binding in BAFE | Hoch — ohne keine Western-Daten |

---

## 4. Datenbank (Supabase)

**Projekt:** `ykoijifgweoapitabgxx.supabase.co`

### Tabellen

| Tabelle | Zweck | Zugriff |
|---------|-------|---------|
| `profiles` | User-Profil (auto via Trigger) | Auth Users |
| `birth_data` | Geburtsdaten (1 pro User) | Owner |
| `astro_profiles` | BAFE-Ergebnisse (Sun/Moon/Asc, JSON) | Owner |
| `natal_charts` | Natal Chart Snapshots | Owner |
| `contribution_events` | Quiz-Ergebnisse (ContributionEvents) | Owner + Anon Insert |

### RLS (Row Level Security)

Alle Tabellen haben RLS aktiviert. User können nur eigene Daten lesen/schreiben. Anon-Insert ist erlaubt für `contribution_events` (User die noch nicht eingeloggt sind), aber nur ohne `user_id` (kein Spoofing).

---

## 5. Fusion Ring Signal Engine (Kern-IP)

### Die Masterformel

```
Signal(s) = w₁·W(s) + w₂·B(s) + w₃·X(s) + w₄·T(s)

s ∈ {0, 1, ..., 11}  (12 Sektoren = 12 Zeichen)

Mit Tests:    w₁=0.30, w₂=0.30, w₃=0.20, w₄=0.20
Ohne Tests:   w₁=0.375, w₂=0.375, w₃=0.25, w₄=0.00
```

### Signalquellen

| Komponente | Quelle | Methode | Daten |
|------------|--------|---------|-------|
| **W(s)** Western | BAFE `/calculate/western` | Gauss-Glocke (σ=1.2) | Sun 50%, Moon 30%, Asc 20% |
| **B(s)** BaZi | BAFE `/calculate/bazi` | Gauss-Glocke (σ=1.2) | Day 40%, Year 25%, Month 20%, Hour 15% |
| **X(s)** Wu-Xing | BAFE `/calculate/wuxing` | Element→Sektor Mapping | 5 Elemente → 12 Sektoren |
| **T(s)** Tests | ContributionEvents | AFFINITY_MAP Lookup | Marker → Sektor-Gewichte |

### Nachbearbeitung

1. **Opposition-Tension:** `-Signal(opposite) × 0.15` — gegenüberliegende Sektoren erzeugen Spannung
2. **Neighbor-Coupling:** `(avg(links, rechts) - selbst) × 0.35` — Glättung zu organischen Wellen
3. **Power-Curve:** `sign(s) · |s|^1.5` — schwache Signale subtil, starke dramatisch

### AFFINITY_MAP (Semantic Marker → Sektor)

Zweistufiges Lookup:
1. Keyword-Match: `marker.love.physical_touch` → `AFFINITY_MAP['physical_touch']` → S7 Peak
2. Domain-Fallback: `marker.love.unknown` → `AFFINITY_MAP['love']` → S3/S6/S7 verteilt
3. Unbekannt: Marker wird ignoriert (12×0). System crasht nie.

Aktuell: 27 Einträge (10 Domain-Level, 17 Keyword-Level). Erweiterbar durch eine Zeile pro neuem Keyword.

---

## 6. Ist-Zustand vs. Ziel-Zustand

### IST (März 2026)

```
┌─────────────┐     HTTPS      ┌─────────────┐
│ Astro-Noctum│────────────────▶│    BAFE     │
│  (Railway)  │   /calculate/* │  (Vercel)   │
│             │◀────────────────│             │
│  ┌────────┐ │                 │ Western     │
│  │Fusion  │ │                 │ BaZi        │
│  │Ring    │ │                 │ WuXing      │
│  │Engine  │ │                 │ Fusion      │
│  │(client)│ │                 └─────────────┘
│  └────────┘ │
│  ┌────────┐ │     HTTPS      ┌─────────────┐
│  │Quizzes │ │────────────────▶│  Supabase   │
│  │(3 MVP) │ │  contribution_  │  (Managed)  │
│  └────────┘ │  events         │  Auth + DB  │
│             │                 └─────────────┘
│             │     HTTPS
│             │────────────────▶ Gemini (Text)
│             │────────────────▶ ElevenLabs (Voice)
│             │────────────────▶ Stripe (Payment)
└─────────────┘

┌─────────────┐                 ┌─────────────┐
│  QuizzMe    │  (eigenständig) │  LeanDeep   │  (eigenständig)
│  (Vercel)   │  14 Quizzes     │  (Fly.io)   │  848 Marker
│  Next.js    │  Quiz-Quelle    │  NLP Engine │  VAD-Profile
└─────────────┘                 └─────────────┘
     nicht verbunden                nicht verbunden
```

**Probleme im Ist-Zustand:**
- Signal Engine lebt clientseitig (TypeScript). Nicht wiederverwendbar für andere Clients.
- LeanDeep und BAFE kennen sich nicht. Keine automatische Mapping-Validierung.
- QuizzMe und Astro-Noctum teilen Code durch manuelle Portierung, nicht durch gemeinsame Packages.
- BAFE liefert Rohdaten, kein fertig berechnetes Ring-Signal.

---

### ZIEL (Zielarchitektur)

```
                    ┌─────────────────────────┐
                    │      USER (Browser)     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     ASTRO-NOCTUM        │
                    │     (Frontend SPA)      │
                    │                         │
                    │  Dashboard + Ring UI    │
                    │  Quizzes (N Stück)      │
                    │  3D Planetarium         │
                    │  Voice Agent            │
                    └──┬──────┬──────┬───────┘
                       │      │      │
            ┌──────────▼┐  ┌──▼───┐  │
            │   BAFE    │  │Supa- │  │
            │  (API)    │  │base  │  │
            │           │  │      │  │
            │ /calc/*   │  │Auth  │  └──▶ Gemini, ElevenLabs, Stripe
            │ /ring  ◄──┼──┤Events│
            │           │  │      │
            └─────┬─────┘  └──────┘
                  │
                  │ (Offline-Tool / CI)
                  │
            ┌─────▼─────┐
            │  LeanDeep  │
            │  (NLP API) │
            │            │
            │ Mapping    │
            │ Validierung│
            │ VAD→Sektor │
            └────────────┘
```

**Kern-Änderungen gegenüber Ist:**

**A. BAFE bekommt `/calculate/ring` Endpoint**

```
POST /calculate/ring

Request:
{
  "date": "1990-03-15T14:30:00",
  "tz": "Europe/Berlin",
  "lon": 13.405,
  "lat": 52.52,
  "events": [ContributionEvent, ...]   // optional
}

Response:
{
  "sectors": [0.12, 0.47, ...],        // 12 Werte
  "components": { "W": [...], "B": [...], "X": [...], "T": [...] },
  "weights": { "w1": 0.30, ... },
  "peak_sectors": [7, 1, 11],
  "resolution": 33,
  "opposition_tensions": [...],
  "element_colors": [...]
}
```

Die Signal Engine wandert von TypeScript (Astro-Noctum) nach Python (BAFE). Ein Call, alles drin. Astro-Noctum rendert nur noch. Jeder zukünftige Client (Mobile, B2B Partner) nutzt denselben Endpoint.

**B. LeanDeep als Mapping-Compiler**

LeanDeep validiert und generiert AFFINITY_MAP-Einträge. Nicht zur Runtime, sondern als Offline-Tool (`tools/derive_affinity.py` im BAFE Repo). Workflow:

```
Neues Quiz → Profil-Beschreibungen (Text)
  → LeanDeep /v1/analyze → VAD-Aggregate
    → Cosinus-Similarity gegen Sektor-VAD-Profile
      → AFFINITY_MAP-Zeile (Vorschlag)
        → Mensch reviewt → TypeScript/Python eintragen
```

**C. LeanDeep als eigenständiges API-Produkt**

Separater Service, separate Auth, separates Pricing. Kunden:
- Bazodiac (intern) — Mapping-Validierung
- Therapie-Plattformen — Manipulationserkennung
- HR/Coaching — Kommunikationsmuster
- Dating — Konversationsdynamik

---

## 7. Service-Verbindungen (Zielzustand Detail)

### 7.1 Astro-Noctum → BAFE

```
Astro-Noctum                              BAFE
─────────────                              ────
BirthForm                                  
  └→ POST /calculate/bazi      ──────────→ BaZi Pillars
  └→ POST /calculate/western   ──────────→ Planets, Signs
  └→ POST /calculate/fusion    ──────────→ Wu-Xing Harmony
  └→ POST /calculate/wuxing    ──────────→ Element Vector
  └→ POST /calculate/ring      ──────────→ FusionRingSignal [12]  ← NEU
     (mit ContributionEvents)
```

Aktuell: 5 parallele Calls, Signal-Berechnung clientseitig.
Ziel: 5 Calls + 1 Ring-Call, oder Ring-Call ersetzt die anderen (enthält alles).

### 7.2 Astro-Noctum → Supabase

```
Auth:
  SignUp (server-side mit Service Role Key → auto-confirm)
  SignIn/SignOut (client-side Supabase SDK)

Persistence:
  birth_data         → INSERT (einmalig)
  astro_profiles     → UPSERT (nach BAFE-Berechnung)
  natal_charts       → INSERT (Snapshot)
  contribution_events → INSERT/DELETE (nach Quiz-Abschluss)
```

### 7.3 BAFE → LeanDeep (Offline/CI)

```
tools/derive_affinity.py
  └→ POST /v1/analyze (LeanDeep)
     Text → Detections → VAD-Aggregate
     → Cosinus-Similarity → AFFINITY_MAP-Zeile
     → Vergleich mit bestehender Map
     → KOHÄRENT ✓ oder MISMATCH ✗

Kein Runtime-Dependency. Clean Boundary.
LeanDeep-Ausfall = BAFE funktioniert trotzdem.
```

### 7.4 Astro-Noctum → Gemini

```
Nach BAFE-Berechnung:
  gemini.ts → Gemini 2.0 Flash
  Prompt: All BAFE data + Structure template
  → 400-500 Wörter personalisierte Interpretation
  Fallback: Hardcodierte DE/EN Texte wenn API ausfällt
  Timeout: 15 Sekunden
```

### 7.5 Astro-Noctum → ElevenLabs

```
Dashboard (Premium):
  <elevenlabs-convai> Widget
  Agent: "Levi Bazi" (agent_1801kje0zqc8e4b89swbt7wekawv)
  
server.mjs Endpoints:
  POST /api/agent/session → ElevenLabs Session erstellen
  GET  /api/profile/:userId → Astro-Profil für Agent-Kontext
  Auth: ELEVENLABS_TOOL_SECRET Bearer Token
```

---

## 8. Datenflusskarte: User Journey

```
1. SIGNUP
   User → Astro-Noctum → Supabase Auth
   → profiles Tabelle (auto-trigger)

2. GEBURSDATEN
   User → BirthForm → birth_data INSERT
   → calculateAll() → BAFE (5 Endpoints parallel)
   → Responses → api.ts Mapper (DE→EN Keys)
   → astro_profiles UPSERT
   → Gemini → Interpretation
   → Dashboard rendert

3. FUSION RING (Stufe 1: nur Astro)
   useFusionRing Hook:
     W = westernToSectors(sun, moon, asc)    ← Gauss-Glocke
     B = baziToSectors(day, year, month, hour) ← Gauss-Glocke
     X = wuxingToSectors(element_vector)
     T = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  ← keine Tests
     Signal = 0.375·W + 0.375·B + 0.25·X + 0·T
     → Opposition-Tension → Neighbor-Coupling
     → FusionRing.tsx rendert (weiche Form)

4. QUIZ ABSOLVIEREN
   User → Quiz-Card → QuizOverlay → LoveLanguagesQuiz
   → Fragen beantworten → Scores akkumulieren
   → getProfile(scores) → Profil-Zuordnung
   → loveLangToEvent(scores, profileId) → ContributionEvent
     { markers: [
         { id: 'marker.love.physical_touch', weight: 0.95 },
         { id: 'marker.love.expression', weight: 0.40 },
         ...
       ],
       tags: [{ id: 'tag.archetype.flame', ... }]
     }
   → addQuizResult(event)
     → setEvents([...prev, event])
     → saveContributionEvent(event) → Supabase INSERT

5. FUSION RING (Stufe 2+: mit Tests)
   T = fuseAllEvents(events)
     → resolveMarkerToSectors pro Marker
       → AFFINITY_MAP Keyword-Lookup oder Domain-Fallback
       → Gewichte × marker.weight
     → Aggregation → Normalisierung [-1, 1]
   Signal = 0.30·W + 0.30·B + 0.20·X + 0.20·T
   → Ring morpht animated (800ms, damping 0.08)
   → Peaks leuchten, Einbuchtungen bei Opposition

6. RELOAD
   useFusionRing → loadUserEvents(userId) → Supabase SELECT
   → Events wiederhergestellt → T neu berechnet → Ring korrekt
```

---

## 9. Skalierungspfade

### 9.1 Mehr Quizzes (Content-Skalierung)

**Aufwand pro Quiz:** 1 React-Komponente + 1 JSON Config + 1 Mapper-Funktion in `quiz-to-event.ts`. Wenn Marker bestehende Domains nutzen (`love`, `emotion`, `social`, etc.), keine AFFINITY_MAP-Änderung nötig (Domain-Fallback greift). Für höhere Präzision: eine Zeile pro neuem Keyword.

**Validierung:** `tools/derive_affinity.py batch --quiz-json <path>` prüft ob LeanDeep-VAD und AFFINITY_MAP-Gewichte kohärent sind.

**Architektonische Grenze:** 15 Domains aktuell. Neues Quiz das in keine Domain passt → neue Domain-Zeile in AFFINITY_MAP (1 Minute).

### 9.2 Mobile App (Client-Skalierung)

BAFE `/calculate/ring` Endpoint macht das Frontend austauschbar. React Native App ruft denselben Endpoint, rendert Ring nativ (Canvas/SVG/Skia). Keine Logik-Duplizierung.

### 9.3 B2B API (Revenue-Skalierung)

**BAFE als API-Produkt:** Partner integrieren `/calculate/ring`. Geburtsdaten + Quiz-Events rein, Signal raus. Partner rendern in eigenem UI. Pricing pro Call oder Flatrate.

**LeanDeep als API-Produkt:** Separates Pricing. Text-Analyse für Therapie, HR, Dating, Coaching. Kein Bazodiac-Bezug nötig.

### 9.4 Dating-Matching (die Schublade)

Zwei Ring-Signale übereinanderlegen. Resonanz = Peaks am selben Sektor. Spannung = Peaks auf Opposition-Achsen. Komplementarität = Peaks auf benachbarten Sektoren. Die Mathematik ist bereits da — `computeFusionSignal` für Person A und Person B, dann Cosinus-Similarity der beiden Signal-Vektoren.

---

## 10. Deployment-Übersicht

| Service | Provider | Region | URL | Kosten |
|---------|----------|--------|-----|--------|
| Astro-Noctum | Railway | Auto | Railway-generiert | ~$5/mo |
| BAFE | Vercel (primary) | Edge | `bafe.vercel.app` | Free Tier |
| BAFE | Fly.io (backup) | Amsterdam | `bafe-2u0e2a.fly.dev` | Free Tier |
| BAFE | Railway (backup) | Auto | Railway-generiert | ~$5/mo |
| QuizzMe | Vercel | Edge | `quizz-me-six.vercel.app` | Free Tier |
| LeanDeep | Fly.io | Amsterdam | Port 8420 | Free Tier |
| Supabase | Managed | Frankfurt | `ykoijif...supabase.co` | Free Tier |
| Gemini | Google Cloud | Global | API Key | Pay per use |
| ElevenLabs | Managed | Global | Widget + API | Subscription |
| Stripe | Managed | Global | Checkout Sessions | 2.9% + 30¢ |

---

## 11. Sicherheit & Secrets

| Secret | Wo | Zweck |
|--------|----|-------|
| `VITE_GEMINI_API_KEY` | Browser (exposed) | Gemini Text-Generation |
| `VITE_SUPABASE_URL` | Browser (exposed) | Supabase Client |
| `VITE_SUPABASE_ANON_KEY` | Browser (exposed) | Supabase Anon Access (RLS schützt) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (server.mjs) | Auto-Confirm Signup, Admin Ops |
| `ELEVENLABS_TOOL_SECRET` | Server only | Webhook Auth |
| `VITE_BAFE_BASE_URL` | Browser | BAFE Proxy Target |
| `STRIPE_SECRET_KEY` | Server only | Checkout Sessions |

**Risiko:** `VITE_GEMINI_API_KEY` ist im Browser sichtbar. Gemini-Missbrauch möglich. Mitigation: Rate-Limiting auf Gemini-Seite, oder Migration zu serverseitigem Proxy.

---

## 12. Offene Arbeitspakete

| # | Paket | Status | Abhängigkeit | Aufwand |
|---|-------|--------|-------------|---------|
| 1 | Signal Engine (TypeScript) | ✅ Implementiert | — | Fertig |
| 2 | Quiz-Portierung + Event Bridge | ✅ Implementiert | Paket 1 | Fertig |
| 3 | Fusion Ring Visualisierung | ⚠️ Bug: Canvas Init | Paket 1+2 | Patch nötig |
| 4 | LeanDeep Affinity Derivation | 📋 Spezifiziert | LeanDeep laufend | ~1 Tag |
| 5 | BAFE `/calculate/ring` Endpoint | 📋 Konzept | Paket 1 (Port nach Python) | ~2 Tage |
| 6 | LeanDeep als eigenständiger SaaS | 💡 Idee | Auth/Pricing Setup | Woche+ |
| 7 | Dating-Matching | 🗄️ Schublade | Paket 5 | — |

---

## 13. Glossar

| Begriff | Bedeutung |
|---------|-----------|
| **Bazahuawa** | Name des Fusion Rings. Visueller Persönlichkeits-Fingerabdruck. |
| **BAFE** | BaZi-Astro Fusion Engine. Python API für astrologische Berechnungen. |
| **ContributionEvent** | Standardisiertes Event-Format für Quiz-Ergebnisse. Enthält Marker, Traits, Tags. |
| **Marker** | Semantischer Signal-Punkt. Format: `marker.domain.keyword`. Gewicht 0–1. |
| **AFFINITY_MAP** | Lookup-Tabelle: Keyword → 12 Sektor-Gewichte. Kern-IP des Mapping-Systems. |
| **Fusion Ring Signal** | `number[12]` — die 12 Sektor-Werte die den Ring formen. |
| **Opposition-Tension** | Gegenseitige Hemmung gegenüberliegender Sektoren (S0↔S6, etc.). |
| **Gauss-Glocke** | `exp(-d²/2σ²)` mit σ=1.2. Erzeugt organische Peaks statt harter Spikes. |
| **Power-Curve** | `sign(x)·|x|^1.5`. Verstärkt starke, dämpft schwache Signale. |
| **VAD** | Valence/Arousal/Dominance. 3D-Emotionskoordinaten (Mehrabian & Russell 1974). |
| **LeanDeep** | Deterministische NLP-Engine. 848 Regex-Marker, 4-Schicht-Kaskade, 1ms Latenz. |
| **Morning-Theme** | Helles UI-Theme in Astro-Noctum (Blau-Gradient, weiße Cards). |
| **Obsidian** | Dunkles Farbschema (#00050A). Ursprünglich geplantes Theme, jetzt für Ring-Container. |
