# Bazodiac Mobile — Ist-Architektur & Zielarchitektur

## Ist-Architektur (Stand 2026-03-16)

### Stack
- **Framework:** React Native 0.79 + Expo 53 (Managed Workflow)
- **Sprache:** TypeScript (strict)
- **Navigation:** React Navigation v7 (Bottom Tabs + Native Stack)
- **State:** React Context (AuthContext, AppStateContext) + Hooks
- **Backend:** Supabase (Auth + Postgres) + BAFE API (via bazodiac.space Proxy)
- **Shared Code:** `@bazodiac/shared` Monorepo-Paket (Fusion Ring Signal, Quiz Schema/Scoring)
- **Offline:** AsyncStorage + Contribution Queue mit NetInfo-basiertem Auto-Flush

### Screens (9)
| Screen | Status | Qualität |
|--------|--------|----------|
| AuthScreen | Funktional | Basis — E-Mail/Passwort, kein Social Login |
| OnboardingScreen | Funktional | Vollständig — BAFE-Berechnung + Supabase-Persistierung |
| DashboardScreen | Funktional | **Sehr dünn** — 3 Text-Cards, keine Visualisierung |
| FuRingScreen | Skeleton | Balken-Darstellung + WebView-Fallback |
| WuXingScreen | Skeleton | 5 Balken, keine Beschreibungen |
| QuizScreen | Funktional | **Gerade gebaut** — SectionList mit QuizRenderer |
| VoiceScreen | Skeleton | WebView-Wrapper auf Web-Levi |
| WissenScreen | Skeleton | FlatList mit 2 hardcoded Artikeln |
| ArticleScreen | Funktional | Titel + Body, minimalistisch |

### Architektur-Diagramm (Ist)
```
App.tsx
├── AuthProvider (Supabase)
└── MobileRoot
    ├── AuthScreen (wenn !user)
    ├── OnboardingScreen (wenn !profile)
    └── AppStateProvider
        └── RootNavigator
            ├── Tabs (Bottom)
            │   ├── Dashboard → 3 Text-Cards
            │   ├── FuRing → Balken + WebView
            │   ├── WuXing → 5 Balken
            │   └── Wissen → 2 Artikel
            └── Stack (Modal)
                ├── Article → Detail-Ansicht
                ├── Voice → WebView Levi
                └── Quiz → QuizRenderer (23 Quizzes)
```

### Was gut ist
- Offline-Queue mit Dedup (userId + moduleId)
- Supabase Realtime + Polling für Profil-Sync
- Monorepo-Sharing mit Web-App (Quiz-Definitionen, Signal-Math)
- EAS Build-Config fertig
- Deep Linking konfiguriert

### Was schlecht ist
- **Dashboard ist ein Wireframe** — 3 Text-Cards statt der reichen Web-Erfahrung
- **Keine Push Notifications** — der größte Mobile-Vorteil fehlt
- **Kein Daily Horoscope** — die tägliche Nutzungsschleife fehlt
- **Keine Bilder/Grafiken** — keine Zodiac-Illustrations, keine Signatur-Visualisierung
- **Tab-Icons sind Buchstaben** ("D", "F", "W", "K") statt echte Icons
- **Nie gebaut oder getestet** — kein einziger Simulator-Run

---

## Zielarchitektur: "Daily Cosmic Companion"

### Philosophie
**Die App ist nicht die Web-App auf kleinem Bildschirm.** Sie ist das, was du morgens aufmachst.

Fokus auf:
1. **Signatur** — dein lebendiges kosmisches Profil, immer sichtbar
2. **Daily Horoskop** — jeden Tag ein neuer Impuls basierend auf Transiten
3. **Push Notifications** — tägliche Transit-Alerts ohne App-Öffnung
4. **Quizzes** — Persönlichkeits-Entdeckung die die Signatur verändert

**NICHT im Scope:**
- Wissen/Artikel (Web-Feature, SEO-relevant, nicht für Mobile)
- 3D Orrery/Planetarium (zu GPU-intensiv, Web-only)
- Levi Voice Agent (Phase 2, wenn ElevenLabs RN-SDK stabil)
- WuXing-Detailseite (in Dashboard integriert statt eigener Tab)

### Neue Tab-Struktur (3 Tabs statt 4)

```
Tabs (Bottom, mit echten Icons)
├── 🏠 Home → SignaturScreen (Signatur + Daily + Transits)
├── 🔮 Quizzes → QuizScreen (22 Quizzes, Cluster-Fortschritt)
└── 👤 Profil → ProfileScreen (Settings, Premium, Tier)
```

**Warum 3 Tabs:**
- Apple HIG empfiehlt 3-5 Tabs, weniger ist klarer
- Wissen + WuXing sind kein täglicher Use-Case
- Signatur wird zum Startscreen (statt eines leeren Dashboards)

### Home Screen (SignaturScreen) — Der Kern

```
┌─────────────────────────────────┐
│        Bazodiac                 │
├─────────────────────────────────┤
│                                 │
│    ╭─────────────────────╮      │
│    │                     │      │
│    │   Signatur-Ring     │      │  ← 2D animiert (Skia)
│    │   (12 Sektoren)     │      │     statt 3D WebGL
│    │                     │      │
│    ╰─────────────────────╯      │
│                                 │
│  ☀️ Scorpio  🌙 Leo  ↑ Virgo   │  ← Western Signs
│  🐉 Holz-Drache · Metall 15%   │  ← BaZi + Dominant WuXing
│                                 │
├─────────────────────────────────┤
│  📅 Tagesimpuls                 │
│  "Heute steht Mars im Quadrat   │  ← Daily Horoscope
│   zu deinem Natal-Mond. ..."    │     (von Gemini, cached)
│                                 │
├─────────────────────────────────┤
│  🌊 Aktive Transite             │
│  ┌──────┐ ┌──────┐ ┌──────┐    │  ← Transit-Cards
│  │Mars □│ │Venus○│ │Mond △│    │     (aus FuFirE)
│  │Moon  │ │Sun   │ │Asc   │    │
│  └──────┘ └──────┘ └──────┘    │
│                                 │
├─────────────────────────────────┤
│  📊 WuXing Balance              │
│  ████████░░ Holz 32%  ★         │  ← Inline-Balken
│  █████░░░░ Feuer 20%            │     (statt eigener Tab)
│  ████░░░░░ Erde 16%             │
│  ██░░░░░░░ Metall 8%            │
│  ███████░░ Wasser 24%           │
└─────────────────────────────────┘
```

### Stack-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| **Skia statt WebGL/expo-gl** für Signatur | react-native-skia ist performanter und batterieschonender als expo-gl. 2D-Ring mit 12 animierten Sektoren reicht für Mobile. Kein Bloom, kein 3D. |
| **expo-notifications** für Daily Push | Expo hat ein eigenes Push-System. Täglicher Cron auf dem Server sendet personalisierte Transit-Zusammenfassung. |
| **Gemini Flash** für Daily Horoscope | Selbes Modell wie Web. Server generiert morgens um 06:00 für jeden User einen Tagesimpuls basierend auf aktiven Transiten. Cache in Supabase (1 Zeile pro User pro Tag). |
| **3 Tabs statt 4** | Weniger Ablenkung. Home (Signatur + Daily) ist der tägliche Touchpoint. |
| **Kein Wissen-Tab** | Artikel sind SEO, nicht Mobile. Wenn nötig, als Link im Profil-Tab. |
| **Kein Voice-Tab** | WebView-Levi ist kein gutes Mobile-Erlebnis. Kommt in Phase 2 mit nativem SDK. |

### Datenfluss

```
Server (bazodiac.space)
  │
  ├── GET /api/daily-horoscope/:userId  ← NEU: Gemini-generiert, cached
  ├── GET /api/transit-state/:userId    ← Bestehend: FuFirE Transit-Daten
  ├── POST /api/calculate/*             ← Bestehend: BAFE Proxy
  └── POST /api/push/register           ← NEU: Push-Token registrieren
  │
  ▼
Mobile App
  │
  ├── useProfile() → Supabase Realtime + 45s Poll
  ├── useDailyHoroscope() → NEU: Cached daily text
  ├── useTransitState() → NEU: Active transits for cards
  └── Offline Queue → Contribution Events
```

### Implementierungs-Reihenfolge (Minimum → Maximum)

#### Phase 1: Lauffähig machen (1 Woche)
1. `npx expo run:ios` — Build-Fehler fixen
2. Tab-Icons von Buchstaben auf echte Icons (`@expo/vector-icons`)
3. "Fu Ring" Tab → "Signatur" umbenennen
4. Wissen-Tab entfernen, WuXing-Tab entfernen
5. ProfileScreen erstellen (Settings, Tier, Logout)
6. **Ergebnis:** 3-Tab-App die startet und navigiert

#### Phase 2: Home Screen mit Substanz (1-2 Wochen)
1. Signatur 2D-Visualisierung via `@shopify/react-native-skia`
2. Western Signs + BaZi-Zusammenfassung aus Profil
3. WuXing-Balken inline im Home Screen
4. Daily Horoscope Endpunkt + useHook + Card
5. Transit-Cards (aktive Transite als horizontale ScrollView)
6. **Ergebnis:** Home Screen der sich täglich verändert

#### Phase 3: Push Notifications (1 Woche)
1. `expo-notifications` Setup + Permission-Flow
2. Server-Endpunkt `POST /api/push/register` (speichert Token in Supabase)
3. Cron-Job: Morgens um 06:00 → Gemini generiert Tagesimpuls → Push an alle User
4. Transit-Alert Pushes (z.B. "Mars wechselt heute ins Zeichen Widder")
5. **Ergebnis:** User öffnet App wegen Push, sieht neuen Content

#### Phase 4: Polish + TestFlight (1 Woche)
1. Splash Screen + App Icon finalisieren
2. Haptic Feedback auf Interaktionen
3. Skeleton-Loading statt leerer Screens
4. Error Boundaries + Offline-Hinweis
5. TestFlight Build + Beta-Tester
6. App Store Metadata + Screenshots

### Aufwands-Schätzung

| Phase | Aufwand | Ergebnis |
|-------|---------|----------|
| Phase 1 | 3-5 Tage | App startet, 3 Tabs, navigiert |
| Phase 2 | 7-10 Tage | Täglicher Nutzen, Signatur lebt |
| Phase 3 | 5-7 Tage | Push = Retention |
| Phase 4 | 3-5 Tage | App Store ready |
| **Gesamt** | **~4-5 Wochen** | **Shippable MVP** |

### Was danach kommt (Phase 2.0)
- Native ElevenLabs Voice (wenn SDK stable)
- Wissen-Artikel in-app (wenn Content > 10 Artikel)
- Partner-Match Social Features
- Apple Watch Complication (Daily Horoscope)
- Widgets (iOS 16+ WidgetKit via expo-widgets)
