# issues_GPT.md – Schwachstellen- & Architektur-Analyse (QuizzMe-main)

_Generiert von Refactoring-GPT am 2026-01-01._

## Überblick

Dieses Dokument identifiziert **Schwachstellen, Bugs und architektonische Sackgassen** im Repository `QuizzMe-main` (ZIP-Analyse, statisch – **nicht verifiziert durch Build/Tests**).

**Repository-Metriken (grob):**
- Dateien gesamt: **531**
- Dateien unter `src/`: **224**
- TypeScript: **102** (`.ts`) + **96** (`.tsx`)
- Markdown: **91**

---

## Executive Summary (Top-Risiken)

1. **CRITICAL Security:** Supabase RLS für `psyche_profiles` ist praktisch offen (`device_id IS NOT NULL`). → Datenabfluss/Manipulation.
2. **CRITICAL API Exposure:** `/api/contribute` & `/api/profile/snapshot` ohne Auth; dazu `force-static` Caching-Risiko.
3. **CRITICAL Core Feature Bug:** CosmicEngine wird durch Hard-Throw immer auf Mock gezwungen.
4. **HIGH Correctness:** Client/Server-Contract für `userId` ist inkonsistent (Header vs Body/Query) → API-Mode ist kaputt/irreführend.
5. **HIGH Architecture Drift:** Mehrere konkurrierende Profile-/Storage-/Ingestion-Pfade (localStorage v1/v2, JSON-Store, Supabase) ohne klare Source-of-Truth.

**Gesamtbewertung:** **Kritisch** (wegen Security + Core Feature + Deploy/Contract-Fehler).

---

## Architektur-Skizze (wie es aktuell wirkt)

- **UI / Next App Router**
  - `/` → Character Sheet (lokal, `lme/storage-full`)
  - `/verticals/quiz/*` → Quiz-Flows (nutzen `lib/api/contribute-client` mit Static/API Mode)
  - `/character` → AstroSheet (auth required, Supabase)
- **Persistenz / State**
  - `lib/storage/localstorage-store.ts` (ProfileState+Events, Static Mode)
  - `lib/storage/json-store.ts` (Server Mode, FS-basiert)
  - `lib/lme/storage-full.ts` (Snapshot-only, anderer Storage-Key)
  - Supabase: `astro_profiles` (ok), `psyche_profiles` (RLS kritisch)
- **Compute**
  - Astro: `src/server/cosmicEngine/*` + `/api/astro/compute`
  - Derzeit: Engine-Fallback auf Mock erzwungen (Bug)
- **Deployment-Modi**
  - Static Export (GitHub Pages / Nginx)
  - Server Mode (Docker, Node + Python)
  - Dual-Mode Client erkennt static vs server heuristisch

➡️ **Sackgasse:** Zu viele gleichzeitige „Produktionspfade“ ohne harte Abgrenzung/Feature-Flags.

---

## Findings (kompakt)

| ID | Kategorie | Schweregrad | Ort | Kurzbeschreibung |
|---|---|---|---|---|
| SEC-001 | Security / Data Access | CRITICAL | `supabase/migrations/001_psyche_profiles.sql:70` – `OR device_id IS NOT NULL` | Row Level Security (RLS) erlaubt Lesen/Ändern fremder `psyche_profiles`-Zeilen, sobald `device_id` gesetzt ist. |
| SEC-002 | Security / API | CRITICAL | `src/app/api/contribute/route.ts:35` – `const userId = (body.userId as string) ?? "demo";` | POST `/api/contribute` akzeptiert frei wählbares `userId` (Default: `demo`) ohne Auth/Rate-Limit. |
| SEC-003 | Security / API | CRITICAL | `src/app/api/profile/snapshot/route.ts:16` – `export const dynamic = "force-static";` | GET `/api/profile/snapshot` ist unauthentifiziert und dazu als `force-static` markiert. |
| SEC-004 | Security / Secrets / Supply Chain | HIGH | `src/components/astro-sheet/IdentityBadges.tsx:268` – `new GoogleGenAI({ apiKey: process.env.API_KEY \|\| "" })` | Google GenAI SDK wird im Client gebundelt; API-Key-Handling ist unklar/fehleranfällig. |
| BUG-001 | Correctness / Core Feature | CRITICAL | `src/server/cosmicEngine/engine.ts:78` – `throw new Error("Forcing Mock Engine due to build failure");` | CosmicEngine wird *immer* in den Mock-Fallback gezwungen. |
| BUG-002 | Correctness / API Contract | HIGH | `src/lib/api/contribute-client.ts:183` – `headers: { ... "x-user-id": userId } , body: JSON.stringify({ event })` | Client sendet `x-user-id` Header, Server liest `userId` nur aus Body/Query → `userId` wird ignoriert. |
| BUG-003 | Correctness / Caching | HIGH | `src/app/api/profile/snapshot/route.ts:16` – `dynamic = "force-static"` | `force-static` für user-spezifisches Snapshot ist (sehr wahrscheinlich) falsch. |
| GAP-001 | Product Gap | MEDIUM | `src/lib/astro/compute.ts:0` – `calculateDailyTransits(): TODO (Stub)` | `calculateDailyTransits` ist als TODO/Stub implementiert; Daily Horoscope verweist darauf. |
| ARCH-001 | Architecture / Cohesion | HIGH | `src/app/page.tsx:1` – `getProfileSnapshot() aus lme/storage-full` | Parallele Profile-Speicher/Modelle: `lme/storage-full` (Snapshot-Key) vs `lib/storage/localstorage-store` (ProfileState+Events) vs Supabase `psyche_profiles`. |
| ARCH-002 | Architecture / Routing | MEDIUM | `src/proxy.ts:1` – `proxy() vorhanden, aber keine middleware.ts gefunden` | Doku/Code deuten auf Multi-Domain-Rewrites via Middleware hin, aber `middleware.ts` fehlt und `proxy.ts` ist ungenutzt. |
| DEPLOY-001 | Build/Deploy | HIGH | `.github/workflows/nextjs.yml:70` – `path: ./out` | GitHub Pages Workflow lädt `./out` hoch, setzt aber kein `NEXT_OUTPUT=export` o.Ä. (Next default produziert kein `out`). |
| ARCH-003 | Architecture / Client-Server Boundary | MEDIUM | `src/lib/supabase/index.ts:2` – `export { createClient as createServerClient, createAdminClient }` | Ein gemeinsames Barrel-File exportiert Browser- und Server-Clients zusammen. |
| REL-001 | Reliability / Browser APIs | MEDIUM | `src/lib/device-id.ts:18` – `localStorage.getItem(...) ohne try/catch` | Ungefangene localStorage-Errors möglich (Safari Private Mode, QuotaExceeded, SSR-Hydration). |
| DX-001 | Developer Experience / Tooling | LOW | `src/components/quizzes/quizzes new design/:1` – `Verzeichnisname enthält Leerzeichen` | Spaces in Pfaden erschweren Imports/Tooling, können auf manchen Umgebungen/CI-Skripten brechen. |
| PERF-001 | Performance / Determinism | MEDIUM | `src/components/astro-sheet/DailyQuest.tsx:249` – `Math.random() im JSX` | Nicht-deterministische Werte im Render-Pfad. |
| DX-002 | Docs / Onboarding | LOW | `README.md:0` – `keine .env.example im Repo` | Kein `.env.example`/Setup-Skript für Supabase & CosmicEngine. |
| QA-001 | Testing / CI | MEDIUM | `.github/workflows/ci.yml:0` – `CI läuft lint+build, aber keine `npm test`/vitest` | Unit-Tests werden nicht im CI ausgeführt. |
| QA-002 | Testing / E2E | LOW | `e2e/character-sheet.spec.ts:1` – `Playwright test placeholder` | E2E-Test ist ein Platzhalter; Playwright fehlt in Dependencies. |
| ARCH-004 | Maintainability / Complexity | MEDIUM | `src/components/quizzes/AuraColorsQuiz.tsx:1` – `618 LOC (God Component)` | Viele Quiz-Komponenten sind sehr groß (500–600+ LOC) und enthalten wiederholte Flow-Logik. |

---

## Details & Empfehlungen (pro Issue)

### SEC-001 – Security / Data Access (CRITICAL)
- **Ort:** `supabase/migrations/001_psyche_profiles.sql:70` – `OR device_id IS NOT NULL`
- **Beschreibung:** Row Level Security (RLS) erlaubt Lesen/Ändern fremder `psyche_profiles`-Zeilen, sobald `device_id` gesetzt ist.
- **Impact/Risiko:** Datenabfluss & Manipulation: Jede anonyme/angemeldete Session kann potenziell *alle* anonymen Profile lesen/ändern.
- **Empfehlung:** RLS strikt auf `auth.uid() = user_id` begrenzen. Für anonyme Profile: entweder lokal speichern, oder eigenes Auth-Konzept (custom JWT mit `device_id` Claim + `auth.jwt()` Policy) bzw. Backend-Service-API mit Service-Role-Key.

### SEC-002 – Security / API (CRITICAL)
- **Ort:** `src/app/api/contribute/route.ts:35` – `const userId = (body.userId as string) ?? "demo";`
- **Beschreibung:** POST `/api/contribute` akzeptiert frei wählbares `userId` (Default: `demo`) ohne Auth/Rate-Limit.
- **Impact/Risiko:** Beliebige Fremd-Manipulation von Profilen, Speicher/Log-Spam, DoS (JSON-Store wächst).
- **Empfehlung:** Endpoint mit Auth absichern (Supabase Session/JWT), `userId` aus Token ableiten; Rate-Limit + Payload-Limits; Body mit zod/io-ts validieren.

### SEC-003 – Security / API (CRITICAL)
- **Ort:** `src/app/api/profile/snapshot/route.ts:16` – `export const dynamic = "force-static";`
- **Beschreibung:** GET `/api/profile/snapshot` ist unauthentifiziert und dazu als `force-static` markiert.
- **Impact/Risiko:** Potentiell falsches Caching/Leaking zwischen Usern; Zugriff ohne Auth möglich (wenn Server-Deployment).
- **Empfehlung:** Auth erzwingen und `force-dynamic` + passende Cache-Header nutzen (oder komplett entfernen, wenn nur Demo).

### SEC-004 – Security / Secrets / Supply Chain (HIGH)
- **Ort:** `src/components/astro-sheet/IdentityBadges.tsx:268` – `new GoogleGenAI({ apiKey: process.env.API_KEY || "" })`
- **Beschreibung:** Google GenAI SDK wird im Client gebundelt; API-Key-Handling ist unklar/fehleranfällig.
- **Impact/Risiko:** Key könnte (je nach Build/Env) im Bundle landen oder Feature ist schlicht kaputt. Zusätzlich: kein Rate-Limit / Abuse-Schutz.
- **Empfehlung:** AI-Aufruf serverseitig kapseln (Next Route/Server Action), Key nur serverseitig; Input/Output limitieren; Caching & Abuse-Prevention.

### BUG-001 – Correctness / Core Feature (CRITICAL)
- **Ort:** `src/server/cosmicEngine/engine.ts:78` – `throw new Error("Forcing Mock Engine due to build failure");`
- **Beschreibung:** CosmicEngine wird *immer* in den Mock-Fallback gezwungen.
- **Impact/Risiko:** Astro-Berechnungen sind nicht produktionsfähig; Debug-Code blockiert reale Engine.
- **Empfehlung:** Debug-Flag über ENV (`COSMIC_FORCE_MOCK=true`) statt Hard-Throw; Integrationstest in Docker/CI; klare Fallback-Strategie.

### BUG-002 – Correctness / API Contract (HIGH)
- **Ort:** `src/lib/api/contribute-client.ts:183` – `headers: { ... "x-user-id": userId } , body: JSON.stringify({ event })`
- **Beschreibung:** Client sendet `x-user-id` Header, Server liest `userId` nur aus Body/Query → `userId` wird ignoriert.
- **Impact/Risiko:** API-Mode funktioniert faktisch immer als `demo` (oder falscher User), schwer zu debuggen.
- **Empfehlung:** Contract vereinheitlichen: entweder Header *oder* Body; gemeinsam in Shared Type + zod Schema; Contract-Tests.

### BUG-003 – Correctness / Caching (HIGH)
- **Ort:** `src/app/api/profile/snapshot/route.ts:16` – `dynamic = "force-static"`
- **Beschreibung:** `force-static` für user-spezifisches Snapshot ist (sehr wahrscheinlich) falsch.
- **Impact/Risiko:** Risiko: falsche Antworten, Caching-Leaks, unklare Semantik in Next.
- **Empfehlung:** `force-dynamic` + `Cache-Control: no-store` (oder ETag pro user).

### GAP-001 – Product Gap (MEDIUM)
- **Ort:** `src/lib/astro/compute.ts:0` – `calculateDailyTransits(): TODO (Stub)`
- **Beschreibung:** `calculateDailyTransits` ist als TODO/Stub implementiert; Daily Horoscope verweist darauf.
- **Impact/Risiko:** Horoskop/Transits liefern Platzhalterwerte → Nutzervertrauen sinkt.
- **Empfehlung:** Klare MVP-Definition: minimale Transit-Berechnung oder Feature-Flag; Tests für Datum/Timezone.

### ARCH-001 – Architecture / Cohesion (HIGH)
- **Ort:** `src/app/page.tsx:1` – `getProfileSnapshot() aus lme/storage-full`
- **Beschreibung:** Parallele Profile-Speicher/Modelle: `lme/storage-full` (Snapshot-Key) vs `lib/storage/localstorage-store` (ProfileState+Events) vs Supabase `psyche_profiles`.
- **Impact/Risiko:** Inkonsistente User Experience: Quiz-Resultate landen ggf. in anderem Speicher als Character Sheet; schwierige Migration.
- **Empfehlung:** Eine 'Source of Truth' definieren (z.B. ProfileState+Snapshot Builder). Alte Pipeline entfernen oder Migrationspfad implementieren.

### ARCH-002 – Architecture / Routing (MEDIUM)
- **Ort:** `src/proxy.ts:1` – `proxy() vorhanden, aber keine middleware.ts gefunden`
- **Beschreibung:** Doku/Code deuten auf Multi-Domain-Rewrites via Middleware hin, aber `middleware.ts` fehlt und `proxy.ts` ist ungenutzt.
- **Impact/Risiko:** Routing/Deployment-Verhalten schwer vorhersehbar (Hostnames, BasePath, GH Pages).
- **Empfehlung:** Entweder echte `src/middleware.ts` einführen (und testen), oder Konzept entfernen + Routing vereinfachen.

### DEPLOY-001 – Build/Deploy (HIGH)
- **Ort:** `.github/workflows/nextjs.yml:70` – `path: ./out`
- **Beschreibung:** GitHub Pages Workflow lädt `./out` hoch, setzt aber kein `NEXT_OUTPUT=export` o.Ä. (Next default produziert kein `out`).
- **Impact/Risiko:** Deploy kann fehlschlagen oder leeres Artifact ausliefern.
- **Empfehlung:** Workflow: env setzen (z.B. `NEXT_OUTPUT=export`) oder `next export` explizit; Artefaktpfad verifizieren.

### ARCH-003 – Architecture / Client-Server Boundary (MEDIUM)
- **Ort:** `src/lib/supabase/index.ts:2` – `export { createClient as createServerClient, createAdminClient }`
- **Beschreibung:** Ein gemeinsames Barrel-File exportiert Browser- und Server-Clients zusammen.
- **Impact/Risiko:** Future Footgun: Client-Komponenten könnten versehentlich Server-Code importieren (next/headers) → Build-Fehler/Bundling-Risiken.
- **Empfehlung:** Separate Entry-Points beibehalten (`/client`, `/server`) und `index.ts` entfernen oder nur client-safe exports.

### REL-001 – Reliability / Browser APIs (MEDIUM)
- **Ort:** `src/lib/device-id.ts:18` – `localStorage.getItem(...) ohne try/catch`
- **Beschreibung:** Ungefangene localStorage-Errors möglich (Safari Private Mode, QuotaExceeded, SSR-Hydration).
- **Impact/Risiko:** Crash/Blank Screen bei bestimmten Browsern/Settings.
- **Empfehlung:** localStorage Access in try/catch kapseln + Fallback (in-memory ID) + Telemetrie.

### DX-001 – Developer Experience / Tooling (LOW)
- **Ort:** `src/components/quizzes/quizzes new design/:1` – `Verzeichnisname enthält Leerzeichen`
- **Beschreibung:** Spaces in Pfaden erschweren Imports/Tooling, können auf manchen Umgebungen/CI-Skripten brechen.
- **Impact/Risiko:** Build-/Lint-Probleme, unnötige Reibung.
- **Empfehlung:** Verzeichnis umbenennen (`quizzes-new-design`) oder in `docs/` auslagern.

### PERF-001 – Performance / Determinism (MEDIUM)
- **Ort:** `src/components/astro-sheet/DailyQuest.tsx:249` – `Math.random() im JSX`
- **Beschreibung:** Nicht-deterministische Werte im Render-Pfad.
- **Impact/Risiko:** Unnötige Re-Renders/DOM churn; potenziell SSR/CSR Mismatch wenn je deployed.
- **Empfehlung:** Randoms in `useMemo/useState` initialisieren oder deterministisch aus Seed ableiten.

### DX-002 – Docs / Onboarding (LOW)
- **Ort:** `README.md:0` – `keine .env.example im Repo`
- **Beschreibung:** Kein `.env.example`/Setup-Skript für Supabase & CosmicEngine.
- **Impact/Risiko:** Setup dauert länger, Fehlerquote höher.
- **Empfehlung:** `.env.example` + klare Sektion 'Required/Optional env vars' + Docker compose optional.

### QA-001 – Testing / CI (MEDIUM)
- **Ort:** `.github/workflows/ci.yml:0` – `CI läuft lint+build, aber keine `npm test`/vitest`
- **Beschreibung:** Unit-Tests werden nicht im CI ausgeführt.
- **Impact/Risiko:** Regressionen landen unbemerkt im main.
- **Empfehlung:** `npm test` (vitest) in CI integrieren; ggf. split jobs (lint/test/build).

### QA-002 – Testing / E2E (LOW)
- **Ort:** `e2e/character-sheet.spec.ts:1` – `Playwright test placeholder`
- **Beschreibung:** E2E-Test ist ein Platzhalter; Playwright fehlt in Dependencies.
- **Impact/Risiko:** Kein End-to-End-Sicherheitsnetz.
- **Empfehlung:** Playwright hinzufügen + minimaler 'happy path' Test + in CI nightly.

### ARCH-004 – Maintainability / Complexity (MEDIUM)
- **Ort:** `src/components/quizzes/AuraColorsQuiz.tsx:1` – `618 LOC (God Component)`
- **Beschreibung:** Viele Quiz-Komponenten sind sehr groß (500–600+ LOC) und enthalten wiederholte Flow-Logik.
- **Impact/Risiko:** Änderungen sind fehleranfällig; Feature-Ausbau skaliert schlecht.
- **Empfehlung:** Konfigurationsgetriebene Quiz-Engine (Questions/Scoring JSON) + wiederverwendbare UI-Komponenten + generische Result-Renderer.

---

## Code-Smell-Metriken (Spotlight)

### Größte Dateien (Top 12 nach LOC)
| Datei | LOC | Bytes |
|---|---:|---:|
| `src/lib/registry/tags.ts` | 707 | 14357 |
| `src/components/quizzes/aura-colors/data.ts` | 635 | 34119 |
| `src/components/quizzes/AuraColorsQuiz.tsx` | 618 | 22010 |
| `src/lib/ingestion/__tests__/ingestion.test.ts` | 603 | 19230 |
| `src/components/quizzes/CharmeQuiz.tsx` | 602 | 29715 |
| `src/components/quizzes/EQQuiz.tsx` | 587 | 28631 |
| `src/lib/registry/markers.ts` | 585 | 14392 |
| `src/components/quizzes/LoveLanguagesQuiz.tsx` | 573 | 32153 |
| `src/components/astro-sheet/IdentityBadges.tsx` | 565 | 35278 |
| `src/lib/registry/traits.ts` | 506 | 12687 |
| `src/lib/registry/unlocks.ts` | 493 | 13961 |
| `src/components/quizzes/social-role/data.ts` | 450 | 15460 |

### Explizite `any`-Nutzung (Top 12 nach Count)
| Datei | any-Vorkommen (heuristisch) |
|---|---:|
| `src/components/quizzes/PersonalityQuiz.tsx` | 11 |
| `src/app/api/astro/compute/route.ts` | 8 |
| `src/components/quizzes/DestinyQuiz.tsx` | 6 |
| `src/components/quizzes/LoveLanguagesQuiz.tsx` | 6 |
| `src/components/quizzes/PartyQuiz.tsx` | 4 |
| `src/components/quizzes/CareerDNAQuiz.tsx` | 3 |
| `src/components/quizzes/SocialRoleQuiz.tsx` | 3 |
| `src/components/quizzes/SpotlightQuiz.tsx` | 3 |
| `src/components/character/__tests__/CharacterSheet.test.tsx` | 2 |
| `src/hooks/useAstroCompute.ts` | 2 |
| `src/lib/lme/ingestion.ts` | 2 |
| `src/lib/lme/types.ts` | 2 |

### `process.env` Non-Null Assertions (`!`)
Diese Stellen crashen bei fehlenden Env-Vars statt sauber zu degradieren:
- `src/lib/supabase/client.ts:7` – `process.env.NEXT_PUBLIC_SUPABASE_URL!`
- `src/lib/supabase/client.ts:8` – `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`
- `src/lib/supabase/server.ts:8` – `process.env.NEXT_PUBLIC_SUPABASE_URL!`
- `src/lib/supabase/server.ts:9` – `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`
- `src/lib/supabase/server.ts:36` – `process.env.NEXT_PUBLIC_SUPABASE_URL!`
- `src/lib/supabase/server.ts:37` – `process.env.SUPABASE_SERVICE_ROLE_KEY!`

---

## Architektonische Sackgassen (Bündel)

### A) Anonyme Profile in Supabase via `device_id`
- **Problem:** RLS kann den „Besitz“ eines `device_id` nicht prüfen (weil `device_id` kein Auth-Claim ist).
- **Symptom:** `OR device_id IS NOT NULL` macht die Tabelle faktisch öffentlich.
- **Konsequenz:** Entweder anonyme Daten lokal halten, oder ein Auth-System einführen, das `device_id` als Claim/JWT enthält (oder Backend-Proxy mit Service Role).

### B) Multi-Mode Persistence ohne klare Source-of-Truth
- `lme/storage-full` (Snapshot-only) vs `localstorage-store` (State+Events) vs JSON-Store vs Supabase.
- Ohne Migrationsstrategie entsteht „Daten-Drift“: UI zeigt andere Daten als Quiz schreibt.

### C) Python/CosmicEngine in Next Runtime
- Dockerfile investiert in Python + Ephemeriden, aber App erzwingt Mock.
- **Empfehlung:** Entweder Engine robust integrieren (Feature Flag + Healthcheck + Tests), oder als separaten Service (HTTP) entkoppeln.

### D) Quiz-Implementierung skaliert nicht
- Viele große Komponenten, wiederholte Patterns (Fragenfluss, Scoring, Ergebnisrendering).
- **Empfehlung:** Data-driven Quiz Engine + Component Library.

---

## Quick Wins (1–2 Tage)
1. **RLS fixen** (`psyche_profiles`) – *sofort*.
2. **API absichern** oder deaktivieren (falls nur Demo).
3. Hard-Throw in CosmicEngine entfernen → über ENV steuern.
4. API-Contract `userId` vereinheitlichen (Header vs Body).
5. Snapshot Route auf `force-dynamic` + `no-store`.
6. `.env.example` hinzufügen.

---

## Verifikation / Checks (empfohlen)

> Nicht verifiziert: Diese Checks bitte lokal/CI laufen lassen.

- `npm ci`
- `npm run lint`
- `npm test` (vitest) – aktuell nicht in CI
- `npm run build`
- Security:
  - Supabase: Policies prüfen, `anon` Zugriff testen
  - API routes: mit curl unauth Requests versuchen
- Static export:
  - `NEXT_OUTPUT=export npm run build` und prüfen ob `out/` entsteht

---

## Offene Fragen (für nächsten Schritt)
- Welcher Persistenzpfad ist **Source of Truth** (Supabase vs local-only)?
- Soll es echten Serverbetrieb geben, oder ist es ein reiner Static Host?
- Ist „anonymes Profil“ wirklich ein Produktziel? Wenn ja: welches Auth/Ownership-Modell?


---

## Weitere Auffälligkeiten (nicht vollständig ausgearbeitet)

### Security / Privacy
- **Keine Rate-Limits** auf compute-/contribute-Endpunkten → Abuse/DoS Risiko. (z.B. `src/app/api/astro/compute/route.ts`)
- **PII in AI-Prompt/Client**: Falls AI-Feature aktiv, gehen sensible Daten an Drittanbieter (Google). `IdentityBadges.tsx` – Consent/Redaction fehlt.
- **Service-Role-Key Footgun**: `src/lib/supabase/server.ts` enthält `SUPABASE_SERVICE_ROLE_KEY!` – sicherstellen, dass es **nie** in Client-Bundles landet (Barrel-Exports vermeiden).

### Correctness / Produktlogik
- **DST Fold Handling unvollständig**: Onboarding erwähnt Fold-Dialog als TODO (`src/app/onboarding/astro/page.tsx`).
- **Horoscope Daily basiert auf Stub**: `calculateDailyTransits()` ist TODO (`src/lib/astro/compute.ts`), Daily Page kommentiert das (`src/app/verticals/horoscope/daily/page.tsx`).
- **`force-static` auf POST-Route**: `/api/contribute` exportiert `dynamic="force-static"` – wirkt inkonsistent und kann Next-Caching verwirren. (`src/app/api/contribute/route.ts`)

### Architecture / Maintainability
- **Mehrere „Versionen“ im Repo**: `src/components/quizzes/quizzes new design/*` + viele `docs/plans/*` unter produktivem `src/` → build/bundle drift.
- **Dead/Unused Dependencies**: `better-sqlite3` ist als Dependency gelistet, wird aber im `src/` nicht verwendet (Supply-Chain & Bundle-Risiko).
- **`console.*` im Produktcode** (24 Dateien) – Logging sollte strukturiert und environment-aware sein.

### Performance
- **Sehr große Daten- und UI-Dateien** (600+ LOC) erhöhen Bundle & parse time; häufige Patterns: große Inline-Arrays, lange Strings.
- **Random/Animation-heavy UI** ohne memoization kann auf mobilen Geräten ruckeln (z.B. IdentityBadges, DailyQuest).

### Testing / Quality
- **Contract-Tests fehlen** für Dual-Mode API (Client ↔ Route). Die aktuelle `userId`-Diskrepanz wäre so sofort aufgefallen.
- **CI**: `nextjs.yml` & `ci.yml` haben überlappende Pipelines; Tests nicht konsistent.

