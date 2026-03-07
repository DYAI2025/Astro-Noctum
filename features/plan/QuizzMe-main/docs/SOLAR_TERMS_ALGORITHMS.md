# Solar Terms Algorithms - Implementation Reference

**Purpose:** Quick reference for pseudocode implementations of solar term calculations

---

## QUICK REFERENCE: All 24 Solar Terms

```
SOLAR_TERMS_DATA = [
  // [index, pinyin, chinese, english, longitude]
  [0, "Li Chun", "立春", "Spring Begins", 315],
  [1, "Yu Shui", "雨水", "Rain Water", 330],
  [2, "Jing Zhe", "驚蟄", "Awakening of Insects", 345],
  [3, "Chun Fen", "春分", "Spring Equinox", 0],
  [4, "Qing Ming", "清明", "Pure Brightness", 15],
  [5, "Gu Yu", "穀雨", "Grain Rain", 30],
  [6, "Li Xia", "立夏", "Summer Begins", 45],
  [7, "Xiao Man", "小滿", "Grain Full", 60],
  [8, "Xia Zhi", "夏至", "Summer Solstice", 90],
  [9, "Xiao Shu", "小暑", "Minor Heat", 105],
  [10, "Da Shu", "大暑", "Major Heat", 120],
  [11, "Li Qiu", "立秋", "Autumn Begins", 135],
  [12, "Chu Shu", "處暑", "Ending of Heat", 150],
  [13, "Baipe Lu", "白露", "White Dew", 165],
  [14, "Qiu Fen", "秋分", "Autumn Equinox", 180],
  [15, "Han Lu", "寒露", "Cold Dew", 195],
  [16, "Shuang Jiang", "霜降", "Descent of Frost", 210],
  [17, "Li Dong", "立冬", "Winter Begins", 225],
  [18, "Xiao Xue", "小雪", "Minor Snow", 240],
  [19, "Da Xue", "大雪", "Major Snow", 255],
  [20, "Dong Zhi", "冬至", "Winter Solstice", 270],
  [21, "Xiao Han", "小寒", "Minor Cold", 285],
  [22, "Da Han", "大寒", "Major Cold", 300],
  [23, "Li Chun Next", "立春", "Spring Begins (Next)", 315]
]

TERM_BY_LONGITUDE = {
  315: 0, 330: 1, 345: 2, 0: 3, 15: 4, 30: 5,
  45: 6, 60: 7, 90: 8, 105: 9, 120: 10, 135: 11,
  150: 12, 165: 13, 180: 14, 195: 15, 210: 16,
  225: 17, 240: 18, 255: 19, 270: 20, 285: 21, 300: 22
}

INITIAL_DATES = {
  315: [2, 4], 330: [2, 19], 345: [3, 6], 0: [3, 21],
  15: [4, 5], 30: [4, 20], 45: [5, 6], 60: [5, 21],
  90: [6, 21], 105: [7, 7], 120: [7, 23], 135: [8, 8],
  150: [8, 23], 165: [9, 8], 180: [9, 23], 195: [10, 8],
  210: [10, 23], 225: [11, 8], 240: [11, 22], 255: [12, 7],
  270: [12, 21], 285: [1, 6], 300: [1, 20]
}
```

---

## MASTER ALGORITHMS

### Algorithm A: Convert Gregorian Date to Julian Date

```pseudocode
FUNCTION gregorianToJulianDate(year, month, day, hour, minute, second)
  INPUT: year (int), month (1-12), day (1-31),
         hour (0-23), minute (0-59), second (0-59.999)
  OUTPUT: Julian Date (double), range ≈ 2,400,000 to 2,600,000

  // Adjust year/month for January/February
  y = year
  m = month
  IF month <= 2 THEN
    y = y - 1
    m = m + 12
  END IF

  // Gregorian calendar correction
  A = FLOOR(y / 100)
  B = 2 - A + FLOOR(A / 4)

  // Main JD calculation
  jd_int = FLOOR(365.25 * (y + 4716)) +
           FLOOR(30.6001 * (m + 1)) +
           day + B - 1524.5

  // Fractional day
  frac = (hour + minute / 60 + second / 3600) / 24

  RETURN jd_int + frac

END FUNCTION
```

### Algorithm B: Convert Julian Date to Gregorian Date

```pseudocode
FUNCTION julianDateToGregorian(jd)
  INPUT: Julian Date (double)
  OUTPUT: [year, month, day, hour, minute, second]

  // Extract integer and fractional parts
  jd_int = FLOOR(jd + 0.5)
  frac = jd + 0.5 - jd_int

  // Gregorian calendar correction
  a = jd_int + 32044
  b = (4 * a + 3) / 146097
  c = a - FLOOR(146097 * b / 4)

  d = (4 * c + 3) / 1461
  e = c - FLOOR(1461 * d / 4)
  m = FLOOR((5 * e + 2) / 153)

  day = e - FLOOR((153 * m + 2) / 5) + 1
  month = m + 3 - 12 * FLOOR(m / 10)
  year = 100 * b + d - 4800 + FLOOR(m / 10)

  // Convert fractional day to time
  frac = frac * 24
  hour = FLOOR(frac)
  frac = (frac - hour) * 60
  minute = FLOOR(frac)
  frac = (frac - minute) * 60
  second = frac

  RETURN [year, month, day, hour, minute, FLOOR(second)]

END FUNCTION
```

### Algorithm C: Calculate Sun's Ecliptic Longitude

```pseudocode
FUNCTION solarLongitude(jd)
  INPUT: Julian Date
  OUTPUT: Solar longitude in degrees (0.0 to 360.0)

  // Julian centuries from J2000
  T = (jd - 2451545.0) / 36525.0

  // Geometric mean longitude of sun
  L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T

  // Mean anomaly of sun
  g = 357.52911 + 35999.05029 * T - 0.0001536 * T * T

  // Convert to radians
  g_rad = g * (π / 180)

  // Equation of center
  c1 = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(g_rad)
  c2 = (0.019993 - 0.000101 * T) * sin(2 * g_rad)
  c3 = 0.000289 * sin(3 * g_rad)
  C = c1 + c2 + c3

  // True longitude
  trueLon = L0 + C

  // Normalize to 0-360 range
  lon = trueLon MOD 360
  IF lon < 0 THEN
    lon = lon + 360
  END IF

  RETURN lon

END FUNCTION
```

### Algorithm D: Find Julian Date for Solar Longitude in Year

```pseudocode
FUNCTION findSolarLongitudeInYear(year, targetLongitude)
  INPUT: year (int), targetLongitude (0-360)
  OUTPUT: Julian Date when sun reaches that longitude

  // Normalize target
  targetLongitude = targetLongitude MOD 360
  IF targetLongitude < 0 THEN
    targetLongitude = targetLongitude + 360
  END IF

  // Get initial guess from table
  [guessMonth, guessDay] = INITIAL_DATES[targetLongitude]
  IF guessMonth IS NULL THEN
    // Interpolate for intermediate values
    lowerLon = FLOOR(targetLongitude / 15) * 15
    upperLon = lowerLon + 15
    [m1, d1] = INITIAL_DATES[lowerLon]
    [m2, d2] = INITIAL_DATES[upperLon]
    fraction = (targetLongitude - lowerLon) / 15
    guessMonth = m1 + (m2 - m1) * fraction
    guessDay = d1 + (d2 - d1) * fraction
  END IF

  // Start iteration
  jd = gregorianToJulianDate(year, guessMonth, guessDay, 12, 0, 0)
  tolerance = 0.0001
  maxIter = 50
  iter = 0

  LOOP WHILE iter < maxIter DO
    iter = iter + 1

    // Current solar longitude
    currentLon = solarLongitude(jd)

    // Calculate difference
    diff = targetLongitude - currentLon

    // Handle wrap-around
    IF ABS(diff) > 180 THEN
      IF diff > 0 THEN
        diff = diff - 360
      ELSE
        diff = diff + 360
      END IF
    END IF

    // Check convergence
    IF ABS(diff) < tolerance THEN
      BREAK
    END IF

    // Newton's method adjustment
    daysAdjust = diff / 0.98565
    jd = jd + daysAdjust

  END LOOP

  IF ABS(diff) >= tolerance THEN
    // Did not converge - use best approximation with warning
    WARN("Did not converge on solar term date")
  END IF

  RETURN jd

END FUNCTION
```

### Algorithm E: Determine Current Solar Term

```pseudocode
FUNCTION currentSolarTerm(year, month, day, hour, minute, second, tzOffset)
  INPUT: Gregorian date + time in local timezone
         tzOffset: hours to add to local time to get UTC (e.g., -5 for EST)
  OUTPUT: {termNumber (0-23), termName, solarLongitude, daysSinceTerm}

  // Convert to UTC
  utcHour = hour - tzOffset
  utcDay = day
  utcMonth = month
  utcYear = year

  // Handle overflow/underflow (simplified - see full algorithm for completeness)
  WHILE utcHour >= 24 DO
    utcHour = utcHour - 24
    utcDay = utcDay + 1
  END WHILE

  WHILE utcHour < 0 DO
    utcHour = utcHour + 24
    utcDay = utcDay - 1
  END WHILE

  // Convert to JD
  jd = gregorianToJulianDate(utcYear, utcMonth, utcDay, utcHour, minute, second)

  // Get solar longitude
  lon = solarLongitude(jd)

  // Normalize to Chinese coordinate system (start at 315°)
  normLon = (lon - 315) MOD 360
  IF normLon < 0 THEN
    normLon = normLon + 360
  END IF

  // Find which 15° segment
  segment = FLOOR(normLon / 15)
  IF segment >= 24 THEN
    segment = 23
  END IF
  IF segment < 0 THEN
    segment = 0
  END IF

  // Look up term info
  term = SOLAR_TERMS_DATA[segment]

  // Calculate days since term started
  termStartLon = term.longitude
  termStartJD = findSolarLongitudeInYear(year, termStartLon)
  daysSince = jd - termStartJD

  RETURN {
    termNumber: segment,
    termIndex: term[0],
    pinyin: term[1],
    chinese: term[2],
    english: term[3],
    solarLongitude: lon,
    termLongitude: term[4],
    daysSinceTerm: daysSince,
    termStartDate: julianDateToGregorian(termStartJD)
  }

END FUNCTION
```

### Algorithm F: Get All Solar Terms for a Year

```pseudocode
FUNCTION solarTermsForYear(year)
  INPUT: year (int)
  OUTPUT: Array of 24 solar terms with their dates/times in UTC

  results = []

  FOR i = 0 TO 23 DO
    term = SOLAR_TERMS_DATA[i]
    targetLon = term.longitude
    jd = findSolarLongitudeInYear(year, targetLon)
    dateTime = julianDateToGregorian(jd)

    results.push({
      termNumber: i + 1,
      pinyin: term[1],
      chinese: term[2],
      english: term[3],
      longitude: targetLon,
      date: dateTime,
      julianDate: jd
    })
  END FOR

  RETURN results

END FUNCTION
```

---

## SPECIALIZED ALGORITHMS FOR BA ZI INTEGRATION

### Algorithm G: Determine Month Pillar from Date

```pseudocode
FUNCTION getMonthPillarFromDate(year, month, day, hour, tzOffset)
  INPUT: Birth date/time
  OUTPUT: {monthNumber (1-12), branch (Yin...Pig), stem, element}

  // Get current solar term
  termInfo = currentSolarTerm(year, month, day, hour, 0, 0, tzOffset)

  // Solar month = term number indicates which solar month we're in
  // Each pair of terms = one solar month
  solarMonthIndex = FLOOR(termInfo.termNumber / 2)  // 0-11

  // Get the starting term of current month
  solarMonthStart = solarMonthIndex * 2

  // Find when this month's first term occurs
  termStartLon = SOLAR_TERMS_DATA[solarMonthStart].longitude
  termStartJD = findSolarLongitudeInYear(year, termStartLon)

  // Convert birth time to JD
  birthJD = gregorianToJulianDate(year, month, day, hour, 0, 0)

  // If born before first term of month, use previous month
  IF birthJD < termStartJD THEN
    solarMonthIndex = (solarMonthIndex - 1) MOD 12
  END IF

  // Map solar month to branch (Tiger = 1st solar month)
  branchIndex = (solarMonthIndex + 2) MOD 12
  branch = BRANCHES[branchIndex]

  // Get year stem for Five Tigers rule
  yearTerm = getYearPillar(year, birthJD)
  yearStemIndex = yearTerm.stemIndex

  // Five Tigers Stem Rule
  tigerStarts = [2, 4, 6, 8, 0]  // Starting stems for each year stem group
  stemIndex = (tigerStarts[yearStemIndex MOD 5] + solarMonthIndex) MOD 10
  stem = STEMS[stemIndex]

  RETURN {
    solarMonthIndex: solarMonthIndex + 1,
    branch: branch,
    stem: stem,
    element: getElementFromStem(stem),
    monthTermBoundary: termStartJD
  }

END FUNCTION
```

### Algorithm H: Check if Date is Before Li Chun (Year Boundary)

```pseudocode
FUNCTION isBeforeLiChun(year, month, day, hour, tzOffset)
  INPUT: Date/time to check
  OUTPUT: TRUE if before Li Chun, FALSE otherwise

  birthJD = gregorianToJulianDate(year, month, day, hour, 0, 0)
  liChunJD = findSolarLongitudeInYear(year, 315)

  RETURN birthJD < liChunJD

END FUNCTION
```

---

## UTILITY FUNCTIONS

### Helper: Normalize Angle

```pseudocode
FUNCTION normalizeAngle(deg)
  // Normalize angle to 0-360 range
  d = deg MOD 360
  IF d < 0 THEN
    d = d + 360
  END IF
  RETURN d
END FUNCTION
```

### Helper: Angle Difference

```pseudocode
FUNCTION angleDifference(from, to)
  // Calculate shortest angular distance (considering wrap-around)
  diff = to - from
  IF ABS(diff) > 180 THEN
    IF diff > 0 THEN
      diff = diff - 360
    ELSE
      diff = diff + 360
    END IF
  END IF
  RETURN diff
END FUNCTION
```

### Helper: Days Between JD Dates

```pseudocode
FUNCTION daysBetween(jd1, jd2)
  // Number of days between two Julian dates
  RETURN jd2 - jd1
END FUNCTION
```

### Helper: Convert to Local Time

```pseudocode
FUNCTION convertToLocalTime(jd, tzOffset)
  // jd: Julian Date in UTC
  // tzOffset: hours to add to UTC for local time (negative for west)

  dateUtc = julianDateToGregorian(jd)
  dateLocal = dateUtc
  dateLocal.hour = dateLocal.hour + tzOffset

  // Handle day overflow
  WHILE dateLocal.hour >= 24 DO
    dateLocal.hour = dateLocal.hour - 24
    dateLocal.day = dateLocal.day + 1
  END WHILE

  WHILE dateLocal.hour < 0 DO
    dateLocal.hour = dateLocal.hour + 24
    dateLocal.day = dateLocal.day - 1
  END WHILE

  RETURN dateLocal
END FUNCTION
```

---

## PSEUDOCODE TEMPLATES FOR SPECIFIC TASKS

### Task 1: "What solar term am I in?"

```pseudocode
TASK: Given today's date, what solar term applies?

PROCEDURE:
  today = getCurrentDate()
  result = currentSolarTerm(
    today.year, today.month, today.day,
    today.hour, today.minute, today.second,
    tzOffset = getLocalTimezoneOffset()
  )

  PRINT "You are in: " + result.chinese + " (" + result.english + ")"
  PRINT "Term started: " + result.termStartDate
  PRINT "Days in term: " + result.daysSinceTerm
```

### Task 2: "When does a specific term occur?"

```pseudocode
TASK: Find exact date/time of Li Chun in 2024

PROCEDURE:
  termData = findSolarTermInYear(2024, 315)  // 315° = Li Chun

  localTime = convertToLocalTime(termData.jd, tzOffset = 8)  // China time

  PRINT "Li Chun 2024 occurs on:"
  PRINT localTime.year + "-" + localTime.month + "-" + localTime.day
  PRINT "at " + localTime.hour + ":" + localTime.minute + " local time"
```

### Task 3: "Determine correct month pillar for Ba Zi"

```pseudocode
TASK: What is the month pillar for someone born Apr 10, 2000, 14:30 Beijing?

PROCEDURE:
  monthPillar = getMonthPillarFromDate(
    2000, 4, 10, 14.5, tzOffset = 8  // Beijing = UTC+8
  )

  PRINT "Month Pillar:"
  PRINT monthPillar.stem + monthPillar.branch
  PRINT "Element: " + monthPillar.element
  PRINT "Solar month: " + monthPillar.solarMonthIndex

  // Verify by checking which term we're in
  term = currentSolarTerm(2000, 4, 10, 14, 30, 0, tzOffset = 8)
  PRINT "Current term: " + term.chinese
```

---

## CONSTANTS & LOOKUP TABLES

### Gregorian Calendar Leap Year Rule

```pseudocode
FUNCTION isLeapYear(year)
  IF year MOD 400 == 0 THEN RETURN TRUE
  IF year MOD 100 == 0 THEN RETURN FALSE
  IF year MOD 4 == 0 THEN RETURN TRUE
  RETURN FALSE
END FUNCTION
```

### Days in Month

```pseudocode
FUNCTION daysInMonth(year, month)
  daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  IF month == 2 AND isLeapYear(year) THEN
    RETURN 29
  ELSE
    RETURN daysPerMonth[month - 1]
  END IF
END FUNCTION
```

### Pi Constant

```pseudocode
π = 3.14159265358979323846
π/180 = 0.01745329251994329577  // Degrees to radians
180/π = 57.29577951308232087680  // Radians to degrees
```

---

## ERROR HANDLING & EDGE CASES

### Invalid Date Handling

```pseudocode
FUNCTION validateGregorianDate(year, month, day)
  IF month < 1 OR month > 12 THEN RETURN FALSE
  IF day < 1 OR day > daysInMonth(year, month) THEN RETURN FALSE
  IF year < -4712 THEN RETURN FALSE  // Before JD epoch
  RETURN TRUE
END FUNCTION
```

### Convergence Failure Recovery

```pseudocode
FUNCTION findSolarLongitudeWithFallback(year, targetLon)
  RESULT = TRY findSolarLongitudeInYear(year, targetLon)

  IF RESULT failed to converge THEN
    // Use bisection method as fallback
    RESULT = findSolarLongitudeViaBotsection(year, targetLon)
  END IF

  RETURN RESULT
END FUNCTION
```

### Timezone Handling

```pseudocode
FUNCTION convertAnyTimeToUtc(localTime, tzDescriptor)
  // tzDescriptor can be:
  // - Numeric offset: -5, 8, 12.75
  // - String: "EST", "CST", "UTC+8"
  // - IANA zone: "America/New_York", "Asia/Shanghai"

  IF tzDescriptor is numeric THEN
    tzOffset = tzDescriptor
  ELSE IF tzDescriptor is string THEN
    tzOffset = lookupTimezoneOffset(tzDescriptor)
  ELSE
    ERROR("Invalid timezone descriptor")
  END IF

  utcHour = localTime.hour - tzOffset
  // ... handle day overflow ...

  RETURN utcTime
END FUNCTION
```

---

## SUMMARY DECISION TREE

```
Given: Date/Time + Timezone

YES ├─ Need exact solar term occurrence date?
    │  └─ findSolarLongitudeInYear(year, longitude)
    │
    ├─ Need current solar term for a date?
    │  └─ currentSolarTerm(year, month, day, hour, minute, tzOffset)
    │
    ├─ Need all 24 solar terms for year?
    │  └─ solarTermsForYear(year)
    │
    ├─ Need month pillar for Ba Zi?
    │  └─ getMonthPillarFromDate(year, month, day, hour, tzOffset)
    │
    └─ Need solar longitude for arbitrary date?
       └─ solarLongitude(jd) [after converting to JD first]
```

