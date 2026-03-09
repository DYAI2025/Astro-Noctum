# QuizzMe

## 📖 Projektübersicht

**QuizzMe** ist eine moderne Web-Applikation, die interaktive Persönlichkeits- und Horoskop-Quizze anbietet. Das Projekt nutzt **Next.js 16**, **React 19**, **TypeScript** und **Tailwind CSS v4** und unterstützt mehrere Domains (Quiz- und Horoskop-Vertikale) über ein zentrales Middleware-Routing.

Die aktuelle Version (1.3) enthält:

- Ein überarbeitetes **Altar-Dashboard** mit modularen Action-Tiles und einer dynamischen **Zodiac Shield**-Komponente.
- Umfassende **Astrologie-Features** mit Tageshoroskopen, Transitberechnungen und personalisierten Interpretationen.
- Mehrere neue Design-Assets (Icons, Hintergrundgrafiken) im `public/assets`-Verzeichnis.
- Integration von Supabase für persistente Benutzerdaten (Psyche-Profile, Geräte-IDs).
- Vollständige **Static-Site-Generation** (`output: 'export'`) für einfache Bereitstellung auf GitHub Pages oder Vercel.

---

## 🛠️ Installation & Setup

### Voraussetzungen

- **Node.js** (v20 oder neuer) und **npm**
- **Git**
- (Optional) **Docker** für containerisierte Entwicklung

### Schritte

1. **Repository klonen**

   ```bash
   git clone https://github.com/DYAI2025/QuizzMe.git
   cd QuizzMe
   ```

2. **Abhängigkeiten installieren**

   ```bash
   npm install   # oder npm ci für reproduzierbare Installation
   ```

3. **Umgebungsvariablen konfigurieren**
   - Kopiere die Beispiel-Datei und füge deine Supabase-Credentials ein:

   ```bash
   cp .env.example .env.local
   # edit .env.local
   ```

   - Benötigte Variablen:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Entwicklungs-Server starten**

   ```bash
   npm run dev
   ```

   Die Anwendung ist dann unter `http://localhost:3000` erreichbar.

5. **Build & Export (für Produktion)**

   ```bash
   npm run build   # erzeugt .next & static files
   npm run export  # legt das statische `out/`-Verzeichnis an
   ```

   Das Ergebnis kann auf jedem statischen Host deployed werden.

6. **Linting & Tests**

   ```bash
   npm run lint    # ESLint prüfen
   npm run test    # Unit-Tests mit Vitest
   ```

---

## 🚀 Features

### Quiz-System

- **Quiz-Vertikale** (`/verticals/quiz/*`) mit modularen Komponenten
- Unterstützte Quizze: Personality, Love Languages, RPG-Identity, Aura-Colors, Celebrity Soulmate, und mehr
- Dynamische Ergebnisberechnung mit Psyche-Markern

### Astrologie & Horoskope

- **Astro-Onboarding** (`/onboarding/astro`) – Erfassung von Geburtsdatum, -zeit und -ort
- **Tageshoroskop** (`/verticals/horoscope/daily`) – Personalisierte Tagesprognosen
- **Berechnungen**:
  - Sonnenzeichen (Western Zodiac)
  - Aszendent und Mondzeichen (bei bekannter Geburtszeit)
  - Chinesisches Tierkreiszeichen, Element und Yin/Yang
  - Tägliche Transite (Jupiter, Saturn, Mars, Venus, Merkur, Mond)
- **Interpretationen** für verschiedene Aspekte:
  - Konjunktion, Trigon, Quadrat, Opposition
  - Planetenspezifische Texte (Glück, Herausforderungen, Harmonie, etc.)

### Character Sheet

- **Altar-Dashboard** mit Action-Sidebar, Dashboard-Grid und Profile-Spine
- **Zodiac Shield** – Dynamisches Wappen basierend auf dem Sternzeichen
- **Element-Anzeige** (Feuer, Erde, Luft, Wasser) im Character-Header
- Fortschrittsanzeige und Unlock-System

### Backend & Persistenz

- **Supabase-Integration** für:
  - Persistente Speicherung von Nutzer-Profilen
  - Geräte-ID-basiertes Anonym-Login
  - Contribution-Events für Quiz-Ergebnisse

---

## 📁 Projektstruktur

```
QuizzMe/
├── src/
│   ├── app/                    # Next.js App Router Seiten
│   │   ├── character/          # Character Sheet
│   │   ├── onboarding/         # Onboarding-Flows
│   │   └── verticals/          # Quiz & Horoscope Vertikalen
│   ├── components/             # React-Komponenten
│   │   ├── character-v2/       # Character Sheet UI
│   │   └── quizzes/            # Quiz-Komponenten
│   ├── lib/
│   │   ├── astro/              # Astrologie-Berechnungen
│   │   │   ├── astronomy.ts    # Kernberechnungen (JD, GMST, Aszendent)
│   │   │   ├── compute.ts      # Hauptlogik für Astro-Daten
│   │   │   ├── interpretations.ts  # Transit-Texte
│   │   │   └── cities.ts       # Städte-Datenbank
│   │   ├── lme/                # Lean Micro Experience API
│   │   └── registry/           # Trait & Anchor Registries
│   └── modules/
│       └── onboarding/         # Onboarding-Logik
├── public/
│   └── assets/                 # Bilder, Icons, Shields
└── docs/                       # Dokumentation & Pläne
```

---

## 📈 Entwicklungsstand

| Bereich | Status |
|---------|--------|
| UI / Dashboard | ✅ Fertig (Altar-Layout, Action-Tiles, Zodiac-Shield) |
| Quiz-Komponenten | ✅ 12+ Quizze implementiert |
| Astrologie-System | ✅ Sonnenzeichen, Aszendent, Transite, Tageshoroskop |
| Supabase-Integration | ✅ CRUD-Operationen, Contribution-Events |
| CI / Linting | ✅ ESLint, Vitest-Tests |
| Deployment | ✅ GitHub-Pages-Export, Vercel-Ready |

---

## 🗓️ Roadmap

1. **Erweiterte Quiz-Designs** – neue „Modern Alchemy"-Layouts für alle Quiz-Typen
2. **Realtime-Updates** – Supabase-Realtime für sofortige Synchronisation
3. **Benutzer-Authentifizierung** – OAuth-Login (Google, GitHub)
4. **Internationalisierung (i18n)** – Deutsch, Englisch und weitere Sprachen
5. **Progressive Web App (PWA)** – Offline-Funktionalität
6. **Erweiterte Analytik** – Quiz-Tracking via Supabase-Analytics
7. **Theming-Engine** – Dark-Mode, Light-Grimoire mit CSS-Variablen
8. **Vollständiges Natal-Chart** – Alle Planetenpositionen und Häuser

---

## 🤝 Beitrag leisten

Beiträge sind herzlich willkommen! Bitte folge diesen Schritten:

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/mein-feature`)
3. Schreibe Tests und halte dich an das bestehende Lint-Setup
4. Öffne einen Pull-Request mit einer klaren Beschreibung

---

## 📜 Lizenz

Dieses Projekt ist unter der **MIT License** lizenziert – siehe die Datei `LICENSE` für Details.

---

*Letzte Aktualisierung: 23. Dezember 2025*
