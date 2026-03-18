# Dev Brief: Neue Signatur-Engine in Astro-Noctum integrieren

**Repo:** `DYAI2025/Astro-Noctum` (Vite/React, Railway)
**Branch:** Erstelle `feature/signatur-v2-engine`
**Quelle:** `/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/components/`
**Ziel:** `/Astro-Noctum/src/components/fusion-ring-website/`

---

## Kontext

Die aktuelle `FusionRingWebsiteCanvas.tsx` (2115 Zeilen) nutzt ein 12-Sektor Deformations-System mit `soulProfile`-Array. Die neue Version besteht aus zwei Dateien:

- `bazodiac-engine.ts` (891 Zeilen) — Cousto-Frequenzen, Spirograph-Geometrie, Mustersprung, 4-Tier Detail-System, Kaleidoskop
- `fusion-ring-canvas.tsx` (1700 Zeilen) — Neuer Three.js Renderer, der die Engine nutzt

Die neue Engine erzeugt visuell deutlich reichere Signaturen mit planetarischer Frequenz-Mathematik statt einfacher Sektor-Deformation.

**WICHTIG:** Astro-Noctum ist eine Vite/React-App (KEIN Next.js). Alle `'use client'`-Direktiven und Next.js-Importe (`next/navigation`, `next/dynamic`) müssen entfernt/ersetzt werden.

---

## Task 1: Engine-Dateien portieren

**Was:** `bazodiac-engine.ts` und den neuen `fusion-ring-canvas.tsx` ins Astro-Noctum Projekt kopieren.

**Wohin:**
```
src/components/fusion-ring-website/bazodiac-engine.ts    ← NEU
src/components/fusion-ring-website/FusionRingCanvasV2.tsx ← NEU (umbenennen!)
```

**Anpassungen:**
1. Aus `fusion-ring-canvas.tsx` → `FusionRingCanvasV2.tsx`:
   - `'use client'` entfernen (Vite braucht das nicht)
   - Import-Pfade anpassen: `'./bazodiac-engine'` bleibt gleich (selber Ordner)
   - `fusion-ring-audio`, `fusion-ring-input`, `fusion-ring-transit`, `fusion-ring-profile` — diese existieren bereits in Astro-Noctum unter gleichem Pfad → Imports prüfen/bestätigen
   - Prop-Interface `FusionRingCanvasV2Props` exportieren mit:
     ```ts
     interface FusionRingCanvasV2Props {
       natalWeights?: Record<string, number>;  // Planet → Weight 0-1
       quizWeights?: Record<string, number>;    // Quiz-Dim → Weight 0-1
       isMini?: boolean;                        // true = keine UI-Controls
       showUI?: boolean;                        // false = kein Overlay
       className?: string;
     }
     ```

2. `bazodiac-engine.ts` — keine Änderungen nötig (reines TypeScript, keine Framework-Abhängigkeiten)

**Bestehende Dateien NICHT löschen:**
- `FusionRingWebsiteCanvas.tsx` (alte Version) bleibt als Fallback, bis V2 stabil läuft
- `fusion-ring-audio.ts`, `fusion-ring-input.ts`, `fusion-ring-profile.ts`, `fusion-ring-transit.ts` — unverändert lassen

**Testkriterium:** `npm run lint` (tsc --noEmit) durchläuft ohne Fehler für die neuen Dateien.

---

## Task 2: Bridge — Neue Engine an bestehende Datenquellen anschließen

**Problem:** Die neue Engine erwartet `natalWeights: Record<string, number>` (z.B. `{ Sun: 0.93, Mars: 1.0, ... }`). Astro-Noctum liefert stattdessen `soulprint_sectors: number[12]` aus der Bootstrap API.

**Was:** Einen Adapter schreiben der beide Richtungen abdeckt.

**Datei:** `src/components/fusion-ring-website/signatur-bridge.ts` (NEU)

```ts
import { PLANETS, computeWeights, type BazodiacWeights } from './bazodiac-engine';

/**
 * Konvertiert soulprint_sectors (12 Zahlen, aus Bootstrap API)
 * → natalWeights (7 Planeten, für neue Engine)
 *
 * Mapping: Die 12 Sektoren repräsentieren Zodiak-Segmente.
 * Jeder Planet hat eine natürliche Affinität zu bestimmten Segmenten.
 */
const PLANET_SECTOR_MAP: Record<string, number[]> = {
  Sun:     [4],        // Leo
  Moon:    [3],        // Cancer
  Mercury: [2, 5],     // Gemini, Virgo
  Venus:   [1, 6],     // Taurus, Libra
  Mars:    [0, 7],     // Aries, Scorpio
  Jupiter: [8, 11],    // Sagittarius, Pisces
  Saturn:  [9, 10],    // Capricorn, Aquarius
};

export function soulprintToNatalWeights(sectors: number[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const [planet, indices] of Object.entries(PLANET_SECTOR_MAP)) {
    const avg = indices.reduce((sum, i) => sum + (sectors[i] ?? 0.5), 0) / indices.length;
    weights[planet] = avg;
  }
  return weights;
}

/**
 * Konvertiert quiz_sectors (12 Zahlen, aus SignatureDelta API)
 * → quizWeights (Quiz-Dimensionen, für neue Engine)
 */
export function quizSectorsToQuizWeights(sectors: number[]): Record<string, number> {
  // Quiz-Dimensionen sind abgeleitet aus Sektor-Differenzen
  // Die genaue Zuordnung hängt vom Quiz-Keyword ab
  // Vorerst: direkte Normalisierung
  const avg = sectors.reduce((s, v) => s + v, 0) / sectors.length;
  return {
    assertion: sectors[0] ?? avg,
    empathy: sectors[3] ?? avg,
    logic: sectors[5] ?? avg,
    intuition: sectors[8] ?? avg,
    creativity: sectors[4] ?? avg,
    discipline: sectors[9] ?? avg,
  };
}
```

**Testkriterium:** Unit-Test in `src/__tests__/signatur-bridge.test.ts` — soulprintToNatalWeights([0.6, 0.45, ...]) liefert valide Weights für alle 7 Planeten.

---

## Task 3: SignatureReveal aktualisieren

**Datei:** `src/components/onboarding/SignatureReveal.tsx`

**Was:** Die alte `FusionRingWebsiteCanvas` gegen `FusionRingCanvasV2` tauschen.

**Änderungen:**
```diff
- import { FusionRingWebsiteCanvas } from '../fusion-ring-website/FusionRingWebsiteCanvas';
+ import { default as FusionRingCanvasV2 } from '../fusion-ring-website/FusionRingCanvasV2';
+ import { soulprintToNatalWeights } from '../fusion-ring-website/signatur-bridge';

// Im Component:
- const [activeSectors, setActiveSectors] = useState<number[]>(soulprint_sectors);
+ const [natalWeights] = useState(() => soulprintToNatalWeights(soulprint_sectors));
+ const [quizWeights, setQuizWeights] = useState<Record<string, number> | undefined>();

// Im handleQuizAnswer callback:
- setActiveSectors(delta.quiz_sectors);
+ setQuizWeights(quizSectorsToQuizWeights(delta.quiz_sectors));

// Im JSX:
- <FusionRingWebsiteCanvas soulProfile={activeSectors} className="w-full h-full" />
+ <FusionRingCanvasV2
+   natalWeights={natalWeights}
+   quizWeights={quizWeights}
+   showUI={false}
+   className="w-full h-full"
+ />
```

**Alles andere bleibt:** Die API-Calls (signatureDelta), Framer Motion Animationen, Tracking, Error-Handling — nichts davon ändern.

**Testkriterium:** Onboarding durchspielen → Ring zeigt neue Spirograph-Visualisierung → Quiz-Antwort animiert den Ring.

---

## Task 4: Dashboard Mini-Signatur ersetzen

**Datei:** `src/components/Dashboard.tsx`

**Was:** Die kleine 80x80 Signatur-Widget im Dashboard gegen V2 tauschen.

**Änderungen:**
```diff
- import { FusionRingWebsiteCanvas } from "./fusion-ring-website/FusionRingWebsiteCanvas";
+ import { default as FusionRingCanvasV2 } from "./fusion-ring-website/FusionRingCanvasV2";
+ import { soulprintToNatalWeights } from "./fusion-ring-website/signatur-bridge";
```

Im JSX wo aktuell `<FusionRingWebsiteCanvas>` mit `soulProfile` genutzt wird:
```diff
- <FusionRingWebsiteCanvas soulProfile={soulprintSectors} className="w-20 h-20" />
+ <FusionRingCanvasV2
+   natalWeights={soulprintToNatalWeights(soulprintSectors)}
+   isMini={true}
+   showUI={false}
+   className="w-20 h-20"
+ />
```

**Testkriterium:** Dashboard zeigt neue Mini-Signatur statt alter Ring.

---

## Task 5: FuRingPage (Signatur-Vollansicht) aktualisieren

**Datei:** `src/pages/FuRingPage.tsx`

**Was:** Die Vollansicht unter `/signatur` nutzt `FusionRing3D` → `FusionRingWebsiteCanvas`. Auf V2 umstellen.

**Datei:** `src/components/fusion-ring-3d/FusionRing3D.tsx`

**Änderungen:**
```diff
- import { FusionRingWebsiteCanvas } from '../fusion-ring-website/FusionRingWebsiteCanvas';
+ import { default as FusionRingCanvasV2 } from '../fusion-ring-website/FusionRingCanvasV2';
+ import { soulprintToNatalWeights } from '../fusion-ring-website/signatur-bridge';
```

Der Hook `useFusionSignal` liefert `signalData.baseSignals` (12 Sektoren). Diese über `soulprintToNatalWeights()` konvertieren.

**Testkriterium:** `/signatur` Route zeigt neue Visualisierung mit Transit-Effekten.

---

## Task 6: Neue UI-Komponenten portieren (Optional — Phase 2)

Diese Komponenten aus der Quelle sind UI-Entwürfe mit Mock-Daten. Sie können in einer späteren Phase portiert werden, wenn die Engine stabil läuft:

| Quell-Datei | Ziel in Astro-Noctum | Zweck |
|---|---|---|
| `blueprint-card.tsx` | `src/components/dashboard/BlueprintCard.tsx` | Kosmischer Blueprint (ersetzt aktuelle Quotes) |
| `influence-gauges.tsx` | `src/components/dashboard/InfluenceGauges.tsx` | Tageseinflüsse-Balken |
| `levi-orb.tsx` | `src/components/dashboard/LeviOrb.tsx` | CSS Levi-Orb (ersetzt/ergänzt ElevenLabs Widget) |
| `mini-signature.tsx` | Nicht nötig | Astro-Noctum nutzt direkt FusionRingCanvasV2 |
| `birth-input-form.tsx` | Nicht nötig | Astro-Noctum hat bereits besseren BirthForm.tsx |
| `home/page.tsx` | Dashboard.tsx Redesign | 5-Zonen Layout — muss von Next.js auf React Router portiert werden |

**Bei Portierung beachten:**
- Alle `'use client'` Direktiven entfernen
- `useRouter` (Next.js) → `useNavigate` (React Router v6)
- `next/dynamic` → `React.lazy` + `Suspense`
- Hardcoded Mock-Daten → an bestehende Contexts (AppLayoutContext, FusionRingContext) anbinden
- i18n: Texte durch `useLanguage()` Hook leiten

---

## Task 7: Feature Flag

**Datei:** `src/lib/feature-flags.ts`

**Was:** Neuen Flag `signatur_engine_v2` hinzufügen (default: `true`).

```ts
export const FEATURE_FLAGS = {
  signature_onboarding_v1: true,
  daily_modal_v1: true,
  signatur_engine_v2: true,  // ← NEU
} as const;
```

Damit kann man über `localStorage.setItem('ff_signatur_engine_v2', 'false')` auf die alte Engine zurückfallen, falls die neue Probleme macht.

In den Tasks 3–5 dann:
```ts
import { isFeatureEnabled } from '../../lib/feature-flags';

const useV2 = isFeatureEnabled('signatur_engine_v2');
// Bedingt V2 oder V1 rendern
```

---

## Task 8: Visual Polish (aus vorherigem Brief)

Wenn die Engine läuft, diese Feinschliff-Punkte aus Ben's Feedback:

1. **Glow reduzieren:** In `FusionRingCanvasV2.tsx` die Glow-Layer `sizeScale` von 0.12 → 0.07, `alphaScale` von 0.6 → 0.25
2. **Bloom hinzufügen:** `UnrealBloomPass` (three/addons) mit threshold: 0.9, strength: 0.35, radius: 0.4
3. **Farben kräftiger:** Sättigung der Planeten-Farben um 30% erhöhen
4. **Muster-Vielfalt:** `d`-Parameter in Spirograph-Berechnung variieren (aktuell fest, sollte pro Planet unterschiedlich sein)

---

## Reihenfolge

```
Task 1 (Engine kopieren) → Task 2 (Bridge) → Task 7 (Feature Flag)
→ Task 3 (SignatureReveal) → Task 4 (Dashboard) → Task 5 (FuRingPage)
→ Task 8 (Visual Polish)
→ Task 6 (Neue UI-Komponenten, Phase 2)
```

Tasks 1-2-7 sind Voraussetzung. Tasks 3-4-5 können danach parallel.

---

## Dateien NICHT anfassen

- `src/services/experience.ts` — API-Integration funktioniert
- `src/components/BirthForm.tsx` — Astro-Noctum's Version ist vollständiger
- `src/contexts/AuthContext.tsx` — Auth bleibt
- `src/contexts/AppLayoutContext.tsx` — Datenfluss bleibt
- `server.mjs` — Backend-Proxy bleibt
- `fusion-ring-audio.ts`, `fusion-ring-input.ts`, `fusion-ring-profile.ts`, `fusion-ring-transit.ts` — Supporting files, unverändert lassen

## Quell-Dateien (Lesen, nicht importieren)

```
/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/components/bazodiac-engine.ts
/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/components/fusion-ring-canvas.tsx
/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/components/fusion-ring-reveal.tsx
/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/components/blueprint-card.tsx
/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/components/influence-gauges.tsx
/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/components/levi-orb.tsx
/1_-_Fusion_Ring_Design/fusion_ring_website/nextjs_space/app/home/page.tsx
```
