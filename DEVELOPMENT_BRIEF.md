# Development Brief: Dashboard Flow, Daily Pulse, 3D Signatur, Stripe CTA

**Stand:** 2026-05-09  
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
7. **Tagespuls-Neuarchitektur (Aphorismus + Rat-der-sechs-Wahl) — gemerged in PR #331 am 2026-05-09.** Phase T ist nicht mehr Non-Goal. Architektur-Entscheidung Express statt Edge Functions: siehe [`2-design/decisions/DEC-tagespuls-on-express.md`](2-design/decisions/DEC-tagespuls-on-express.md).

## Non-Goals

- Keine Änderungen an astrologischen Formeln, Scoring, Ephemeris, BaZi, Wu-Xing.
- Kein Rebuild der Signatur V3 als neues Feature.
- Kein Austausch von Stripe oder der Payment-Architektur.
- Keine AI-Quota-Migration (außer nachgewiesen als Checkout/Render-Blocker).
- ~~Kein Tagespuls-Neuarchitektur-Build~~ → **Erledigt 2026-05-09**, siehe Ziel 7.
- Kein Aufstellungsbrett (späteres Feature, nicht in Scope).
- Kein Refactor zu separaten `WahlMoment` / `TagesdeutungCard` Komponenten — bewusste Architektur-Entscheidung: kombinierte zwei-Phasen-`TagespulsCard.tsx` ist die Produktions-Form. Re-evaluation nur wenn UX-Daten das fordern.

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
| P2 | TASK-5.1 Transit-Polling reduzieren | GreenOps |
| P2 | TASK-5.2 SpaceWeather deduplizieren | GreenOps |

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

## Phase 2 — 3D-Signaturkugel sichtbar machen

### TASK-2.1 — 3D-Kugel-Codepfad dokumentieren

**Bekannter Codepfad (verifiziert):**
```
src/components/signatur-3d/SignatureSphere3D.tsx
src/components/signatur-renderer/SignaturRenderer.tsx
src/pages/SignaturPage.tsx
src/lib/signatur-3d/*
src/lib/cymatics/bazi-to-chladni.ts
```

**Zu prüfen:**
1. Wird `/signatur` im Dashboard ausreichend sichtbar verlinkt?
2. Ist `chladniParams` für vollständige Profile wirklich vorhanden?
3. Verhindert CSS/Height/Suspense/Error Boundary das Rendering?
4. Gibt es Runtime-Fehler durch Wu-Xing-Material oder Weight-Mapping (bekannter DE/EN-Drift-Bug — siehe `project_wuxing_german_keys_supabase.md`)?

**Props-Bedarf von SignaturSphere3D dokumentieren:**
```typescript
// Pflicht: userId, chladniParams, planetWeights
// Optional: planetariumMode, kpIndex, dominantElement
```

Acceptance:
- Grund für Unsichtbarkeit im Dashboard konkret benannt.
- Props-Bedarf dokumentiert.
- Runtime-Fehler durch Wu-Xing DE/EN-Drift geprüft.

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

## Acceptance Criteria für ersten PR (Minimum Shippable)

- [ ] `tsc --noEmit` ohne Fehler
- [ ] `npm run build` ohne Fehler
- [ ] `tourStep === 'done'` → Tour-Overlay nicht sichtbar
- [ ] Free Dashboard: genau ein primärer Upgrade-CTA
- [ ] Agent Cards: kein eigener `/api/checkout`-Call
- [ ] Primärer Upgrade-CTA → genau ein `POST /api/checkout`
- [ ] Stripe-Erfolg redirectet zu `https://checkout.stripe.com/...`
- [ ] Checkout-Fehler zeigen konkreten Text
- [ ] Unvollständiges Profil → Tagesimpuls-Sektion zeigt Profil-CTA (bereits erledigt)
- [ ] 3D-Signaturkugel-Codepfad dokumentiert
- [ ] Entscheidung getroffen: Option B (Preview Card) oder Option A (eingebettet)
- [ ] Keine astrologischen Formeln geändert

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
