# Paket 5 — Vollständige Quiz-Portierung + Cluster Energy System

> **Repo:** `DYAI2025/Astro-Noctum`
> **Quelle:** `DYAI2025/QuizzMe` (src/components/quizzes/)
> **Voraussetzung:** Bugfix-Auftrag (Ring sichtbar, TOTAL_QUIZZES dynamisch) muss vorher gemergt sein
> **Geschätzter Aufwand:** 2–3 Tage

---

## 1. Was gebaut wird

Alle 15 Quizzes aus QuizzMe nach Astro-Noctum portieren, in 4 Cluster organisieren, und ein visuelles Energy-Charge-Discharge-System bauen das den Ring zum Zentrum einer Engagement-Mechanik macht.

**Kern-Mechanik:** Einzelne Quiz-Ergebnisse werden in Supabase gespeichert, aber ihr Signal fließt erst in den Ring wenn das gesamte Cluster abgeschlossen ist. Bis dahin baut sich sichtbar Energie auf. Der Abschluss des letzten Quiz löst die Entladung aus — der Ring morpht, die Cluster-Energie fließt visuell in den Ring.

---

## 2. Die 4 Cluster

### Cluster 1 — Naturkind (bestehend)

| # | Quiz | moduleId | Marker-Domain | Status |
|---|------|----------|---------------|--------|
| 1 | Aura-Farben | quiz.aura_colors.v1 | marker.energy.* | neu portieren |
| 2 | Krafttier | quiz.krafttier.v1 | marker.social.*, marker.instinct.*, marker.leadership.* | bereits portiert |
| 3 | Blumenwesen | quiz.blumenwesen.v1 | marker.flower.* | neu portieren |
| 4 | Energiestein | quiz.energiestein.v1 | marker.stone.* | neu portieren |

**Cluster-Thema:** Instinkt, Natur, Elemente. Mappt primär auf S0 (Widder/Impuls), S1 (Stier/Sinnlichkeit), S11 (Fische/Intuition).
**Icon:** 🌿 **Farbe:** #2D5A4C

### Cluster 2 — Mentalist (bestehend)

| # | Quiz | moduleId | Marker-Domain | Status |
|---|------|----------|---------------|--------|
| 1 | Liebessprache | quiz.love_languages.v1 | marker.love.* | bereits portiert |
| 2 | Charme | quiz.charme.v1 | marker.eq.*, marker.aura.* | neu portieren |
| 3 | EQ-Signatur | quiz.eq.v1 | marker.eq.*, marker.emotion.* | neu portieren |

**Cluster-Thema:** Emotion, soziale Intelligenz, Beziehungsdynamik. Mappt primär auf S3 (Krebs/Empathie), S6 (Waage/Harmonie), S7 (Skorpion/Tiefe).
**Icon:** 🔮 **Farbe:** #4A0E4E

### Cluster 3 — Stratege (neu)

| # | Quiz | moduleId | Marker-Domain | Status |
|---|------|----------|---------------|--------|
| 1 | Persönlichkeit | quiz.personality.v1 | marker.psyche.* | bereits portiert |
| 2 | Karriere-DNA | quiz.career_dna.v2 | marker.values.*, marker.skills.*, marker.cognition.* | neu portieren |
| 3 | Soziale Rolle | quiz.social_role.v2 | marker.social.*, marker.values.* | neu portieren |
| 4 | Spotlight | quiz.spotlight.v2 | marker.social.*, marker.aura.* | neu portieren |

**Cluster-Thema:** Kognition, Führung, soziale Positionierung. Mappt primär auf S2 (Zwillinge/Kognition), S4 (Löwe/Ausdruck), S5 (Jungfrau/Analyse), S9 (Steinbock/Ambition).
**Icon:** ♟️ **Farbe:** #1A3A5C

### Cluster 4 — Mystiker (neu)

| # | Quiz | moduleId | Marker-Domain | Status |
|---|------|----------|---------------|--------|
| 1 | Destiny | quiz.destiny.v1 | marker.psyche.* | neu portieren |
| 2 | RPG-Identität | quiz.rpg_identity.v1 | (Marker nachrüsten) | neu portieren + Marker |
| 3 | Party-Bedürfnis | quiz.party_need.v1 | marker.lifestyle.*, marker.social.* | neu portieren |
| 4 | Celebrity Soulmate | quiz.celebrity_soulmate.v1 | marker.social.*, marker.creativity.* | neu portieren |

**Cluster-Thema:** Freiheit, Kreativität, Archetypen. Mappt primär auf S4 (Löwe/Kreativität), S8 (Schütze/Freiheit), S10 (Wassermann/Innovation), S11 (Fische/Träume).
**Icon:** 🌀 **Farbe:** #5C1A4A

---

## 3. Signal-Mechanik: Gated Cluster Release

### 3.1 Grundregel

Quiz-Events werden sofort in Supabase gespeichert. Aber `fuseAllEvents` ignoriert Events deren Cluster noch nicht komplett ist. Standalone-Quizzes (keinem Cluster zugeordnet) feuern sofort.

### 3.2 Neue Datenstruktur

Erstelle `src/lib/fusion-ring/clusters.ts`:

```typescript
export interface ClusterDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  quizModuleIds: string[];  // geordnet
}

export const CLUSTER_REGISTRY: ClusterDef[] = [
  {
    id: 'cluster.naturkind.v1',
    name: 'Naturkind',
    icon: '🌿',
    color: '#2D5A4C',
    quizModuleIds: [
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
      'quiz.energiestein.v1',
    ],
  },
  {
    id: 'cluster.mentalist.v1',
    name: 'Mentalist',
    icon: '🔮',
    color: '#4A0E4E',
    quizModuleIds: [
      'quiz.love_languages.v1',
      'quiz.charme.v1',
      'quiz.eq.v1',
    ],
  },
  {
    id: 'cluster.stratege.v1',
    name: 'Stratege',
    icon: '♟️',
    color: '#1A3A5C',
    quizModuleIds: [
      'quiz.personality.v1',
      'quiz.career_dna.v2',
      'quiz.social_role.v2',
      'quiz.spotlight.v2',
    ],
  },
  {
    id: 'cluster.mystiker.v1',
    name: 'Mystiker',
    icon: '🌀',
    color: '#5C1A4A',
    quizModuleIds: [
      'quiz.destiny.v1',
      'quiz.rpg_identity.v1',
      'quiz.party_need.v1',
      'quiz.celebrity_soulmate.v1',
    ],
  },
];

/** Finde das Cluster zu dem ein Quiz gehört. null = standalone. */
export function findClusterForModule(moduleId: string): ClusterDef | null {
  return CLUSTER_REGISTRY.find(c => c.quizModuleIds.includes(moduleId)) ?? null;
}

/** Prüfe ob alle Quizzes eines Clusters abgeschlossen sind. */
export function isClusterComplete(
  cluster: ClusterDef,
  completedModuleIds: Set<string>,
): boolean {
  return cluster.quizModuleIds.every(id => completedModuleIds.has(id));
}

/** Berechne Fortschritt eines Clusters: 0-1 */
export function clusterProgress(
  cluster: ClusterDef,
  completedModuleIds: Set<string>,
): number {
  const done = cluster.quizModuleIds.filter(id => completedModuleIds.has(id)).length;
  return done / cluster.quizModuleIds.length;
}
```

### 3.3 Geänderter Event-Filter in useFusionRing

In `src/hooks/useFusionRing.ts` — der T(s)-Berechnung:

```typescript
import { findClusterForModule, isClusterComplete, CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';

// Nur Events feuern deren Cluster komplett ist ODER die keinem Cluster angehören
const completedModuleIds = new Set(events.map(e => e.source.moduleId));

const activeEvents = events.filter(e => {
  const cluster = findClusterForModule(e.source.moduleId);
  if (!cluster) return true;  // standalone → sofort aktiv
  return isClusterComplete(cluster, completedModuleIds);
});

const T = useMemo(() => fuseAllEvents(activeEvents), [activeEvents]);
```

### 3.4 Resolution-Berechnung

Resolution zählt Cluster als Einheiten, nicht einzelne Quizzes:

```typescript
// Anzahl aktiver Signal-Quellen:
// = Anzahl kompletter Cluster + Anzahl abgeschlossener Standalone-Quizzes
const completedClusters = CLUSTER_REGISTRY.filter(c =>
  isClusterComplete(c, completedModuleIds)
).length;

const standaloneCompleted = events.filter(e =>
  !findClusterForModule(e.source.moduleId)
).length;

const totalUnits = CLUSTER_REGISTRY.length; // 4 Cluster = 4 Einheiten
// (Standalone-Quizzes gibt es aktuell keine — alle 15 sind in Clustern)

const resolution = Math.round((completedClusters / totalUnits) * 100);
```

Bei 4 Clustern: 0% → 25% → 50% → 75% → 100%. Saubere Sprünge.

---

## 4. Visuelles Konzept: Energy Charge & Discharge

### 4.1 Layout

```
         ┌──────────┐
         │ Naturkind│ ←── Cluster-Card oben links
         │ 🌿 3/4   │
         └────┬─────┘
              │ ← Energy-Kanal (Linie mit Glow)
    ┌─────────▼──────────┐
    │                    │
    │    FUSION RING     │ ←── Ring im Zentrum
    │                    │
    └─────────▲──────────┘
              │
         ┌────┴─────┐
         │ Mentalist │ ←── Cluster-Card unten rechts
         │ 🔮 2/3   │
         └──────────┘
```

Auf Desktop: Ring zentriert, 4 Cluster-Cards in den Ecken (2×2 Grid um den Ring). Jede Card hat einen visuellen Kanal zum Ring.

Auf Mobile: Ring oben, 4 Cluster-Cards als horizontaler Scroll darunter. Kanäle zeigen nach oben.

### 4.2 Cluster-Card Zustände

**Leer (0/N):**
Card zeigt Icon + Name + "Starten →". Dezent, einladend. Kein Glow.

**Ladend (1/N bis N-1/N):**
Card zeigt Fortschrittsbalken. Glow in Cluster-Farbe wird mit jedem Quiz stärker. Der Energy-Kanal (Linie zum Ring) pulsiert leicht — wird heller je voller das Cluster. Die Card "vibriert" minimal (CSS animation: subtiles scale-pulse 2s infinite). Spannung aufbauen.

Visuell: Die Cluster-Card hat einen inneren Glow der wächst:
```css
/* Beispiel für 3/4 geladen */
box-shadow:
  inset 0 0 20px rgba(45,90,76, 0.3),   /* Cluster-Farbe */
  0 0 30px rgba(45,90,76, 0.15);
```

Der Kanal zum Ring:
```css
/* Linie vom Cluster zum Ring — SVG oder Canvas */
stroke-dasharray: 8 4;
animation: energy-flow 1.5s linear infinite;
opacity: 0.3 + (progress * 0.5);  /* heller je voller */
```

**Voll (N/N) — Entladung:**
Einmaliger Discharge-Effekt: Partikel/Glow fließt durch den Kanal in den Ring. Ring pulsiert einmal hell in der Cluster-Farbe. Dann: Card zeigt ✓ mit "Abgeschlossen". Kein Pulsieren mehr. Ruhiger Glow bleibt.

**Einzelne Quizzes innerhalb einer Card:**
Jede Cluster-Card ist aufklappbar (Accordion oder Modal). Darin: die 3–4 Quizzes als Liste, mit Status (✓ erledigt / → starten / 🔒 Premium).

### 4.3 Technische Umsetzung

Erstelle `src/components/ClusterEnergySystem.tsx`:

Dieses Komponente ersetzt den bisherigen flachen `QUIZ_CATALOG` Grid. Es enthält:
- Den FusionRing im Zentrum
- 4 ClusterCards drumherum
- SVG-Kanäle zwischen Cards und Ring
- Animations-State für Discharge

Props:
```typescript
interface ClusterEnergySystemProps {
  signal: FusionRingSignal;
  events: ContributionEvent[];
  completedModules: Set<string>;
  onStartQuiz: (quizId: string) => void;
  lang: 'de' | 'en';
}
```

### 4.4 Discharge-Animation

Wenn ein Cluster-completing Quiz Event reinkommt:

1. Card Glow-Flash (300ms)
2. Partikel-Stream durch den Kanal (600ms) — einfache CSS animation auf SVG-Pfad
3. Ring-Pulse in Cluster-Farbe (400ms)
4. Ring morpht zu neuem Signal (800ms, wie bisher)
5. Card settled auf "Abgeschlossen" State

Der gesamte Discharge dauert ~2 Sekunden. Danach ist der Ring aktualisiert.

---

## 5. Premium-Gating pro Cluster

### 5.1 Freemium-Regel

Erstes Quiz jedes Clusters ist **kostenlos**. Quizzes 2–4 brauchen **Premium**.

Das bedeutet: Jeder User kann 4 Quizzes spielen (eines pro Cluster), sieht die Fortschrittsbalken bei 1/4 bzw 1/3, sieht den Kanal schwach pulsieren, und versteht dass da mehr kommt. Aber der Ring zeigt 0% Resolution — weil kein Cluster komplett ist.

Der Premium-Upgrade-Moment ist natürlich: "Du hast 4 von 15 Quizzes gespielt. Schließe ein Cluster ab um deinen Ring freizuschalten."

### 5.2 Implementierung

In den Cluster-Cards:

```typescript
const isFirstInCluster = cluster.quizModuleIds[0] === quiz.moduleId;
const needsPremium = !isFirstInCluster && !isPremium;

// Im UI:
{needsPremium ? (
  <div className="flex items-center gap-2 text-gold/40">
    <Lock className="w-3 h-3" />
    <span>Premium</span>
  </div>
) : (
  <button onClick={() => onStartQuiz(quiz.id)}>Starten →</button>
)}
```

---

## 6. Quiz-Portierung (12 neue Quizzes)

### 6.1 Portierungsregeln (wie Paket 2)

Für jedes Quiz aus QuizzMe:

1. `'use client'` entfernen
2. Next.js Imports entfernen (`useClusterProgress`, `contributeClient`)
3. Interface: `{ onComplete: (event: ContributionEvent) => void; onClose: () => void; }`
4. Result-Screen mit `onComplete(event)` Callback
5. Styling: Morning-Theme kompatibel (helle Cards, gold Akzente)
6. Default Export für Lazy-Loading

### 6.2 Portierungsliste

| # | Quelle (QuizzMe) | Ziel (Astro-Noctum) | Zeilen | Marker vorhanden |
|---|---|---|---|---|
| 1 | AuraColorsQuiz.tsx + aura-colors/data.ts | src/components/quizzes/AuraColorsQuiz.tsx | ~600 | ✓ marker.energy.* |
| 2 | BlumenwesenQuiz.tsx + blumenwesen/data.ts | src/components/quizzes/BlumenwesenQuiz.tsx | ~250 | ✓ marker.flower.* |
| 3 | EnergiesteinQuiz.tsx + energiestein/data.ts | src/components/quizzes/EnergiesteinQuiz.tsx | ~260 | ✓ marker.stone.* |
| 4 | CharmeQuiz.tsx + charme/charme-quiz.json | src/components/quizzes/CharmeQuiz.tsx | ~650 | ✓ (aus JSON) |
| 5 | EQQuiz.tsx + feq/eq-signature-quiz.json | src/components/quizzes/EQQuiz.tsx | ~640 | ✓ (aus JSON) |
| 6 | CareerDNAQuiz.tsx + careerdna/data.ts | src/components/quizzes/CareerDNAQuiz.tsx | ~310 | ✓ marker.values.* |
| 7 | SocialRoleQuiz.tsx + social-role/data.ts | src/components/quizzes/SocialRoleQuiz.tsx | ~300 | ✓ marker.social.* |
| 8 | SpotlightQuiz.tsx + spotlight/data.ts | src/components/quizzes/SpotlightQuiz.tsx | ~290 | ✓ marker.social.* |
| 9 | DestinyQuiz.tsx | src/components/quizzes/DestinyQuiz.tsx | ~500 | ✓ marker.psyche.* |
| 10 | RpgIdentityQuiz.tsx + rpg-identity/data.ts | src/components/quizzes/RpgIdentityQuiz.tsx | ~350 | ⚠ Marker nachrüsten |
| 11 | PartyQuiz.tsx + party/data.ts | src/components/quizzes/PartyQuiz.tsx | ~310 | ✓ marker.lifestyle.* |
| 12 | CelebritySoulmateQuiz.tsx + celebrity-soulmate/data.ts | src/components/quizzes/CelebritySoulmateQuiz.tsx | ~460 | ✓ marker.social.* |

### 6.3 Fehlende Marker für RpgIdentityQuiz

RPG-Identität hat Profile (Paladin, Berserker, Heiler, Nekromant, Stratege, Seher) aber keine Marker-Zuordnung. Ergänzen:

```typescript
const RPG_PROFILE_MARKERS: Record<string, Marker[]> = {
  paladin:   [{ id: 'marker.leadership.guardian', weight: 0.8 }, { id: 'marker.social.protective', weight: 0.7 }],
  berserker: [{ id: 'marker.instinct.primal_force', weight: 0.9 }, { id: 'marker.freedom.independence', weight: 0.6 }],
  heiler:    [{ id: 'marker.emotion.empathy', weight: 0.85 }, { id: 'marker.spiritual.healing', weight: 0.7 }],
  nekromant: [{ id: 'marker.cognition.shadow_work', weight: 0.8 }, { id: 'marker.spiritual.depth', weight: 0.75 }],
  stratege:  [{ id: 'marker.cognition.system_thinking', weight: 0.85 }, { id: 'marker.leadership.planner', weight: 0.7 }],
  seher:     [{ id: 'marker.instinct.gut_feeling', weight: 0.8 }, { id: 'marker.spiritual.vision', weight: 0.75 }],
};
```

### 6.4 Quiz-to-Event Mapper erweitern

In `src/lib/fusion-ring/quiz-to-event.ts` — 12 neue Mapper-Funktionen hinzufügen. Muster identisch zu den bestehenden 3 (loveLangToEvent, krafttierToEvent, personalityToEvent). Jeder Mapper:
1. Nimmt Quiz-Scores/Profile-ID
2. Baut ContributionEvent mit korrekten Markern + Gewichten
3. Setzt `source.moduleId` auf die korrekte Quiz-ID

---

## 7. AFFINITY_MAP Erweiterungen

Neue Marker-Domains die in den bestehenden 10 NICHT enthalten sind:

```typescript
// Neue Domain-Level Einträge in AFFINITY_MAP:
'energy':    [0,  .2, 0,  0,  .2, 0,  0,  .1, .1, 0,  .2, .2],  // Aura
'flower':    [0,  .3, 0,  .2, 0,  0,  .2, 0,  0,  0,  0,  .3],  // Blumenwesen
'stone':     [0,  .4, 0,  0,  0,  0,  0,  .2, 0,  .2, 0,  .2],  // Energiestein
'lifestyle': [0,  .1, .1, 0,  .2, 0,  .1, 0,  .3, 0,  .1, .1],  // Party/Lifestyle
'values':    [0,  0,  0,  .1, .1, .1, .2, 0,  .2, .2, .1, 0 ],  // Karriere/Werte
'psyche':    [.1, 0,  .1, .1, 0,  .1, 0,  .2, .1, 0,  0,  .2],  // Destiny/Personality
'eq':        [0,  0,  0,  .3, .1, 0,  .2, .1, 0,  0,  .2, .1],  // Emotionale Intelligenz
'aura':      [0,  0,  0,  0,  .3, 0,  .2, .1, .1, 0,  .1, .2],  // Ausstrahlung/Charisma
'skills':    [.1, 0,  .2, 0,  .1, .3, 0,  0,  .1, .2, 0,  0 ],  // Fähigkeiten

// Neue Keyword-Level Einträge:
'introversion':     [0,  .2, 0,  .2, 0,  0,  0,  .1, 0,  0,  0,  .5],
'extroversion':     [.1, 0,  .2, 0,  .3, 0,  .2, 0,  .1, 0,  .1, 0 ],
'system_thinking':  [0,  0,  .2, 0,  0,  .5, 0,  0,  .1, .2, 0,  0 ],
'risk_taking':      [.3, 0,  0,  0,  .1, 0,  0,  .1, .3, 0,  .1, .1],
'spontaneity':      [.2, 0,  .1, 0,  .1, 0,  0,  0,  .4, 0,  .1, .1],
'empathy':          [0,  0,  0,  .5, 0,  0,  .2, 0,  0,  0,  .1, .2],
'self_awareness':   [0,  0,  .1, .1, 0,  .3, 0,  .2, 0,  0,  0,  .3],
'warmth':           [0,  .2, 0,  .4, 0,  0,  .2, 0,  0,  0,  0,  .2],
'authority':        [.1, 0,  0,  0,  .3, 0,  0,  .1, 0,  .4, .1, 0 ],
'healing':          [0,  0,  0,  .2, 0,  .2, 0,  0,  0,  0,  0,  .6],
'shadow_work':      [0,  0,  0,  0,  0,  .1, 0,  .6, 0,  0,  0,  .3],
'vision':           [0,  0,  0,  0,  0,  0,  0,  .1, .3, 0,  .1, .5],
'guardian':         [.2, 0,  0,  .3, 0,  0,  0,  0,  0,  .3, .1, .1],
'planner':         [0,  0,  .1, 0,  0,  .3, 0,  0,  0,  .5, .1, 0 ],
'primal_force':    [.6, 0,  0,  0,  0,  0,  0,  .3, 0,  0,  0,  .1],
'depth':           [0,  0,  0,  0,  0,  0,  0,  .5, 0,  0,  0,  .5],
```

Alle Zeilen summieren sich auf ~1.0.

---

## 8. QuizOverlay erweitern

`src/components/QuizOverlay.tsx` — Lazy-Imports für alle 15 Quizzes:

```typescript
const LoveLanguagesQuiz = lazy(() => import('./quizzes/LoveLanguagesQuiz'));
const KrafttierQuiz = lazy(() => import('./quizzes/KrafttierQuiz'));
const PersonalityQuiz = lazy(() => import('./quizzes/PersonalityQuiz'));
const AuraColorsQuiz = lazy(() => import('./quizzes/AuraColorsQuiz'));
const BlumenwesenQuiz = lazy(() => import('./quizzes/BlumenwesenQuiz'));
const EnergiesteinQuiz = lazy(() => import('./quizzes/EnergiesteinQuiz'));
const CharmeQuiz = lazy(() => import('./quizzes/CharmeQuiz'));
const EQQuiz = lazy(() => import('./quizzes/EQQuiz'));
const CareerDNAQuiz = lazy(() => import('./quizzes/CareerDNAQuiz'));
const SocialRoleQuiz = lazy(() => import('./quizzes/SocialRoleQuiz'));
const SpotlightQuiz = lazy(() => import('./quizzes/SpotlightQuiz'));
const DestinyQuiz = lazy(() => import('./quizzes/DestinyQuiz'));
const RpgIdentityQuiz = lazy(() => import('./quizzes/RpgIdentityQuiz'));
const PartyQuiz = lazy(() => import('./quizzes/PartyQuiz'));
const CelebritySoulmateQuiz = lazy(() => import('./quizzes/CelebritySoulmateQuiz'));

const QUIZ_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<QuizProps>>> = {
  love_languages: LoveLanguagesQuiz,
  krafttier: KrafttierQuiz,
  personality: PersonalityQuiz,
  aura_colors: AuraColorsQuiz,
  blumenwesen: BlumenwesenQuiz,
  energiestein: EnergiesteinQuiz,
  charme: CharmeQuiz,
  eq: EQQuiz,
  career_dna: CareerDNAQuiz,
  social_role: SocialRoleQuiz,
  spotlight: SpotlightQuiz,
  destiny: DestinyQuiz,
  rpg_identity: RpgIdentityQuiz,
  party_need: PartyQuiz,
  celebrity_soulmate: CelebritySoulmateQuiz,
};
```

---

## 9. Dashboard-Integration

### 9.1 Alten Quiz-Grid entfernen

Den bisherigen `QUIZ_CATALOG` + flachen Grid (3 Buttons) komplett entfernen. Ersetzen durch:

```tsx
<ClusterEnergySystem
  signal={fusionSignal}
  events={events}
  completedModules={completedModules}
  onStartQuiz={(quizId) => setActiveQuiz(quizId)}
  lang={lang}
  isPremium={isPremium}
/>
```

### 9.2 Position im Dashboard

Ring + Cluster-System kommt direkt nach der Interpretation. Vor dem Levi PremiumGate. Wie im Bugfix-Auftrag bereits spezifiziert.

---

## 10. Dateistruktur (Ergebnis)

```
src/
  lib/fusion-ring/
    clusters.ts              ← NEU: ClusterDef, Registry, Progress-Helpers
    affinity-map.ts          ← ERWEITERT: ~25 neue Zeilen
    quiz-to-event.ts         ← ERWEITERT: 12 neue Mapper

  components/
    ClusterEnergySystem.tsx  ← NEU: Gesamtes visuelles System
    ClusterCard.tsx          ← NEU: Einzelne Cluster-Card mit Energy-State
    EnergyChannel.tsx        ← NEU: SVG-Kanal zwischen Card und Ring
    FusionRing.tsx           ← UNVERÄNDERT (nach Bugfix)
    QuizOverlay.tsx          ← ERWEITERT: 15 Lazy-Imports

    quizzes/
      LoveLanguagesQuiz.tsx  ← existiert
      KrafttierQuiz.tsx      ← existiert
      PersonalityQuiz.tsx    ← existiert
      AuraColorsQuiz.tsx     ← NEU
      BlumenwesenQuiz.tsx    ← NEU
      EnergiesteinQuiz.tsx   ← NEU
      CharmeQuiz.tsx         ← NEU
      EQQuiz.tsx             ← NEU
      CareerDNAQuiz.tsx      ← NEU
      SocialRoleQuiz.tsx     ← NEU
      SpotlightQuiz.tsx      ← NEU
      DestinyQuiz.tsx        ← NEU
      RpgIdentityQuiz.tsx    ← NEU
      PartyQuiz.tsx          ← NEU
      CelebritySoulmateQuiz.tsx ← NEU

  hooks/
    useFusionRing.ts         ← GEÄNDERT: Cluster-gated Event-Filter, neue Resolution
```

---

## 11. Akzeptanzkriterien

1. Alle 15 Quizzes spielbar im QuizOverlay
2. Jedes Quiz produziert ein valides ContributionEvent mit Markern
3. Quiz-Events werden in Supabase gespeichert (contribution_events)
4. Ring zeigt 0% solange kein Cluster komplett
5. Ring springt auf 25% wenn erstes Cluster abgeschlossen wird
6. Cluster-Cards zeigen korrekten Fortschritt (0/4, 1/4, ..., 4/4)
7. Energy-Kanäle pulsieren proportional zum Fortschritt
8. Discharge-Animation beim Cluster-Abschluss sichtbar
9. Erstes Quiz jedes Clusters ohne Premium spielbar
10. Quizzes 2–4 zeigen Lock-Icon ohne Premium
11. Ring morpht korrekt nach Cluster-Abschluss (animated, Sektoren verschieben sich)
12. Mobile: Cluster-Cards horizontal scrollbar, Ring oben
13. Desktop: Ring zentriert, 4 Cards drumherum
14. Alle neuen Keywords in AFFINITY_MAP mit Summe ~1.0
15. `npm run lint` fehlerfrei

## 12. Nicht im Scope

- Kein Cluster-Aggregations-Event (Cluster-Bonus/Achievements kommen später)
- Kein BAFE Endpoint
- Kein LeanDeep
- Keine Änderungen an der Masterformel oder Signal Engine
- Kein neues Supabase Schema (nutzt bestehendes contribution_events)
