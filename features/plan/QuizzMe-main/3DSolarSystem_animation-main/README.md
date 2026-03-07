# 🌌 Celestial Orrery + Planetarium

Ein **modulares**, **visuell verbessertes** 3D-Sonnensystem mit echten Kepler-Orbitalmechaniken und einem interaktiven Planetarium. **Neu:** Vollständige programmatische API-Steuerung und modulare Integration!

![Solar System Orrery](https://img.shields.io/badge/React-18.2-blue) ![Three.js](https://img.shields.io/badge/Three.js-0.160-green) ![License](https://img.shields.io/badge/License-MIT-yellow) ![Modular](https://img.shields.io/badge/Architecture-Modular-brightgreen)

## ✨ Features

### 🌍 Sonnensystem-Ansicht (Orrery)
- **Echte Kepler-Mechanik** — Newton-Raphson Solver für die Kepler-Gleichung
- **J2000.0 Orbitaldaten** — Alle 8 Planeten mit NASA JPL Daten
- **6 Orbitalelemente** — Halbachse, Exzentrizität, Inklination, Ω, ω, M₀
- **Logarithmische Skalierung** — Realistische Abstände bei guter Sichtbarkeit
- **Echtzeit-Simulation** — 7 Geschwindigkeitsstufen (1× bis 1 Jahr/Sekunde)
- **Datums-Navigation** — Springe zu jedem beliebigen Datum

### ⭐ Planetarium-Ansicht
- **150+ hellste Sterne** — Yale Bright Star Catalog Daten mit J2000.0 Koordinaten
- **Sternbild-Linien** — Orion, Großer Bär, Kassiopeia, Skorpion, etc.
- **Deutsche Sternbild-Namen** — Automatische Labels am Himmel
- **Planeten am Nachthimmel** — Zeigt wo Venus, Mars, Jupiter etc. stehen
- **Beliebige Koordinaten** — Jeder Punkt auf der Erde
- **Realistischer Horizont** — Shader-basierter Gradient mit Abendrot/Morgengrauen
- **Hover-Tooltips** — Stern-Infos mit Name, Helligkeit, Position
- **Interaktive Mouse-Look** — Bewege die Maus zum Umschauen

### 🎨 Visuelle Verbesserungen (NEU!)
- **Shader-basierte Materialien** — Custom GLSL-Shader für Sonne, Planeten, Himmel
- **Atmosphären-Effekte** — Fresnel-basierte Glows für Planeten
- **Animierte Sonne** — Turbulente Oberfläche mit Noise-Funktion
- **Verbesserte Saturn-Ringe** — Detaillierte Bänder mit Cassini-Division
- **Milchstraße** — 15.000 Sterne in galaktischem Band
- **Realistische Beleuchtung** — Schatten, Hemisphere-Light, Punkt-Lichtquellen
- **Farbvariationen** — Sterne mit spektral-typischen Farben

### 🎮 Modulare API (NEU!)
- **Vollständige programmatische Steuerung** — Alle Funktionen per API zugänglich
- **React Hooks** — `useCelestialOrrery` für State-Management
- **TypeScript-Typen** — Vollständig typisierte API
- **Event Callbacks** — Reagiere auf View-Änderungen, Datum-Updates, Klicks
- **Scene-Zugriff** — Direkter Zugang zu Three.js Scene, Camera, Renderer

### 🌏 Geburts-Sternenhimmel
- Geburtsdaten eingeben (Datum, Uhrzeit, Ort)
- Cinematischer Zoom vom Sonnensystem zur Erde
- Persönlicher Himmel zum Zeitpunkt der Geburt

## 🚀 Installation

```bash
# Repository klonen
git clone https://github.com/DYAI2025/3DSolarSystem_animation.git
cd 3DSolarSystem_animation

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## 📁 Projektstruktur (NEU - Modular!)

```
3DSolarSystem_animation/
├── app/
│   ├── page.tsx                    # Next.js Hauptseite
│   ├── layout.tsx                  # App Layout
│   └── globals.css                 # Globale Styles
├── components/
│   └── CelestialOrrery/
│       ├── index.tsx               # Haupt-Export
│       ├── CelestialOrreryCore.tsx # Core 3D-Komponente (modular)
│       └── CelestialOrreryWithUI.tsx # UI-Wrapper (optional)
├── lib/
│   ├── astronomy/
│   │   ├── calculations.ts         # Astronomische Berechnungen
│   │   ├── data.ts                 # Sterne, Planeten, Städte-Daten
│   │   └── types.ts                # TypeScript-Typen
│   └── 3d/
│       └── materials.ts            # Verbesserte Shader & Materialien
├── hooks/
│   └── useCelestialOrrery.ts       # React Hook für State-Management
├── package.json
└── README.md
```

## 🔧 Integration in eigene Projekte

### Standalone-Komponente (einfachste Variante)

```tsx
import CelestialOrrery from '@/components/CelestialOrrery';

export default function MyPage() {
  return <CelestialOrrery />;
}
```

### Mit API-Zugriff

```tsx
'use client';

import { useRef } from 'react';
import { CelestialOrreryCore } from '@/components/CelestialOrrery';
import type { CelestialOrreryAPI } from '@/lib/astronomy/types';

export default function MyPage() {
  const apiRef = useRef<CelestialOrreryAPI>(null);

  const handleApiReady = (api: CelestialOrreryAPI) => {
    console.log('API ready!', api);
  };

  const jumpToDate = () => {
    apiRef.current?.setDate(new Date('2030-01-01'));
  };

  const focusOnMars = () => {
    apiRef.current?.focusOnPlanet('mars');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <CelestialOrreryCore
        ref={apiRef}
        onApiReady={handleApiReady}
        initialSpeed={86400}
        showOrbits={true}
      />
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <button onClick={jumpToDate}>Jump to 2030</button>
        <button onClick={focusOnMars}>Focus on Mars</button>
        <button onClick={() => apiRef.current?.togglePlayPause()}>
          Play/Pause
        </button>
      </div>
    </div>
  );
}
```

### Mit React Hook

```tsx
'use client';

import { CelestialOrreryCore } from '@/components/CelestialOrrery';
import useCelestialOrrery from '@/hooks/useCelestialOrrery';
import { CITIES } from '@/lib/astronomy/data';

export default function MyPage() {
  const hook = useCelestialOrrery(CITIES[0]); // Berlin
  const { api, currentDate, isPlaying, viewMode } = hook;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CelestialOrreryCore onApiReady={(readyApi) => {}} />

      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <p>📅 {currentDate.toLocaleDateString('de-DE')}</p>
        <p>👁️ {viewMode}</p>
        <p>{isPlaying ? '▶️ Playing' : '⏸️ Paused'}</p>
        <button onClick={() => api.togglePlayPause()}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}
```

## 🎮 API-Referenz

Die Komponente bietet eine umfassende API zur programmatischen Steuerung:

### View Control

```tsx
api.setViewMode('orrery' | 'planetarium' | 'transition')
api.getViewMode() // returns current mode
```

### Time Control

```tsx
api.setDate(new Date('2025-12-31'))
api.getDate() // returns Date
api.setSpeed(86400) // 1 day per second
api.getSpeed()
api.play()
api.pause()
api.togglePlayPause()
api.isPlaying() // returns boolean
```

### Camera Control

```tsx
api.setCameraPosition(100, 80, 100)
api.lookAt(0, 0, 0)
api.resetCamera()
```

### Planet Control

```tsx
api.getPlanetPosition('mars') // returns { x, y, z } | null
api.focusOnPlanet('jupiter')
```

### Observer Location

```tsx
api.setObserverLocation(52.52, 13.405) // Berlin
api.getObserverLocation() // returns { latitude, longitude }
```

### Settings

```tsx
api.setShowOrbits(true)
api.setShowConstellations(true)
api.setShowConstellationNames(true)
```

### Birth Chart

```tsx
import { CITIES } from '@/lib/astronomy/data';
const berlin = CITIES.find(c => c.name === 'Berlin');
api.showBirthChart('1990-01-01', '12:00', berlin);
```

### Scene Access (für erweiterte Three.js-Interaktion)

```tsx
const scene = api.getScene() // THREE.Scene
const camera = api.getCamera() // THREE.Camera
const renderer = api.getRenderer() // THREE.WebGLRenderer

// Beispiel: Füge eigene 3D-Objekte hinzu
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const cube = new THREE.Mesh(geometry, material);
scene?.add(cube);
```

## ⚙️ Konfigurationsoptionen

Die `CelestialOrreryCore`-Komponente unterstützt umfangreiche Props:

```tsx
interface CelestialOrreryConfig {
  // Initial settings
  initialDate?: Date;
  initialViewMode?: 'orrery' | 'planetarium';
  initialSpeed?: number;

  // Visual settings
  sunRadius?: number;
  orbitScale?: number;
  showOrbits?: boolean;
  showConstellations?: boolean;
  showConstellationNames?: boolean;

  // Observer location
  observerLatitude?: number;
  observerLongitude?: number;

  // Callbacks
  onViewModeChange?: (mode: ViewMode) => void;
  onDateChange?: (date: Date) => void;
  onPlanetClick?: (planetKey: string, planet: PlanetData) => void;
  onStarClick?: (star: StarData) => void;
  onApiReady?: (api: CelestialOrreryAPI) => void;

  // Style
  className?: string;
  style?: React.CSSProperties;
}
```

Beispiel mit allen Optionen:

```tsx
<CelestialOrreryCore
  initialDate={new Date('2025-01-01')}
  initialViewMode="orrery"
  initialSpeed={86400}
  sunRadius={1.5}
  orbitScale={25}
  showOrbits={true}
  showConstellations={true}
  showConstellationNames={true}
  observerLatitude={52.52}
  observerLongitude={13.405}
  onViewModeChange={(mode) => console.log('View:', mode)}
  onDateChange={(date) => console.log('Date:', date)}
  onPlanetClick={(key, planet) => console.log('Planet:', planet.name)}
  onStarClick={(star) => console.log('Star:', star.name)}
  onApiReady={(api) => console.log('API ready!')}
  className="my-solar-system"
  style={{ border: '2px solid gold' }}
/>
```

## 🔬 Astronomische Präzision

### Kepler-Gleichung
```
M = E - e·sin(E)
```
Wird iterativ mit Newton-Raphson gelöst (Toleranz: 10⁻⁸)

### Koordinatentransformation
```
Äquatorial (RA/Dec) → Horizontal (Azimut/Altitude)

Sternzeit = GMST + Längengrad
Stundenwinkel = Sternzeit - Rektaszension
Altitude = arcsin(sin(Lat)·sin(Dec) + cos(Lat)·cos(Dec)·cos(HA))
```

### Orbitaldaten (J2000.0 Epoch)
| Planet | a (AU) | e | i (°) | Periode (Tage) |
|--------|--------|---|-------|----------------|
| Merkur | 0.387 | 0.206 | 7.0 | 87.97 |
| Venus | 0.723 | 0.007 | 3.4 | 224.7 |
| Erde | 1.000 | 0.017 | 0.0 | 365.25 |
| Mars | 1.524 | 0.093 | 1.9 | 686.98 |
| Jupiter | 5.203 | 0.048 | 1.3 | 4332.59 |
| Saturn | 9.537 | 0.054 | 2.5 | 10759.22 |
| Uranus | 19.19 | 0.047 | 0.8 | 30688.5 |
| Neptun | 30.07 | 0.009 | 1.8 | 60182.0 |

## 🎨 UI Design

- **Glassmorphism** — Backdrop-blur Panels mit Gold-Akzenten
- **Farbpalette** — #D4AF37 (Gold), #4A90D9 (Erde), #CD5C5C (Mars)
- **Typography** — SF Mono, ultra-thin (font-weight: 300)
- **Animations** — Smooth camera transitions

## 🛠 Tech Stack

- **React 18** — UI Framework
- **Three.js** — 3D WebGL Rendering
- **Next.js 14** — React Framework
- **TypeScript** — Type Safety

## 📜 Lizenz

MIT License — Frei für persönliche und kommerzielle Nutzung.

## 🙏 Credits

- Orbitaldaten: NASA JPL Horizons
- Sternenkatalog: Yale Bright Star Catalog
- Sternbild-Linien: IAU Konstellationen

---

*Gebaut mit ❤️ für Astronomie und Astrologie*
