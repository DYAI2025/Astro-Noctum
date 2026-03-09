# Cosmic Architecture Engine v3.1 - Enhanced with Swiss Ephemeris

**Präzise astrologische Berechnungen auf professionellem Niveau**

Die Cosmic Architecture Engine vereint **westliche Astrologie** (Tropical Zodiac) mit **Ba Zi** (chinesische Vier-Säulen-Astrologie) in einem deterministischen, nachvollziehbaren Framework.

**Neu in v3.1:** Integration der **Swiss Ephemeris** Bibliothek für astronomisch exakte Berechnungen (±0.001° Präzision).

---

## ✨ Features

### Westliche Astrologie
- ✅ **Aszendent** - IAU 2000/2006 Standard, quadranten-korrigiert
- ✅ **Planetenpositionen** - Sonne, Mond, Merkur bis Pluto
- ✅ **Häuser** - Placidus-System (weitere Systeme: Koch, Equal, etc.)
- ✅ **MC/IC, Deszendent** - Korrekt berechnet
- ✅ **Swiss Ephemeris** - Professionelle Präzision (optional)

### Ba Zi (Vier Säulen)
- ✅ **Year Pillar (年柱)** - Gesellschaft, Gemeinschaft
- ✅ **Month Pillar (月柱)** - Karriere, Familie
- ✅ **Day Pillar (日柱)** - Identität, Day Master
- ✅ **Hour Pillar (時柱)** - Innere Motivation, Ausdruck
- ✅ **Li Chun (立春)** - Präzise Jahresgrenze (315° Solar Longitude)
- ✅ **True Solar Time** - Korrekte Stundensäule
- ✅ **23:00 Uhr Regel** - Ba Zi Tag-Wechsel

### Fusion & Analysis
- ✅ **Wu Xing (五行)** - Fünf-Elemente-Balance
- ✅ **Element Resonance** - Westlich-Östliche Synthese
- ✅ **Li Wei Interpretation** - Empowerment-fokussierte Deutung
- ✅ **Harmony Index** - Kohärenz-Analyse

---

## 🚀 Quick Start

### Option 1: Simplified Mode (Keine Dependencies)

```javascript
const { CosmicEngineEnhanced } = require('./src/cosmic-engine-enhanced');

const engine = new CosmicEngineEnhanced({ usePrecision: false });

const profile = await engine.calculateProfile({
  year: 1980,
  month: 6,
  day: 24,
  hour: 15,
  minute: 20,
  second: 0,
  latitude: 52.3759,   // Hannover
  longitude: 9.7320,
  timezone: 'Europe/Berlin'  // IANA Timezone
});

console.log('Sun:', profile.western.sun.sign);
console.log('Ascendant:', profile.western.ascendant.sign);
console.log('Day Master:', profile.bazi.dayMaster.stem);
```

### Option 2: Precision Mode (Swiss Ephemeris)

**Setup:**
```bash
# 1. Python Dependencies installieren
cd astro-precision-horoscope
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. (Optional) Swiss Ephemeris Files
export SE_EPHE_PATH=~/.swisseph  # Pfad zu Ephemeris-Dateien

# 3. Zurück zum Root
cd ..
```

**Usage:**
```javascript
const { CosmicEngineEnhanced } = require('./src/cosmic-engine-enhanced');

const engine = new CosmicEngineEnhanced({
  usePrecision: true,    // Swiss Ephemeris verwenden
  useFallback: true      // Fallback zu Simplified bei Fehler
});

await engine.initialize();  // Prüft Verfügbarkeit

const profile = await engine.calculateProfile({
  year: 1983,
  month: 3,
  day: 12,
  hour: 16,
  minute: 26,
  latitude: 52.3759,
  longitude: 9.7320,
  timezone: 'Europe/Berlin'
});

// Precision-spezifische Features
console.log('Mode:', profile.meta.precision.mode);  // 'swiss-ephemeris'
console.log('Validation:', profile.meta.precision.validation.status);
console.log('Audit Trail:', profile.meta.precision.audit);
```

---

## 📊 Precision Comparison

| Feature | Simplified Mode | Precision Mode (Swiss Ephemeris) |
|---------|----------------|-----------------------------------|
| **Setup** | Keine Dependencies | Python + Swiss Ephemeris |
| **Speed** | ~8ms | ~120ms |
| **Präzision** | ±0.1° - 0.5° | ±0.001° |
| **Ascendant** | Quadranten-korrigiert | IAU Standard |
| **Planeten** | Simplified VSOP | Swiss Ephemeris |
| **Validation** | Basic | Crosschecks + Audit Trail |
| **Use Case** | Web-Apps, Prototyping | Professionelle Software |

**Empfehlung:**
- **Simplified**: Für die meisten Use-Cases ausreichend, schnell, einfach
- **Precision**: Für professionelle Anwendungen, Forschung, kritische Genauigkeit

---

## 🧪 Testing

### Automatisierte Tests
```bash
npm test
# oder
node tests/test-precision-integration.js
```

Tests umfassen:
- ✅ Precision Bridge Availability
- ✅ Swiss Ephemeris Calculation
- ✅ Enhanced Engine Integration
- ✅ Precision vs Simplified Comparison

### Original Engine Test
```bash
node cosmic-architecture-engine-v3.js
```

Führt drei Validierungstests aus:
1. **Ben** (Kalibrierungsvektor)
2. **Vincent** (Original-Test)
3. **Li Chun Edge Case** (Jahresgrenze)

---

## 📖 Dokumentation

### Haupt-Dokumentation
- **[SWISS_EPHEMERIS_INTEGRATION.md](docs/SWISS_EPHEMERIS_INTEGRATION.md)** - Vollständige Integration-Dokumentation
- **[BaZi_Western_Fusion_Framework.md](BaZi_Western_Fusion_Framework.md)** - Mathematisches Framework
- **[COSMIC_ENGINE_V3_VALIDATION.md](COSMIC_ENGINE_V3_VALIDATION.md)** - Validierungsbericht
- **[FINAL_STATUS_REPORT.md](docs/FINAL_STATUS_REPORT.md)** - Projektstatus v3.0

### Technische Referenz
- **[Aszendent-rechnen.md](Aszendent-rechnen.md)** - Aszendent-Berechnung (Deutsch)
- **[ba zi calculation.md](ba%20zi%20calculaion.md)** - Ba Zi Details
- **[docs/ASCENDANT_FORMULA_RAG.md](docs/ASCENDANT_FORMULA_RAG.md)** - Formeln für Voice Agent

---

## 🏗️ Architektur

```
cosmicEnginge_v3/
├── cosmic-architecture-engine-v3.js    # Original v3 Engine
├── src/
│   ├── precision-bridge.js             # Node.js ↔ Python Bridge
│   └── cosmic-engine-enhanced.js       # Enhanced Engine (v3.1)
├── astro-precision-horoscope/          # Python Swiss Ephemeris Module
│   ├── astro_precision/
│   │   ├── core/
│   │   │   ├── engine.py               # Swiss Ephemeris Wrapper
│   │   │   └── time.py                 # Zeit-Konvertierung
│   │   └── models.py                   # Datenmodelle
│   ├── scripts/
│   │   └── compute_horoscope.py        # CLI Tool
│   └── requirements.txt
├── tests/
│   └── test-precision-integration.js   # Integration Tests
├── docs/
│   ├── SWISS_EPHEMERIS_INTEGRATION.md
│   ├── FINAL_STATUS_REPORT.md
│   └── ...
├── package.json
└── README.md
```

---

## 🔧 API

### CosmicEngineEnhanced

```javascript
const engine = new CosmicEngineEnhanced(options);

// Options:
{
  usePrecision: true,      // Swiss Ephemeris verwenden (default: true)
  strictMode: true,        // Strict Validation (default: true)
  useFallback: true,       // Fallback zu Simplified (default: true)
  pythonPath: 'python3',   // Python-Interpreter Pfad
  scriptPath: '...'        // compute_horoscope.py Pfad
}

// Methods:
await engine.initialize()                    // Initialisierung
await engine.calculateProfile(birthData)     // Vollständiges Profil
await engine.calculateWestern(birthData)     // Nur Western
engine.calculateBaZi(birthData)              // Nur Ba Zi (sync)
```

### PrecisionBridge (Low-Level)

```javascript
const { PrecisionBridge } = require('./src/precision-bridge');

const bridge = new PrecisionBridge(options);

await bridge.checkAvailability()             // Verfügbarkeitsprüfung
await bridge.computeHoroscope(birthData)     // Vollständige Berechnung
await bridge.getPlanetPositions(birthData)   // Nur Planeten
await bridge.getAscendant(birthData)         // Nur Ascendant
await bridge.getHouses(birthData, 'P')       // Nur Häuser
await bridge.getLiChun(year)                 // Li Chun Datum
```

---

## 🎯 Use Cases

### Web-App (User-facing)
```javascript
// Simplified Mode für schnelle Responses
const engine = new CosmicEngineEnhanced({ usePrecision: false });
const profile = await engine.calculateProfile(userData);
```

### Professional Software
```javascript
// Precision Mode für höchste Genauigkeit
const engine = new CosmicEngineEnhanced({
  usePrecision: true,
  strictMode: true
});
await engine.initialize();
const profile = await engine.calculateProfile(userData);
```

### Hybrid (Best of Both)
```javascript
// Simplified für Preview, Precision für Final
const preview = await simplifiedEngine.calculateProfile(data);
// ... User prüft Preview ...
const final = await precisionEngine.calculateProfile(data);
```

---

## 🌟 Validation & Quality

### Automatische Crosschecks (Precision Mode)

1. **Sun Sign Crosscheck** - Sonnenzeichen aus Länge vs Datumstabelle
2. **Chinese Year Crosscheck** - Li Chun vs Boundary-Tabelle
3. **ΔT Sanity Check** - Delta-T Plausibilität

### Audit Trail (Precision Mode)

Jede Berechnung protokolliert:
- Julian Date (JD_UT)
- Delta-T (ΔT in Sekunden)
- Timezone (IANA + UTC-Offset + DST)
- Swiss Ephemeris Version
- Engine Flags (SWIEPH/MOSEPH)

**Verwendung:** Reproduzierbarkeit, Debugging, Compliance

---

## 📐 Kritische Details

### Day Pillar Offset
```javascript
const DAY_PILLAR_OFFSET = 49;  // ✅ Validiert gegen chinesische Quellen
```
❌ v2 verwendete 58 (inkorrekt)

### Aszendent Quadranten
```javascript
// ✅ KORREKT: atan2() gibt bereits korrekten Quadranten
let ascDeg = Math.atan2(y, x) * (180 / Math.PI);
if (ascDeg < 0) ascDeg += 360;

// ❌ FALSCH: Zusätzliche Korrektur zerstört Ergebnis
if (x < 0) ascDeg += 180;  // NICHT VERWENDEN!
```

### Ba Zi Tag-Wechsel
Ba Zi Tag wechselt um **23:00 Uhr Lokalzeit** (Ratten-Stunde), nicht um Mitternacht!

---

## 🔍 Verifikation

### Online-Tools zum Vergleich

**Westliche Astrologie:**
- https://www.astro.com/horoscope (Aszendent, Planeten, Häuser)

**Ba Zi:**
- https://yi733.com/paipan.php (Chinesisch)
- https://www.yourchineseastrology.com/calculator/bazi/ (Englisch)

**Li Chun:**
- https://www.hko.gov.hk/tc/gts/time/calendar.htm (Hong Kong Observatory)

---

## 🛠️ Troubleshooting

### "Python not found"
```javascript
const engine = new CosmicEngineEnhanced({
  pythonPath: '/usr/local/bin/python3'  // Absoluter Pfad
});
```

### "Swiss Ephemeris files missing"
```bash
# Download von https://www.astro.com/ftp/swisseph/
export SE_EPHE_PATH=/path/to/ephemeris
```
Oder: Moshier-Fallback akzeptieren (immer noch sehr präzise)

### Validation Errors
Prüfe Audit Trail:
```javascript
console.log('Audit:', profile.meta.precision.audit);
console.log('Validation:', profile.meta.precision.validation);
```

---

## 📜 Lizenz & Credits

**Cosmic Architecture Engine**
- Framework: Li Wei DYAI Prime Directive
- Author: [Your Name]
- License: ISC

**Swiss Ephemeris**
- Copyright: Astrodienst AG
- License: GPL oder Professional License
- Website: https://www.astro.com/swisseph/

**pyswisseph**
- Author: Stanislas Marquis
- License: GPL-2.0
- GitHub: https://github.com/astrorigin/pyswisseph

---

## 🚀 Roadmap

### v3.1 (Aktuell)
- ✅ Swiss Ephemeris Integration
- ✅ Automatisches Fallback-System
- ✅ Validation & Crosschecks
- ✅ Audit Trail

### v3.2 (Geplant)
- [ ] Planeten-Aspekte (Trigon, Quadrat, etc.)
- [ ] Häuser-Interpretation
- [ ] Progressionen/Transitionen
- [ ] Batch-Processing API

### v4.0 (Vision)
- [ ] Native Bindings (kein Python)
- [ ] WebAssembly für Browser
- [ ] Cloud-API Service
- [ ] ML-basierte Interpretation

---

## 💡 Philosophy: Li Wei DYAI Prime Directive

**Wahrheit > Nützlichkeit > Schönheit**

1. **Wahrheit** - Deterministische, nachvollziehbare Berechnungen
2. **Nützlichkeit** - Actionable Insights, praktische Empowerment
3. **Schönheit** - Eleganter Code, klare Struktur

Keine Halluzinationen, keine erfundenen Daten - nur präzise, traceable Astronomie und Astrologie.

---

**🌟 Made with precision and wisdom 🌟**

*Fusing Western astronomical accuracy with Eastern metaphysical insight*
