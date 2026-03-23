# Mobile Home Screen — Definitive Vision

## Leitsatz
> "Je volatiler und wandelbarer etwas ist, desto mehr sollte es im Fokus sein.
> Unveränderliches zeigen wir einmal oder lassen den Nutzer wissen, dass er
> solche Dinge immer an einem bestimmten Ort findet."

---

## Screen-Aufbau (von oben nach unten)

### 1. Identitäts-Leiste (immer sichtbar, sticky)
Drei Symbole die den User identifizieren — immer sichtbar, auch beim Scrollen.
Nicht als Cards, nicht als Text — als kompakte Icon-Leiste.

```
♐  龍  木
```
Sonnenzeichen · Jahrestier · Dominantes Element

Klein, elegant, oben fixiert. Kein Label nötig — der User weiß was es ist.

---

### 2. Tageshoroskop (ERSTER Content, sofort sichtbar)
Beim App-Öffnen sieht der User **sofort** sein Tageshoroskop.
Kein Modal, kein Wegklicken, kein Loading-Spinner vor dem Text.

```
┌─────────────────────────────────┐
│                                 │
│  Dein Mars trifft heute auf     │
│  den Transit-Mond — emotionale  │
│  Impulse wollen kanalisiert     │
│  werden, nicht unterdrückt.     │
│                                 │
│  Themen: Emotion · Intuition    │
│                                 │
│  ────────────────────────────   │
│  BaZi: Dein Holz-Drache        │
│  begegnet heute der Metall-     │
│  Energie — Reibung erzeugt      │
│  Klarheit.                      │
│                                 │
└─────────────────────────────────┘
```

Zwei Absätze: Westlich + BaZi/Östlich. Die Fusion in Textform.
**Kein** Titel-Label nötig. Der Text IST das Feature.

Datenquelle: `/api/experience/daily` → `daily.western.summary` + `daily.eastern.summary`

---

### 3. Kosmisches Wetter (Transite, NASA-Daten)
Was passiert JETZT am Himmel — und was bedeutet das für den User.

```
┌─────────────────────────────────┐
│  ⚡ Kp 4.2 — Moderate Aktivität │
│  ██████████░░░░░░ 47%           │
│                                 │
│  Keine Magnetsturm-Warnung.     │
│  Nächste potenzielle Eruption:  │
│  ~14h (NOAA Forecast)           │
└─────────────────────────────────┘
```

Wenn Kp ≥ 5: Karte wird rot, pulsiert, Text wird zur Warnung.
Datenquelle: `useSpaceWeather()` (bereits implementiert)

---

### 4. Die Signatur (das Herzstück)

**NICHT:** 12 Balken, Prozente, Daten-Charts
**SONDERN:** Ein lebendiges, waberndes, vibrierendes visuelles Objekt

#### Was es ist:
Eine **3D-artige Blase/Sphäre** die ständig in Bewegung ist.
Wie Wasser das auf bestimmte Frequenzen reagiert (Cymatics).
Strukturen und Muster entstehen und vergehen.
Die Form verändert sich:
- Durch **Quizzes** (neue Sektoren = neue Deformation)
- Durch **Transite** (aktive Aspekte = Wellenmuster)
- Durch **kosmisches Wetter** (Kp-Index = Vibrations-Intensität)

#### Was es NICHT zeigt:
- Keine Zahlen, Prozente, Labels
- Keinen Kohärenz-Index (der ist statisch → Raum der Ewigkeit)
- Keine 12 benannte Sektoren

#### Wie es sich anfühlt:
- Touch: Berührung erzeugt Wellen die sich ausbreiten
- Idle: Sanftes Wabern, nie stillstehend
- Quiz-Impact: Momentane Deformation, dann neue Grundform
- Magnetsturm: Intensivere Vibration, mehr Struktur

#### Technische Umsetzung:
- **Option A:** `react-native-skia` mit 2D Shader (GLSL)
  - Pro: Performant, batterieschonend, shader-basiert
  - Con: Braucht native Build-Dep
- **Option B:** `expo-gl` + Three.js (wie Web-App)
  - Pro: Kann Web-Signatur-Code portieren
  - Con: GPU-intensiv, Battery-Drain
- **Option C:** Lottie Animation als Fallback
  - Pro: Extrem performant, kein GL nötig
  - Con: Nicht wirklich interaktiv, vorgefertigte Animation

**Empfehlung:** Option A (Skia) für die echte Version.
Für den MVP: **Animated API mit mehreren überlagerten Views** die
pulsieren, rotieren und auf Touch reagieren. Sieht weniger beeindruckend
aus als Skia, aber funktioniert ohne neue Dependencies.

---

### 5. Quiz des Tages (unter der Signatur)
Ein einziger Vorschlag. Abschließen → Signatur verändert sich sichtbar.

---

### Raum der Ewigkeit (separater Bereich, nicht auf Home)
Alles Unveränderliche:
- Geburtsdaten
- Vollständiges BaZi-Chart (4 Säulen)
- Kohärenz-Index
- Natal-Chart Details
- Western Houses

Zugänglich über Profil-Tab oder eine "∞" Geste auf der Signatur.

---

## Was jetzt gebaut werden muss (priorisiert)

### Sofort (dieser Sprint):
1. **Home Screen umstrukturieren:** Tageshoroskop als erster Content
2. **Identitäts-Leiste:** ♐ 龍 木 sticky oben
3. **Kosmisches Wetter Card** mit Kp-Farblogik
4. **Signatur Placeholder:** Animierte wabernde Blase (Animated API)
   - Mehrere überlagerte Kreise mit unterschiedlichen Puls-Frequenzen
   - Touch → Ripple-Effekt
   - Kp-Index → Vibrations-Intensität

### Nächster Sprint:
5. **Echte Signatur mit Skia/GL** (cymatics-ähnlich)
6. **Quiz-Impact Animation** (Signatur verformt sich nach Quiz)
7. **Raum der Ewigkeit** Screen

---

## Abgrenzung zur Web-Signatur

Die Web-Signatur (`FusionRingCanvasV2`) ist ein Spirograph mit 28K Partikeln
und Cousto-Frequenzen. Die Mobile-Signatur muss NICHT identisch sein —
sie ist eine **vereinfachte, touch-optimierte Interpretation** des gleichen
Konzepts. Beide visualisieren die Soulprint-Daten, aber auf unterschiedliche
Art: Web = technisch beeindruckend, Mobile = intuitiv und taktil.
