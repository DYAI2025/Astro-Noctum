# Mobile Home Screen Redesign — "Cosmic Dashboard"

## Design Vision

Der Home Screen wird zum **kosmischen Radar** — minimal oben, lebendig in der Mitte, spannend unten. Der User öffnet die App und sieht sofort: was bin ich, was passiert heute, und was kommt in den nächsten Stunden.

**Farbpalette:**
- Background: `#060b12` → `#0a1628` (Nacht-zu-Morgendämmerung Gradient)
- Akzent: `#D4AF37` (rötliches Gelbgold)
- Text: `#f4f7fb` (klares Weiß)
- Dim: `#6b7f99` (gedämpftes Blau-Grau)
- Alert/Warm: `#c44d2a` (Magnetsturm-Rot)
- Success: `#3D8B37` (Element-Grün)

---

## Screen Layout (von oben nach unten)

```
┌─────────────────────────────────┐
│          Status Bar              │
├─────────────────────────────────┤
│                                 │
│    ♐︎        龍        木         │  ← Kosmische Triade
│  Schütze   Drache    Holz       │     (Sun Sign · BaZi Tier · WuXing)
│                                 │
├─────────────────────────────────┤
│  ⚡ KOSMISCHES WETTER            │
│  ██████░░░░ Kp 3.2              │  ← Kp-Index Balken
│  Moderate geomagnetische        │     Farbe: grün < 3, gelb 3-5, rot > 5
│  Aktivität                      │
├─────────────────────────────────┤
│                                 │
│  ☀️ TAGESIMPULS                  │
│                                 │
│  "Mars im Quadrat zu deinem     │  ← Gemini-generiert, täglich frisch
│   Natal-Mond verstärkt heute    │
│   emotionale Reaktionen..."     │
│                                 │
│  Themen: Emotion · Intuition    │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ✦ NÄCHSTES KOSMISCHES EVENT    │
│                                 │
│  ┌─────────────────────────┐    │
│  │   72%                   │    │  ← Event-Wahrscheinlichkeit
│  │   Resonanz-Event        │    │     nächste 6 Stunden
│  │   in den nächsten 6h    │    │
│  └─────────────────────────┘    │
│                                 │
│  ODER (wenn Event < 3h):        │
│                                 │
│  ┌─────────────────────────┐    │
│  │  🔴 02:14:33            │    │  ← Countdown + Beschreibung
│  │  Venus-Transit durch    │    │
│  │  dein 7. Haus           │    │
│  │                         │    │
│  │  "Beziehungsthemen      │    │
│  │   rücken in den         │    │
│  │   Vordergrund..."       │    │
│  │                         │    │
│  │  [🔔 Push 1 Min vorher] │    │  ← Push-Opt-in Button
│  └─────────────────────────┘    │
│                                 │
├─────────────────────────────────┤
│  [Signatur öffnen]              │  ← Gold CTA
│  [Teilen] [Aktualisieren]       │
└─────────────────────────────────┘
│  🏠 Home  ✨ Quizzes  👤 Profil │
└─────────────────────────────────┘
```

---

## Sektion 1: Kosmische Triade (Header)

**Was:** Drei Symbole nebeneinander — die kosmische Identität des Users auf einen Blick.

| Position | Inhalt | Quelle |
|----------|--------|--------|
| Links | Sonnenzeichen als Zodiac-Symbol (♐︎, ♈, etc.) | `profile.sun_sign` |
| Mitte | BaZi Jahrestier als chinesisches Schriftzeichen (龍, 虎, etc.) | `profile.astro_json.bazi.zodiac_sign` → `getBranchByAnimal()` |
| Rechts | Dominantes WuXing-Element als Symbol (木, 火, 土, 金, 水) | `profile.astro_json.wuxing.dominant_element` |

**Styling:**
- Symbole: 36pt, Farbe je Element/Zeichen
- Labels darunter: 10pt, `#6b7f99`, uppercase tracking
- Hintergrund: subtiler radialer Gradient von Mitte nach außen
- Kein Card-Container — direkt auf dem Background

---

## Sektion 2: Kosmisches Wetter

**Was:** Kp-Index als horizontaler Balken mit Farbcodierung.

| Kp-Wert | Farbe | Label |
|---------|-------|-------|
| 0-2 | `#3D8B37` (grün) | Ruhig |
| 3-4 | `#C49A2A` (gelb) | Moderat |
| 5+ | `#c44d2a` (rot) | Sturm |
| 7+ | `#ff2222` (hellrot, pulsierend) | Starker Sturm |

**Datenquelle:** `useSpaceWeather()` → `/api/space-weather`

**Bei Kp ≥ 5:** Karte bekommt einen roten Border-Glow und der Text wird zu einer Warnung:
```
⚠️ MAGNETSTURM-WARNUNG
Kp 6.2 — Starke geomagnetische Aktivität.
Erhöhte Sensibilität möglich.
```

---

## Sektion 3: Tagesimpuls

**Was:** Der tägliche Fusion-Horoscope-Text von Gemini.

**Datenquelle:** `useDailyHoroscope()` → `/api/experience/daily` → `daily.fusion.summary` + `daily.fusion.action`

**Layout:**
- Kicker: "TAGESIMPULS" in Gold
- Summary: 1-2 Sätze, weiß, 16pt
- Action: 1 Satz, was man tun kann, `#6b7f99`
- Themen-Tags: horizontal, kleine Pills mit Themen aus `daily.western.themes`

---

## Sektion 4: Kosmisches Event (NEU — Kernfeature)

### State 1: Wahrscheinlichkeits-Anzeige (Event > 3h entfernt)

**Was:** Ein Prozent-Wert der angibt wie wahrscheinlich ein kosmisches Resonanz-Event in den nächsten 6 Stunden ist.

**Berechnung (Server-seitig):**
```
event_probability = f(
  active_transits,           // aus FuFirE /transit/state
  user_natal_sensitivity,    // welche Transit-Aspekte den User betreffen
  kp_index,                  // geomagnetische Aktivität
  upcoming_exact_aspects,    // Planeten die exakte Aspekte bilden
)
```

**Visuell:**
- Großer Prozent-Wert (48pt, Gold wenn > 50%, Weiß wenn < 50%)
- Kreisförmiger Progress-Ring um die Zahl
- Darunter: "Resonanz-Event in den nächsten 6h"
- Tap → expandiert zu Details (welche Transite, welche Planeten)

### State 2: Countdown (Event < 3h entfernt)

Wenn ein konkretes Event identifiziert wird (exakter Aspekt, Magnetsturm-Peak, etc.):

**Was:** Countdown-Timer + Event-Beschreibung

**Layout:**
- Countdown: `02:14:33` in großer Monospace-Schrift, Gold
- Event-Typ: z.B. "Venus-Transit durch dein 7. Haus"
- Beschreibung: 2-3 Sätze was das bedeutet (Gemini-generiert)
- Push-Button: "🔔 1 Min vorher benachrichtigen" → registriert lokale Push-Notification
- Pulsierender roter Dot wenn Event < 30 Min

### State 3: Event aktiv

Wenn der Countdown bei 0 ist:
- Animation: Kurzer Glow/Pulse
- Text: "JETZT AKTIV" in Gold
- Beschreibung des Events
- Timer zeigt jetzt Dauer des Events

### Datenfluss

```
Server (/api/transit-state/:userId + /api/experience/daily)
  │
  ├── active_transits: TransitEvent[]
  ├── upcoming_events: { time: ISO, type: string, description: string }[]
  └── event_probability_6h: number (0-100)
  │
  ▼
Mobile Hook: useCosmicEvent(profile)
  │
  ├── probability: number
  ├── nextEvent: { countdown: number, type: string, description: string } | null
  ├── isActive: boolean
  └── requestPush: (eventId: string) => void
```

**Neuer Server-Endpunkt nötig:**
```
GET /api/cosmic-events/:userId
→ {
    probability_6h: 72,
    next_event: {
      id: "venus-transit-h7-20260318",
      type: "transit",
      label: "Venus-Transit durch dein 7. Haus",
      description: "Beziehungsthemen rücken in den Vordergrund...",
      starts_at: "2026-03-18T14:23:00Z",
      duration_minutes: 45,
      intensity: 0.8,
    } | null,
    active_event: null | { ... },
  }
```

---

## Implementierungs-Reihenfolge

### Sofort machbar (nur Frontend, bestehende APIs):
1. **Kosmische Triade** — Daten sind im Profil, nur UI-Arbeit
2. **Kosmisches Wetter Redesign** — `useSpaceWeather()` existiert, nur Farblogik + Layout
3. **Tagesimpuls Redesign** — `useDailyHoroscope()` gerade gebaut, nur Layout-Polish
4. **Farbpalette + Gradient Background** — CSS/StyleSheet

### Braucht Backend-Arbeit:
5. **Event-Wahrscheinlichkeit** — neuer Endpunkt `/api/cosmic-events/:userId`
6. **Event-Countdown** — Timer-Logik im Frontend + Event-Daten vom Server
7. **Push 1 Min vorher** — `expo-notifications` lokale Notification schedulen

---

## MFRI Assessment

| Dimension | Score | Reason |
|-----------|-------|--------|
| Platform Clarity | 5 | iOS only, Expo RN |
| Interaction Complexity | 2 | ScrollView, tap, countdown — simple |
| Performance Risk | 2 | Countdown timer needs efficient re-render |
| Offline Dependence | 2 | Cached daily data, countdown works offline once loaded |
| Accessibility Risk | 1 | Standard text + colors |

**MFRI = (5 + 4) - (2 + 2 + 2) = 3** → Moderate, proceed with performance validation on countdown timer.

---

## Nächster Schritt

Frontend-Redesign (Schritte 1-4) kann sofort gebaut werden. Backend für Cosmic Events (Schritte 5-7) braucht einen separaten Plan.
