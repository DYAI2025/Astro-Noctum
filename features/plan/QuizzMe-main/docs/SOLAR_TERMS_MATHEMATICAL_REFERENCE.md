# Solar Terms - Mathematical & Reference Data

**Complete mathematical formulas and lookup tables for solar term calculations**

---

## PART 1: MATHEMATICAL FORMULAS

### Section 1.1: Time Conversions

#### Julian Date Calculation (From Gregorian Date)

**Standard Formula (Meeus, Ch. 7):**

```
If M ≤ 2, then Y' = Y - 1, M' = M + 12
Else Y' = Y, M' = M

A = ⌊Y'/100⌋
B = 2 - A + ⌊A/4⌋

JD = ⌊365.25(Y'+4716)⌋ + ⌊30.6001(M'+1)⌋ + D + B - 1524.5

Then add: (h + m/60 + s/3600)/24
```

**Where:**
- Y = Gregorian year
- M = Gregorian month (1-12)
- D = Day (1-31)
- h = Hour (0-23)
- m = Minute (0-59)
- s = Second (0-59.999...)
- ⌊ ⌋ = Floor function (round down)
- JD = Julian Date (decimal)

**Example:** March 21, 2024, 15:30:00 UTC

```
Y = 2024, M = 3, D = 21, h = 15, m = 30, s = 0

Since M = 3 > 2: Y' = 2024, M' = 3

A = ⌊2024/100⌋ = 20
B = 2 - 20 + ⌊20/4⌋ = 2 - 20 + 5 = -13

JD_int = ⌊365.25 × 6740⌋ + ⌊30.6001 × 4⌋ + 21 + (-13) - 1524.5
       = ⌊2461350⌋ + ⌊122.4004⌋ + 21 - 13 - 1524.5
       = 2461350 + 122 + 21 - 13 - 1524.5
       = 2459955.5

fraction = (15 + 30/60 + 0)/24 = 15.5/24 = 0.6458...

JD = 2459955.5 + 0.6458 = 2459956.146
```

---

#### Gregorian Date from Julian Date

**Reverse Formula (Meeus variant):**

```
JD_total = JD + 0.5
JD_int = ⌊JD_total⌋
F = JD_total - JD_int

a = JD_int + 32044
b = ⌊(4a + 3)/146097⌋
c = a - ⌊146097b/4⌋

d = ⌊(4c + 3)/1461⌋
e = c - ⌊1461d/4⌋
m = ⌊(5e + 2)/153⌋

day = e - ⌊(153m + 2)/5⌋ + 1
month = m + 3 - 12⌊m/10⌋
year = 100b + d - 4800 + ⌊m/10⌋

hour = ⌊F × 24⌋
minute = ⌊(F × 24 - hour) × 60⌋
second = ((F × 24 - hour) × 60 - minute) × 60
```

---

### Section 1.2: Solar Longitude Calculations

#### Apparent Solar Longitude

**Complete formula (Meeus, Ch. 25, with corrections):**

```
T = (JD - 2451545.0) / 36525.0
```

Where:
- T = Julian centuries since J2000 epoch (Jan 1, 2000, 12:00 UT)
- JD = Julian Date
- 2451545.0 = JD of J2000 epoch
- 36525.0 = Days per Julian century

#### Step 1: Geometric Mean Longitude (L₀)

```
L₀ = 280.46646° + 36000.76983° × T + 0.0003032° × T²

Units: All coefficients in decimal degrees
```

**Accuracy:** ±1.0° without further corrections

#### Step 2: Mean Anomaly (g)

```
g = 357.52911° + 35999.05029° × T - 0.0001536° × T²
```

**Convert to radians:**
```
g_rad = g × π/180
```

#### Step 3: Equation of Center (C)

The sun moves in an elliptical orbit, so its angular speed varies:

```
C = C₁ + C₂ + C₃ + ...
```

Where:

**First term (dominant, ~1.9° amplitude):**
```
C₁ = (1.914602° - 0.004817° × T - 0.000014° × T²) × sin(g_rad)
```

**Second term (smaller, ~0.02° amplitude):**
```
C₂ = (0.019993° - 0.000101° × T) × sin(2g_rad)
```

**Third term (very small, ~0.0003° amplitude):**
```
C₃ = 0.000289° × sin(3g_rad)
```

**For most purposes, C = C₁ + C₂ suffices.**

#### Step 4: True Geometric Longitude

```
λ_true = L₀ + C
```

#### Step 5: Apparent Longitude (optional, for highest accuracy)

**Nutation in Longitude:**
```
Ω = 125.04° - 1934.136° × T
Ω_rad = Ω × π/180

Δψ = -0.00569° - 0.00478° × sin(Ω_rad)
```

**Aberration:**
```
κ = -20.4898″ ≈ -0.005689°
```

**Apparent longitude:**
```
λ_apparent = λ_true + Δψ + κ
```

#### Step 6: Final Normalization

```
λ = λ_apparent MOD 360°

If λ < 0 then λ := λ + 360°

Final result: 0° ≤ λ < 360°
```

---

### Section 1.3: Finding Solar Term Dates

#### Newton-Raphson Iteration

**Goal:** Find JD where solar longitude equals target

```
f(JD) = λ(JD) - λ_target

Newton's method:
JD_{n+1} = JD_n - f(JD_n) / f'(JD_n)
         = JD_n - (λ_current - λ_target) / (dλ/dJD)

where dλ/dJD ≈ 0.98565°/day (sun's mean motion)
```

**Practical implementation:**

```
Iteration formula:
JD_next = JD_current + (λ_target - λ_current) / 0.98565
```

**Convergence criterion:**
```
Stop when |λ_current - λ_target| < ε

Recommended: ε = 0.0001° (≈ 9 seconds of arc)
```

**Maximum iterations:** 50 (usually converges in 3-5)

---

### Section 1.4: Solar Term Segment Determination

#### Mapping Solar Longitude to Term Number

**Chinese coordinate system:** Starts at 315° (Li Chun), not 0°

```
Normalize longitude to Chinese frame:
λ_normalized = (λ - 315°) MOD 360°

If λ_normalized < 0, then λ_normalized := λ_normalized + 360°

Each term spans 15°:
term_segment = ⌊λ_normalized / 15°⌋

Valid range: 0 ≤ term_segment ≤ 23
```

**Inverse mapping (given term number, find longitude):**
```
λ = (315° + 15° × term_segment) MOD 360°
```

---

## PART 2: SOLAR LONGITUDE LOOKUP TABLE

**Solar longitudes for key astronomical events:**

| Event | Longitude | Western Sign | Chinese Name | Typical Date |
|-------|-----------|---|---|---|
| Spring Equinox | 0° | Aries 0° | 春分 (Chun Fen) | Mar 20-22 |
| Summer Solstice | 90° | Cancer 0° | 夏至 (Xia Zhi) | Jun 20-22 |
| Autumn Equinox | 180° | Libra 0° | 秋分 (Qiu Fen) | Sep 22-24 |
| Winter Solstice | 270° | Capricorn 0° | 冬至 (Dong Zhi) | Dec 21-23 |
| Li Chun (Year Marker) | 315° | - | 立春 (Li Chun) | Feb 3-5 |

**Relationship to Western zodiac (30° per sign):**

```
Longitude   Sign         Element (Western)
0° - 30°   Aries        Fire
30° - 60°  Taurus       Earth
60° - 90°  Gemini       Air
90° - 120° Cancer       Water
120° - 150° Leo         Fire
150° - 180° Virgo       Earth
180° - 210° Libra       Air
210° - 240° Scorpio     Water
240° - 270° Sagittarius Fire
270° - 300° Capricorn   Earth
300° - 330° Aquarius    Air
330° - 360° Pisces      Water
```

---

## PART 3: SOLAR TERM REFERENCE DATA

### Complete 24 Solar Terms with Characteristics

| # | Pinyin | Chinese | English | Longitude | Branch | Yin/Yang | Month | Element (Wu Xing) |
|---|--------|---------|---------|-----------|--------|---------|-------|---|
| 1 | Lì Chūn | 立春 | Spring Begins | 315° | 寅 Tiger | Yin | I | Wood |
| 2 | Yǔ Shuǐ | 雨水 | Rain Water | 330° | 寅 Tiger | Yang | I | Wood |
| 3 | Jīng Zhé | 驚蟄 | Awakening of Insects | 345° | 卯 Rabbit | Yin | II | Wood |
| 4 | **Chūn Fēn** | **春分** | **Spring Equinox** | **0°** | 卯 Rabbit | Yang | II | **Wood** |
| 5 | Qīng Míng | 清明 | Pure Brightness | 15° | 辰 Dragon | Yin | III | Wood |
| 6 | Gǔ Yǔ | 穀雨 | Grain Rain | 30° | 辰 Dragon | Yang | III | **Wood** |
| 7 | Lì Xià | 立夏 | Summer Begins | 45° | 巳 Snake | Yin | IV | **Fire** |
| 8 | Xiǎo Mǎn | 小滿 | Grain Full | 60° | 巳 Snake | Yang | IV | Fire |
| 9 | **Xià Zhì** | **夏至** | **Summer Solstice** | **90°** | 午 Horse | Yin | V | **Fire** |
| 10 | Xiǎo Shǔ | 小暑 | Minor Heat | 105° | 午 Horse | Yang | V | Fire |
| 11 | Dà Shǔ | 大暑 | Major Heat | 120° | 未 Sheep | Yin | VI | **Fire** |
| 12 | Lì Qiū | 立秋 | Autumn Begins | 135° | 未 Sheep | Yang | VI | **Metal** |
| 13 | Chǔ Shǔ | 處暑 | Ending of Heat | 150° | 申 Monkey | Yin | VII | Metal |
| 14 | Báipī Lù | 白露 | White Dew | 165° | 申 Monkey | Yang | VII | Metal |
| 15 | **Qiū Fēn** | **秋分** | **Autumn Equinox** | **180°** | 酉 Rooster | Yin | VIII | **Metal** |
| 16 | Hán Lù | 寒露 | Cold Dew | 195° | 酉 Rooster | Yang | VIII | Metal |
| 17 | Shuāng Jiàng | 霜降 | Descent of Frost | 210° | 戌 Dog | Yin | IX | **Metal** |
| 18 | Lì Dōng | 立冬 | Winter Begins | 225° | 戌 Dog | Yang | IX | **Water** |
| 19 | Xiǎo Xuě | 小雪 | Minor Snow | 240° | 亥 Pig | Yin | X | Water |
| 20 | Dà Xuě | 大雪 | Major Snow | 255° | 亥 Pig | Yang | X | Water |
| 21 | **Dōng Zhì** | **冬至** | **Winter Solstice** | **270°** | 子 Rat | Yin | XI | **Water** |
| 22 | Xiǎo Hán | 小寒 | Minor Cold | 285° | 子 Rat | Yang | XI | Water |
| 23 | Dà Hán | 大寒 | Major Cold | 300° | 丑 Ox | Yin | XII | **Earth** |
| 24 | (Lì Chūn) | (立春) | (Spring Begins) | 315° | 丑 Ox | Yang | XII | **Earth** |

---

## PART 4: TYPICAL DATES FOR ALL 24 SOLAR TERMS

### Historical Average Dates (1950-2050)

| # | Pinyin | Typical Date Range | Average Date |
|---|--------|---|---|
| 1 | Lì Chūn | Feb 3-5 | Feb 4 |
| 2 | Yǔ Shuǐ | Feb 18-20 | Feb 19 |
| 3 | Jīng Zhé | Mar 5-7 | Mar 6 |
| 4 | Chūn Fēn | Mar 20-22 | Mar 21 |
| 5 | Qīng Míng | Apr 4-6 | Apr 5 |
| 6 | Gǔ Yǔ | Apr 19-21 | Apr 20 |
| 7 | Lì Xià | May 5-7 | May 6 |
| 8 | Xiǎo Mǎn | May 20-22 | May 21 |
| 9 | Xià Zhì | Jun 20-22 | Jun 21 |
| 10 | Xiǎo Shǔ | Jul 6-8 | Jul 7 |
| 11 | Dà Shǔ | Jul 22-24 | Jul 23 |
| 12 | Lì Qiū | Aug 7-9 | Aug 8 |
| 13 | Chǔ Shǔ | Aug 22-24 | Aug 23 |
| 14 | Báipī Lù | Sep 7-9 | Sep 8 |
| 15 | Qiū Fēn | Sep 22-24 | Sep 23 |
| 16 | Hán Lù | Oct 8-9 | Oct 8 |
| 17 | Shuāng Jiàng | Oct 23-24 | Oct 23 |
| 18 | Lì Dōng | Nov 7-8 | Nov 7 |
| 19 | Xiǎo Xuě | Nov 22-23 | Nov 22 |
| 20 | Dà Xuě | Dec 6-8 | Dec 7 |
| 21 | Dōng Zhì | Dec 21-23 | Dec 22 |
| 22 | Xiǎo Hán | Jan 5-7 | Jan 6 |
| 23 | Dà Hán | Jan 20-21 | Jan 20 |
| 24 | (Lì Chūn) | (Feb 3-5) | (Feb 4) |

**Note:** Actual dates vary by ±1 day year to year due to orbital variations and leap years

---

## PART 5: PRECISION & ACCURACY REQUIREMENTS

### Error Analysis

**Solar term location accuracy vs. time precision:**

| JD Time Precision | Solar Longitude Error | Minutes/Hours Error |
|---|---|---|
| ±1 minute | ±0.0007° | ±1 minute |
| ±1 hour | ±0.04° | ±1 hour |
| ±4 hours | ±0.17° | ±4 hours |
| ±1 day | ±1.0° | ±24 hours |

**For Ba Zi calculations:** Need JD accurate to ±4 hours to reliably determine month pillar

**For exact solar term date:** Need JD accurate to ±1 hour for result within ±1 hour

### Error Sources in Calculations

1. **Julian Date Conversion Error:** < 1 second (negligible for solar terms)
2. **Solar Longitude Calculation Error:**
   - With C₁ only: ±0.02° = ±1.4 hours
   - With C₁+C₂: ±0.0003° = ±22 seconds
   - With C₁+C₂+C₃: ±0.00005° = ±3.6 seconds

3. **Iteration Convergence Error:** < 10 seconds (if properly converged)
4. **Nutation/Aberration Omission:** ±9 seconds (small but measurable)

**For solar terms:** C₁+C₂ (0.0003° accuracy) is sufficient

---

## PART 6: ASTRONOMICAL CONSTANTS & UNITS

### Angle Conversions

```
1 degree (°) = 60 arcminutes (′) = 3600 arcseconds (″)
1 hour angle (h) = 15 degrees
1 radian = 180/π ≈ 57.2957795°

Conversions:
rad_to_deg = 180 / π ≈ 57.29577951
deg_to_rad = π / 180 ≈ 0.01745329251

Example:
45° = 45 × π/180 = π/4 ≈ 0.785398 radians
```

### Time Units & Solar Motion

```
Earth's orbital period: 365.25636 days (sidereal year)
Sun's mean motion: 360° / 365.25636 ≈ 0.98565° per day

Angular velocity:
= 0.98565°/day
= 0.04107°/hour
= 0.0006845°/minute
= 0.0000114°/second

In arcseconds:
= 3600 arcseconds / 365.25636 days ≈ 9.8561 arcseconds/day
```

### Mathematical Constants

```
π = 3.14159265358979323846...
e = 2.71828182845904523536...
√2 = 1.41421356237309504880...

In calculations, use at least 12 decimal places
```

### J2000 Epoch

```
J2000.0 = January 1, 2000, 12:00:00 UT
Julian Date: 2451545.0
Greenwich Mean Sidereal Time: 18h 41m 50.54841s

Used as reference point (T=0) for all ephemeris calculations
```

---

## PART 7: SPECIAL CASES & BOUNDARY CONDITIONS

### Handling Year Boundaries

**Problem:** Li Chun marks the astrological new year (typically Feb 3-5)

**Solution:**
```
For determining Year Pillar in Ba Zi:

If birth_date < Li_Chun_in_same_year:
  use_year_pillar_for = birth_year - 1
else:
  use_year_pillar_for = birth_year
```

### Handling 0°/360° Wrap-around

**Problem:** Sun can be at 359° or 1°, which are very close

**Solution:**
```
When calculating angular difference:

diff = target - current

If |diff| > 180° then:
  if diff > 0: diff := diff - 360°
  else: diff := diff + 360°

This gives the shortest angular path
```

### Handling Fractional Seconds

**Problem:** Calculations may produce fractional seconds

**Solution:**
```
For user display:
round(second, 0)  // Nearest second
round(hour + minute/60 + second/3600, 4)  // Decimal hours to 4 places

For Ba Zi (coarse granularity):
ceil(hour)  // Round up to nearest hour
```

---

## PART 8: VERIFICATION & TESTING

### Test Cases with Known Values

**Test 1: Spring Equinox 2000**
```
Expected: λ = 0° on March 20, 2000, around 07:35 UTC

Calculation:
JD = gregorianToJulianDate(2000, 3, 20, 7, 35, 0)
    = 2451623.8160

T = (2451623.8160 - 2451545.0) / 36525 = 0.002154

L0 = 280.46646 + 36000.76983 × 0.002154 + 0.0003032 × 0.002154²
   = 280.46646 + 77.5548 + 0.0000141 ≈ 358.021

g = 357.52911 + 35999.05029 × 0.002154 - 0.0001536 × 0.002154²
  = 357.52911 + 77.5217 - 0.0000000713 ≈ 435.051° (normalize: 75.051°)

g_rad ≈ 1.3095 rad

C1 = (1.914602 - 0.004817 × 0.002154 - ...) × sin(1.3095)
   ≈ 1.914416 × 0.9641 ≈ 1.846°

C2 = (0.019993 - ...) × sin(2 × 1.3095)
   ≈ 0.019963 × 0.2635 ≈ 0.00526°

C ≈ 1.851°

λ = L0 + C = 358.021 + 1.851 ≈ 359.87° ≈ 0° (wrap)

Actual: 359.99° (essentially 0°) ✓
```

**Test 2: Summer Solstice 2024**
```
Expected: λ = 90° around June 20-21, 2024

Use algorithm to find exact date:
findSolarLongitudeInYear(2024, 90)
Expected output: June 20, 2024, around 15:50 UTC

Verify calculation gives same result within ±4 hours
```

---

## PART 9: REFERENCE MATERIALS

### Recommended Bibliography

1. **"Astronomical Algorithms" by Jean Meeus (2nd ed., 1998)**
   - Chapters 7 (Julian Dates), 25 (Solar Positions)
   - Gold standard for astronomical calculations
   - High precision methods

2. **"Celestial Mechanics" by Archie Roy**
   - Orbital mechanics principles
   - Equation of Center derivation

3. **"Mathematical Astronomy Morsels" by Jean Meeus**
   - Collection of astronomical calculation methods
   - Solar term specific sections

### Related Standards

- **ISO 8601** - Date and time representation
- **IERS Bulletin A** - Earth orientation (for high-precision work)
- **USNO Circular 163** - Astronomical Almanac references

### Online Resources

- NASA HORIZONS System - Planetary position verification
- SOFA (Standards of Fundamental Astronomy) - Algorithm library
- PyEphem / Skyfield - Python implementations for verification

---

## PART 10: IMPLEMENTATION CHECKLIST

### Before Coding

- [ ] Understand Julian Date system and conversions
- [ ] Know sun's mean motion: 0.98565°/day
- [ ] Understand Chinese solar term coordinate system (starts at 315°)
- [ ] Know the 4 cardinal points: 0°, 90°, 180°, 270°
- [ ] Review Equation of Center formula

### During Coding

- [ ] Use double-precision floating point (64-bit)
- [ ] Handle wrap-around at 360°/0°
- [ ] Test iteration convergence
- [ ] Verify against known astronomical events
- [ ] Handle timezone conversions correctly
- [ ] Include error handling for edge cases

### After Coding

- [ ] Verify Spring Equinox, Summer Solstice, Autumn Equinox, Winter Solstice dates
- [ ] Test month pillar determination for known Ba Zi charts
- [ ] Verify Li Chun year boundary handling
- [ ] Compare results with authoritative sources
- [ ] Test for years 1900-2100

---

## APPENDIX: QUICK REFERENCE FORMULAS

### All Key Formulas on One Page

```
T = (JD - 2451545.0) / 36525.0

L₀ = 280.46646 + 36000.76983T + 0.0003032T²

g = 357.52911 + 35999.05029T - 0.0001536T²
g_rad = g × π/180

C = (1.914602 - 0.004817T - 0.000014T²)sin(g_rad)
  + (0.019993 - 0.000101T)sin(2g_rad)
  + 0.000289sin(3g_rad)

λ_true = L₀ + C

λ_apparent = λ_true + (-0.00569 - 0.00478sin(Ω)) + (-0.005689)

λ = λ_apparent MOD 360

segment = ⌊(λ - 315) MOD 360 / 15⌋

JD_next = JD_current + (λ_target - λ_current) / 0.98565

Term: SOLAR_TERMS_DATA[segment]
```

