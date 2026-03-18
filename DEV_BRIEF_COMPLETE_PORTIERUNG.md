# Dev Brief: Komplette Portierung des neuen Onboarding + Signatur + Daily Home

**Repo:** `DYAI2025/Astro-Noctum` (Vite/React, Railway)
**Branch:** neuer Branch `feature/new-onboarding-v2`
**Master-Quelle:** `/1_-_Fusion_Ring_Design (1)/fusion_ring_website/nextjs_space/`

---

## Kontext

Die einzig korrekte Version des neuen Onboardings, der Signatur und des Daily Home liegt im Next.js-Prototyp unter `/1_-_Fusion_Ring_Design/`. Astro-Noctum hat noch das alte Onboarding live. Diese Portierung bringt den kompletten neuen Flow nach Astro-Noctum.

**Source ist Next.js** → **Target ist Vite/React.** Jede Datei muss beim Portieren angepasst werden:
- `'use client'` Direktive entfernen
- `useRouter` (next/navigation) → `useNavigate` (react-router-dom)
- `router.push('/x')` → `navigate('/x')`
- `router.replace('/x')` → `navigate('/x', { replace: true })`
- `next/dynamic` → `React.lazy` + `Suspense`
- `next/font/google` → Fonts sind bereits in Astro-Noctum via CSS/Tailwind konfiguriert (Cormorant Garamond als `font-serif`, Sora als `font-sora`)

---

## Dateien-Inventar: Was portiert werden muss

### Engine + Renderer (Source → Target)

| Source | Target | Aktion |
|--------|--------|--------|
| `app/components/bazodiac-engine.ts` (891 Z.) | `src/components/fusion-ring-website/bazodiac-engine.ts` | **ÜBERSCHREIBEN** — Source ist Master. Astro-Noctum hat eine modifizierte Kopie mit anderen Farben. Source-Version verwenden. |
| `app/components/fusion-ring-canvas.tsx` (1700 Z.) | `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | **ÜBERSCHREIBEN** — Source ist Master. Beim Portieren: `'use client'` weg, `window.innerWidth/Height` → container-basiertes Sizing (s. unten), `className` Prop ergänzen. |

### Neue UI-Komponenten (Source → Target)

| Source | Target | Aktion |
|--------|--------|--------|
| `app/components/fusion-ring-reveal.tsx` | `src/components/onboarding/FusionRingReveal.tsx` | **NEU** — Portieren, Next.js-Imports ersetzen |
| `app/components/blueprint-card.tsx` | `src/components/dashboard/BlueprintCard.tsx` | **NEU** — Portieren |
| `app/components/influence-gauges.tsx` | `src/components/dashboard/InfluenceGauges.tsx` | **NEU** — Portieren |
| `app/components/levi-orb.tsx` | `src/components/dashboard/LeviOrb.tsx` | **NEU** — Portieren |
| `app/components/mini-signature.tsx` | `src/components/dashboard/MiniSignature.tsx` | **NEU** — Portieren. `next/dynamic` → `React.lazy` |
| `app/components/birth-input-form.tsx` | NICHT portieren | Astro-Noctum hat besseren `BirthForm.tsx` mit Location-Suche + Timezone |

### Seiten (Source → Target)

| Source | Target | Aktion |
|--------|--------|--------|
| `app/onboarding/page.tsx` (104 Z.) | `src/pages/OnboardingPage.tsx` | **NEU** — Portieren. Next.js-Router → React Router. Input-Felder an Astro-Noctum BirthForm anbinden. |
| `app/home/page.tsx` (274 Z.) | `src/pages/NewDashboardPage.tsx` | **NEU** — Portieren als neue Seite. Mock-Daten → Astro-Noctum Contexts (AppLayoutContext, FusionRingContext). |
| `app/signature/page.tsx` (61 Z.) | Integration in bestehende `FuRingPage.tsx` | **MERGE** — Die Source zeigt den Ring fullscreen mit sessionStorage-Weights. `FuRingPage.tsx` wurde bereits um ClusterSidebar erweitert. |
| `app/page.tsx` (24 Z.) | Logik in `App.tsx` | **MERGE** — Routing-Logik (kein Profil → Onboarding, Profil → Home) existiert schon in App.tsx. |
| `app/state.ts` (61 Z.) | NICHT portieren als separater Store | Astro-Noctum nutzt React Contexts, kein Zustand. Die Typen (`UserProfile`, `BlueprintData`, `PlanetInfluence`, `QuizCluster`) als Interfaces übernehmen. |

### Support-Dateien (bleiben wie sie sind in Source)

| Source | Aktion |
|--------|--------|
| `app/components/fusion-ring-audio.ts` | Existiert schon in Astro-Noctum — NICHT überschreiben |
| `app/components/fusion-ring-input.ts` | Existiert schon — NICHT überschreiben |
| `app/components/fusion-ring-transit.ts` | Existiert schon — NICHT überschreiben |
| `app/components/fusion-ring-profile.ts` | Existiert schon — NICHT überschreiben |
| `app/components/fusion-ring-scene.tsx` | Nicht nötig — Astro-Noctum hat FusionRing3D |

---

## Task 1: Engine + Renderer überschreiben

**Dateien:**
- `bazodiac-engine.ts` — 1:1 aus Source kopieren, keine Änderungen
- `FusionRingCanvasV2.tsx` — aus Source kopieren, dann anpassen:

**Anpassungen für FusionRingCanvasV2.tsx:**
```diff
- 'use client';
  (Zeile 1 entfernen)

- import React, { useState, useEffect, useRef, useCallback } from 'react';
+ import { useState, useEffect, useRef, useCallback } from 'react';

  // Container-basiertes Sizing statt window:
- const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, ...);
+ const container = canvasRef.current;
+ const width = container?.clientWidth || window.innerWidth;
+ const height = container?.clientHeight || window.innerHeight;
+ const camera = new THREE.PerspectiveCamera(45, width / height, ...);

- renderer.setSize(window.innerWidth, window.innerHeight);
+ renderer.setSize(width, height);

  // Bloom in Resize-Handler ebenfalls container-basiert:
- bloomPass.resolution.set(window.innerWidth, window.innerHeight);
+ bloomPass.resolution.set(width, height);

  // className Prop ans Props-Interface hinzufügen:
+ className?: string;

  // Im return JSX:
- <div ref={canvasRef} style={{ width: '100%', height: '100%' }}>
+ <div ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }}>
```

**Die bestehende `FusionRingWebsiteCanvas.tsx` (V1) NICHT löschen** — sie bleibt als Feature-Flag-Fallback.

**Testkriterium:** `npm run lint` läuft durch. `/signatur` zeigt den Ring mit Source-Farben und Source-Bloom-Settings.

---

## Task 2: Neue UI-Komponenten portieren

Jede Komponente einzeln:

### FusionRingReveal.tsx
Source: `fusion-ring-reveal.tsx`
Target: `src/components/onboarding/FusionRingReveal.tsx`

```diff
- 'use client';
- import FusionRingCanvas from './fusion-ring-canvas';
+ import FusionRingCanvasV2 from '../fusion-ring-website/FusionRingCanvasV2';
```
Sonst 1:1 übernehmen — die Komponente nimmt `natalWeights`, `quizWeights`, `autoReveal` Props.

### BlueprintCard.tsx
Source: `blueprint-card.tsx`
Target: `src/components/dashboard/BlueprintCard.tsx`
- `'use client'` weg, sonst 1:1.

### InfluenceGauges.tsx
Source: `influence-gauges.tsx`
Target: `src/components/dashboard/InfluenceGauges.tsx`
- `'use client'` weg, sonst 1:1.

### LeviOrb.tsx
Source: `levi-orb.tsx`
Target: `src/components/dashboard/LeviOrb.tsx`
- `'use client'` weg, sonst 1:1.

### MiniSignature.tsx
Source: `mini-signature.tsx`
Target: `src/components/dashboard/MiniSignature.tsx`
```diff
- 'use client';
- import dynamic from 'next/dynamic';
- const FusionRingCanvas = dynamic(() => import('./fusion-ring-canvas'), { ssr: false });
+ import { lazy, Suspense } from 'react';
+ const FusionRingCanvasV2 = lazy(() => import('../fusion-ring-website/FusionRingCanvasV2'));
```
Im JSX `<Suspense fallback={<div />}>` um den Canvas wrappen.

---

## Task 3: Onboarding-Seite portieren

Source: `app/onboarding/page.tsx` (104 Z.)
Target: `src/pages/OnboardingPage.tsx` (NEU)

**Wichtig:** Die Source hat einfache `<input>` Felder (date, time, text). Astro-Noctum hat bereits einen vollwertigen `BirthForm.tsx` mit Location-Suche, Timezone-Erkennung, DST-Detection.

**Ansatz:** Das visuelle Layout/Styling aus der Source übernehmen, aber die `BirthForm`-Komponente von Astro-Noctum als Eingabe nutzen:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthForm } from '@/src/components/BirthForm';
import { FusionRingReveal } from '@/src/components/onboarding/FusionRingReveal';
import { soulprintToNatalWeights } from '@/src/components/fusion-ring-website/signatur-bridge';
import { bootstrapExperience } from '@/src/services/experience';
import { isFeatureEnabled } from '@/src/lib/feature-flags';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'reveal'>('form');
  const [natalWeights, setNatalWeights] = useState<Record<string, number> | undefined>();

  const handleFormSubmit = async (formData) => {
    // Visuelles Layout: der Source-Stil (dunkler Hintergrund, goldene Akzente)
    // aber BirthForm liefert die echten Daten (date, tz, lon, lat)

    if (isFeatureEnabled('signature_onboarding_v1')) {
      try {
        const bootstrap = await bootstrapExperience(formData);
        setNatalWeights(soulprintToNatalWeights(bootstrap.soulprint_sectors));
        setStep('reveal');
      } catch {
        // Fallback: Reveal mit Default-Weights
        setNatalWeights({ Sun: 0.7, Moon: 0.5, Mercury: 0.4, Venus: 0.4, Mars: 0.5, Jupiter: 0.5, Saturn: 0.4 });
        setStep('reveal');
      }
    }
  };

  const handleRevealComplete = () => navigate('/', { replace: true });

  return (
    <main className="w-screen h-screen overflow-hidden bg-[#030A18]">
      {step === 'form' && (
        <div className="flex items-center justify-center h-full p-6">
          {/* Styling aus Source: goldene Akzente, Sora/Cormorant Fonts */}
          <div className="max-w-sm w-full space-y-8">
            <h1 className="font-serif text-[30px] text-center text-white/90 tracking-[0.1em]">
              Deine kosmische Signatur existiert schon.
            </h1>
            <p className="font-sora text-[10px] uppercase tracking-[5px] text-amber-400/60 text-center">
              Wir machen sie sichtbar.
            </p>
            <BirthForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      )}
      {step === 'reveal' && (
        <FusionRingReveal
          natalWeights={natalWeights}
          autoReveal={true}
          onComplete={handleRevealComplete}
        />
      )}
    </main>
  );
}
```

### Routing hinzufügen
`src/router.tsx` — neue Route:
```tsx
{ path: '/onboarding', element: <OnboardingPage /> }
```

### App.tsx — Flow anpassen
Der bestehende Onboarding-Flow in `App.tsx` (Phase `form → signature → done`) muss an die neue Route delegieren, statt inline BirthForm + SignatureReveal zu rendern:
```tsx
// Wenn kein Profil: navigate('/onboarding') statt inline BirthForm zeigen
```

---

## Task 4: Daily Home portieren

Source: `app/home/page.tsx` (274 Z.)
Target: Bestehende `src/components/Dashboard.tsx` erweitern ODER neue `src/pages/NewDashboardPage.tsx`

**Die Source hat 5 Zonen:**
1. BlueprintCard (kosmischer Tagesimpuls)
2. MiniSignature + LeviOrb (Side-by-Side)
3. InfluenceGauges (Tageseinflüsse)
4. Quiz-Frage mit 4 Antworten
5. Navigation Footer

**Mapping Mock-Daten → echte Daten:**

| Source (Mock) | Astro-Noctum (Real) |
|---------------|---------------------|
| `BASE_NATAL` (hardcoded weights) | `soulprintToNatalWeights(soulprint_sectors)` aus Supabase |
| `QUIZ_ANSWERS` (4 hardcoded) | QuizOverlay mit echten Quizzes |
| Blueprint-Text (hardcoded deutsch) | `interpretation` aus AppLayoutContext / Gemini |
| Influence-Gauges (4 hardcoded, Mars 82%...) | Aus `apiData.western` + Transit-State ableiten |
| `sessionStorage.bazodiac_weights` | FusionRingContext / useFusionSignal |
| `useRouter` (Next.js) | `useNavigate` (React Router) |
| `useBazodiacStore` (Zustand) | AppLayoutContext + AuthContext + FusionRingContext |

**Empfehlung:** Nicht `Dashboard.tsx` überschreiben (hat viel funktionierenden Code), sondern die neuen Zonen als Komponenten portieren und schrittweise in `Dashboard.tsx` einsetzen:

1. `BlueprintCard` ersetzt die aktuellen Session-Quotes
2. `MiniSignature` + `LeviOrb` ersetzen/ergänzen die kleine Ring-Preview
3. `InfluenceGauges` wird als neue Section eingefügt
4. Quiz wird über `QuizOverlay` + `ClusterSidebar` abgedeckt (schon in FuRingPage geplant)

---

## Task 5: Debug-Panels weg + isInteractive

**Datei:** `src/components/fusion-ring-3d/FusionRing3D.tsx`

```diff
- isInteractive = true,
+ isInteractive = false,
```

**Datei:** `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` (V1 Fallback)

Alle UI-Controls (Effect-Buttons Zeilen 1844-2076) hinter `showEffectControls` Prop:
```diff
+ showEffectControls = false,
...
- {/* Effect Buttons */}
+ {showEffectControls && (
    ... alle Buttons ...
+ )}
```

---

## Task 6: signatur-bridge.ts aktualisieren

Die bestehende `signatur-bridge.ts` in Astro-Noctum bleibt. Ergänze:

```ts
// Fallback wenn kein soulprint vorhanden — Weights aus Western-Daten ableiten
export function deriveWeightsFromApiData(apiData: any): Record<string, number> {
  const base: Record<string, number> = {
    Sun: 0.7, Moon: 0.5, Mercury: 0.4,
    Venus: 0.4, Mars: 0.5, Jupiter: 0.5, Saturn: 0.4,
  };
  const ZODIAC_RULER: Record<string, string> = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury',
    Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
    Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter',
    Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
  };
  const sunRuler = ZODIAC_RULER[apiData?.western?.sun_sign];
  if (sunRuler) base[sunRuler] = Math.min((base[sunRuler] ?? 0.5) + 0.2, 1);
  const moonRuler = ZODIAC_RULER[apiData?.western?.moon_sign];
  if (moonRuler) base[moonRuler] = Math.min((base[moonRuler] ?? 0.5) + 0.15, 1);
  return base;
}
```

Damit sehen auch User ohne Bootstrap einen Ring.

---

## Reihenfolge

```
Task 1  (Engine überschreiben)      → 15 min
Task 5  (Debug-Panels weg)          → 10 min
Task 2  (UI-Komponenten portieren)  → 45 min
Task 6  (signatur-bridge erweitern) → 15 min
Task 3  (Onboarding-Seite)          → 60 min (BirthForm Integration + Routing)
Task 4  (Daily Home)                → 90 min (Daten-Mapping ist der Aufwand)
```

Gesamt: ~4 Stunden für einen IDE-Agent.

---

## Neue Dateien

| Datei | Zeilen (ca.) |
|-------|-------------|
| `src/components/onboarding/FusionRingReveal.tsx` | ~80 |
| `src/components/dashboard/BlueprintCard.tsx` | ~60 |
| `src/components/dashboard/InfluenceGauges.tsx` | ~40 |
| `src/components/dashboard/LeviOrb.tsx` | ~50 |
| `src/components/dashboard/MiniSignature.tsx` | ~30 |
| `src/pages/OnboardingPage.tsx` | ~80 |

## Überschriebene Dateien

| Datei | Was passiert |
|-------|-------------|
| `src/components/fusion-ring-website/bazodiac-engine.ts` | Source-Version überschreibt Astro-Noctum-Version (Originalfarben) |
| `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | Source-Version mit Container-Sizing + className Anpassungen |

## Geänderte Dateien

| Datei | Änderung |
|-------|---------|
| `src/router.tsx` | Route `/onboarding` hinzufügen |
| `src/App.tsx` | Onboarding-Flow auf neue Route umleiten |
| `src/components/Dashboard.tsx` | Neue Zonen-Komponenten einbauen |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | `isInteractive = false` |
| `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` | `showEffectControls` Prop |
| `src/components/fusion-ring-website/signatur-bridge.ts` | `deriveWeightsFromApiData()` hinzufügen |

## NICHT anfassen

- `src/components/BirthForm.tsx` — Astro-Noctum's Version ist besser
- `src/services/experience.ts` — API-Integration funktioniert
- `src/contexts/*` — Contexts bleiben
- `server.mjs` — Backend bleibt
- `src/components/quizzes/*` — Quizzes sind fertig
- `src/lib/fusion-ring/clusters.ts` — Cluster-Definitionen fertig
- `fusion-ring-audio.ts`, `fusion-ring-input.ts`, `fusion-ring-transit.ts`, `fusion-ring-profile.ts` — Support-Dateien nicht überschreiben

---

## Master-Quelle für alle Dateien

```
/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/1_-_Fusion_Ring_Design (1)/fusion_ring_website/nextjs_space/app/
```

Im Zweifel: **Source gewinnt.** Wenn etwas in Astro-Noctum anders ist als in der Source, die Source-Version verwenden (mit den nötigen Next.js → Vite Anpassungen).
