# Development Brief: Dashboard Flow, Daily Pulse, 3D Signatur, Stripe CTA

**Stand:** 2026-05-07
**Repo:** Astro-Noctum
**Executor:** Claude Code (führt diesen Brief aus)

---

## Ziele

1. Dashboard stabilisieren: Buildbreaker, CTA-Deduplizierung, Stripe-Checkout.
2. Daily Pulse sichtbar und zuverlässig machen (DailyChartHero + API-Kette).
3. Implementierte 3D-Signaturkugel im Dashboard-Flow verankern.
4. Dashboard-Informationshierarchie für Orientierung und Retention.
5. Daily Chart API-Kontrakt bereinigen.
6. GreenOps: Polling-Frequenz und Space-Weather-Deduplizierung.
7. **Tagespuls Neu-Architektur**: Aphorismus-basierter Slot 1 + Rat der sechs Wahl-Moment implementieren (Infrastructure in `apps/tagespuls_package` ist bereit).

## Non-Goals

- Keine Änderungen an astrologischen Formeln, Scoring, Ephemeris, BaZi, Wu-Xing.
- Kein Rebuild der Signatur V3 als neues Feature.
- Kein Austausch von Stripe oder der Payment-Architektur.
- Keine AI-Quota-Migration (außer nachgewiesen als Checkout/Render-Blocker).
- Keine Tagespuls-Neuarchitektur-Implementierung ohne nicht-leere `aphorisms.json` (Prerequisite: Ben approved min. 15 Aphorismen in `aphorisms/review/`, dann Build-Pipeline ausführen — das ist ein menschlicher Handgriff, kein Code-Task).

---

## Bereits erledigt (nicht nochmal anfassen)

| Task | Datei | Was |
|------|-------|-----|
| TASK-D1 | `src/components/dashboard/DailyChartHero.tsx` | Props `profileIncomplete` + `onCompleteProfile` ergänzt; Section D zeigt Profil-CTA wenn `profileIncomplete && !hasImpuls` |
| TASK-D1 | `src/components/Dashboard.tsx` | `profileIncomplete` und `onCompleteProfile={onReset}` an DailyChartHero übergeben |
| TASK-D3 | `src/hooks/useFirstRunDaily.ts` | Delivery-Window-Guard dokumentiert (Kommentar Zeile 132ff, Option B bestätigt) |

---

## Prioritäten

| Prio | Task | Begründung |
|------|------|------------|
| P0 | TASK-1.1 isTourStepVisible-Bug | Dashboard-UI-Blocker: Tour-Overlay verschwindet nicht nach Abschluss |
| P0 | TASK-1.2 Upgrade-CTA-Inventar | Flow- und Vertrauensproblem |
| P0 | TASK-1.3 Genau ein Upgrade-CTA | Conversion-Hygiene |
| P0 | TASK-1.4 Checkout-Auslösung | Umsatz-Blocker |
| P1 | TASK-D2 Fallback-Label | Datenwahrheit |
| P1 | TASK-D4 vertiefen-Button bei Fallback | UX-Vollständigkeit |
| P1 | TASK-2.1 3D-Kugel-Codepfad | Kernwert sichtbar machen |
| P1 | TASK-2.2 3D-Kugel im Dashboard verankern | Retention-Anker |
| P1 | TASK-3.1 Dashboard-Informationshierarchie | Orientierung + Retention |
| P1 | TASK-4 Daily Chart API entmischen | Datenwahrheit |
| P2 | TASK-T0 Prerequisite: aphorisms.json prüfen | Gate für Phase T |
| P2 | TASK-T1 Supabase-Migration tagespuls | DB-Fundament |
| P2 | TASK-T2 Edge Function daily-pulse (GET) | API-Kern |
| P2 | TASK-T3 Edge Function daily-interpretation (POST) | Phase-2-API |
| P2 | TASK-T4 useDailyPulse Hook | Client-Daten |
| P2 | TASK-T5 TagespulsCard Komponente | UI |
| P2 | TASK-T6 Dashboard-Verdrahtung | Sichtbarkeit |
| P3 | TASK-5.1 Transit-Polling reduzieren | GreenOps |
| P3 | TASK-5.2 SpaceWeather deduplizieren | GreenOps |

---

## Phase 0 — Baseline

**Vor jedem anderen Task ausführen.**

```bash
cd Bazodiac-WebApp/Astro-Noctum
npx tsc --noEmit
npm run build
npm run test
```

Exit Criteria:
- Buildstatus bekannt und dokumentiert.
- Typecheck-Fehler sind gelistet.
- Kein Task beginnt ohne Baseline.

---

## Phase 1 — Dashboard Buildbreaker, CTA, Stripe

### TASK-1.1 — isTourStepVisible-Bug fixen

**Datei:** `src/components/Dashboard.tsx`

**Problem (verifiziert):**

```typescript
// AKTUELL — BUG: tourStep === 'done' lässt Tour-Overlay dauerhaft sichtbar
const isTourStepVisible = tourStep === 0 || tourStep === 'done'
  || (tourStep === 1 && scrollReached.has(1));
```

**Fix:**

```typescript
// KORREKT — Tour-Overlay verschwindet nach Abschluss
const isTourStepVisible = tourStep === 0
  || (tourStep === 1 && scrollReached.has(1));
```

Acceptance:
- `tourStep === 'done'` → kein Tour-Overlay gerendert.
- `tourStep === 0` → Tour-Overlay sichtbar.
- `tourStep === 1` + Sentinel gescrollt → Tour-Overlay sichtbar.
- `typecheck` läuft durch.

---

### TASK-1.2 — Upgrade-CTA-Inventar erstellen

**Dateien durchsuchen:**

```
src/components/Dashboard.tsx
src/components/UpgradeButton.tsx
src/components/dashboard/AgentSection.tsx
src/components/ManageSubscription.tsx
src/components/navigation/*
src/components/signatur/PremiumUpgradeModal.tsx
```

**Aufgabe:** Jeden Upgrade-/Premium-Button klassifizieren:

| Klasse | Bedeutung |
|--------|-----------|
| `keep_primary` | Der eine primäre Dashboard-CTA |
| `convert_to_lock_hint` | Wird zu Lock-Indikator ohne Checkout-Button |
| `remove` | Redundant, entfernen |
| `modal_only` | Nur innerhalb eines Modals zulässig |
| `premium_only_manage` | Nur für Premium-User als Abo-Verwaltung |

Acceptance:
- Inventar liegt als Kommentar-Block in Dashboard.tsx oder als separates `docs/cta-inventory.md`.
- Jede Stelle ist klassifiziert.

---

### TASK-1.3 — Genau ein primärer Upgrade-CTA

**Regeln:**
- Free User: maximal **ein** großer Upgrade-CTA im Dashboard-Viewport.
- Agent Cards: dürfen Premium-Lock-Zustand zeigen, aber **kein** eigener `/api/checkout`-Call.
- Navigation: kein konkurrierender Checkout-CTA im Dashboard-Viewport.
- Premium User: **kein** Upgrade-CTA, optional `ManageSubscription`.

**Konkret zu fixen (aus Code-Analyse bekannt):**
- `AgentSection.tsx` enthält einen eigenen `handleUpgrade()` mit `POST /api/checkout` → ersetzen durch `onRequestUpgrade`-Callback oder Lock-Hinweis.
- Dashboard Free-User-Banner: bleibt als primärer CTA wenn vorhanden.
- `UpgradeButton` bleibt als zentraler Auslöser.

Acceptance:
- Free User: genau ein primärer CTA.
- Premium User: kein Upgrade-CTA.
- Agent Cards: Lock-Indikator, kein eigener Checkout-Trigger.
- `typecheck` läuft durch.

---

### TASK-1.4 — Checkout-Auslösung fixen

**Datei:** `src/components/UpgradeButton.tsx`

**Required behavior:**
- Klick → genau **ein** `POST /api/checkout`.
- Button während Request disabled (kein Double-Click).
- Success `{ url }` → `window.location.href = url` (Stripe Checkout).
- Fehler werden konkret unterschieden:

| Fehlerfall | Anzeige |
|------------|---------|
| Nicht eingeloggt | „Bitte zuerst anmelden." |
| Kein Token / 401 | „Sitzung abgelaufen. Bitte neu anmelden." |
| 403 | „Kein Zugriff. Wende dich an den Support." |
| 503 / Stripe env fehlt | „Zahlung derzeit nicht verfügbar. Versuche es später." |
| 200 ohne url | „Unerwartete Antwort. Bitte Seite neu laden." |
| Network Error | „Verbindungsproblem. Bitte Netzwerk prüfen." |

**Analytics-Events (fire-and-forget, kein Blocking):**

```typescript
upgrade_clicked
checkout_started
checkout_failed  // mit error_type-Property
checkout_redirected
```

Acceptance:
- `POST /api/checkout` wird bei CTA-Klick **genau einmal** ausgelöst.
- Erfolg redirectet zu `https://checkout.stripe.com/...`.
- Jeder Fehlertyp zeigt konkreten Text.
- Button ist während Request disabled.

---

## Phase D — Daily Pulse Sichtbarkeit (zwischen Phase 1 und Phase 2)

> TASK-D1 und TASK-D3 sind bereits erledigt (siehe oben).

### TASK-D2 — Fallback-Herkunft sichtbar machen

**Dateien:**
- `src/hooks/useFirstRunDaily.ts`
- `src/components/dashboard/DailyChartHero.tsx`
- `src/components/Dashboard.tsx`

**Problem:**
Wenn FuFirE/Gemini down ist, setzt `buildFallbackDaily()` `meta.engine_version = 'v1-local-fallback'`. Dieser Wert ist im UI unsichtbar — der User sieht generischen Text als wäre es sein echter Tagesimpuls.

**Fix:**
1. `DailyChartHero.tsx` — neues optionales Prop ergänzen:

```typescript
/** True wenn dailyData aus lokalem Fallback stammt (API nicht erreichbar) */
isFallback?: boolean;
```

2. In Section D, unter dem `impulsText`-Absatz, wenn `isFallback && hasImpuls`:

```tsx
{isFallback && (
  <p
    className="text-[9px] text-center mt-2"
    style={{ color: 'var(--tile-text-secondary)', opacity: 0.4 }}
    data-testid="fallback-indicator"
  >
    {isDe ? '↻ Heute nicht verfügbar — generischer Inhalt' : '↻ Unavailable today — generic content'}
  </p>
)}
```

3. `Dashboard.tsx` — `isFallback` ableiten und übergeben:

```typescript
isFallback={dailyData?.meta?.engine_version === 'v1-local-fallback'}
```

Acceptance:
- API-Ausfall → dezentes Label sichtbar unter Impuls-Text.
- Echter API-Response → kein Label.
- `typecheck` läuft durch.

---

### TASK-D4 — „vertiefen →" Button bei Fallback-Daten prüfen

**Datei:** `src/components/Dashboard.tsx`

**Aufgabe:** Verifizieren dass es keinen Codepfad gibt wo `dailyData !== null` (Fallback hat gefeuert) aber `onOpenDayModal` nicht übergeben wird.

Aktueller Stand (verifiziert): `onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}` — das ist unabhängig von `dailyData`. Kein Fix nötig wenn `dailyEnabled` (`daily_modal_v1`) true bleibt.

**Aufgabe:** Explizit verifizieren und als Kommentar dokumentieren:

```typescript
// onOpenDayModal is passed regardless of dailyData presence —
// fallback data is a valid basis for the detail modal.
```

Acceptance:
- Kommentar gesetzt.
- Kein neuer Code nötig wenn Verhalten korrekt.

---

## Phase T — Tagespuls Neu-Architektur (Aphorismus + Wahl-Moment)

> **Prerequisite (menschlicher Handgriff — kein Code-Task):**
> Ben öffnet `apps/tagespuls_package/knowledge/bazodiaac-brain/aphorisms/review/aph-*.md`
> und setzt `status: "draft"` → `status: "approved"` für alle Aphorismen, die inhaltlich und
> rechtlich freigegeben sind. Ziel: mindestens 15 approved, idealerweise 5+ pro Mode-Tag
> (`pulse`, `trace`, `spannung`).
> Danach ausführen:
> ```bash
> cd apps/tagespuls_package
> python3 packages/voice/scripts/build_aphorisms.py \
>   knowledge/bazodiaac-brain/aphorisms/review \
>   packages/voice/data/aphorisms.json
> # Erwartet: "wrote N approved aphorisms to ..."
> ```
> Claude Code startet TASK-T0 erst wenn `aphorisms.json` nicht-leer ist.

---

### Was bereits gebaut ist (nicht nochmal implementieren)

| Artefakt | Pfad | Status |
|----------|------|--------|
| TypeScript-Typen | `apps/tagespuls_package/packages/voice/src/types.ts` | fertig |
| Selektionsalgorithmus | `apps/tagespuls_package/packages/voice/src/tagespuls.ts` | fertig |
| DB-Schema | `apps/tagespuls_package/packages/db/schema.sql` | fertig, nicht migriert |
| OpenAPI-Spec | `apps/tagespuls_package/packages/api/openapi.yaml` | fertig |
| Build-Pipeline | `apps/tagespuls_package/packages/voice/scripts/build_aphorisms.py` | fertig |
| Pipeline-Doku | `apps/tagespuls_package/docs/day-pulse-trace-pipeline.md` | fertig |
| Aphorism-Vault | `apps/tagespuls_package/knowledge/bazodiaac-brain/aphorisms/review/` | 21 draft, 0 approved |
| aphorisms.json | `apps/tagespuls_package/packages/voice/data/aphorisms.json` | leer (Build-Output) |

---

### TASK-T0 — Prerequisite-Gate

**Datei:** `apps/tagespuls_package/packages/voice/data/aphorisms.json`

**Aufgabe:** Verifizieren dass `aphorisms.json` mindestens 15 Einträge enthält und die Modustags alle drei Modes abdecken.

```bash
python3 -c "import json; d = json.load(open('apps/tagespuls_package/packages/voice/data/aphorisms.json'))
modes = {t for a in d for t in a['mode_tags']}
print(f'{len(d)} aphorisms, modes: {modes}')
assert len(d) >= 15, 'Zu wenig approved aphorisms — Prerequisite nicht erfüllt'
assert {'pulse','trace','spannung'} <= modes or len(d) >= 10, 'Mode-Coverage unvollständig'
print('Gate: OK')"
```

Wenn Gate fehlschlägt: Phase T pausieren, Ben informieren.

Acceptance:
- Gate-Check läuft ohne AssertionError.
- Ergebnis in `docs/tagespuls-gate-check.txt` dokumentiert.

---

### TASK-T1 — Supabase-Migration

**Datei:** `apps/tagespuls_package/packages/db/schema.sql`

**Aufgabe:** Schema gegen das Supabase-Projekt von Bazodiac migrieren.

Tabellen, die neu angelegt werden:
- `aphorisms`
- `cosmic_weather_snapshots`
- `user_astro_profiles`
- `daily_pulses`
- `daily_interpretations`
- `aphorism_usage_events`

**Hinweis:** Supabase-MCP ist verfügbar (`mcp__a13dd11f-*`). Alternativ `supabase db push` via CLI.

Vorgehensweise:
1. Mit `list_tables` prüfen ob Tabellen bereits existieren.
2. Falls nicht: `apply_migration` mit dem Inhalt von `schema.sql`.
3. Nach Migration: `list_tables` zur Verifikation.

Acceptance:
- Alle 6 Tabellen existieren in Supabase.
- Constraints und Indizes gesetzt.
- Kein Datenverlust in bestehenden Tabellen.

---

### TASK-T2 — Aphorismen-Seeding

**Datei:** `apps/tagespuls_package/packages/voice/data/aphorisms.json`

**Aufgabe:** Genehmigte Aphorismen aus `aphorisms.json` in die `aphorisms`-Supabase-Tabelle einspielen.

```python
# seed_aphorisms.py — lokal ausführen oder als Supabase-CLI-Script
import json, os
from supabase import create_client

data = json.load(open('packages/voice/data/aphorisms.json'))
client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])

for a in data:
    client.table('aphorisms').upsert({
        'id': a['id'],
        'status': a['status'],
        'text_de': a['text']['de'],
        'text_en': a['text']['en'],
        'text_original': a['text'].get('original'),
        'author': a['source']['author'],
        'work': a['source'].get('work'),
        'year': a['source'].get('year'),
        'original_language': a['source']['original_language'],
        'translator_de': a['source'].get('translator_de'),
        'translator_en': a['source'].get('translator_en'),
        'copyright': a['copyright'],
        'attribution_status': a['attribution_status'],
        'attribution_note': a.get('attribution_note'),
        'mode_tags': a['mode_tags'],
        'tone_tags': a.get('tone_tags', []),
        'element_affinity': a.get('element_affinity', []),
        'figure_affinity': a.get('figure_affinity', []),
        'season_affinity': a.get('season_affinity', []),
        'word_count_de': a['word_count_de'],
        'word_count_en': a['word_count_en'],
        'quality_rating': a['quality_rating'],
        'cooldown_days': a.get('cooldown_days', 30),
    }).execute()
```

Acceptance:
- `SELECT count(*) FROM aphorisms` ergibt ≥ 15.
- Kein `status` außer `approved`.

---

### TASK-T3 — Edge Function `daily-pulse` (GET)

**Neue Datei:** `supabase/functions/daily-pulse/index.ts`

**Vertrag** (aus `packages/api/openapi.yaml`):

```
GET /v1/users/:userId/daily-pulse?date=YYYY-MM-DD&locale=de
```

**Implementierungsschritte:**
1. User-Astroprofil aus `user_astro_profiles` laden (oder aus `profiles`-Tabelle falls noch nicht migriert).
2. Kosmisches Wetter aus `cosmic_weather_snapshots` für das Datum laden (oder letzten Snapshot als Stale).
3. `harmony_index` berechnen (Wu-Xing-Dot-Product, Formel aus `packages/voice/src/tagespuls.ts` → `dayModeFromHarmony`).
4. Aphorismus-Pool aus `aphorisms`-Tabelle laden (nur `status = 'approved'`, nach `mode_tags` filtern).
5. `selectAphorism()` deterministisch anwenden: Top-5 by `quality_rating`, dann `simpleHash(userId + date + mode) % 5`.
6. LLM-Aufruf für Slot 2 + Slot 3 (Gemini/FuFirE oder direkt via Supabase AI).
7. `daily_pulses`-Row upserten.
8. Response zurückgeben.

**Response-Schema:**

```typescript
{
  id: string;
  date: string;
  mode: 'pulse' | 'trace' | 'spannung';
  intensity: number;
  aphorism: { id: string; text_de: string; text_en: string; author: string };
  slot_1: string;  // === aphorism.text (je nach locale)
  slot_2: string;  // LLM-generiert: Brücke ins Heute
  slot_3: string;  // LLM-generiert: Handlungsimpuls
  council: CouncilFigure[];  // Rat der sechs für Wahl-Moment
  weather_stale: boolean;
}
```

**Fehlerbehandlung:**
- Kein approved Aphorismus → `fallback_text` aus `buildFallbackDaily()` (bereits in `useFirstRunDaily.ts` implementiert), Response mit `fallback: true`.
- LLM-Fehler → nach max. 2 Versuchen Fallback-Slot-2/3.
- User-Profil fehlt → 422 mit klarer Fehlermeldung.

Acceptance:
- `GET /v1/users/:userId/daily-pulse?date=2026-05-07&locale=de` gibt valide Response.
- Determinismus: gleiche Parameter → gleicher Aphorismus.
- Typecheck ohne Fehler.

---

### TASK-T4 — Edge Function `daily-interpretation` (POST)

**Neue Datei:** `supabase/functions/daily-interpretation/index.ts`

**Vertrag:**

```
POST /v1/users/:userId/daily-interpretation
Body: { daily_pulse_id, selected_archetype_key, locale }
```

**Implementierungsschritte:**
1. `daily_pulses`-Row laden für `daily_pulse_id`.
2. Validierung: `selected_archetype_key` in `[sonne, mond, aszendent, day_master, jahrestier, wuxing_dom]`.
3. LLM-Prompt: Aphorismus + Mode + Intensität + gewählte Figur + Rest-Rat (nur pulse/spannung).
4. Response in `daily_interpretations` upserten.
5. Interpretation zurückgeben.

Acceptance:
- POST mit valider `selected_archetype_key` → LLM-Text zurück.
- Bereits gesehene Figur an demselben Tag → bestehende Interpretation zurückgeben (kein erneuter LLM-Call).
- `typecheck` läuft durch.

---

### TASK-T5 — Client Hook `useDailyPulse`

**Neue Datei:** `src/hooks/useDailyPulse.ts`

**Interface:**

```typescript
interface UseDailyPulseResult {
  pulse: DailyPulse | null;
  council: CouncilFigure[];
  interpretation: DailyInterpretation | null;
  loading: boolean;
  loadingInterpretation: boolean;
  isFallback: boolean;
  selectCouncilFigure: (key: CouncilKey) => Promise<void>;
}

export function useDailyPulse(
  userId: string,
  birthData: BirthInput | null,
  locale: string,
): UseDailyPulseResult
```

**Verhalten:**
- Fetcht `GET /v1/users/:userId/daily-pulse` wenn `userId && birthData` vorhanden.
- Cacht in `localStorage` mit `date`-Key (analog zu `daily_horoscope_cache`).
- `selectCouncilFigure(key)` → `POST /v1/users/:userId/daily-interpretation`.
- `birthData === null` → sofort `pulse: null, isFallback: false` (kein stiller Exit — expliziter Zustand).

**Wichtig:** `useDailyPulse` ersetzt NICHT `useFirstRunDaily` in diesem Sprint. Beide Hooks existieren parallel. `useFirstRunDaily` bleibt für den bestehenden `DailyChartHero`. `useDailyPulse` versorgt die neue `TagespulsCard`.

Acceptance:
- `birthData === null` → `pulse: null` ohne unbehandelten Hook-Exit.
- API-Fehler → Fallback-Pulse, `isFallback: true`.
- Cache-Hit → kein API-Call.
- `typecheck` läuft durch.

---

### TASK-T6 — `TagespulsCard` Komponente

**Neue Datei:** `src/components/dashboard/TagespulsCard.tsx`

**Layout (zwei Phasen):**

**Phase 1 — Tagespuls (bei Mount):**

```
┌─────────────────────────────────────────┐
│  [MODE-Chip: PULS / SPUR / SPANNUNG]    │
│                                          │
│  "[Aphorismus slot_1]"                  │
│  — Autor, Werk                          │
│                                          │
│  [slot_2 — Brücke ins Heute]            │
│                                          │
│  [slot_3 — Handlungsimpuls]             │
│                                          │
│  ───── Wer begleitet dich heute? ─────  │
│  [☉] [☽] [↑] [日] [年] [五]           │
│  (Rat der sechs — sechs Tap-Buttons)    │
└─────────────────────────────────────────┘
```

**Phase 2 — Tagesdeutung (nach Figur-Wahl):**

```
┌─────────────────────────────────────────┐
│  [Figur-Icon + Name]                    │
│                                          │
│  [interpretation.text]                  │
│                                          │
│  [Zurück / andere Figur wählen →]       │
└─────────────────────────────────────────┘
```

**Props:**

```typescript
interface TagespulsCardProps {
  pulse: DailyPulse | null;
  council: CouncilFigure[];
  interpretation: DailyInterpretation | null;
  loading: boolean;
  isFallback: boolean;
  onSelectFigure: (key: CouncilKey) => void;
  locale: 'de' | 'en';
}
```

**Loading-State:** Skeleton-Placeholder (keine leere Karte).

**Empty-State (kein Profil):** Gleicher Profil-CTA wie in `DailyChartHero`.

**Fallback-State:** Dezentes Label (analog TASK-D2) wenn `isFallback`.

Acceptance:
- Phase 1 rendert bei vollständigem Profil.
- Figur-Tap → Phase 2 erscheint.
- Kein Profil → Profil-CTA.
- Fallback → dezentes Label.
- `typecheck` läuft durch.

---

### TASK-T7 — Dashboard-Verdrahtung

**Datei:** `src/components/Dashboard.tsx`

**Aufgabe:**
1. `useDailyPulse` importieren und aufrufen.
2. `<TagespulsCard>` in die Dashboard-Hierarchie einbauen:

```
1. TagespulsCard         ← NEU (Aphorismus + Wahl-Moment)
2. DailyChartHero        ← bleibt (Harmonie-Chart + alter Impuls-Flow)
3. Signatur-Anker
4. Active Influences...
```

**Hinweis zur Reihenfolge:** `TagespulsCard` kommt VOR `DailyChartHero`, weil sie das tägliche Framing liefert (Aphorismus + Wahl). `DailyChartHero` bleibt als Vertiefungs-Layer.

**Feature-Flag-Guard:**

```typescript
// Neues Flag in feature-flags oder direkt in Dashboard:
const tagespulsNeuEnabled = featureFlags?.tagespuls_neu_v1 ?? false;

{tagespulsNeuEnabled && (
  <TagespulsCard ... />
)}
```

Acceptance:
- `tagespuls_neu_v1: true` → `TagespulsCard` sichtbar im Dashboard.
- `tagespuls_neu_v1: false` → bisheriges Dashboard unverändert.
- `typecheck` läuft durch.

---

## Phase 2 — 3D-Signaturkugel sichtbar machen

### TASK-2.1 — 3D-Kugel-Codepfad verifizieren

**Verifizierter Codepfad (2026-05-07):**

```
src/components/signatur-3d/SignatureSphere3D.tsx   ← Chladni-Kugel
src/components/signatur-renderer/SignaturRenderer.tsx  ← Wrapper, statisch importiert
src/pages/SignaturPage.tsx                         ← Standalone-Seite
src/lib/signatur-3d/*                              ← Physik + Material
src/lib/cymatics/bazi-to-chladni.ts               ← BaZi→ChladniParams
```

**Was bereits bekannt ist (aus Code-Review):**
- `SignaturRenderer` importiert `SignatureSphere3D` statisch (kein Suspense-Overhead).
- Zeigt `CymaticsFallback` nur wenn `chladniParams === undefined`.
- `/signatur`-Seite existiert.
- **Problem**: Dashboard verlinkt `/signatur` nicht sichtbar → User findet die Kugel nicht.

**Aufgabe:**
1. Prüfen ob `chladniParams` für vollständige Profile tatsächlich berechnet und übergeben wird (BaZi→ChladniParams-Pipeline).
2. Bekannten Wu-Xing DE/EN-Drift-Bug prüfen (`project_wuxing_german_keys_supabase.md`) — könnte `chladniParams` leer lassen.
3. Props-Bedarf der `SignaturRenderer`-Callsite in `SignaturPage.tsx` dokumentieren.

**Props-Bedarf (verifiziert aus `SignaturRenderer.tsx`):**

```typescript
// Pflicht: userId, labels
// Inhaltlich: chladniParams (ChladniParams), planetWeights (Record<PlanetName, number>)
// Optional: planetariumMode (boolean, default true), quizWeights (deprecated), dayHarmonic (deprecated)
// Wenn chladniParams fehlt → CymaticsFallback statt Kugel
```

Acceptance:
- Grund für Unsichtbarkeit im Dashboard konkret benannt (Link fehlt vs. chladniParams fehlt vs. Runtime-Error).
- Props-Bedarf dokumentiert.
- Wu-Xing DE/EN-Drift-Risiko eingeschätzt.

---

### TASK-2.2 — 3D-Kugel im Dashboard-Flow verankern

**Placement (Ziel-Hierarchie):**

```
1. DailyChartHero          ← bereits P0 position
2. Signatur 3D / CTA       ← hier einhängen
3. Active Influences
4. Daily Impulse / Modal
5. Agents / Premium
```

**Implementierungsoptionen (in Reihenfolge):**

**Option B zuerst (schnell, sicher):**

Preview Card im Dashboard mit Link zu `/signatur`:

```tsx
<SectionErrorBoundary name="SignaturAnchor">
  <SignaturAnchorCard
    onNavigate={() => navigate('/signatur')}
    dominantElement={apiData?.wuxing?.dominant_element}
    birthSign={birthSign}
  />
</SectionErrorBoundary>
```

`SignaturAnchorCard` ist eine neue Komponente:
- Zeigt statischen Platzhalter (NatalSignaturStatic oder ähnlich)
- CTA „Deine Signatur ansehen →"
- Kein WebGL im Dashboard-Kontext (Performance-Guard)

**Option A danach (wenn B stabil):**

Eingebetteter `SignaturRenderer` im Dashboard — nur wenn `chladniParams` verfügbar und WebGL-Fehler durch Error Boundary abgesichert.

Acceptance:
- Vollständiges Profil → 3D-Kugel erreichbar (direkt oder via CTA) im ersten Viewport.
- Unvollständiges Profil → erklärter Empty State.
- WebGL-Fehler → Error Boundary mit explizitem Fallback.
- Kein direkter SignaturRenderer im Dashboard ohne Performance-Prüfung.

---

## Phase 3 — Dashboard-Informationshierarchie

### TASK-3.1 — Neue Sektion-Reihenfolge

**Ziel-Hierarchie im Dashboard:**

```
1. DailyChartHero          — was ist heute los
2. Signatur-Anker           — wer bin ich (persistent)
3. Active Influences        — warum heute anders
4. Daily Impulse / Modal   — was kann ich jetzt tun
5. Agents / Premium        — vertiefen
6. Blueprint / Archive     — nicht als Flow-Bremse oben
```

**Erster Viewport muss beantworten:**
- Was ist heute los?
- Was hat das mit mir zu tun?
- Was kann ich jetzt tun?

**Regeln:**
- Free User: maximal ein primärer Upgrade-CTA (aus Phase 1 bereits gesichert).
- Premium User: kein Upgrade-CTA-Spam.
- Degraded/Fallback-Zustände: sichtbar markiert (nicht als Live-Wahrheit).

Acceptance:
- Returning User sieht im ersten Viewport: tagesaktuellen Kernwert, Signatur-Zugang, konkrete nächste Handlung.
- Reihenfolge ist umgesetzt.
- Keine neuen TypeScript-Fehler.

---

### TASK-3.2 — Retention-Metriken dokumentieren

**Aufgabe:** Folgende Events als `TODO(analytics):`-Kommentare in den relevanten Komponenten setzen wenn nicht bereits vorhanden:

```
D1_return_rate              → App-Level, nicht in Komponente
D7_return_rate              → App-Level
dashboard_first_interaction → Dashboard.tsx, erste User-Aktion
daily_detail_open_rate      → DayModeModal, bei Mount
signatur_sphere_interaction → SignaturSphere3D oder SignaturAnchorCard, bei Klick
upgrade_cta_click           → UpgradeButton (bereits in TASK-1.4)
checkout_start              → UpgradeButton (bereits in TASK-1.4)
checkout_complete           → Stripe Webhook, nicht Frontend
```

Acceptance:
- Events existieren oder `TODO(analytics):` gesetzt.
- Keine personenbezogenen Rohdaten in Events.

---

## Phase 4 — Daily Chart API bereinigen

### TASK-4.1 — `/api/impact/active` Contract klären

**Datei:** `src/hooks/useActiveImpacts.ts`

**Problem (bekannt):** `useActiveImpacts()` sendet `body: '{}'` an `/api/impact/active`. Unklar ob server-profile-driven oder request-driven.

**Fix:**
1. Prüfen ob `/api/impact/active` in `server.mjs` das Profil selbst aus der Session lädt.
2. Wenn server-driven: leerer Body ist korrekt — Kommentar setzen:
   ```typescript
   // Contract: server-profile-driven. Empty body is correct —
   // server resolves user profile from session/userId.
   ```
3. Wenn request-driven: Birth-Daten aus profileMeta übergeben.

Acceptance:
- Contract dokumentiert.
- Kein leerer Body ohne Begründung.

---

### TASK-4.2 — DailyChartHero strukturell aus `/api/impact/active`

**Datei:** `src/components/dashboard/DailyChartHero.tsx`, `src/hooks/useActiveImpacts.ts`

Bestätigen dass `baseCoherence`, `positiveDailyDelta`, `displayedCoherence` aus `useActiveImpacts()` kommen und nicht aus einer zweiten Quelle. Keine Duplizierung.

---

### TASK-4.3 — Degraded States sichtbar machen

**Regelung:** Wenn ein API-Wert fehlt oder ein Fallback greift, darf er nicht als echte Antwort dargestellt werden.

Bereits teilweise umgesetzt durch TASK-D2 (Fallback-Label). Erweitern auf:
- `useActiveImpacts`: wenn Kohärenz-Daten fehlen → `isUnavailable`-Pfad in DailyChartHero greift korrekt (bereits implementiert, verifizieren).
- `useSpaceWeather`: wenn Kp-Index nicht verfügbar → Driver-Strip zeigt `—` statt `0`.

---

## Phase 5 — GreenOps

### TASK-5.1 — Transit-Polling reduzieren

**Datei:** `src/hooks/useSignaturSignal.ts`

**Problem (bekannt):** Pollt alle 800ms, offline alle 15.000ms.

**Fix:**

```typescript
// Baseline: 15_000ms
// Tab hidden: pausieren oder auf 60_000ms verlängern
// Sofortiger Refresh: nur bei relevantem User-Event (Quiz-Abschluss, Profil-Update)
const POLL_INTERVAL = 15_000;
const HIDDEN_INTERVAL = 60_000;
const interval = document.visibilityState === 'hidden' ? HIDDEN_INTERVAL : POLL_INTERVAL;
```

Visibility-Change-Listener:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Immediate refresh on tab-focus after being hidden
    triggerRefresh();
  }
});
```

Acceptance:
- Kein `>1000 Requests / 15 Minuten` pro User.
- Hidden Tab pollt nicht aggressiv.
- Fehler-Backoff bleibt erhalten.

---

### TASK-5.2 — SpaceWeather-Hook deduplizieren

**Dateien:** `src/components/Dashboard.tsx`, `src/components/dashboard/MagnetsturmKarte.tsx`

**Problem (bekannt):** `MagnetsturmKarte` ruft `useSpaceWeather()` selbst auf, obwohl Dashboard bereits Space Weather lädt → zwei Poller.

**Fix:**

```typescript
// Dashboard.tsx
const spaceWeather = useSpaceWeather();

// An MagnetsturmKarte übergeben statt doppelt holen:
<MagnetsturmKarte spaceWeather={spaceWeather} />
```

`MagnetsturmKarte` wird zur Presentational Component — kein eigener Hook-Aufruf mehr.

Acceptance:
- Ein Space-Weather-Poller pro Dashboard-Mount.
- `MagnetsturmKarte` akzeptiert `spaceWeather` als Prop.
- Loading/Error-State konsistent aus Dashboard-Level.

---

## Acceptance Criteria

### PR 1 — Dashboard Stability (Phase 1 + D)

- [ ] `tsc --noEmit` ohne Fehler
- [ ] `npm run build` ohne Fehler
- [ ] `tourStep === 'done'` → Tour-Overlay nicht sichtbar
- [ ] Free Dashboard: genau ein primärer Upgrade-CTA
- [ ] Agent Cards: kein eigener `/api/checkout`-Call
- [ ] Primärer Upgrade-CTA → genau ein `POST /api/checkout`
- [ ] Stripe-Erfolg redirectet zu `https://checkout.stripe.com/...`
- [ ] Checkout-Fehler zeigen konkreten Text
- [ ] Unvollständiges Profil → Tagesimpuls-Sektion zeigt Profil-CTA (bereits erledigt)
- [ ] API-Ausfall → dezentes Fallback-Label in DailyChartHero
- [ ] Keine astrologischen Formeln geändert

### PR 2 — 3D Signatur + Dashboard-Hierarchie (Phase 2 + 3)

- [ ] `/signatur` vom Dashboard erreichbar (Preview Card oder direkter Link)
- [ ] Vollständiges Profil → 3D-Kugel rendert (nicht CymaticsFallback)
- [ ] Wu-Xing DE/EN-Drift-Risiko eingeschätzt und dokumentiert
- [ ] Dashboard-Informationshierarchie umgesetzt
- [ ] `tsc --noEmit` ohne Fehler

### PR 3 — Tagespuls Neu-Architektur (Phase T)

- [ ] Prerequisite Gate bestanden (aphorisms.json mit ≥ 15 approved)
- [ ] `aphorisms`-Tabelle in Supabase befüllt
- [ ] `daily_pulses`-Tabelle in Supabase angelegt
- [ ] Edge Function `daily-pulse` gibt valide Response
- [ ] `useDailyPulse` Hook mit `birthData === null`-Guard
- [ ] `TagespulsCard` rendert Phase 1 (Aphorismus + Rat der sechs)
- [ ] `TagespulsCard` rendert Phase 2 nach Figur-Wahl
- [ ] Feature-Flag `tagespuls_neu_v1` gatet die neue Karte
- [ ] `tsc --noEmit` ohne Fehler

---

## Hinweise für Claude Code

1. **Lies diese Datei vollständig** bevor du anfängst.
2. **Phase 0 zuerst** — kein Task ohne Baseline-Check.
3. **Dateien vor Bearbeitung lesen** — kein Edit ohne Read.
4. **Nach jedem Edit re-read** und Typecheck.
5. **Bereits erledigte Tasks nicht nochmal anfassen** (Liste oben).
6. **Phasenweise vorgehen** — maximal 5 Dateien pro Phase.
7. **Bei Widersprüchen zwischen Brief und Code**: Code gewinnt, Brief kommentieren.
8. **Wu-Xing DE/EN-Drift-Bug** (bekannt in `bazi-to-chladni.ts`): nicht in diesem Brief, separater Fix-Track.
9. **Phase T nur starten wenn `apps/tagespuls_package/packages/voice/data/aphorisms.json` nicht-leer ist** — TASK-T0 ist das Gate.
10. **`useDailyPulse` und `useFirstRunDaily` koexistieren** in diesem Sprint. Nicht verschmelzen.
11. **Tagespuls-Package-Typen aus `apps/tagespuls_package/packages/voice/src/types.ts`** importieren, nicht neu definieren.
12. **Supabase-MCP** für DB-Operationen bevorzugen (`mcp__a13dd11f-*`). Bei Edge-Functions `deploy_edge_function` verwenden.
