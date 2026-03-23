# Dev Brief: Signatur V2 — Offene Fixes (Stand 2026-03-18)

**Repo:** `DYAI2025/Astro-Noctum`
**Branch:** `feature/onboarding-signatur-daily` (aktuell aktiv)
**Kontext:** Engine V2, Bridge und Feature-Flag sind bereits integriert. Dieser Brief behandelt nur die verbleibenden Probleme.

---

## Was schon funktioniert

- ✅ `bazodiac-engine.ts` + `FusionRingCanvasV2.tsx` + `signatur-bridge.ts` — im Repo
- ✅ Feature Flag `signature_engine_v2: true` — aktiv
- ✅ SignatureReveal nutzt V2 mit Feature-Flag-Gating
- ✅ Dashboard holt `soulprint_sectors` aus Supabase, rechnet `v2NatalWeights`
- ✅ FusionRing3D importiert V2

---

## Fix 1: Debug-Panels verstecken

**Problem:** Auf `/signatur` sind die manuellen Effect-Trigger-Buttons sichtbar (RESONANZSPRUNG, DOMINANZWECHSEL, etc. + INGEST/DEMO TRANSIT Panels).

**Ursache:**
- `FusionRing3D.tsx` Zeile 64: `isInteractive = true` (default)
- V2 bekommt `showUI={isInteractive}` → alle UI-Controls sichtbar
- V1 (Fallback) hat GAR KEIN showUI-Gating → zeigt IMMER alles (Zeilen 1844-2076)

**Fix:**

### V2 Canvas — `FusionRing3D.tsx`:
```diff
- isInteractive = true,
+ isInteractive = false,
```
Oder besser: `isInteractive` nur im DEV-Modus aktivieren:
```diff
- isInteractive = true,
+ isInteractive = !!import.meta.env.DEV,
```

### V1 Canvas — `FusionRingWebsiteCanvas.tsx`:
Eine `showEffectControls` Prop hinzufügen (analog zu V2):
```diff
// Props-Interface:
+ showEffectControls?: boolean;

// Default:
+ showEffectControls = false,

// Im JSX bei Zeile 1844:
- {/* Effect Buttons */}
+ {showEffectControls && (
  ... alle Effect Buttons, INGEST, DEMO TRANSIT, INGEST QUIZ Panels ...
+ )}
```

**Testkriterium:** `/signatur` zeigt NUR den Ring, keine Buttons/Panels. Im DEV-Modus (`npm run dev`) optional sichtbar.

---

## Fix 2: Onboarding reparieren

**Problem:** Das Onboarding funktioniert nicht.

**Diagnose-Schritte** (der Agent muss diese durchgehen):

1. **Feature Flag prüfen:** `signature_onboarding_v1` muss `true` sein
   - Datei: `src/lib/feature-flags.ts`
   - Ist es `true`? → weiter zu 2
   - Ist es `false`? → aktivieren

2. **Bootstrap API prüfen:** `POST /api/experience/bootstrap` muss erreichbar sein
   - Datei: `server.mjs` Zeile ~1290+
   - Wird die Route an FuFirE weitergeleitet?
   - Ist FuFirE erreichbar? (`BAFE_INTERNAL_URL` oder `VITE_BAFE_BASE_URL`)
   - Testen: `curl -X POST http://localhost:3001/api/experience/bootstrap -H "Content-Type: application/json" -d '{"date":"1990-01-15","time":"14:30","tz":"Europe/Berlin","lat":52.52,"lon":13.405}'`

3. **App.tsx Flow prüfen:** `handleOnboardingSubmit` (Zeile 67-98)
   - Ruft `bootstrapExperience()` auf
   - Wenn Bootstrap fehlschlägt: `onboardingPhase` bleibt `'form'` → User sieht nie die Signatur
   - **Schnellfix wenn Bootstrap-API nicht verfügbar:** Phase trotzdem auf `'signature'` setzen mit Fallback-Daten:
   ```ts
   } catch (err) {
     console.error('[onboarding] Bootstrap failed:', err);
     // Fallback: Zeige Signatur mit synthetischen Sektoren
     setBootstrapData({
       profile: {
         sun_sign: 'Unknown', moon_sign: 'Unknown',
         ascendant_sign: 'Unknown', day_master: 'Unknown',
         harmony_index: 0.5,
       },
       soulprint_sectors: [0.6, 0.45, 0.8, 0.35, 0.7, 0.55, 0.9, 0.4, 0.65, 0.5, 0.75, 0.3],
       signature_blueprint: { seed: Date.now() },
     } as BootstrapResponse);
     setOnboardingPhase('signature');
   }
   ```

4. **SignatureReveal prüfen:**
   - Bekommt es `bootstrapData` korrekt?
   - Ruft `signatureDelta()` auf — wenn FuFirE nicht erreichbar, fällt es nach 3s durch (das ist gewollt)
   - Ist der V2 Canvas renderfähig ohne Build-Fehler? → `npm run lint` checken

**Testkriterium:** Neuer User → BirthForm → Signatur-Reveal mit Ring → Quiz-Frage → Dashboard.

---

## Fix 3: Signatur an echte Daten anschließen

**Problem:** Wenn `soulprint_sectors` in der DB null ist (User hat kein Bootstrap durchlaufen), zeigt der Ring nichts.

**Betroffene Stellen:**

### Dashboard.tsx (Zeile ~236):
```ts
{profileMeta.soulprintSectors && (
  <FusionRingCanvasV2 natalWeights={v2NatalWeights} ... />
)}
```
→ Wenn `soulprintSectors` null → kein Ring sichtbar.

**Fix:** Fallback aus astro_profiles-Daten generieren:
```ts
const v2NatalWeights = useMemo(() => {
  if (profileMeta.soulprintSectors) {
    return soulprintToNatalWeights(profileMeta.soulprintSectors);
  }
  // Fallback: Weights aus Western/BaZi-Daten ableiten
  // (vereinfacht — besser als nichts)
  if (apiData) {
    return deriveWeightsFromApiData(apiData);
  }
  return undefined;
}, [profileMeta.soulprintSectors, apiData]);
```

**Neue Funktion in `signatur-bridge.ts`:**
```ts
export function deriveWeightsFromApiData(apiData: ApiData): Record<string, number> {
  // Nutze Western-Daten (sun_sign, moon_sign, ascendant) + BaZi (day_master)
  // um approximate Weights zu generieren
  const weights: Record<string, number> = {
    Sun: 0.7, Moon: 0.5, Mercury: 0.4,
    Venus: 0.4, Mars: 0.5, Jupiter: 0.5, Saturn: 0.4,
  };
  // Sun sign boost
  const sunRuler = ZODIAC_TO_RULER[apiData?.western?.sun_sign];
  if (sunRuler && weights[sunRuler] !== undefined) weights[sunRuler] = 0.9;
  // Moon sign boost
  const moonRuler = ZODIAC_TO_RULER[apiData?.western?.moon_sign];
  if (moonRuler && weights[moonRuler] !== undefined) weights[moonRuler] = 0.8;
  return weights;
}

const ZODIAC_TO_RULER: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury',
  Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter',
  Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};
```

### FusionRing3D.tsx:
Gleiche Logik — wenn kein soulprint vorhanden, aus `signalData.baseSignals` ableiten.

**Testkriterium:** Auch User ohne Bootstrap sehen einen Ring (basierend auf Western/BaZi-Daten).

---

## Fix 4: Quizzes mounten

**Problem:** `QuizOverlay` existiert (`src/components/QuizOverlay.tsx`) aber wird nirgends importiert oder gerendert.

**Was CLAUDE.md dazu sagt:**
> `QuizOverlay` is defined but currently not mounted in any page component. To activate the quiz→ring pipeline, mount it with `useQuizContribution` as the `onComplete` handler.

**Fix:**

### In `src/components/Dashboard.tsx`:
```ts
import { QuizOverlay } from './QuizOverlay';
import { useQuizContribution } from '../hooks/useQuizContribution';

// Im Component:
const [showQuiz, setShowQuiz] = useState(false);
const handleQuizComplete = useQuizContribution();

// Im JSX (nach dem bestehenden Content):
{showQuiz && (
  <QuizOverlay
    onComplete={(event) => {
      handleQuizComplete(event);
      setShowQuiz(false);
    }}
    onClose={() => setShowQuiz(false)}
  />
)}
```

### Quiz-Trigger (im Dashboard):
Einen Button oder Card hinzufügen, der `setShowQuiz(true)` aufruft. Kann in die bestehende UI eingefügt werden (z.B. nach der Interpretation Section).

**Achtung:** `useQuizContribution` braucht `completedModuleIds` hydrated aus `contribution_events` beim Mount. Prüfen ob der Hook das selbst macht oder ob man die IDs manuell laden muss.

**Testkriterium:** User kann Quiz starten → Antworten → Ring reagiert.

---

## Reihenfolge

```
Fix 1 (Debug-Panels weg)     → 15 min, kein Risiko
Fix 2 (Onboarding reparieren) → 30-60 min, Diagnose nötig
Fix 3 (Daten-Fallback)        → 30 min, signatur-bridge erweitern
Fix 4 (Quizzes mounten)       → 45 min, QuizOverlay + useQuizContribution
```

Fix 1 zuerst — das ist sofort sichtbar und schnell. Fix 2 ist der wichtigste (Onboarding = Erstnutzer-Erlebnis). Fix 3 stellt sicher, dass auch Bestandsnutzer den Ring sehen. Fix 4 aktiviert die Quiz-Pipeline.

---

## Dateien die geändert werden

| Datei | Änderung |
|-------|---------|
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | `isInteractive` default auf `false` oder `import.meta.env.DEV` |
| `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` | `showEffectControls` Prop + Gating um Zeilen 1844-2076 |
| `src/components/fusion-ring-website/signatur-bridge.ts` | `deriveWeightsFromApiData()` Fallback-Funktion |
| `src/components/Dashboard.tsx` | Fallback-Weights + QuizOverlay mounten |
| `src/App.tsx` | Bootstrap-Fallback im catch-Block (Fix 2) |
| `src/components/onboarding/SignatureReveal.tsx` | Nur prüfen, nicht ändern (ist schon V2-ready) |

## Dateien NICHT anfassen

- `bazodiac-engine.ts` — Engine ist fertig
- `FusionRingCanvasV2.tsx` — Renderer ist fertig
- `server.mjs` — Backend nur prüfen, nicht ändern (es sei denn Route fehlt)
- `feature-flags.ts` — Flags sind korrekt
