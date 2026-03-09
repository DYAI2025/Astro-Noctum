# FAIL-CLOSED PRODUCTION MODE

## ✅ Abnahme-Checkliste

Die Cosmic Architecture Engine ist **vollständig gefixt** wenn ALLE folgenden Punkte erfüllt sind:

### 1. ✅ Kein Fallback in Production

```bash
# RICHTIG (Production):
NODE_ENV=production
COSMIC_STRICT_MODE=1
# COSMIC_PRECISION_FALLBACK NICHT SETZEN

# FALSCH (blockiert bei Startup):
NODE_ENV=production
COSMIC_PRECISION_FALLBACK=1  # ❌ FATAL ERROR
```

**Test:**
```javascript
// In Production Mode wirft dies einen Error beim Initialisieren:
const bridge = new PrecisionBridge({ useFallback: true });
// Error: FATAL: Fallback mode is not allowed in production
```

**Status:** ✅ **IMPLEMENTIERT**
- `precision-bridge.js:32-34` - Fatal error bei Fallback in Production
- Environment Detection: `IS_PRODUCTION = process.env.NODE_ENV === 'production'`
- `useFallback` ist nur möglich wenn `COSMIC_PRECISION_FALLBACK=1` UND nicht Production

---

### 2. ✅ Nur `validation.status="ok"` liefert Daten

```javascript
// In Strict Mode:
if (validation.status === 'error') {
  // ❌ Wirft PrecisionError
}

if (validation.status === 'warn' && strictMode) {
  // ❌ Wirft PrecisionError (warn = error in strict)
}

if (validation.status === 'ok') {
  // ✅ Liefert data.ascendant, data.houses
}
```

**Test:**
```bash
node tests/ci-gate.js
# Prüft dass nur validation.status='ok' akzeptiert wird
```

**Status:** ✅ **IMPLEMENTIERT**
- `precision-bridge.js:273-323` - `_enforceValidation()`
- Errors: Immer ablehnen
- Warnings: In strict mode ablehnen
- Nur 'ok': Durchlassen

---

### 3. ✅ Fehlende/ambige TZ führt zu Error

```javascript
// ❌ FEHLT timezone
{ year: 1980, month: 6, day: 24, hour: 15, minute: 20 }
// Wirft: PrecisionError(code='TIMEZONE_NOT_RESOLVABLE')

// ✅ MIT timezone
{ ..., timezone: 'Europe/Berlin' }
// OK

// ⚠️  UTC offset (nicht empfohlen, aber erlaubt)
{ ..., tzOffsetMinutes: 120 }
// Warnung wegen DST-Ungenauigkeit, aber rechnet
```

**DST Ambiguity:**
```javascript
// Bei DST-Übergang ohne fold Parameter:
// Python astro_precision/core/time.py wirft TimeConversionError
// Node Bridge propagiert als PrecisionError(code='CALCULATION_FAILED')

// Mit fold Parameter:
{ ..., fold: 0 }  // Erste Stunde bei Zeitumstellung
{ ..., fold: 1 }  // Zweite Stunde bei Zeitumstellung
```

**Status:** ✅ **IMPLEMENTIERT**
- `precision-bridge.js:160-166` - Timezone PFLICHT-Check
- `precision-bridge.js:224-267` - `_transformInputStrict()` - keine stillen Defaults
- `precision-bridge.js:262-264` - DST fold Parameter Support
- Python `astro_precision/core/time.py` - DST Ambiguity Detection

---

### 4. ✅ Ascendent/Häuser nur aus Swiss Ephemeris

```javascript
// SSOT = Single Source of Truth

// ❌ FALSCH (alte Version):
if (precisionFailed) {
  return calculateAscendantSimplified();  // NEIN!
}

// ✅ RICHTIG (fail-closed):
try {
  return await bridge.computeHoroscope(input);
} catch (error) {
  // In Production: Error propagieren, NICHT fallback
  throw error;
}
```

**Test:**
```bash
# Ohne Python/Swiss Ephemeris:
NODE_ENV=production node tests/ci-gate.js
# Exit Code: 2 (Setup Error)
# Message: "Swiss Ephemeris not available and fallback is disabled"
```

**Status:** ✅ **IMPLEMENTIERT**
- `precision-bridge.js:118-142` - Kein Fallback, nur Exception
- `precision-bridge.js:45-67` - checkAvailability wirft Error wenn nicht verfügbar
- Keine JavaScript-Berechnungen als Fallback möglich

---

### 5. ✅ CI blockiert bei Golden-Abweichung

```bash
# CI Gate Test:
npm run ci
# = node tests/ci-gate.js

# Prüft Golden Fixtures:
# - tests/fixtures/golden-ben.json
# - tests/fixtures/golden-test2.json

# Exit Codes:
# 0 = Alle Tests bestanden → Deploy erlaubt
# 1 = Tests fehlgeschlagen → Deploy BLOCKIERT
# 2 = Setup fehlt → Deploy BLOCKIERT
```

**Golden Fixtures:**
```json
{
  "expected": {
    "ascendant": {
      "longitude": 202.67,
      "tolerance": 0.01  // ± 0.01° = 36 Bogensekunden
    }
  }
}
```

**Test:**
```bash
npm run test:ci-gate
# Ausgabe:
# ✅ Ben - Ascendant: PASSED (diff: 0.0003°)
# ✅ Test2 - Ascendant: PASSED (diff: 0.0012°)
# ✅ CI GATE PASSED - Deployment allowed
```

**Status:** ✅ **IMPLEMENTIERT**
- `tests/ci-gate.js` - Vollständiger CI Gate
- `tests/fixtures/golden-*.json` - Golden Fixtures mit Toleranzen
- `package.json:scripts.ci` - npm run ci Hook

---

## 🚫 Was NICHT mehr möglich ist (by Design)

### 1. Stille UTC Defaults

```javascript
// ❌ VORHER (gefährlich):
timezone = input.timezone || 'UTC';  // Stiller Default!

// ✅ JETZT (fail-closed):
if (!input.timezone && !input.tzOffsetMinutes) {
  throw new PrecisionError('TIMEZONE_NOT_RESOLVABLE');
}
```

### 2. Fallback bei Precision Failure

```javascript
// ❌ VORHER (gefährlich):
try {
  return precisionCalculation();
} catch {
  return simplifiedCalculation();  // Stiller Fallback!
}

// ✅ JETZT (fail-closed):
try {
  return precisionCalculation();
} catch (error) {
  throw error;  // Propagiere Error
}
```

### 3. Warnings ignorieren

```javascript
// ❌ VORHER:
if (validation.status === 'warn') {
  console.warn('Warning, aber rechne weiter');
  return data;  // Gefährlich!
}

// ✅ JETZT (strict mode):
if (validation.status === 'warn' && strictMode) {
  throw new PrecisionError('VALIDATION_WARN_IN_STRICT');
}
```

### 4. Production ohne Swiss Ephemeris

```javascript
// ❌ VORHER:
// Engine startete, nutzte simplified math

// ✅ JETZT:
// Engine wirft Error beim Initialize:
// "Swiss Ephemeris module is not available"
```

---

## 🔧 Environment-Konfiguration

### Production (Fail-Closed)

```bash
# .env.production
NODE_ENV=production
COSMIC_STRICT_MODE=1
# COSMIC_PRECISION_FALLBACK NICHT SETZEN!
SE_EPHE_PATH=/path/to/ephemeris
```

**Verhalten:**
- ✅ Kein Fallback möglich
- ✅ Warnings sind Errors
- ✅ Timezone PFLICHT
- ✅ Nur Swiss Ephemeris

### Development (mit Fallback)

```bash
# .env.development
NODE_ENV=development
COSMIC_STRICT_MODE=0
COSMIC_PRECISION_FALLBACK=1  # Erlaubt Fallback
```

**Verhalten:**
- ⚠️  Fallback zu simplified möglich
- ⚠️  Warnings erlaubt
- ⚠️  UTC default möglich (mit Warning)
- ⚠️  Nur für lokale Tests!

### Testing (Strict)

```bash
# .env.test
NODE_ENV=test
COSMIC_STRICT_MODE=1
COSMIC_PRECISION_FALLBACK=0
```

**Verhalten:**
- ✅ Wie Production
- ✅ Kein Fallback
- ✅ Für CI/CD

---

## 📊 Validation Flow

```
Input
  ↓
[Input Validation]
  ├─ Missing fields? → PrecisionError(MISSING_REQUIRED_FIELDS)
  ├─ No timezone? → PrecisionError(TIMEZONE_NOT_RESOLVABLE)
  ├─ Invalid lat/lon? → PrecisionError(INVALID_LAT_LON)
  └─ OK → Continue
  ↓
[Python Swiss Ephemeris]
  ├─ Not available? → PrecisionError(EPHEMERIS_UNAVAILABLE)
  ├─ Calculation error? → PrecisionError(CALCULATION_FAILED)
  └─ Success → validation.status
  ↓
[Validation Gate]
  ├─ status='error'? → PrecisionError(VALIDATION_ERROR)
  ├─ status='warn' && strict? → PrecisionError(VALIDATION_WARN_IN_STRICT)
  ├─ status='ok'? → Return Data ✅
  └─ Other? → PrecisionError(VALIDATION_NOT_OK)
```

---

## 🧪 Test-Kommandos

```bash
# CI Gate (Production-Test)
npm run ci
npm run test:ci-gate

# Mit explizitem Strict Mode
npm run verify:strict

# Production Validation
npm run prod:validate

# Integration Tests (mit Fallback, Dev only)
npm run test:integration

# Setup prüfen
npm run verify:setup

# Original v3 Engine Test
npm run test:v3
```

---

## ✅ Checkliste: "Vollständig gefixt"

- [x] **1. Kein Fallback in Production** - technisch unmöglich
- [x] **2. Nur validation.status='ok'** - harte Gates
- [x] **3. Timezone PFLICHT** - keine stillen Defaults
- [x] **4. Nur Swiss Ephemeris** - SSOT
- [x] **5. CI blockiert bei Abweichung** - Golden Fixtures

**Status:** ✅ **VOLLSTÄNDIG IMPLEMENTIERT**

---

## 🚀 Deployment Checklist

Vor jedem Production Deployment:

1. **Environment Check:**
   ```bash
   echo $NODE_ENV          # = production
   echo $COSMIC_STRICT_MODE  # = 1
   echo $COSMIC_PRECISION_FALLBACK  # = (leer)
   echo $SE_EPHE_PATH      # = /path/to/ephe
   ```

2. **Dependencies Check:**
   ```bash
   cd astro-precision-horoscope
   source .venv/bin/activate
   python -c "import swisseph; print(swisseph.version)"
   ```

3. **CI Gate:**
   ```bash
   npm run ci
   # Exit Code muss 0 sein
   ```

4. **Golden Fixtures aktuell?**
   ```bash
   git log tests/fixtures/
   # Sicherstellen dass Fixtures nicht alt sind
   ```

5. **Deploy:**
   ```bash
   # Nur wenn CI Gate = 0
   ./deploy.sh
   ```

---

## 📞 Support

**Fehler "EPHEMERIS_UNAVAILABLE":**
```bash
cd astro-precision-horoscope
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export SE_EPHE_PATH=/path/to/ephe  # optional
```

**Fehler "TIMEZONE_NOT_RESOLVABLE":**
```javascript
// Füge timezone hinzu:
{
  ...,
  timezone: 'Europe/Berlin'  // IANA timezone
}
```

**Fehler "VALIDATION_WARN_IN_STRICT":**
```
// Prüfe validation.issues:
console.log(error.details.validation.issues);
// Behebe die Ursache (z.B. DST ambiguity, cusp)
```

**CI Gate schlägt fehl:**
```bash
# Prüfe Abweichung:
npm run ci
# Wenn diff > tolerance:
# - Sind Golden Fixtures korrekt?
# - Swiss Ephemeris korrekt installiert?
# - Wurden Breaking Changes gemacht?
```

---

**Die Engine ist jetzt vollständig FAIL-CLOSED für Production! 🎉**
