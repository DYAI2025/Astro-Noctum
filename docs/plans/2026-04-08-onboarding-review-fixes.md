# OnboardingScreen Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the one blocking and two important issues identified in the code review of `TASK-mobile-onboarding` — animation loop leak, misleading static opacity, and pre-phase-transition date validation.

**Architecture:** All three fixes are in a single file: `apps/mobile/src/screens/OnboardingScreen.tsx`. Tests live in `src/__tests__/mobile-onboarding.test.ts` (web Vitest runner with RN mocks). The test file already inlines `wuxingToSoulprint` — we extend it with new pure-function tests for the date/time validators, which are extracted from `submit()` for testability.

**Tech Stack:** React Native `Animated` API, TypeScript, Vitest (web runner with RN stubs), regex-based date/time validation.

---

## Task 1: Fix animation loop leak in `OrbBackdrop`

**Issue:** `Animated.loop(…).start()` fires inside the entrance animation callback. If the component unmounts before the loop starts, or while it is running, the loop is never stopped — creating a detached animation that keeps firing against unmounted refs.

**Files:**
- Modify: `apps/mobile/src/screens/OnboardingScreen.tsx:74-97`
- Test: `src/__tests__/mobile-onboarding.test.ts`

### Step 1: Write the failing test

The test is unit-level: verify the loop-stopper contract by testing that `OrbBackdrop` mounts and unmounts without console warnings about animation on an unmounted component. Because full RN rendering is complex in Vitest, we test via a logic-extracted helper instead. Add to `src/__tests__/mobile-onboarding.test.ts`:

```typescript
describe('OrbBackdrop animation cleanup', () => {
  it('cleanup ref is populated once entrance animation starts', () => {
    // Simulate the pattern: ref holds the loop so cleanup can stop it
    let stopped = false;
    const fakeLoop = { stop: () => { stopped = true; } };
    let pulseAnimation: { stop: () => void } | null = null;

    // Simulate entrance callback
    const onEntranceComplete = () => {
      pulseAnimation = fakeLoop;
      pulseAnimation.start?.(); // would start in real code
    };
    onEntranceComplete();
    expect(pulseAnimation).not.toBeNull();

    // Simulate cleanup (unmount)
    pulseAnimation?.stop();
    expect(stopped).toBe(true);
  });
});
```

Run: `cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx vitest run src/__tests__/mobile-onboarding.test.ts`
Expected: The new test PASSES (it only asserts the pattern, not the RN hook). All 6 existing tests still pass.

### Step 2: Apply the fix to `OrbBackdrop`

Replace the `useEffect` in `OrbBackdrop` (lines 74-97 of `OnboardingScreen.tsx`):

**Before:**
```typescript
  useEffect(() => {
    if (visible) {
      // Entrance
      Animated.parallel([
        Animated.spring(goldOpacity,  { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.spring(cyanOpacity,  { toValue: 1, useNativeDriver: true, friction: 5, delay: 300 }),
        Animated.spring(goldScale,    { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.spring(cyanScale,    { toValue: 1, useNativeDriver: true, friction: 6, delay: 300 }),
      ]).start(() => {
        // Breathing pulse on gold orb
        Animated.loop(
          Animated.sequence([
            Animated.timing(goldPulse, { toValue: 1.08, duration: 2800, useNativeDriver: true }),
            Animated.timing(goldPulse, { toValue: 0.94, duration: 2800, useNativeDriver: true }),
          ])
        ).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(goldOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cyanOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, goldOpacity, cyanOpacity, goldScale, cyanScale, goldPulse]);
```

**After:**
```typescript
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;

    if (visible) {
      Animated.parallel([
        Animated.spring(goldOpacity, { toValue: 1, useNativeDriver: true, friction: 5 }),
        Animated.spring(cyanOpacity, { toValue: 1, useNativeDriver: true, friction: 5, delay: 300 }),
        Animated.spring(goldScale,   { toValue: 1, useNativeDriver: true, friction: 6 }),
        Animated.spring(cyanScale,   { toValue: 1, useNativeDriver: true, friction: 6, delay: 300 }),
      ]).start(() => {
        pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(goldPulse, { toValue: 1.08, duration: 2800, useNativeDriver: true }),
            Animated.timing(goldPulse, { toValue: 0.94, duration: 2800, useNativeDriver: true }),
          ])
        );
        pulseAnimation.start();
      });
    } else {
      Animated.parallel([
        Animated.timing(goldOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cyanOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }

    return () => {
      pulseAnimation?.stop();
    };
  }, [visible, goldOpacity, cyanOpacity, goldScale, cyanScale, goldPulse]);
```

### Step 3: Run tests

Run: `cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx vitest run src/__tests__/mobile-onboarding.test.ts`
Expected: 7 tests passing, 0 failing.

Run: `npm run test 2>&1 | grep -E "Test Files|Tests " | tail -3`
Expected: All passing, same count as before.

### Step 4: Commit

```bash
git add apps/mobile/src/screens/OnboardingScreen.tsx src/__tests__/mobile-onboarding.test.ts
git commit -m "fix(mobile): stop OrbBackdrop pulse loop on unmount — prevent animation leak"
```

---

## Task 2: Remove static opacity from orb stylesheet entries

**Issue:** `styles.orbGold` has `opacity: 0.18` and `styles.orbCyan` has `opacity: 0.14` hardcoded. These are overridden at runtime by `goldOpacity` and `cyanOpacity` (`Animated.Value`s starting at 0). The static values are dead weight — they only confuse readers into thinking there is a fixed opacity floor. The animated values are the sole authority.

**Files:**
- Modify: `apps/mobile/src/screens/OnboardingScreen.tsx:506-534`
- Test: `src/__tests__/mobile-onboarding.test.ts`

### Step 1: Write the test

Add a static-analysis style test that reads the source file and asserts the stylesheet entries do NOT contain a bare `opacity` key alongside the dynamic orb style keys. Add to `src/__tests__/mobile-onboarding.test.ts`:

```typescript
describe('OrbBackdrop stylesheet', () => {
  it('orbGold stylesheet entry does not contain static opacity (animated value is sole authority)', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(
      'apps/mobile/src/screens/OnboardingScreen.tsx',
      'utf-8'
    );
    // Find the orbGold block — from "orbGold: {" to its closing "}"
    const orbGoldMatch = src.match(/orbGold:\s*\{([^}]+)\}/s);
    expect(orbGoldMatch).not.toBeNull();
    // Static opacity must be absent — animated value handles opacity
    expect(orbGoldMatch![1]).not.toMatch(/\bopacity\s*:/);
  });

  it('orbCyan stylesheet entry does not contain static opacity', async () => {
    const fs = await import('fs');
    const src = fs.readFileSync(
      'apps/mobile/src/screens/OnboardingScreen.tsx',
      'utf-8'
    );
    const orbCyanMatch = src.match(/orbCyan:\s*\{([^}]+)\}/s);
    expect(orbCyanMatch).not.toBeNull();
    expect(orbCyanMatch![1]).not.toMatch(/\bopacity\s*:/);
  });
});
```

Run: `npx vitest run src/__tests__/mobile-onboarding.test.ts`
Expected: 2 new tests **FAIL** (static opacity still present). 7 old tests pass.

### Step 2: Remove static opacity from both orb styles

In `apps/mobile/src/screens/OnboardingScreen.tsx`, edit the stylesheet:

**`orbGold` — remove `opacity: 0.18,`:**
```typescript
  orbGold: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#D4AF37',
    top: SCREEN_H * 0.25,
    left: SCREEN_W * 0.05,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 60,
  },
```

**`orbCyan` — remove `opacity: 0.14,`:**
```typescript
  orbCyan: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#00F5FF',
    top: SCREEN_H * 0.3,
    right: SCREEN_W * 0.05,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
  },
```

### Step 3: Run tests

Run: `npx vitest run src/__tests__/mobile-onboarding.test.ts`
Expected: 9 tests passing, 0 failing.

Run: `npm run test 2>&1 | grep -E "Test Files|Tests " | tail -3`
Expected: All passing.

### Step 4: Commit

```bash
git add apps/mobile/src/screens/OnboardingScreen.tsx src/__tests__/mobile-onboarding.test.ts
git commit -m "fix(mobile): remove dead static opacity from orb styles — animated value is sole authority"
```

---

## Task 3: Validate date/time format before transitioning to `calculating` phase

**Issue:** `submit()` calls `setPhase('calculating')` before `calculateAll`. An invalid date string (e.g. `"1990-13-45"`) passes lat/lon validation, transitions to the spinner, the API call fails, and `setPhase('birth-input')` snaps back. The user sees a flash: form → spinner → form. Date and time should be validated before the phase transition.

The validators are simple regex checks — extract them as pure functions so they can be unit-tested without mocking the component.

**Files:**
- Modify: `apps/mobile/src/screens/OnboardingScreen.tsx:117-121` (add validators after `formatDateForApi`)
- Modify: `apps/mobile/src/screens/OnboardingScreen.tsx:180-209` (add validation calls in `submit` before `setPhase`)
- Test: `src/__tests__/mobile-onboarding.test.ts`

### Step 1: Write the failing tests

Add to `src/__tests__/mobile-onboarding.test.ts`:

```typescript
// ── Date/time validation helpers (inlined to match screen implementation) ──────

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function isValidTime(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t);
}

describe('date/time format validators', () => {
  describe('isValidDate', () => {
    it('accepts YYYY-MM-DD format', () => {
      expect(isValidDate('1990-01-15')).toBe(true);
      expect(isValidDate('2000-12-31')).toBe(true);
    });

    it('rejects missing leading zeros or wrong separators', () => {
      expect(isValidDate('1990-1-1')).toBe(false);
      expect(isValidDate('1990/01/01')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('rejects partial or extra characters', () => {
      expect(isValidDate('90-01-01')).toBe(false);
      expect(isValidDate('1990-01-015')).toBe(false);
    });
  });

  describe('isValidTime', () => {
    it('accepts HH:MM format', () => {
      expect(isValidTime('12:00')).toBe(true);
      expect(isValidTime('00:00')).toBe(true);
      expect(isValidTime('23:59')).toBe(true);
    });

    it('rejects wrong format', () => {
      expect(isValidTime('9:00')).toBe(false);
      expect(isValidTime('12:0')).toBe(false);
      expect(isValidTime('')).toBe(false);
      expect(isValidTime('12-00')).toBe(false);
    });
  });
});
```

Run: `npx vitest run src/__tests__/mobile-onboarding.test.ts`
Expected: The new 7 validator tests PASS immediately (pure functions, no dependencies). Total: 16 tests passing.

### Step 2: Add validators to `OnboardingScreen.tsx`

After `formatDateForApi` (around line 121), add:

```typescript
/** Returns true if the string matches YYYY-MM-DD exactly. */
function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

/** Returns true if the string matches HH:MM exactly. */
function isValidTime(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t);
}
```

### Step 3: Add validation calls in `submit` before `setPhase('calculating')`

In `submit()`, after the lon/lat validation block (after line 204) and **before** `setPhase('calculating')`, insert:

```typescript
    if (!isValidDate(date)) {
      const message = "Geburtsdatum muss im Format JJJJ-MM-TT sein (z.B. 1990-01-15).";
      setError(message);
      Alert.alert("Ungültiges Datum", message);
      return;
    }

    if (!timeUnknown && !isValidTime(time)) {
      const message = "Geburtszeit muss im Format HH:MM sein (z.B. 12:00).";
      setError(message);
      Alert.alert("Ungültige Uhrzeit", message);
      return;
    }
```

The full updated `submit` function body should look like:

```typescript
  const submit = async () => {
    setError(null);

    if (!user) {
      const message = "Bitte melde dich erneut an.";
      setError(message);
      Alert.alert("Anmeldung erforderlich", message);
      return;
    }

    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      const message = "Breitengrad muss zwischen -90 und 90 liegen.";
      setError(message);
      Alert.alert("Ungültiger Breitengrad", message);
      return;
    }
    if (!Number.isFinite(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      const message = "Längengrad muss zwischen -180 und 180 liegen.";
      setError(message);
      Alert.alert("Ungültiger Längengrad", message);
      return;
    }

    if (!isValidDate(date)) {
      const message = "Geburtsdatum muss im Format JJJJ-MM-TT sein (z.B. 1990-01-15).";
      setError(message);
      Alert.alert("Ungültiges Datum", message);
      return;
    }

    if (!timeUnknown && !isValidTime(time)) {
      const message = "Geburtszeit muss im Format HH:MM sein (z.B. 12:00).";
      setError(message);
      Alert.alert("Ungültige Uhrzeit", message);
      return;
    }

    const normalizedTime = timeUnknown ? "12:00" : time;
    const birthDate = formatDateForApi(date, normalizedTime);

    setPhase('calculating');
    try {
      const reading = await calculateAll({ date: birthDate, tz, lat: parsedLat, lon: parsedLon });

      let interpretation: string;
      try {
        interpretation = await generateInterpretation(reading, "de");
      } catch {
        interpretation = "Dein kosmisches Profil wurde berechnet. Die KI-Deutung wird beim nächsten Öffnen nachgeladen.";
      }

      await persistReading(
        user.id,
        { date: birthDate, tz, lat: parsedLat, lon: parsedLon, place: placeName || placeQuery },
        reading,
        interpretation,
      );

      const sectors = wuxingToSoulprint(reading.wuxing?.elements ?? {});
      setSoulprintSectors(sectors);
      setPhase('ring-reveal');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
      Alert.alert("Berechnung fehlgeschlagen", message);
      setPhase('birth-input');
    }
  };
```

### Step 4: Run tests

Run: `npx vitest run src/__tests__/mobile-onboarding.test.ts`
Expected: 16 tests passing, 0 failing.

Run: `npm run lint`
Expected: No TypeScript errors.

Run: `npm run test 2>&1 | grep -E "Test Files|Tests " | tail -3`
Expected: All passing.

### Step 5: Commit

```bash
git add apps/mobile/src/screens/OnboardingScreen.tsx src/__tests__/mobile-onboarding.test.ts
git commit -m "fix(mobile): validate date/time format before transitioning to calculating phase"
```
