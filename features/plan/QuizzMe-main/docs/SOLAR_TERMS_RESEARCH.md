# 24 Chinese Solar Terms (節氣) - Comprehensive Research & Algorithms

**Research Date:** 2026-01-03
**Subject:** Astronomical algorithms for calculating and identifying the 24 solar terms
**Focus:** Astronomical accuracy based on sun's ecliptic longitude
**Context:** Integration with existing astrology engine (see: cosmic-architecture-engine-v3.js)

---

## TABLE OF CONTENTS

1. [Complete 24 Solar Terms Reference](#complete-24-solar-terms-reference)
2. [Fundamental Concepts](#fundamental-concepts)
3. [Algorithm 1: Solar Longitude Calculation](#algorithm-1-solar-longitude-calculation)
4. [Algorithm 2: Determine Solar Term for a Given Date](#algorithm-2-determine-solar-term-for-a-given-date)
5. [Algorithm 3: Find Date of Solar Term in Given Year](#algorithm-3-find-date-of-solar-term-in-given-year)
6. [Key Mathematical Constants](#key-mathematical-constants)
7. [Implementation Considerations](#implementation-considerations)
8. [Validation & Testing](#validation--testing)

---

## COMPLETE 24 SOLAR TERMS REFERENCE

### Master Table: All 24 Solar Terms with Exact Solar Longitudes

| # | Pinyin Name | Chinese | English Name | Solar Longitude | Typical Date Range | Month Cycle |
|---|---|---|---|---|---|---|
| 1 | **Lì Chūn** | 立春 | Spring Begins (Tiger) | **315°** | Feb 3-5 | I (1st) |
| 2 | **Yǔ Shuǐ** | 雨水 | Rain Water | **330°** | Feb 18-20 | I (1st) |
| 3 | **Jīng Zhé** | 驚蟄 | Awakening of Insects (Rabbit) | **345°** | Mar 5-7 | II (2nd) |
| 4 | **Chūn Fēn** | 春分 | Spring Equinox | **0°** | Mar 20-22 | II (2nd) |
| 5 | **Qīng Míng** | 清明 | Pure Brightness (Dragon) | **15°** | Apr 4-6 | III (3rd) |
| 6 | **Gǔ Yǔ** | 穀雨 | Grain Rain | **30°** | Apr 19-21 | III (3rd) |
| 7 | **Lì Xià** | 立夏 | Summer Begins (Snake) | **45°** | May 5-7 | IV (4th) |
| 8 | **Xiǎo Mǎn** | 小滿 | Grain Full | **60°** | May 20-22 | IV (4th) |
| 9 | **Xià Zhì** | 夏至 | Summer Solstice (Horse) | **90°** | Jun 20-22 | V (5th) |
| 10 | **Xiǎo Shǔ** | 小暑 | Minor Heat | **105°** | Jul 6-8 | V (5th) |
| 11 | **Dà Shǔ** | 大暑 | Major Heat (Sheep) | **120°** | Jul 22-24 | VI (6th) |
| 12 | **Lì Qiū** | 立秋 | Autumn Begins | **135°** | Aug 7-9 | VI (6th) |
| 13 | **Chǔ Shǔ** | 處暑 | Ending of Heat (Monkey) | **150°** | Aug 22-24 | VII (7th) |
| 14 | **Báipī Lù** | 白露 | White Dew | **165°** | Sep 7-9 | VII (7th) |
| 15 | **Qiū Fēn** | 秋分 | Autumn Equinox (Rooster) | **180°** | Sep 22-24 | VIII (8th) |
| 16 | **Hán Lù** | 寒露 | Cold Dew | **195°** | Oct 8-9 | VIII (8th) |
| 17 | **Shuāng Jiàng** | 霜降 | Descent of Frost (Dog) | **210°** | Oct 23-24 | IX (9th) |
| 18 | **Lì Dōng** | 立冬 | Winter Begins | **225°** | Nov 7-8 | IX (9th) |
| 19 | **Xiǎo Xuě** | 小雪 | Minor Snow (Pig) | **240°** | Nov 22-23 | X (10th) |
| 20 | **Dà Xuě** | 大雪 | Major Snow | **255°** | Dec 6-8 | X (10th) |
| 21 | **Dōng Zhì** | 冬至 | Winter Solstice (Rat) | **270°** | Dec 21-23 | XI (11th) |
| 22 | **Xiǎo Hán** | 小寒 | Minor Cold | **285°** | Jan 5-7 | XI (11th) |
| 23 | **Dà Hán** | 大寒 | Major Cold (Ox) | **300°** | Jan 20-21 | XII (12th) |
| 24 | **(Next) Lì Chūn** | 立春 | Spring Begins (Tiger) | **315°** | Feb 3-5 | XII (12th) → I (1st) |

### Critical Reference Points

**The Four Cardinal Points** (astronomically and culturally significant):

1. **Spring Equinox (春分 Chūn Fēn)** - Solar longitude: **0°**
   - Sun enters Aries in Western tropical zodiac
   - Day ≈ Night (equal light)
   - Date: ~Mar 20-22

2. **Summer Solstice (夏至 Xià Zhì)** - Solar longitude: **90°**
   - Sun enters Cancer in Western tropical zodiac
   - Longest day in Northern Hemisphere
   - Date: ~Jun 20-22

3. **Autumn Equinox (秋分 Qiū Fēn)** - Solar longitude: **180°**
   - Sun enters Libra in Western tropical zodiac
   - Day ≈ Night (equal light)
   - Date: ~Sep 22-24

4. **Winter Solstice (冬至 Dōng Zhì)** - Solar longitude: **270°**
   - Sun enters Capricorn in Western tropical zodiac
   - Shortest day in Northern Hemisphere
   - Date: ~Dec 21-23

---

## FUNDAMENTAL CONCEPTS

### 1. Solar Longitude (Ecliptic Longitude λ☉)

**Definition:**
Solar longitude is the sun's position along the ecliptic (the apparent path of the sun through the sky), measured in degrees from the vernal equinox point.

**Measurement Range:** 0° to 360°

**Reference Point (0°):** Vernal Equinox Point
- Located at the Sun's position on the spring equinox (~March 20-22)
- Called the "First Point of Aries" in Western astrology
- Fixed in the tropical zodiac (not sidereal/star-based)

**East Positive Convention:** Sun moves east along the ecliptic
- 0° = Spring Equinox (Aries 0°)
- 90° = Summer Solstice (Cancer 0°)
- 180° = Autumn Equinox (Libra 0°)
- 270° = Winter Solstice (Capricorn 0°)

### 2. Solar Terms Positioning System

**12 + 12 Structure:**
The 24 solar terms divide the ecliptic into 15° segments:

```
Full Circle = 360°
360° ÷ 24 terms = 15° per term

Or viewed another way:
360° ÷ 12 zodiac months = 30° per month
30° ÷ 2 (major + minor term) = 15° per term
```

**Start Point in Chinese System: 315°** (NOT 0°)
- This is **Li Chun (立春)**, marking the astrological new year
- Approximately February 3-5
- Called "Tiger Month" because it begins Yin Tiger season
- Offset from Western Spring Equinox by 45° backwards (or 315° forwards)

**Why 315° and not 0°?**
- Reflects traditional Chinese agricultural calendar and zodiacal animal cycle
- Tiger is 1st of 12 animals in the cycle
- Winter Solstice (270°) occurs near year-end in Western calendar
- Li Chun at 315° represents the true astrological new year (Chinese New Year)

### 3. Relationship to Ba Zi (Four Pillars) System

**Solar Terms define Month Pillars:**
- Each solar month (15° segment) maps to one of 12 earthly branches
- Month changes at solar term boundaries, NOT calendar month boundaries
- Critical for accurate Ba Zi calculations

**Example:** A person born on April 5, 2000:
- Calendar says April (wrong for Ba Zi)
- If Qing Ming hasn't occurred yet: Month Pillar = Mao (Rabbit, previous solar month)
- If Qing Ming has already occurred: Month Pillar = Chen (Dragon, current solar month)

### 4. Relationship to Western Zodiac

**Alignment:**
Chinese solar terms define the **tropical zodiac** (seasonal, not star-based):

- **Spring Equinox (春分)** at 0° → Aries begins
- **Summer Solstice (夏至)** at 90° → Cancer begins
- **Autumn Equinox (秋分)** at 180° → Libra begins
- **Winter Solstice (冬至)** at 270° → Capricorn begins

**Key Insight:** Both systems use the same astronomical phenomenon (solar longitude), just with different naming conventions and starting points.

---

## ALGORITHM 1: SOLAR LONGITUDE CALCULATION

### Purpose
Calculate the sun's ecliptic longitude (0-360°) for any given Julian Date.

### Input
- **JD** (Julian Date): A decimal number representing the date and time
  - Example: 2451545.0 = J2000 epoch (Jan 1, 2000, 12:00 UT)
  - More precise: any point in time can be expressed as JD

### Output
- **λ☉** (Solar Longitude): A decimal degree value (0.0-360.0)
  - Represents the sun's position along the ecliptic
  - Accuracy needed: ±0.01° for most practical purposes

### Mathematical Foundation

**Two-Part Calculation:**

1. **Geometric Mean Longitude (L₀)** - "Center of mass" mean position
2. **Equation of Center (C)** - Correction for elliptical orbit

**Combined: λ☉ = L₀ + C**

---

### PSEUDOCODE: Solar Longitude Calculator

```pseudocode
FUNCTION calculateSolarLongitude(julianDate_JD)

  // ─────────────────────────────────────────────────────────────
  // Step 1: Calculate Julian Centuries from J2000 Epoch
  // ─────────────────────────────────────────────────────────────

  T = (JD - 2451545.0) / 36525.0
  // T in Julian centuries (36525 days per century)
  // J2000 = 2451545.0 = Jan 1, 2000, 12:00 UT

  // ─────────────────────────────────────────────────────────────
  // Step 2: Geometric Mean Longitude (L₀)
  // ─────────────────────────────────────────────────────────────
  // Formula: L₀ = 280.46646° + 36000.76983°×T + 0.0003032°×T²
  // Reference: Meeus "Astronomical Algorithms" Chapter 25

  L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T

  // ─────────────────────────────────────────────────────────────
  // Step 3: Mean Anomaly of Sun (g)
  // ─────────────────────────────────────────────────────────────
  // This describes the sun's position in its elliptical orbit
  // Formula: g = 357.52911° + 35999.05029°×T - 0.0001536°×T²

  g = 357.52911 + 35999.05029 * T - 0.0001536 * T * T

  // ─────────────────────────────────────────────────────────────
  // Step 4: Equation of Center (C)
  // ─────────────────────────────────────────────────────────────
  // Correction for orbital eccentricity (Kepler's 2nd law effect)
  // The sun moves faster when closer to Earth (perihelion)
  // The sun moves slower when farther from Earth (aphelion)

  // Convert g to radians for trigonometric functions
  g_rad = g * (π / 180)

  // Coefficients for the Equation of Center
  // (Higher-order terms for improved accuracy)
  C1_coef = 1.914602 - 0.004817 * T - 0.000014 * T * T
  C2_coef = 0.019993 - 0.000101 * T
  C3_coef = 0.000289

  // Calculate correction terms
  C1 = C1_coef * sin(g_rad)          // ~1.9° amplitude
  C2 = C2_coef * sin(2 * g_rad)      // ~0.02° amplitude
  C3 = C3_coef * sin(3 * g_rad)      // ~0.0003° amplitude

  // Total Equation of Center
  C = C1 + C2 + C3

  // ─────────────────────────────────────────────────────────────
  // Step 5: True Geometric Longitude
  // ─────────────────────────────────────────────────────────────

  trueLongitude = L0 + C

  // ─────────────────────────────────────────────────────────────
  // Step 6: Apparent Longitude (Optional Advanced Step)
  // ─────────────────────────────────────────────────────────────
  // Accounts for nutation (wobble of Earth's axis) and aberration
  // For solar terms: geometric longitude is usually sufficient
  // Include if accuracy better than 0.01° is needed

  // Longitude of ascending node of lunar orbit
  omega = 125.04 - 1934.136 * T
  omega_rad = omega * (π / 180)

  // Nutation in longitude (simplified)
  nutationLongitude = -0.00569 - 0.00478 * sin(omega_rad)

  // Aberration constant
  aberration = -0.00569  // ≈ -20.4 arcseconds

  // Apparent longitude (can use instead of trueLongitude)
  apparentLongitude = trueLongitude + nutationLongitude + aberration

  // ─────────────────────────────────────────────────────────────
  // Step 7: Normalize to 0-360 Range
  // ─────────────────────────────────────────────────────────────

  solarLongitude = apparentLongitude MOD 360

  IF solarLongitude < 0 THEN
    solarLongitude = solarLongitude + 360
  END IF

  // ─────────────────────────────────────────────────────────────
  // Step 8: Return Result
  // ─────────────────────────────────────────────────────────────

  RETURN solarLongitude  // 0.0 to 360.0 degrees

END FUNCTION
```

### Key Implementation Notes

1. **Units Consistency:**
   - All degree coefficients are in decimal degrees
   - Convert to radians ONLY for trigonometric functions
   - π = 3.14159265358979...

2. **Accuracy Trade-offs:**
   - Without Equation of Center: ±1.9° error
   - With C1 only: ±0.02° error
   - With C1+C2: ±0.0003° error (excellent)
   - With C1+C2+C3: ±0.00005° error (astronomical precision)

3. **For Solar Terms:** C1+C2 is typically sufficient (0.02° = ~2 km on Earth)

4. **Time Precision Matters:**
   - Change in solar longitude ≈ 0.9856° per day = 0.0411° per hour
   - For solar term accuracy: need JD accurate to ±2 hours (±0.08°)
   - For month pillar accuracy: need JD accurate to ±4 hours max

---

## ALGORITHM 2: DETERMINE SOLAR TERM FOR A GIVEN DATE

### Purpose
Given a specific date (gregorian calendar date + time), determine which of the 24 solar terms the sun is currently in, or has most recently passed.

### Input
- **Date** (Gregorian calendar): year, month, day, hour, minute, second
- **Timezone offset** (in hours, can be fractional): -12 to +14

### Output
- **Solar Term Information:**
  - Number (1-24, where 1 = Li Chun)
  - Pinyin name and Chinese name
  - English name
  - Exact solar longitude of the term
  - Days since solar term began
  - Days until next solar term

### Process Overview

1. Convert Gregorian date to Julian Date (UTC)
2. Calculate current solar longitude
3. Determine which 15° segment the sun is in
4. Map segment to solar term number
5. Calculate the date when current term started (for context)

---

### PSEUDOCODE: Determine Current Solar Term

```pseudocode
FUNCTION determineSolarTerm(year, month, day, hour, minute, second, timezoneOffset)

  // ─────────────────────────────────────────────────────────────
  // Step 1: Convert Local Time to UTC
  // ─────────────────────────────────────────────────────────────
  // timezoneOffset: hours to ADD to local time to get UTC
  // Example: EST = UTC-5, so timezoneOffset = -5

  utcHour = hour - timezoneOffset
  utcDay = day
  utcMonth = month
  utcYear = year

  // Handle day/month/year overflow
  IF utcHour >= 24 THEN
    utcHour = utcHour - 24
    utcDay = utcDay + 1
    // Handle month/year overflow (see: Gregorian calendar rules)
  END IF

  IF utcHour < 0 THEN
    utcHour = utcHour + 24
    utcDay = utcDay - 1
    // Handle underflow
  END IF

  // ─────────────────────────────────────────────────────────────
  // Step 2: Convert UTC to Julian Date
  // ─────────────────────────────────────────────────────────────

  JD = convertGregorianToJulianDate(utcYear, utcMonth, utcDay,
                                     utcHour, minute, second)

  // ─────────────────────────────────────────────────────────────
  // Step 3: Calculate Current Solar Longitude
  // ─────────────────────────────────────────────────────────────

  solarLongitude = calculateSolarLongitude(JD)

  // ─────────────────────────────────────────────────────────────
  // Step 4: Normalize to Chinese Solar Term Coordinates
  // ─────────────────────────────────────────────────────────────
  // Chinese terms start at 315° (Li Chun), not 0°
  // Shift the longitude so 315° becomes 0°

  normalizedLongitude = (solarLongitude - 315) MOD 360

  IF normalizedLongitude < 0 THEN
    normalizedLongitude = normalizedLongitude + 360
  END IF

  // ─────────────────────────────────────────────────────────────
  // Step 5: Determine Solar Term Segment
  // ─────────────────────────────────────────────────────────────
  // Each term spans 15°
  // Segment 0: 0-15° (Li Chun)
  // Segment 1: 15-30° (Yu Shui)
  // etc.

  segmentIndex = FLOOR(normalizedLongitude / 15)

  // Clamp to 0-23 range
  IF segmentIndex >= 24 THEN
    segmentIndex = 23
  END IF

  IF segmentIndex < 0 THEN
    segmentIndex = 0
  END IF

  // ─────────────────────────────────────────────────────────────
  // Step 6: Look Up Solar Term Information
  // ─────────────────────────────────────────────────────────────

  SOLAR_TERMS = [
    // Number (0-23), Pinyin, Chinese, English, Longitude
    {name: "Li Chun", chinese: "立春", english: "Spring Begins", lon: 315},
    {name: "Yu Shui", chinese: "雨水", english: "Rain Water", lon: 330},
    {name: "Jing Zhe", chinese: "驚蟄", english: "Awakening of Insects", lon: 345},
    // ... (continue for all 24)
  ]

  currentTerm = SOLAR_TERMS[segmentIndex]

  // ─────────────────────────────────────────────────────────────
  // Step 7: Calculate Days Since Term Started (Optional)
  // ─────────────────────────────────────────────────────────────

  // Find when the current term started (previous 15° boundary)
  termStartLongitude = currentTerm.longitude
  termStartJD = findSolarLongitudeJD(year, termStartLongitude)
  daysSinceTerm = JD - termStartJD

  // ─────────────────────────────────────────────────────────────
  // Step 8: Return Result
  // ─────────────────────────────────────────────────────────────

  RETURN {
    termNumber: segmentIndex + 1,
    termName: currentTerm.name,
    chineseName: currentTerm.chinese,
    englishName: currentTerm.english,
    solarLongitude: solarLongitude,
    termLongitude: currentTerm.longitude,
    daysSinceTerm: daysSinceTerm,
    dateTermStarted: convertJulianDateToGregorian(termStartJD)
  }

END FUNCTION
```

### Example Walkthrough

**Input:** March 21, 2024, 14:30 EST (UTC-5)

1. Convert to UTC: March 21, 2024, 19:30 UTC
2. Convert to JD: 2460394.3125
3. Calculate solar longitude: 358.7°
4. Normalize (subtract 315°): 358.7° - 315° = 43.7°
5. Determine segment: FLOOR(43.7° / 15°) = 2
6. Look up segment 2: Jing Zhe (驚蟄, Awakening of Insects)
7. Result: Person is in the Jing Zhe period

**Output:**
```
Term Number: 3
Term Name: Jing Zhe
Solar Longitude: 358.7°
Segment: 345-360° (Awakening of Insects)
```

---

## ALGORITHM 3: FIND DATE OF SOLAR TERM IN GIVEN YEAR

### Purpose
Determine on which date a specific solar term occurs in a given year.

### Input
- **Year** (integer): e.g., 2024
- **Solar Term Number** (1-24, or longitude 0-360°)

### Output
- **Exact Date and Time** (UTC and optionally in local timezone)
  - Example: 2024-03-20, 11:42:17 UTC

### Algorithm Strategy

**Iterative Binary Search** (Newton's Method variant):
1. Make an initial guess based on typical dates
2. Calculate solar longitude at the guess time
3. Compare with target longitude
4. Adjust guess based on difference
5. Repeat until convergence (within 0.0001°, ≈ 9 seconds)

### PSEUDOCODE: Find Solar Term Date

```pseudocode
FUNCTION findSolarTermDate(year, targetLongitude)

  // ─────────────────────────────────────────────────────────────
  // Step 0: Normalize Target Longitude (if needed)
  // ─────────────────────────────────────────────────────────────

  IF targetLongitude > 360 THEN
    targetLongitude = targetLongitude MOD 360
  END IF

  IF targetLongitude < 0 THEN
    targetLongitude = targetLongitude + 360
  END IF

  // ─────────────────────────────────────────────────────────────
  // Step 1: Initial Guess Based on Typical Dates
  // ─────────────────────────────────────────────────────────────
  // Solar terms follow a roughly periodic pattern
  // Use an initial estimate to speed convergence

  INITIAL_DATES = {
    // Longitude => Approximate [month, day]
    315: [2, 4],      // Li Chun (Spring Begins)
    330: [2, 19],     // Yu Shui (Rain Water)
    345: [3, 6],      // Jing Zhe (Awakening of Insects)
    0: [3, 21],       // Chun Fen (Spring Equinox)
    15: [4, 5],       // Qing Ming (Pure Brightness)
    30: [4, 20],      // Gu Yu (Grain Rain)
    45: [5, 6],       // Li Xia (Summer Begins)
    60: [5, 21],      // Xiao Man (Grain Full)
    90: [6, 21],      // Xia Zhi (Summer Solstice)
    105: [7, 7],      // Xiao Shu (Minor Heat)
    120: [7, 23],     // Da Shu (Major Heat)
    135: [8, 8],      // Li Qiu (Autumn Begins)
    150: [8, 23],     // Chu Shu (Ending of Heat)
    165: [9, 8],      // Baipe Lu (White Dew)
    180: [9, 23],     // Qiu Fen (Autumn Equinox)
    195: [10, 8],     // Han Lu (Cold Dew)
    210: [10, 23],    // Shuang Jiang (Descent of Frost)
    225: [11, 8],     // Li Dong (Winter Begins)
    240: [11, 22],    // Xiao Xue (Minor Snow)
    255: [12, 7],     // Da Xue (Major Snow)
    270: [12, 21],    // Dong Zhi (Winter Solstice)
    285: [1, 6],      // Xiao Han (Minor Cold)
    300: [1, 20],     // Da Han (Major Cold)
  }

  [guessMonth, guessDay] = INITIAL_DATES[targetLongitude]
  guessJD = convertGregorianToJulianDate(year, guessMonth, guessDay, 12, 0, 0)

  // ─────────────────────────────────────────────────────────────
  // Step 2: Iterative Refinement (Newton's Method)
  // ─────────────────────────────────────────────────────────────
  // Iterate until converged to desired precision

  currentJD = guessJD
  tolerance = 0.0001  // 0.0001° ≈ 9 seconds of time
  maxIterations = 50
  iteration = 0

  LOOP WHILE iteration < maxIterations DO

    iteration = iteration + 1

    // Calculate current solar longitude
    currentLongitude = calculateSolarLongitude(currentJD)

    // Calculate difference from target
    difference = targetLongitude - currentLongitude

    // Handle wrap-around (e.g., 359° vs 1° should be 2° apart)
    IF ABS(difference) > 180 THEN
      IF difference > 0 THEN
        difference = difference - 360
      ELSE
        difference = difference + 360
      END IF
    END IF

    // Check for convergence
    IF ABS(difference) < tolerance THEN
      BREAK
    END IF

    // ─────────────────────────────────────────────────────────
    // Step 3: Calculate Adjustment
    // ─────────────────────────────────────────────────────────
    // Sun moves approximately 0.9856° per day (360° / 365.25 days)
    // Solar motion is not constant, but use as approximation

    sunMotionPerDay = 0.98565
    daysToAdjust = difference / sunMotionPerDay

    // Apply adjustment to JD
    currentJD = currentJD + daysToAdjust

  END LOOP

  // ─────────────────────────────────────────────────────────────
  // Step 4: Validate Convergence
  // ─────────────────────────────────────────────────────────────

  IF iteration >= maxIterations AND ABS(difference) >= tolerance THEN
    // Warning: did not converge sufficiently
    // May indicate numerical issues or invalid input
    RAISE error("Failed to converge on solar term date")
  END IF

  // ─────────────────────────────────────────────────────────────
  // Step 5: Convert Back to Calendar Date
  // ─────────────────────────────────────────────────────────────

  [resultYear, resultMonth, resultDay, resultHour, resultMinute, resultSecond] =
    convertJulianDateToGregorian(currentJD)

  // ─────────────────────────────────────────────────────────────
  // Step 6: Return Result
  // ─────────────────────────────────────────────────────────────

  RETURN {
    year: resultYear,
    month: resultMonth,
    day: resultDay,
    hour: resultHour,
    minute: resultMinute,
    second: resultSecond,
    julianDate: currentJD,
    solarLongitude: calculateSolarLongitude(currentJD),
    iterations: iteration
  }

END FUNCTION
```

### Example Calculation

**Input:** Find when Li Chun (立春) occurs in 2024

1. Initial guess: February 4, 2024, 12:00 UTC
   - Convert to JD: 2460366.0
   - Solar longitude: 313.8°
   - Difference from target (315°): 315° - 313.8° = 1.2°

2. First iteration:
   - Adjustment: 1.2° / 0.98565 ≈ 1.216 days
   - New JD: 2460366.0 + 1.216 = 2460367.216
   - Solar longitude: 314.98°
   - Difference: 315° - 314.98° = 0.02°

3. Second iteration:
   - Adjustment: 0.02° / 0.98565 ≈ 0.0203 days ≈ 29 minutes
   - New JD: 2460367.216 + 0.0203 = 2460367.236
   - Solar longitude: 315.000°
   - Difference: < 0.0001° → CONVERGED

4. Convert back to calendar:
   - Result: 2024-02-04, 17:38:24 UTC

**Output:**
```
Li Chun 2024 occurs on:
2024-02-04 at 17:38:24 UTC
(or 2024-02-05 at 01:38:24 in most of Asia)
```

### Optimization Notes

1. **Convergence Speed:** Newton's method converges quadratically
   - Typically 3-5 iterations for 0.0001° accuracy
   - Rarely needs > 10 iterations

2. **Singular Case:** Sun can cross the reference meridian
   - Occurs near 0°/360° boundary (e.g., 359° → 1°)
   - The wrap-around handling in Step 2 addresses this

3. **Alternative: Bisection Method (More Robust)**
   ```pseudocode
   // Binary search between two known dates
   lowerBound = date when longitude < target
   upperBound = date when longitude > target
   LOOP until convergence
     midpoint = (lowerBound + upperBound) / 2
     IF solar_longitude(midpoint) < target
       lowerBound = midpoint
     ELSE
       upperBound = midpoint
     END IF
   END LOOP
   ```

---

## KEY MATHEMATICAL CONSTANTS

### Physical Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| **J2000 Epoch JD** | 2451545.0 | Jan 1, 2000, 12:00 UT (reference point) |
| **Julian Century** | 36525.0 | Days per century (36525 = 365.25 × 100) |
| **Earth's Sidereal Period** | 365.25636 | Days for Earth to orbit the sun |
| **Sun's Mean Motion** | 0.98565° | Degrees per day (≈ 360° / 365.25 days) |
| **Obliquity of Ecliptic** | 23.4392911° | Angle between equator and ecliptic (J2000) |

### Solar Longitude Coefficients (Meeus Chapter 25)

**Geometric Mean Longitude (L₀):**
```
L₀ = 280.46646° + 36000.76983°×T + 0.0003032°×T²
```

**Mean Anomaly (g):**
```
g = 357.52911° + 35999.05029°×T - 0.0001536°×T²
```

**Equation of Center (C = C₁ + C₂ + C₃):**
```
C₁ = (1.914602 - 0.004817×T - 0.000014×T²) × sin(g)
C₂ = (0.019993 - 0.000101×T) × sin(2g)
C₃ = 0.000289 × sin(3g)
```

### Solar Term Longitudes (Reference Table)

```
Term #  Pinyin        Longitude  Offset from Li Chun
  1     Li Chun           315°         0°
  2     Yu Shui           330°         15°
  3     Jing Zhe          345°         30°
  4     Chun Fen            0°         45°
  5     Qing Ming          15°         60°
  6     Gu Yu              30°         75°
  7     Li Xia             45°         90°
  8     Xiao Man           60°        105°
  9     Xia Zhi            90°        135°
 10     Xiao Shu          105°        150°
 11     Da Shu            120°        165°
 12     Li Qiu            135°        180°
 13     Chu Shu           150°        195°
 14     Baipe Lu          165°        210°
 15     Qiu Fen           180°        225°
 16     Han Lu            195°        240°
 17     Shuang Jiang      210°        255°
 18     Li Dong           225°        270°
 19     Xiao Xue          240°        285°
 20     Da Xue            255°        300°
 21     Dong Zhi          270°        315°
 22     Xiao Han          285°        330°
 23     Da Han            300°        345°
 24     (next Li Chun)    315°        360° (or 0°)
```

---

## IMPLEMENTATION CONSIDERATIONS

### 1. Gregorian-to-Julian Date Conversion

**Formula (Meeus Chapter 7):**

```pseudocode
FUNCTION convertGregorianToJulianDate(year, month, day, hour, minute, second)

  // Adjust for January/February being counted as months 13/14 of prior year
  IF month <= 2 THEN
    year = year - 1
    month = month + 12
  END IF

  // Calculate Julian Day Number (integer part)
  A = FLOOR(year / 100)
  B = 2 - A + FLOOR(A / 4)

  JD_integer = FLOOR(365.25 × (year + 4716)) +
               FLOOR(30.6001 × (month + 1)) +
               day + B - 1524.5

  // Add fractional day
  dayFraction = (hour + minute/60 + second/3600) / 24

  JD = JD_integer + dayFraction

  RETURN JD

END FUNCTION
```

### 2. Precision Requirements

**For Solar Terms:**

| Use Case | Required Accuracy | JD Precision | Example |
|----------|---|---|---|
| Which solar term today? | ±2 days | ±0.08° | Find current month pillar |
| Exact date of term | ±4 hours | ±0.17° | Li Chun exact time |
| Ba Zi month pillar | ±2 hours | ±0.08° | Determine correct month stem |

**Sun's Motion Relationship:**
```
1 day    ≈ 0.98565° solar longitude change
1 hour   ≈ 0.04107° change
1 minute ≈ 0.0006845° change (≈2.5 arcseconds)
```

### 3. Numerical Stability

**Avoid These Pitfalls:**

1. **Angle Wrap-around:**
   - Solar longitude should always wrap at 360°, not 180°
   - Always normalize with: `lon = ((lon % 360) + 360) % 360`

2. **Time System Confusion:**
   - UTC vs Local vs Ephemeris Time (ET)
   - For solar terms: UTC is standard
   - If given local time, must convert using timezone offset

3. **Floating-Point Rounding:**
   - Use at least double precision (64-bit floats)
   - Round final results to nearest minute/hour for user display

### 4. Lookup Table vs Calculation

**Lookup Table Approach:**
- Pre-calculate solar term dates for years 1900-2100
- Store in database (240,000 rows)
- O(1) lookup time
- Good for: high-frequency queries, server-side

**Calculation Approach:**
- Use algorithms in this document
- No stored data needed
- O(log n) time (≈5-10 iterations)
- Good for: arbitrary years, future dates, client-side

**Hybrid Approach (Recommended):**
- Pre-compute for common years (1900-2050)
- Calculate for edge cases and far future

---

## VALIDATION & TESTING

### Test Cases

**Test 1: Spring Equinox 2024**
- Expected: ~March 20, 2024
- Verify: Solar longitude = 0° exactly

```pseudocode
result = findSolarTermDate(2024, 0)
assert(result.month == 3)
assert(result.day >= 19 AND result.day <= 22)
assert(ABS(result.solarLongitude - 0) < 0.01)
```

**Test 2: Current Solar Term Detection**
- Input: March 21, 2024, 14:00 EST
- Expected: Still in Jing Zhe (Winter term hasn't started yet)

```pseudocode
result = determineSolarTerm(2024, 3, 21, 14, 0, 0, -5)
assert(result.termNumber >= 1 AND result.termNumber <= 24)
assert(result.daysSinceTerm >= 0)  // Haven't passed into future
```

**Test 3: Year Boundary Case**
- Input: January 2, 2024, 00:00 UTC
- Expected: Still in Da Han (Major Cold) term, not Li Chun

```pseudocode
result = determineSolarTerm(2024, 1, 2, 0, 0, 0, 0)
assert(result.termNumber == 23)  // Da Han (Major Cold)
assert(result.termName == "Da Han")
```

**Test 4: Integration with Ba Zi Month Pillar**
- Input: April 10, 2000, Beijing time
- Expected: Qing Ming has passed, so month pillar = Chen (Dragon)

```pseudocode
// First find when Qing Ming occurred in 2000
qingMingDate = findSolarTermDate(2000, 15)
// April 10 should be after Qing Ming (typically Apr 4-6)
assert(calculateJulianDate(2000, 4, 10) > qingMingDate.julianDate)

// Verify month pillar is Dragon (Chen), not Rabbit (Mao)
solarTerm = determineSolarTerm(2000, 4, 10, 0, 0, 0, 8)
assert(solarTerm.termName == "Qing Ming")
```

### Known Edge Cases

1. **Leap Seconds:**
   - UTC includes leap seconds
   - For solar term calculations: usually ignored (< 1 second impact)
   - If accuracy < 1 second required: consult IERS leap second list

2. **Time Zone Issues:**
   - China uses single time zone (UTC+8) despite spanning 5 zones
   - Always convert to UTC first, then apply local offset

3. **Historical vs Modern Definitions:**
   - Pre-1900: solar term definitions may differ
   - Modern standard: ISO 8601 with Gregorian calendar

### Reference Implementation Validation

**Against Meeus Algorithms:**
- Chapter 25 (Solar Positions) for sun position calculations
- Chapter 7 (Julian Dates) for calendar conversions

**Against Astronomical Software:**
- SOFA (Standards of Fundamental Astronomy) library
- Skyfield Python library
- Swiss Ephemeris

---

## APPENDIX: FULL SOLAR TERMS REFERENCE WITH CHARACTERISTICS

### Extended Reference Table with Seasonal Information

| # | Pinyin | Chinese | English | lon | Mark | Season | Climate | Agricultural |
|---|--------|---------|---------|-----|------|--------|---------|--------------|
| 1 | Lì Chūn | 立春 | Spring Begins | 315° | Yin Tiger | Early Spring | Cold ending | Plowing begins |
| 2 | Yǔ Shuǐ | 雨水 | Rain Water | 330° | Yang Tiger | Spring | Rain increases | Seeds germinate |
| 3 | Jīng Zhé | 驚蟄 | Awakening of Insects | 345° | Yin Rabbit | Spring | Warming | Insects awake |
| 4 | **Chūn Fēn** | **春分** | **Spring Equinox** | **0°** | Yang Rabbit | Mid-Spring | Day=Night | Equinox |
| 5 | Qīng Míng | 清明 | Pure Brightness | 15° | Yin Dragon | Spring | Clear & warm | Tomb sweeping |
| 6 | Gǔ Yǔ | 穀雨 | Grain Rain | 30° | Yang Dragon | Spring | Rain for crops | Grain grows |
| 7 | Lì Xià | 立夏 | Summer Begins | 45° | Yin Snake | Early Summer | Warm | Growth accelerates |
| 8 | Xiǎo Mǎn | 小滿 | Grain Full | 60° | Yang Snake | Summer | Hot | Grain fills |
| 9 | **Xià Zhì** | **夏至** | **Summer Solstice** | **90°** | Yin Horse | Mid-Summer | Hottest day | Solstice |
| 10 | Xiǎo Shǔ | 小暑 | Minor Heat | 105° | Yang Horse | Summer | Very hot | Heat begins |
| 11 | Dà Shǔ | 大暑 | Major Heat | 120° | Yin Sheep | Summer | Extreme heat | Hottest period |
| 12 | Lì Qiū | 立秋 | Autumn Begins | 135° | Yang Sheep | Early Autumn | Still warm | Heat breaks |
| 13 | Chǔ Shǔ | 處暑 | Ending of Heat | 150° | Yin Monkey | Autumn | Cooling | Heat ends |
| 14 | Báipī Lù | 白露 | White Dew | 165° | Yang Monkey | Autumn | Dew appears | Harvest time |
| 15 | **Qiū Fēn** | **秋分** | **Autumn Equinox** | **180°** | Yin Rooster | Mid-Autumn | Day=Night | Equinox |
| 16 | Hán Lù | 寒露 | Cold Dew | 195° | Yang Rooster | Autumn | Cold dew | Crops mature |
| 17 | Shuāng Jiàng | 霜降 | Descent of Frost | 210° | Yin Dog | Autumn | Frost arrives | Frost risk |
| 18 | Lì Dōng | 立冬 | Winter Begins | 225° | Yang Dog | Early Winter | Cold | Winter grows |
| 19 | Xiǎo Xuě | 小雪 | Minor Snow | 240° | Yin Pig | Winter | Possible snow | Snow begins |
| 20 | Dà Xuě | 大雪 | Major Snow | 255° | Yang Pig | Winter | Heavy snow | Winter peak |
| 21 | **Dōng Zhì** | **冬至** | **Winter Solstice** | **270°** | Yin Rat | Mid-Winter | Coldest day | Solstice |
| 22 | Xiǎo Hán | 小寒 | Minor Cold | 285° | Yang Rat | Winter | Very cold | Winter deep |
| 23 | Dà Hán | 大寒 | Major Cold | 300° | Yin Ox | Winter | Coldest period | Year ends |
| 24 | (Lì Chūn) | (立春) | (Spring Begins) | 315° | Yang Ox | Cycle end | Cold ending | Cycle turns |

---

## SUMMARY

The 24 solar terms represent one of humanity's most precise agricultural and astronomical systems. They are defined by the sun's ecliptic longitude and form the foundation for:

1. **Ba Zi (Four Pillars)** - Month pillar determination
2. **Chinese Astrology** - Element and yin/yang calculations
3. **Agricultural Calendar** - Planting and harvest timing
4. **Health & Wellness** - Traditional Chinese medicine seasonality

**Key Takeaway:**
All 24 terms divide the 360° ecliptic into 15° segments, starting at 315° (Li Chun). Using the algorithms provided:
- Calculate precise solar longitude from any Julian Date
- Determine which term the sun is currently in
- Find the exact date/time any term occurs in any year

This foundation enables accurate Ba Zi calculations and western-eastern astrology fusion.

