# Dashboard V2 — Approved Wireframe

**Status**: Approved (2026-03-29)
**Implements**: TASK-dashboard-wireframe → TASK-dashboard-layout-redesign
**Design decisions locked**: F1–F4 (see below)

---

## Layout-Übersicht

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  Bazodiac Logo · Navigation                                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐  ┌────────────────────────────┐    │
│  │  BIG FOUR               │  │  MINI-SIGNATUR             │    │
│  │  ─────────────────────  │  │  240 × 240 px              │    │
│  │  ☀️  Sternzeichen (DE)   │  │  SignaturV3Canvas          │    │
│  │  🌙  Mondzeichen (DE)   │  │  Low/Medium Tier           │    │
│  │  ↑   Aszendent (DE)     │  │  ─────────────────         │    │
│  │  🐰  BaZi-Tier (DE)     │  │  [Signatur pausieren]      │    │
│  │                         │  │  (Toggle, localStorage)    │    │
│  └─────────────────────────┘  └────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TAGES-ENERGIE                           [Pulse|Trace] ◉ │   │
│  │  ──────────────────────────────────────────────────────  │   │
│  │  [Element-Icon]  Headline (aus DailyResponse)            │   │
│  │                                                          │   │
│  │  Body-Text (narrativ, webt Day-Pulse/Trace + Solar ein): │   │
│  │  "Heute trägt [Element] die Energie. [Body-Narrative]   │   │
│  │  Die Sonne sendet ruhigen Wind — deine Signatur atmet    │   │
│  │  entspannter als gestern."                               │   │
│  │                                                          │   │
│  │  ─── Einladung / Advice ─────────────────────────────── │   │
│  │  "[Advice-Text]"                               PREMIUM ▲│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  EINFLÜSSE DES TAGES  (InfluenceGauges, 4 Planeten)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────┐  ┌─────────────────────────────┐   │
│  │  LEVI                  │  │  EVE                        │   │
│  │  Voice Agent           │  │  Voice Agent                │   │
│  └────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ✨ Upgrade zu Premium — [CTA]                      ×    │   │
│  │  (nur für Freemium-User, nach Levi/Eve-Interaktion)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  KOSMISCHER BLUEPRINT                        [▼ öffnen]  │   │
│  │  Accordion-Tabs:  Westlich · BaZi · Wu-Xing · Orrery    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  KI-SYNTHESE                              [PremiumGate]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ShareCard · LegalFooter                                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Entscheidungen (F1–F4)

### F1 — Big Four statt Big Three

Die obere linke Karte zeigt **4 Elemente**:

| Icon | Feld | Quelle | Sprache |
|------|------|--------|---------|
| ☀️ | Sternzeichen | `apiData.western.zodiac_sign` | DE (via i18n) |
| 🌙 | Mondzeichen | `apiData.western.moon_sign` | DE |
| ↑ | Aszendent | `apiData.western.ascendant` | DE |
| 🪐 | BaZi-Tier | `apiData.bazi.zodiac_sign` | DE |

Komponentenname: `DashboardBigFour` (neu). Bisher: `DashboardHeroNav` zeigte 3 Kacheln — diese Komponente wird ersetzt, nicht erweitert.

### F2 — MiniSignature im Dashboard

- **Komponente**: vorhandene `MiniSignature.tsx` (240×240, SignaturV3Canvas)
- **Deaktivierung**: Toggle-Button im Canvas (Icon: `PauseFill`), Zustand in `localStorage` unter `bazodiac_mini_signature_paused`
- **Kein Feature-Flag** — direkt eingebaut; Toggle ist User-Kontrolle, kein Dev-Flag
- **Render-Bedingung**: `soulprintSectors` vorhanden (sonst Skeleton); pausiert = statisches Standbild letzter Frame

### F3 — Tages-Impuls (Hero-Sektion, always visible)

> **Design-Prinzip**: Der Tages-Impuls ist **die erste Frage des Tages** — "Wie ist meine Energie heute? Was erwartet mich?" Er bekommt den prominentesten Platz nach der persönlichen Identität (Big Four + MiniSignature). **Kein Akkordeon, kein Expand, kein 1-Zeiler.** Alles sofort sichtbar.

`CosmicWeatherCard` und `DayModeModal` werden **nicht als separate Komponenten** angezeigt. Stattdessen: neue Hero-Karte `DashboardTagesEnergie`.

**Datenquellen** (alle bereits vorhanden):
```
DailyResponse         → fusion.synthesis, fusion.action, fusion.day_mode, fusion.harmony_index
                        eastern.evidence.day_master (BaZi Element), western/eastern.themes
DayHarmonicState      → mode ('pulse'|'trace'), intensity
SpaceWeatherState     → kpIndex, gScale, xrayClass, xrayFlux, protonFlux,
                        events (cme_arrival|flare|geomagnetic_storm|sep|hss),
                        alerts, solarPressure
```

**Layout der Karte (vollständig, always-on)**:
```
┌──────────────────────────────────────────────────────────────────┐
│  TAGES-IMPULS                          [DAY-PULSE ●]/[DAY-TRACE ◆]│
│  ────────────────────────────────────────────────────────────── │
│                                                                  │
│  [Element-Icon]  Headline (fusion.synthesis, erste Zeile)        │
│                                                                  │
│  Body-Narrativ (immer vollständig sichtbar):                     │
│  "fusion.synthesis — KI-generiertes 2-3 Satz Narrativ"          │
│                                                                  │
│  [Day-Trace only] Reibungs-Kontext:                              │
│  "+ eastern.caution / western.caution als Satz"                  │
│                                                                  │
│  ─── Einladung / fusion.action (hinter PremiumGate) ──────────  │
│  "Was kannst du heute loslassen?"              [Premium ▲]       │
│                                                                  │
│  ════ Kosmoswetter ══════════════════════════════════════════    │
│                                                                  │
│  [🌪 G3 Magnetsturm]  [⚡ M2-Flare]  [☄ CME ~18h]              │
│  [🌬 Hochgeschw.-Strom]  [🪐 Venus trine Jupiter]               │
│                                                                  │
│  Resonanz: ████████░░  deine Signatur verstärkt den              │
│            solaren Impuls heute          78%                     │
└──────────────────────────────────────────────────────────────────┘
```

**Kosmoswetter-Icons — Spezifikation**:

| Event-Typ | Icon (lucide) | Farbe | Trigger |
|---|---|---|---|
| Geomagnetischer Sturm | `Zap` | gold (G3+), amber (G2), weiß/40 (G1) | immer wenn kp ≥ 2 |
| Solarer Flare | `Flame` | rot (X), amber (M), versteckt (≤C) | xrayClass M oder X |
| CME-Ankunft | `Waves` | cyan | event.type === 'cme_arrival' |
| Hochgeschw.-Strom | `Wind` | blau/weiß | event.type === 'hss' |
| Protonenfluss | `Activity` | orange | event.type === 'sep' |
| Planetentransit | `CircleDot` | gold/40 | western/eastern.evidence.natal_focus[0] |

**Resonanz-Indikator**:
```
resonance = clamp(harmonyIndex * 0.65 + solarPressure * 0.35, 0, 1)

> 0.7  → "deine Signatur verstärkt den solaren Impuls heute"
> 0.5  → "deine Signatur schwingt mit dem Kosmos"
> 0.3  → "leichte kosmische Berührung spürbar"
≤ 0.3  → "deine Energie fließt heute unabhängig"
```

**Freemium vs Premium**:
- Freemium: Headline + vollständiger Body (synthesis) + Kosmoswetter + Resonanz-Balken **sichtbar**
- Freemium: `fusion.action` (Einladung/Advice) hinter PremiumGate
- Premium: alles sichtbar, kein Gate

**DayModeModal** bleibt als eigenständiges on-demand Detail-Modal — wird **nicht** automatisch geöffnet. Kleiner `[vertiefen →]`-Link in der Karte öffnet es bei Bedarf.

### F4 — Upgrade Banner

- **Bleibt erhalten** (`UpgradeButton` + `Card variant="gold"`)
- **Neue Position**: nach Levi/Eve, vor Kosmischer Blueprint
- **Rationale**: User sieht erst den Mehrwert (Agenten, Signatur, Tages-Energie), dann das Upgrade-Angebot
- **Freemium vs. Premium**: `{!isPremium && <UpgradeCard />}` — unveränderte Logik, nur Position

---

## Neue Render-Reihenfolge in `Dashboard.tsx`

```tsx
// Section 1: Identity (oben, prominent)
<DashboardBigFour />           // NEU — ersetzt DashboardHeroNav

// Section 2: Signatur (rechts von Big Four — CSS Grid)
<MiniSignature />              // AKTIVIERT (war auskommentiert) + Pause-Toggle

// Section 3: Tageskontext (unified)
<DashboardTagesEnergie />      // NEU — ersetzt CosmicWeatherCard; integriert DayHarmonic

// Section 4: Planetare Einflüsse
<InfluenceGauges />            // UNVERÄNDERT

// Section 5: Voice Agents
<AgentSection agent={Levi} />
<AgentSection agent={Eve} />

// Section 6: Upgrade (freemium only, nach Agenten)
{!isPremium && <UpgradeCard />}  // VERSCHOBEN von Pos. 3 nach Pos. 6

// Section 7: Vertiefung
<DashboardAstroSection />       // UNVERÄNDERT (accordion-style bereits vorhanden)

// Section 8: KI
<DashboardInterpretationSection />  // UNVERÄNDERT

// Section 9: Share + Footer
<ShareCard /> <LegalFooter />
```

---

## Neue Komponenten (zu erstellen)

| Komponente | Datei | Beschreibung |
|---|---|---|
| `DashboardBigFour` | `src/components/dashboard/DashboardBigFour.tsx` | Big Four Kachel (☀️🌙↑🪐) |
| `DashboardTagesEnergie` | `src/components/dashboard/DashboardTagesEnergie.tsx` | Unified Day-Pulse/Trace + Solar narrative |

## Geänderte Komponenten

| Komponente | Änderung |
|---|---|
| `Dashboard.tsx` | Neue Reihenfolge, BigFour statt HeroNav, MiniSignature aktiviert |
| `MiniSignature.tsx` | Pause-Toggle hinzufügen |

## Deprecated (ausgeblendet, nicht gelöscht)

| Komponente | Schicksal |
|---|---|
| `DashboardHeroNav` | Durch `DashboardBigFour` ersetzt — Datei bleibt, nicht mehr gerendert |
| `CosmicWeatherCard` | Durch `DashboardTagesEnergie` ersetzt — Datei bleibt (mobile app nutzt sie ggf.) |
| `DayModeModal` auto-open | Modal bleibt, wird aber nicht mehr automatisch geöffnet; nur via Link in TagesEnergie |

---

## Mobile-Anpassung

Auf `viewport < 768px`:
- Big Four + MiniSignature: **Stacked** (Big Four oben, MiniSignature darunter, 120×120)
- Levi + Eve: **Stacked** (nicht 2-spaltig)
- Upgrade Banner: Volle Breite

---

## Abhängigkeiten / Existierende Daten

Alle benötigten Daten **bereits verfügbar** in Dashboard.tsx:
- `apiData.western.{zodiac_sign, moon_sign, ascendant}` ✅
- `apiData.bazi.zodiac_sign` ✅
- `dailyData` (DailyResponse) ✅
- `dayHarmonic` (DayHarmonicState) ✅
- `spaceWeather` via `useSpaceWeather()` ✅
- `isPremium` via `usePremium()` ✅
- `profileMeta.soulprintSectors` für MiniSignature ✅

Kein neuer API-Aufruf nötig.
