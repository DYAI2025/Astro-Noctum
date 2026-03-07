# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cosmic Architecture Engine v3** - A deterministic astrological calculation engine that fuses Western and Eastern (Ba Zi / Four Pillars) astrology systems. This is a computational library for precise astronomical and astrological calculations with **Li Wei integration** following the DYAI Prime Directive: *Wahrheit > Nützlichkeit > Schönheit* (Truth > Usefulness > Beauty).

## Core Architecture

### Main Engine Files

1. **cosmic-architecture-engine-v3.js** - Production-ready v3 engine with Li Wei integration
   - Implements validated Day Pillar offset of 49 (critical!)
   - Includes quadrant-corrected Ascendant calculation
   - Full Element Analysis with Wu Xing cycles
   - Fusion synthesis between Western and Eastern systems

2. **astro-fusion-engine.js** - Earlier fusion framework implementation
   - Contains fundamental Ba Zi calculation algorithms
   - Implements Five Tigers (五虎遁) and Five Rats (五鼠遁) formulas
   - Element vector quantification system

3. **astromirror_partnership_pdf.py** - PDF generation tool for partnership analyses
   - Generates premium 8-page partnership reports
   - Uses template from astromirror_partnership_template.json

### Documentation Files

- **BaZi_Western_Fusion_Framework.md** - Complete mathematical framework (1,284 lines)
  - Detailed Wu Xing mathematics and graph theory
  - Time conversion algorithms (Julian Date, GMST, LST, etc.)
  - Ba Zi pillar calculation formulas
  - Fusion methodology and API endpoints

- **COSMIC_ENGINE_V3_VALIDATION.md** - Validation report confirming production readiness
- **COSMIC_ENGINE_CALIBRATION_REPORT.md** - Day Pillar offset calibration details

## Critical Implementation Details

### 1. Day Pillar Calculation (CRITICAL)

**Always use offset 49** - validated against authoritative Chinese sources:
```javascript
const DAY_PILLAR_OFFSET = 49;
const idx60 = mod(JDN + DAY_PILLAR_OFFSET, 60);
```
❌ v2 used offset 58 (incorrect)
✅ v3 uses offset 49 (validated)

### 2. Ba Zi Pillars Structure

Each pillar consists of:
- **Heavenly Stem (天干)** - 10 variants, determines primary element
- **Earthly Branch (地支)** - 12 variants, corresponds to Chinese zodiac animals

Four Pillars represent:
- **Year (年柱)** - Society, community, ancestral energy
- **Month (月柱)** - Career, family, seasonal quality
- **Day (日柱)** - Self, identity (Day Master is the core)
- **Hour (時柱)** - Inner motivation, children, expression

### 3. Time Systems

The engine handles multiple time systems:
- **JD_UTC** - Universal Time Coordinated
- **JD_TT** - Terrestrial Time (JD_UTC + ΔT)
- **LST** - Local Sidereal Time (for Ascendant calculation)
- **TST** - True Solar Time (for Hour Pillar)

### 4. Solar Terms (節氣 Jieqi)

**Li Chun (立春)** marks the astrological new year:
- Occurs when solar longitude λ☉ = 315°
- Typically around February 4th
- Birth before Li Chun uses previous year for Year Pillar

Solar months are 30° segments starting at 315° (not calendar months).

### 5. Wu Xing (五行) - Five Elements

Element relationships:
- **Generating Cycle (生)**: Wood→Fire→Earth→Metal→Water→Wood
- **Controlling Cycle (克)**: Wood→Earth→Water→Fire→Metal→Wood

Element weights in analysis:
- Day Master (Day Stem): 3.0
- Day Branch: 2.0
- Month Stem/Branch: 1.5
- Hour Stem/Branch: 1.0
- Year Stem/Branch: 0.5

### 6. Western-Eastern Fusion Points

**Common ground:**
- Julian Date (JD) as universal time standard
- Solar longitude (λ☉) bridges both systems:
  - Western: 12 zodiac signs (30° each, starting at 0°)
  - Eastern: 12 solar months (30° each, starting at 315°)

**Planet-to-Wu Xing mapping:**
```javascript
Sun: Fire
Moon: Water
Mercury: Metal (communication, precision)
Venus: Wood (harmony, relationships)
Mars: Fire (action)
Jupiter: Wood (expansion)
Saturn: Earth (structure)
```

## Running Tests

The v3 engine includes built-in tests:
```bash
node cosmic-architecture-engine-v3.js
```

This runs three validation tests:
1. **Ben** (calibration vector) - validates Day Pillar offset
2. **Vincent** (original test) - confirms corrections from v2
3. **Li Chun edge case** - validates year boundary handling

## Key Formulas

### Julian Date Calculation
```javascript
JD = floor(365.25 * (Y + 4716)) + floor(30.6001 * (M + 1)) + D + B - 1524.5
```

### Ascendant (with quadrant correction)
```javascript
tan(ASC) = cos(θ_LST) / [-sin(θ_LST) × cos(ε) - tan(φ) × sin(ε)]
// Must apply quadrant correction based on ARMC
```

### Harmony Index (Fusion Quality)
```javascript
H = cosine_similarity(western_vector, eastern_vector)
// Range: 0-1, higher = more coherent
```

## Common Development Tasks

### Calculating a Full Profile
```javascript
const profile = calculateCosmicProfile({
  year: 1980, month: 6, day: 24,
  hour: 15, minute: 20,
  latitude: 52.3759,
  longitude: 9.7320,
  tzOffsetMinutes: 120  // CEST = UTC+2
});
```

### Accessing Key Components
```javascript
profile.western.sun        // Western sun sign
profile.bazi.day          // Day Pillar (Day Master)
profile.fusion.elementVector  // Combined element distribution
profile.liWei.interpretation  // Li Wei analysis
```

### Validation
All profiles include `meta.valid` and `meta.warnings` - always check these before using results.

## Important Constraints

1. **Placidus houses fail above 66° latitude** - use equal house system as fallback
2. **Moon calculations are simplified** - accuracy ±2° (sufficient for sign determination)
3. **Li Chun is computed iteratively** - not from lookup tables (ensures accuracy across centuries)
4. **Hidden Stems in Branches** - branches contain multiple stems with decreasing weights

## Design Principles (Li Wei Framework)

Following the **DYAI Prime Directive**:
1. **Wahrheit (Truth)** - No hallucinations, traceable calculations
2. **Nützlichkeit (Usefulness)** - Actionable insights, practical empowerment
3. **Schönheit (Beauty)** - Elegant code, clear structure

## File Organization

```
cosmicEnginge_v3/
├── cosmic-architecture-engine-v3.js    # Main production engine
├── astro-fusion-engine.js              # Earlier implementation
├── astromirror_partnership_pdf.py      # PDF generation
├── astromirror_partnership_template.json  # Template structure
├── BaZi_Western_Fusion_Framework.md    # Complete mathematical docs
├── COSMIC_ENGINE_V3_VALIDATION.md      # Validation report
└── COSMIC_ENGINE_CALIBRATION_REPORT.md # Calibration details
```

## Notes on Astrology Systems

### Western Astrology
- **Tropical Zodiac** - aligned with seasons, not constellations
- **Houses** - life areas (1st = self, 7th = partnerships, 10th = career, etc.)
- **Aspects** - angular relationships between planets (conjunction, trine, square, etc.)

### Ba Zi (Eastern)
- **Sexagenary Cycle** - 60-unit cycle combining 10 stems × 12 branches
- **Day Master** - the Heavenly Stem of Day Pillar = core identity
- **Luck Pillars (大運)** - not yet implemented in this version
- **Annual Pillars (流年)** - can be calculated by applying the year formula to current year

## Future Extensions

The framework is designed to be extensible for:
- Zi Wei Dou Shu (紫微斗數) - complex Chinese system with 12+ stars
- Vedic Dashas - planetary periods
- Transits analysis - current planets vs natal chart
- Swiss Ephemeris integration - for highest precision planetary positions

## Version History

- **v1.0**: Basic fusion engine
- **v2.0**: Introduced fusion framework (Day Pillar offset 58 - incorrect)
- **v3.0**: Li Wei integration, corrected Day Pillar offset to 49, production-ready
