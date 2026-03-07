# QuizzMe - User Journey & Workflows

**Quelle:** Miro Board (Single Source of Truth)
**Letzte Aktualisierung:** 2026-01-05
**Status:** Aktuelle User Journey basierend auf Miro Board Flow

---

## Übersicht

QuizzMe ist eine psychologisch-astrologische Persönlichkeitsplattform, die Quiz-Antworten, westliche Astrologie und chinesische Ba Zi (Vier Säulen) kombiniert, um ein dynamisches Persönlichkeitsprofil zu erstellen.

**Kern-Features:**
- 🔮 Astrologische Berechnung (Western + Ba Zi)
- 🎭 15 Persönlichkeits-Quizzes
- 🎨 Instant Symbol Creator (Unique User Badge)
- 📊 Character Sheet Dashboard
- 🤖 AI Agenten (Chat)
- 💎 Premium Features (Daily Horoscope)

---

## 1. ONBOARDING JOURNEY (Neue User)

### Start: Neuer User kommt zur Platform

**Einstiegspunkt:** Landing Page oder Direct Sign-up

---

### Phase 1: Geburtsdaten-Erfassung
**URL:** `/onboarding/astro`
**Akteur:** Neuer User (noch ohne Astro-Daten)

#### Entscheidungspunkt: "Ensure birthday, place and time information"

**User muss eingeben:**
- ✅ **Geburtsdatum** (Date Picker)
- ✅ **Geburtszeit** (Time Picker)
- ✅ **Geburtsort** (Search + Autocomplete)
  - Automatisch gesetzt: lat/lon + IANA Timezone

**Button:** "Horoskop berechnen"

**Validierung:**
```
if (date && time && place) {
  → Weiter zu Phase 2
} else {
  → Fehlermeldung: Alle Felder erforderlich
}
```

---

### Phase 2: Horoscope Cloud Engine Berechnung
**System-Aktion:** Backend Processing (nicht sichtbar für User)

**Prozess:**
```
Cloud Engine (by ac)
├─ Berechnet Western Zodiac
├─ Berechnet Sun Sign
├─ Berechnet Ba Zi (4 Pillars)
└─ Validiert Daten
```

**Backend-Call:**
```
POST /api/astro/compute
{
  "birth_date": "1980-06-24",
  "birth_time": "14:30",
  "birth_place_lat": 52.52,
  "birth_place_lng": 13.405,
  "iana_timezone": "Europe/Berlin"
}
```

**Ausgabe:** AstroProfileV1 Objekt
```json
{
  "western": {
    "sunSign": "cancer",
    "moonSign": "pisces",
    "ascendant": "scorpio"
  },
  "bazi": {
    "year": { "stem": "Metal", "branch": "Monkey" },
    "month": { ... },
    "day": { ... },
    "hour": { ... }
  },
  "fusion": {
    "element": "Metal-Water",
    "polarity": "Yang-Yin"
  }
}
```

---

### Phase 3: Supabase Speicherung
**System-Aktion:** "Data is saved by byz"

**Datenbank-Operationen:**
```sql
-- Supabase URL saves user ID and zodiac data
INSERT INTO astro_profiles (
  user_id,
  birth_date,
  birth_time_local,
  birth_lat,
  birth_lng,
  iana_time_zone,
  zodiac_data,      -- JSONB
  ba_zi_data,       -- JSONB
  sun_sign,
  moon_sign,
  asc_sign
) VALUES (...);
```

**Parallel:** "Supabase gets user ID and zodiac data and saves userID and user ID"
- Verknüpfung zwischen `auth.users` und `astro_profiles`
- User Profile wird aktualisiert

---

### Phase 4: Instant Symbol Creator
**System-Aktion:** "Instant symbol creator creates unix user badge symbol from embedded data"

**Symbol Generation:**
```
Input: Ba Zi + Western Zodiac Data
  ↓
Fusion Algorithm
  ↓
SVG Symbol + AI Prompt
  ↓
Unique User Badge
```

**Speicherung:**
```sql
INSERT INTO user_symbols (
  user_id,
  symbol_svg,      -- SVG String
  symbol_prompt,   -- Midjourney/NanoBanana Prompt
  colors,          -- JSON
  created_at
) VALUES (...);
```

---

### Phase 5: Redirect zu Dashboard
**Ziel-Screen:** `/astrosheet`

**User sieht:**
```
Dashboard (Astrosheet) erstmals
├─ Erstellungs-Matrix
├─ Mission & Bedeutung
├─ Persönliches Symbol (Badge)
├─ Ba Zi Overview
└─ Sidebar Navigation (verfügbar)
```

**UI-Elemente:**
- Orange Box: Astrosheet Interface
- Symbol: Generiertes User Badge prominent
- Call-to-Action: "Erkunde deine Features"

---

## 2. HAUPTNAVIGATION (Sidebar)

Nach erfolgreichem Onboarding hat jeder User Zugriff auf das Hauptmenü.

### Sidebar-Struktur:
```
┌─────────────────┐
│  🏠 DASHBOARD   │ ← Default Landing
├─────────────────┤
│  👤 PROFIL      │ → Ba Zi Diagram Layer
├─────────────────┤
│  📝 QUIZZES     │ → Quiz Selection Panel
├─────────────────┤
│  🤖 AGENTEN     │ → AI Live Chat (Beta)
├─────────────────┤
│  💎 PREMIUM     │ → Premium Features Upgrade
├─────────────────┤
│  ⚙️ EINSTELLUNGEN│ → User Settings
└─────────────────┘
```

---

## 3. FEATURE FLOWS (Navigation Paths)

### Flow A: User klickt auf "PROFIL"
**Entscheidungspunkt:** "user clicks on sidebar on 'profil'"

**Aktion:** "unique link to bazi diagram layer"

**Ziel-Screen:** `/profile/bazi-diagram`

**Inhalte:**
```
Ba Zi Diagram Detail-Layer
├─ 4 Pillars Visualisierung
│  ├─ Year Pillar
│  ├─ Month Pillar
│  ├─ Day Pillar (Day Master)
│  └─ Hour Pillar
├─ Wu Xing Element Balance
│  └─ Radar Chart (Wood, Fire, Earth, Metal, Water)
├─ Stems & Branches Detail
└─ Interpretation Texts
```

**Use Case:**
- User will tiefer in Ba Zi Astrologie eintauchen
- Detaillierte Chart-Ansicht
- Exportierbar als PDF (Premium)

---

### Flow B: User klickt auf "DAILY" (Horoscope)
**Entscheidungspunkt:** "user clicks on sidebar on 'Daily'"

**Aktion:** "unique link to Daily horoscope (Premium)"

**Ziel-Screen:** `/horoscope/daily`

**Status:** 🔒 **PREMIUM FEATURE**

**Inhalte (für Premium User):**
```
Daily Horoscope
├─ Tagesübersicht
│  ├─ Haupttransit
│  ├─ Mondphase
│  └─ Planetenpositionen
├─ Persönliche Vorhersagen
│  ├─ Liebe & Beziehung
│  ├─ Karriere & Finanzen
│  └─ Gesundheit & Wohlbefinden
└─ Premium-Insights
```

**Für Free User:**
- Teaser-Ansicht
- "Upgrade to Premium" CTA
- Sample Daily Horoscope (eingeschränkt)

---

### Flow C: User klickt auf "QUIZZES"
**Entscheidungspunkt:** "user clicks on sidebar on 'Quizzes'"

**Aktion:** "redirect to quizzes panel, to choose a new quiz"

**Status:** ⚠️ "Premium finished yet" (teilweise in Entwicklung)

**Ziel-Screen:** `/verticals/quiz`

**Inhalte:**
```
Quiz Selection Panel
├─ Verfügbare Quizzes (15)
│  ├─ ✅ Personality Quiz
│  ├─ ✅ Love Languages Quiz
│  ├─ ✅ EQ Quiz
│  ├─ ✅ Aura Colors Quiz
│  ├─ ✅ Charme Quiz
│  ├─ ✅ Celebrity Soulmate Quiz
│  ├─ ✅ Social Role Quiz
│  ├─ ✅ Spotlight Quiz
│  ├─ ✅ Party Quiz
│  ├─ ✅ RPG Identity Quiz
│  ├─ ✅ Energiestein Quiz
│  ├─ ✅ Blumenwesen Quiz
│  ├─ ✅ Krafttier Quiz
│  ├─ ✅ Career DNA Quiz
│  └─ ✅ Destiny Quiz
└─ Quiz Status
   ├─ Not Started (grau)
   ├─ In Progress (blau)
   └─ Completed (✓ grün)
```

**Premium-Status:**
- Einige Quizzes sind Free
- Premium: Erweiterte Auswertungen & Insights

---

### Flow D: User klickt auf "AGENTEN"
**Entscheidungspunkt:** "user clicks on sidebar on 'Agenten'"

**Aktion:** Redirect zu "In-Agent live chat page"

**Ziel-Screen:** `/agenten/chat`

**Status:** ⚠️ **BETA** (Rote Box im Miro Board = Warnung)

**UI-Element:** Live Chat Interface

**Inhalte:**
```
AI Agent Live Chat
├─ Chat Window
│  ├─ Agent Avatar
│  ├─ Message History
│  └─ Input Field
├─ Agent-Typen
│  ├─ Astro Coach
│  ├─ Quiz Guide
│  └─ Personal Advisor
└─ Beta-Warnung
   └─ "Dieses Feature ist in Beta-Phase"
```

**Use Cases:**
- Fragen zu Astro-Daten stellen
- Quiz-Empfehlungen erhalten
- Personalisierte Insights

---

## 4. QUIZ FLOW (Detailliert)

### Schritt 1: Quiz-Auswahl
**Screen:** `/verticals/quiz`

**User-Aktion:**
- Browst verfügbare Quizzes
- Liest Beschreibung
- Klickt "Quiz starten"

---

### Schritt 2: Quiz durchführen
**Screen:** `/verticals/quiz/{quiz-name}`

**Komponente:** `QuizPageShell` + spezifische Quiz-Komponente

**Prozess:**
```
Frage 1 von N
├─ Frage-Text anzeigen
├─ 4 Antwort-Optionen (A, B, C, D)
├─ User wählt Option
│  └─ Interner Score akkumuliert
│     └─ Marker werden gesammelt
└─ "Weiter" → Nächste Frage
```

**Marker System:**
```javascript
{
  "marker.eq.empathy": 0.8,
  "marker.psyche.connection": 0.6,
  "marker.trait.openness": 0.7
}
```

---

### Schritt 3: Quiz abgeschlossen
**Entscheidungspunkt:** "user completes quiz"

**System-Aktion:**
```
Quiz Result berechnen
├─ Dominanter Marker bestimmt Ergebnis-Typ
├─ ContributionEvent wird generiert
└─ POST /api/contribute
```

**User sieht:**
```
Ergebnis-Popup
├─ Dein Ergebnis: [Titel]
├─ Beschreibung (2-3 Sätze)
├─ Visual (Bild/Icon)
└─ 2 Buttons:
   ├─ "Nächstes Quiz" (links)
   └─ "Teilen" (rechts)
```

---

### Schritt 4A: User wählt "Nächstes Quiz"
**Entscheidungspunkt:** "Next Quiz"

**Aktion:** "Back to Profil Page"

**Flow:**
```
Quiz abgeschlossen
    ↓
Contribution Event gespeichert
    ↓
Profil aktualisiert (neue Trait-Werte)
    ↓
Redirect zu /character
    ↓
AfterQuizDeltaBanner erscheint
    ├─ "Top Movers" (1-3 Traits)
    ├─ Auto-Dismiss nach 10s
    └─ Animierte Stat Bars
    ↓
User kann neues Quiz wählen
```

**Character Sheet Update:**
```
CoreStatsCard
├─ Clarity: 68 → 72 (+4) ✨
├─ Courage: 81 (unverändert)
├─ Connection: 59 → 64 (+5) ✨
├─ Order: 73 (unverändert)
└─ Shadow: 45 → 43 (-2)
```

---

### Schritt 4B: User wählt "Teilen"
**Entscheidungspunkt:** "share on Social media"

**Aktion:** "social media banner share on Facebook Instagram etc."

**Flow:**
```
User klickt "Teilen"
    ↓
Share Modal öffnet
    ├─ Platform-Auswahl
    │  ├─ 📘 Facebook
    │  ├─ 📸 Instagram
    │  ├─ 🐦 Twitter/X
    │  ├─ 💬 WhatsApp
    │  └─ 📋 Link kopieren
    ↓
User wählt Platform
    ↓
Social Media Banner generiert
    ├─ Quiz-Ergebnis als Bild
    ├─ User Badge/Symbol
    ├─ Teaser-Text
    └─ QuizzMe Link (Referral)
    ↓
Native Share Dialog öffnet
```

**Banner-Inhalt:**
```
┌─────────────────────────────┐
│   🎭 QuizzMe Ergebnis       │
├─────────────────────────────┤
│                             │
│   [User Badge Symbol]       │
│                             │
│   Du bist ein:              │
│   "Empathischer Kreative"   │
│                             │
│   Finde heraus, was dein    │
│   Profil über dich verrät:  │
│   quizzme.com/ref/abc123    │
│                             │
└─────────────────────────────┘
```

---

## 5. PROFIL & CHARACTER SHEET

### Screen: `/character`
**Zugang:**
- Nach Quiz-Completion
- Via Sidebar "PROFIL"
- Direct Link

**Layout:**
```
┌────────────────────────────────────┐
│  Header: "Dein Character Sheet"   │
│  Subtitle: Dein Avatar ist ein     │
│  Klima, kein Label                 │
├────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐ │
│  │ CoreStats   │  │ Climate     │ │
│  │ Card        │  │ Card        │ │
│  │             │  │             │ │
│  │ 5 Traits    │  │ 5 Achsen    │ │
│  └─────────────┘  └─────────────┘ │
├────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐ │
│  │ Derived     │  │ Archetype   │ │
│  │ Stats       │  │ Story       │ │
│  └─────────────┘  └─────────────┘ │
├────────────────────────────────────┤
│  MetaBadgesRow                     │
│  (Intensity, Tempo, Shadow)        │
├────────────────────────────────────┤
│  AfterQuizDeltaBanner (optional)   │
│  Top Movers: Connection +5, ...    │
└────────────────────────────────────┘
```

**Komponenten:**

#### 1. CoreStatsCard
```
Kernwerte
├─ Clarity:     72/100 ████████░░
├─ Courage:     81/100 █████████░
├─ Connection:  64/100 ███████░░░
├─ Order:       73/100 ████████░░
└─ Shadow:      43/100 █████░░░░░
```

#### 2. ClimateCard
```
Dein Klima (5 Bipolare Achsen)
├─ Licht ←──●────→ Schatten
├─ Warm ←────●──→ Kalt
├─ Tief ←──●────→ Oberfläche
├─ Ich ←────●──→ Wir
└─ Gefühl ←●────→ Verstand
```

#### 3. DerivedStatsCard
```
Abgeleitete Werte
├─ Vitality:  68 (√clarity × connection)
├─ Willpower: 77 (courage × order)
├─ Chaos:     43 (shadow score)
└─ Harmony:   81 (1 - |shadow - connection|)
```

#### 4. ArchetypeStoryCard
```
Archetypen & Story
├─ Dominant: "Der Empathische Kreative"
├─ Sekundär: "Visionär", "Heiler"
└─ Narrative: "Du bewegst dich zwischen
   tiefer Verbindung und freiem Ausdruck..."
```

#### 5. MetaBadgesRow
```
Meta-Eigenschaften
├─ Intensität: ⚡ Spürbar (noticeable)
├─ Tempo: 🌊 Beweglich (dynamic)
└─ Schatten: 🌑 Unbestimmt (confidence < 0.65)
```

---

## 6. ASTRO SHEET (Dashboard)

### Screen: `/astrosheet`
**Primäre Landing Page** nach Onboarding

**Layout:**
```
┌────────────────────────────────────┐
│  Header: "Deine Astro-Matrix"      │
│  [User Badge Symbol] prominent     │
├────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  Erstellungs-Matrix         │   │
│  │  ─────────────────────────  │   │
│  │  Western:                   │   │
│  │  ☉ Sun: Cancer              │   │
│  │  ☽ Moon: Pisces             │   │
│  │  ↑ ASC: Scorpio             │   │
│  │                             │   │
│  │  Eastern (Ba Zi):           │   │
│  │  Year: Metal Monkey (庚申)   │   │
│  │  Month: Water Horse         │   │
│  │  Day: [Day Master]          │   │
│  │  Hour: [Hour Pillar]        │   │
│  └─────────────────────────────┘   │
├────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  Mission & Bedeutung        │   │
│  │  ─────────────────────────  │   │
│  │  [Fusion Element]           │   │
│  │  Metal-Water Duality        │   │
│  │                             │   │
│  │  Dein Pfad: [...]           │   │
│  └─────────────────────────────┘   │
├────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  Wu Xing Balance            │   │
│  │  [Radar Chart]              │   │
│  │  Wood:  35% (Dominance)     │   │
│  │  Fire:  20%                 │   │
│  │  Earth: 15%                 │   │
│  │  Metal: 10% (Deficiency)    │   │
│  │  Water: 20%                 │   │
│  └─────────────────────────────┘   │
└────────────────────────────────────┘
```

---

## 7. SYSTEM-ARCHITEKTUR & DATENFLUSS

### Technischer Stack:

```
Frontend (Next.js)
    ↓ API Calls
Backend Services
├─ Cloud Engine (Horoscope Calculation)
├─ Supabase (Database & Auth)
├─ Symbol Creator (SVG Generation)
└─ Contribution Pipeline (Quiz Processing)
```

### Datenfluss End-to-End:

```
1. USER INPUT
   Onboarding: Birth Data
   Quiz: Answers

2. PROCESSING
   Cloud Engine → Calculate Astro
   Quiz Engine → Calculate Markers

3. STORAGE
   Supabase → Save to DB
   ├─ astro_profiles
   ├─ user_symbols
   └─ profiles (character state)

4. PRESENTATION
   Dashboard → Fetch & Display
   ├─ Astrosheet
   ├─ Character Sheet
   └─ Quiz Results
```

### Datenbank-Schema:

```sql
-- Kern-Tabellen
auth.users              -- Supabase Auth
├─ profiles             -- User Profiles
├─ astro_profiles       -- Astro Data
├─ user_symbols         -- Generated Badges
└─ contribution_events  -- Quiz History

-- Relationships
profiles.user_id → auth.users.id
astro_profiles.user_id → auth.users.id
user_symbols.user_id → auth.users.id
```

---

## 8. FEATURE-STATUS MATRIX

| Feature | Status | Access | Notizen |
|---------|--------|--------|---------|
| **Onboarding** | ✅ Live | Free | Geburtsdaten → Berechnung |
| **Astrosheet Dashboard** | ✅ Live | Free | Erstellungs-Matrix, Mission |
| **Symbol Creator** | ✅ Live | Free | Instant Badge Generation |
| **Character Sheet** | ✅ Live | Free | Full Profile Visualization |
| **15 Quizzes** | ✅ Live | Free | Basic Results |
| **Quiz Social Sharing** | ✅ Live | Free | FB, IG, Twitter, etc. |
| **Ba Zi Diagram** | ✅ Live | Free | Unique Link via Profil |
| **Daily Horoscope** | 🔒 Premium | Paid | Transit Calculations |
| **Quiz Premium Insights** | ⚠️ Partial | Paid | "finished yet" |
| **AI Agenten (Chat)** | ⚠️ Beta | Free? | Live Chat (Red Box) |
| **Premium Tier** | 🔒 Active | Paid | Subscription System |
| **PDF Export** | 🔒 Premium | Paid | Charts & Reports |
| **Settings** | ✅ Live | Free | User Preferences |

**Legende:**
- ✅ Live: Produktiv verfügbar
- 🔒 Premium: Subscription erforderlich
- ⚠️ Beta/Partial: In Entwicklung
- Free: Für alle User
- Paid: Nur Premium-User

---

## 9. USER JOURNEY ZUSAMMENFASSUNG

### Erste Session (Neuer User):
```
Landing Page
    ↓
Onboarding
├─ Geburtsdaten eingeben
├─ Cloud Engine berechnet (30-60s)
├─ Supabase speichert Daten
└─ Symbol wird generiert
    ↓
Dashboard (Astrosheet)
├─ Erstellungs-Matrix sichtbar
├─ Mission & Bedeutung
├─ User Badge prominent
└─ Sidebar Navigation verfügbar
    ↓
Exploration
├─ Profil (Ba Zi Details)
├─ Quizzes (Persönlichkeit)
├─ Agenten (AI Chat)
└─ Premium (Upgrade-Info)
```

### Wiederkehrender User:
```
Login
    ↓
Dashboard (Default)
    ↓
User wählt:
├─ Profil → Ba Zi Diagram
├─ Quiz → Neue Insights
├─ Daily → Horoscope (Premium)
├─ Agenten → Chat Support
└─ Settings → Preferences
```

### Quiz-Session:
```
Quizzes Panel
    ↓
Quiz wählen & starten
    ↓
Fragen beantworten
    ↓
Ergebnis erhalten
    ↓
Entscheidung:
├─ Teilen → Social Media Banner
└─ Profil → Character Sheet Update
    ↓
AfterQuizDeltaBanner
├─ Top Movers angezeigt
├─ Animationen (450-1400ms)
└─ Auto-Dismiss (10s)
```

---

## 10. ENTSCHEIDUNGSBÄUME (Decision Points)

### Onboarding:
```
User startet Onboarding
    ↓
Geburtsdaten vorhanden?
├─ JA → Direkt zu Berechnung
└─ NEIN → Eingabe-Formular
    ↓
Alle Felder ausgefüllt?
├─ JA → Cloud Engine Call
└─ NEIN → Validierungs-Fehler
    ↓
Berechnung erfolgreich?
├─ JA → Supabase Speicherung
└─ NEIN → Fehler-Message
    ↓
Daten gespeichert?
├─ JA → Symbol generieren
└─ NEIN → Retry
    ↓
Symbol erstellt?
├─ JA → Redirect Dashboard
└─ NEIN → Fallback Symbol
```

### Quiz Flow:
```
Quiz abgeschlossen
    ↓
Ergebnis-Popup
    ↓
User wählt:
├─ "Nächstes Quiz"
│   ↓
│   Profil aktualisiert
│   ↓
│   Character Sheet
│   ↓
│   Delta Banner
│   ↓
│   Zurück zu Quizzes
│
└─ "Teilen"
    ↓
    Platform wählen
    ↓
    Banner generieren
    ↓
    Native Share Dialog
    ↓
    Geteilt!
```

### Navigation:
```
Sidebar Click
    ↓
Item gewählt:
├─ Dashboard → Astrosheet
├─ Profil → Ba Zi Diagram
├─ Quizzes → Quiz Panel
│   ↓
│   Premium Check?
│   ├─ Yes → Full Access
│   └─ No → "finished yet"
│
├─ Agenten → Live Chat
│   ↓
│   Beta Warning
│   ↓
│   Chat Interface
│
├─ Premium → Upgrade Page
│   ↓
│   Daily Horoscope Feature
│   ↓
│   Subscription Check
│
└─ Settings → Preferences
```

---

## 11. INTEGRATION POINTS

### External Services:

**Cloud Engine (by "ac"):**
- API: Horoscope Calculation
- Input: Birth Data (date, time, place)
- Output: AstroProfileV1 (Western + Ba Zi)
- SLA: ~30-60s response time

**Supabase:**
- Auth: User Management
- Database: PostgreSQL
- Storage: Zodiac Data (JSONB)
- RLS: Row Level Security (user_id)

**Social Media APIs:**
- Facebook Share API
- Instagram (via Web Share API)
- Twitter/X Share Intent
- WhatsApp Share Link

**Symbol Creator:**
- Input: Fusion Data (Ba Zi + Western)
- Output: SVG + AI Prompt
- Storage: user_symbols table
- Generation: Instant (< 1s)

---

## 12. PREMIUM TIER DETAILS

### Freemium vs Premium:

| Feature | Free | Premium |
|---------|------|---------|
| Onboarding | ✅ | ✅ |
| Astrosheet | ✅ Basic | ✅ Full |
| Character Sheet | ✅ | ✅ |
| 15 Quizzes | ✅ Basic | ✅ Extended |
| Daily Horoscope | ❌ | ✅ |
| Ba Zi Diagram | ✅ View | ✅ Export PDF |
| AI Agenten | ⚠️ Limited | ✅ Full |
| Social Sharing | ✅ | ✅ |
| Ad-Free | ❌ | ✅ |

### Premium Features:
```
Daily Horoscope
├─ Personalisierte Vorhersagen
├─ Transit-Berechnungen
├─ Liebes-Horoskop
└─ Karriere-Insights

Extended Quiz Insights
├─ Detaillierte Analysen
├─ Historische Trends
└─ Vergleiche

AI Agent Full Access
├─ Unbegrenzte Chats
├─ Alle Agent-Typen
└─ Priority Support

Export & Sharing
├─ PDF Reports
├─ High-Res Symbol
└─ Extended Social Banners
```

---

## 13. MOBILE vs DESKTOP EXPERIENCE

### Responsive Breakpoints:

**Mobile (< 768px):**
```
┌──────────────┐
│   Header     │
├──────────────┤
│   Sidebar    │
│   (Burger)   │
├──────────────┤
│              │
│   Content    │
│   (Stack)    │
│              │
├──────────────┤
│   CoreStats  │
│   (Full W)   │
├──────────────┤
│   Climate    │
│   (Full W)   │
└──────────────┘
```

**Desktop (≥ 768px):**
```
┌────┬──────────────────────┐
│    │      Header          │
│ S  ├──────────┬───────────┤
│ i  │          │           │
│ d  │ CoreStats│ Climate   │
│ e  │          │           │
│ b  ├──────────┴───────────┤
│ a  │     DerivedStats     │
│ r  ├──────────────────────┤
│    │   ArchetypeStory     │
└────┴──────────────────────┘
```

---

## 14. ACCESSIBILITY & UX

### WCAG AA Compliance:
- ✅ Contrast Ratios: ≥4.5:1 (Text)
- ✅ Keyboard Navigation: Full Support
- ✅ ARIA Labels: Alle interaktiven Elemente
- ✅ Reduced Motion: ≤250ms (prefers-reduced-motion)
- ✅ Screen Reader: Semantic HTML

### Animation System:
```
Delta-Driven Duration Formula:
duration_ms = clamp(450, 1400, 450 + 1200 * magnitude)

Examples:
├─ Small change (0.05): ~510ms
├─ Medium change (0.20): ~690ms
└─ Large change (0.50): ~1050ms

Reduced Motion:
└─ All animations ≤ 250ms (crossfade only)
```

### Loading States:
```
Onboarding Berechnung:
├─ Spinner Animation
├─ Progress Text: "Berechne Horoskop..."
└─ Estimated Time: "~30 Sekunden"

Dashboard Load:
├─ Skeleton Screens
└─ Lazy Load: Non-critical assets
```

---

## ZUSAMMENFASSUNG

**QuizzMe User Journey = Einfach, Schnell, Personalisiert**

1. **Onboarding:** Minimal Input (Geburtsdaten) → Maximal Output (Astro-Profil)
2. **Dashboard:** Zentrale Anlaufstelle mit Erstellungs-Matrix
3. **Navigation:** Klare Sidebar mit 6 Haupt-Features
4. **Quizzes:** 15 Tests + Social Sharing
5. **Premium:** Daily Horoscope + Extended Features
6. **AI Agenten:** Beta Chat Support
7. **Mobile-First:** Responsive auf allen Geräten

**Status:** Production-Ready
**Single Source of Truth:** Miro Board Flow
**Letzte Aktualisierung:** 2026-01-05
