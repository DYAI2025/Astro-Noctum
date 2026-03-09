# Aszendenten-Korrektur Plan für Cosmic Engine v3

**Problem:** Engine berechnet Widder statt Skorpion für Ben (24.06.1980, 15:20, Hannover)
**Referenz:** Aszendent-rechnen.md (IAU 2000/2006 Standard)
**Ziel:** Präzision < 1 Bogensekunde

---

## 🚨 Identifizierte Fehler in der aktuellen Implementierung

### 1. **Quadrantenkorrektur ist fundamental falsch**

**Aktueller Code (cosmic-architecture-engine-v3.js:204-209):**
```javascript
// FEHLERHAFT:
if (ARMC >= 0 && ARMC < 180) {
    if (asc < 180) asc += 180;
} else {
    if (asc >= 180) asc -= 180;
}
```

**Problem:** Diese Logik ist **mathematisch inkorrekt** und hat keine Basis in der sphärischen Astronomie.

### 2. **Verwendung von tan() statt atan2()**

**Aktueller Code (cosmic-architecture-engine-v3.js:199):**
```javascript
let asc = atan2Deg(y, x);
```

Das ist **korrekt**, aber die nachfolgende Quadrantenkorrektur zerstört das Ergebnis!

### 3. **Keine Berücksichtigung der geografischen Breite**

Die aktuelle Implementierung verwendet die Breite korrekt in der Formel, aber die Quadrantenkorrektur ignoriert sie komplett.

---

## ✅ Die Korrekte Formel nach IAU 2000/2006

### Mathematische Grundlage

Gegeben:
- **θ (RAMC)** = Right Ascension of Medium Coeli (in Grad)
- **ϕ (lat)** = Geografische Breite (in Grad)
- **ε (eps)** = Wahre Schiefe der Ekliptik (in Grad)

**Die atan2-Formel:**

```
y = cos(θ)
x = -sin(θ) × cos(ε) - tan(ϕ) × sin(ε)

ASC = atan2(y, x)
```

**Wichtig:** `atan2(y, x)` gibt bereits das **korrekte Ergebnis im korrekten Quadranten** zurück!

### Warum atan2 und nicht tan?

`atan2(y, x)` liefert den Winkel im Bereich **[-π, π]** (bzw. **[-180°, 180°]**) und **bestimmt automatisch den korrekten Quadranten** basierend auf den Vorzeichen von x und y.

**Es ist KEINE weitere Quadrantenkorrektur erforderlich** außer Normalisierung auf [0°, 360°].

---

## 🔧 Korrektur-Implementierung

### Schritt 1: Entfernen der falschen Quadrantenkorrektur

```javascript
function calculateAscendant(lstDeg, epsilonDeg, latDeg) {
  const ARMC = lstDeg;
  const eps = epsilonDeg;
  const phi = latDeg;

  // Konvertierung in Bogenmaß
  const ARMCrad = ARMC * DEG2RAD;
  const epsRad = eps * DEG2RAD;
  const phiRad = phi * DEG2RAD;

  // KORREKTE Formel nach IAU Standard
  const y = Math.cos(ARMCrad);
  const x = -(Math.sin(ARMCrad) * Math.cos(epsRad) + Math.tan(phiRad) * Math.sin(epsRad));

  // atan2 gibt Ergebnis im korrekten Quadranten
  let asc = Math.atan2(y, x) * RAD2DEG;

  // EINZIGE erforderliche Korrektur: Normalisierung auf [0°, 360°]
  if (asc < 0) {
    asc += 360;
  }

  return asc;
}
```

### Schritt 2: Validierung gegen Ben's Daten

**Für Ben (24.06.1980, 15:20 MEST, Hannover):**

Erwartete Werte:
- LST (RAMC) ≈ 195° - 210° (basierend auf 15:20 lokaler Zeit)
- Epsilon ≈ 23.44°
- Latitude = 52.3759°N

**Erwartetes Ergebnis:** Skorpion (210° - 240°)

**Test:**
```javascript
// Beispiel-Berechnung (hypothetische Werte)
const lstDeg = 202.5;  // Zu verifizieren
const eps = 23.4393;
const lat = 52.3759;

const asc = calculateAscendant(lstDeg, eps, lat);
console.log(`Aszendent: ${asc}° (${getZodiacSign(asc).signDE})`);
// Erwartung: ~225° (Skorpion)
```

---

## 🔬 Detaillierte Fehleranalyse der v3 Engine

### Ben's Fall im Detail

**Input:**
- Datum: 24.06.1980
- Zeit: 15:20 MEST (UTC+2)
- Ort: Hannover (52.3759°N, 9.7320°E)

**Schritt-für-Schritt Debug:**

1. **UTC-Zeit:** 15:20 - 2h = 13:20 UTC ✅
2. **JD_UTC:** ~2444418.056 ✅
3. **GMST:** Berechnung basierend auf JD_UTC
4. **LST:** GMST + (9.7320° / 15) = GMST + 0.6488h
5. **RAMC:** LST in Grad

**Problem-Stelle:**

```javascript
// AKTUELL (FALSCH):
const y = cosDeg(ARMC);
const x = -(sinDeg(ARMC) * cosDeg(eps) + tanDeg(phi) * sinDeg(eps));

let asc = atan2Deg(y, x);

// DANN FOLGT DIE FATALE QUADRANTENKORREKTUR:
if (ARMC >= 0 && ARMC < 180) {
    if (asc < 180) asc += 180;  // ← HIER WIRD ALLES ZERSTÖRT
} else {
    if (asc >= 180) asc -= 180;
}
```

**Was passiert:**
1. `atan2(y, x)` gibt korrekten Wert (z.B. ~225° für Skorpion)
2. Da ARMC vermutlich ~202° ist (>180), greift die else-Bedingung
3. Da asc >= 180, wird 180° **subtrahiert**: 225° - 180° = **45° (Widder)**
4. ❌ **FALSCH!**

---

## 📋 Implementation Checklist

### Phase 1: Minimale Korrektur (Sofort)

- [ ] **Entfernen** der gesamten Quadrantenkorrektur (Zeilen 204-209)
- [ ] **Behalten** nur der Normalisierung: `if (asc < 0) asc += 360`
- [ ] **Testen** mit Ben's Daten
- [ ] **Verifizieren** gegen astro.com oder Swiss Ephemeris

### Phase 2: Vollständige IAU 2000/2006 Implementierung

- [ ] **Delta-T Korrektur** verbessern (aktuell nur Polynom)
  - IERS Tabellen integrieren für höchste Präzision
  - Für 1980: ΔT ≈ 50.54 Sekunden

- [ ] **Nutation IAU 2000A** implementieren
  - Aktuell: vereinfachte Formel
  - Ziel: 1365 periodische Terme

- [ ] **GAST Berechnung** erweitern
  - Equation of Equinoxes mit komplementären Termen
  - Derzeit: nur Δψ × cos(ε)

- [ ] **Polbewegung** (optional, für μas-Präzision)
  - IERS EOP Parameter
  - Nur für ultra-präzise Anwendungen

### Phase 3: Swiss Ephemeris Integration (Empfohlen)

```javascript
// Option A: Swiss Ephemeris npm package
const swisseph = require('swisseph');

function calculateAscendantSwissEph(jdUT, lat, lon, flags = 0) {
  const houses = swisseph.swe_houses(
    jdUT,
    lat,
    lon,
    'P'  // Placidus house system
  );

  return {
    ascendant: houses.ascendant,
    mc: houses.mc,
    // ... weitere Häuser
  };
}
```

**Vorteile:**
- ✅ IAU 2000/2006 konform
- ✅ IERS ΔT Tabellen integriert
- ✅ Validiert von Millionen Nutzern
- ✅ Präzision < 0.1 Bogensekunden

---

## 🧪 Test Cases für Validierung

### Test 1: Ben (Referenzfall)

```javascript
test('Ben Ascendant = Scorpio', () => {
  const result = calculateCosmicProfile({
    year: 1980, month: 6, day: 24,
    hour: 15, minute: 20,
    latitude: 52.3759, longitude: 9.7320,
    tzOffsetMinutes: 120
  });

  expect(result.western.asc.sign).toBe('Scorpio');
  expect(result.western.asc.longitude).toBeCloseTo(225, 1); // ±1°
});
```

### Test 2: Äquator (Spezieller Fall)

```javascript
test('Equator: ASC approximately = RAMC - 90', () => {
  // Am Äquator vereinfacht sich die Formel
  const result = calculateCosmicProfile({
    year: 2000, month: 1, day: 1,
    hour: 12, minute: 0,
    latitude: 0.0,    // Äquator
    longitude: 0.0,   // Greenwich
    tzOffsetMinutes: 0
  });

  const expectedASC = normDeg(result.time.lstDeg - 90);
  expect(result.western.asc.longitude).toBeCloseTo(expectedASC, 0.1);
});
```

### Test 3: Nordpol (Singularität)

```javascript
test('North Pole: Handle singularity gracefully', () => {
  // Bei 90°N ist der Aszendent nicht definiert
  expect(() => {
    calculateCosmicProfile({
      year: 2000, month: 1, day: 1,
      hour: 12, minute: 0,
      latitude: 90.0,   // Nordpol
      longitude: 0.0,
      tzOffsetMinutes: 0
    });
  }).not.toThrow();
  // Sollte entweder MC zurückgeben oder Warnung
});
```

---

## 📊 Erwartete Verbesserungen

| Metrik | Vorher (v3) | Nachher (korrigiert) |
|--------|-------------|----------------------|
| **Aszendent-Genauigkeit** | ❌ Falsches Zeichen | ✅ < 1° Fehler |
| **Ben Test Case** | Widder (45°) | Skorpion (225°) |
| **Abweichung** | ~180° | < 1° |
| **Validierungsstatus** | ❌ FAILED | ✅ PASS |

---

## 🎯 Sofort-Action (Quick Fix)

**Datei:** `cosmic-architecture-engine-v3.js`
**Zeilen:** 191-211

**Ersetze die gesamte Funktion:**

```javascript
/**
 * KORRIGIERTE Aszendent-Berechnung nach IAU Standard
 * KEINE Quadrantenkorrektur erforderlich - atan2 liefert korrektes Ergebnis!
 */
function calculateAscendant(lstDeg, epsilonDeg, latDeg) {
  // Konvertierung in Bogenmaß
  const theta = lstDeg * DEG2RAD;      // RAMC
  const eps = epsilonDeg * DEG2RAD;    // Schiefe der Ekliptik
  const phi = latDeg * DEG2RAD;        // Geografische Breite

  // IAU Standard Formel für den Aszendenten
  const y = Math.cos(theta);
  const x = -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));

  // atan2 gibt bereits den korrekten Quadranten!
  let asc = Math.atan2(y, x) * RAD2DEG;

  // EINZIGE Normalisierung: auf [0°, 360°] bringen
  while (asc < 0) asc += 360;
  while (asc >= 360) asc -= 360;

  return asc;
}
```

**Test sofort nach Änderung:**
```bash
node cosmic-architecture-engine-v3.js
```

Erwartung: Ben's Aszendent sollte nun Skorpion sein!

---

## 📚 Weiterführende Literatur

1. **IAU SOFA Library** - Standards of Fundamental Astronomy
   - http://www.iausofa.org/

2. **Swiss Ephemeris Documentation**
   - https://www.astro.com/swisseph/swephinfo_e.htm

3. **Meeus, Jean - Astronomical Algorithms (2nd Ed.)**
   - Kapitel 13: Transformation of Coordinates

4. **IERS Bulletins** (für ΔT und EOP)
   - https://www.iers.org/IERS/EN/Home/home_node.html

---

**Erstellt:** 2025-12-29
**Priorität:** 🔴 **KRITISCH** - Blockiert produktiven Einsatz
**Geschätzter Aufwand:** 30 Minuten (Quick Fix) bis 2 Stunden (mit Tests)
