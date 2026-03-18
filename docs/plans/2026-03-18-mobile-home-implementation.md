# Mobile Home Screen Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the mobile Home Screen from a list of cards into a cosmic dashboard with an identity triade, color-coded weather, themed daily horoscope, and event countdown — all using the Bazodiac night/dawn color palette.

**Architecture:** The DashboardScreen is rewritten top-to-bottom. The "Kosmisches Profil" card becomes a compact triade of 3 symbols. Weather gets Kp-based color coding. WuXing moves into the triade row (as dominant element). A new CosmicEventCard component shows event probability or countdown. All data comes from existing hooks + profile data. The cosmic event card uses mock data initially (real backend comes in tasks 5-6 spec).

**Tech Stack:** React Native 0.79, Expo 53, existing hooks (useSpaceWeather, useDailyHoroscope), profile.astro_json, StyleSheet with Bazodiac palette

---

## Context for Implementor

### Current DashboardScreen structure (before redesign):
```
ScrollView
├── Card: "Kosmisches Profil" (text: "Sagittarius Sun • Cancer Moon • Gemini Rising")
├── Card: "Weltraumwetter" (Kp value + text)
├── Card: "WuXing 五行" (5 element bars)
├── Card: "Tagesimpuls" (daily.fusion.summary + action)
├── Button: "Signatur öffnen" (gold)
└── Row: "Teilen" + "Upgrade/Aktualisieren"
```

### Target structure (after redesign):
```
ScrollView (gradient background)
├── CosmicTriade: ♐︎ 龍 木 (3 symbols, no card)
├── Card: "Weltraumwetter" (Kp bar with color coding)
├── Card: "Tagesimpuls" (with theme tags)
├── Card: "Kosmisches Event" (probability % or countdown)
├── Button: "Signatur öffnen" (gold)
└── Row: "Teilen" + "Upgrade/Aktualisieren"
```

### Where is the BaZi animal data?
`profile.astro_json.bazi.zodiac_sign` — contains the English animal name (e.g., "Dragon"). The chinese character mapping needs to be inline (no shared lib exists for mobile).

### Where is the dominant WuXing element?
`profile.astro_json.wuxing.dominant_element` — contains the English name (e.g., "Wood"). Map to chinese: Wood→木, Fire→火, Earth→土, Metal→金, Water→水.

### Where is the sun sign?
`profile.sun_sign` — contains the English name (e.g., "Sagittarius"). Map to zodiac symbol: Aries→♈, etc.

### Bazodiac Color Palette
```typescript
const PALETTE = {
  nightSky: '#060b12',       // deepest background
  dawnBlue: '#0a1628',       // card background
  card: '#0f1823',           // elevated card
  gold: '#D4AF37',           // accent, CTAs
  goldDim: 'rgba(212,175,55,0.15)',
  white: '#f4f7fb',          // primary text
  dim: '#6b7f99',            // secondary text
  border: '#1a2636',         // subtle borders
  kpGreen: '#3D8B37',        // Kp 0-2
  kpYellow: '#C49A2A',       // Kp 3-4
  kpRed: '#c44d2a',          // Kp 5-6
  kpCritical: '#ff2222',     // Kp 7+
};
```

---

### Task 1: Update theme.ts with full Bazodiac palette

**Files:**
- Modify: `apps/mobile/src/theme.ts`

**Step 1: Replace theme.ts with expanded palette**

```typescript
/** Shared mobile theme constants — Bazodiac night/dawn palette */
export const COLORS = {
  // Backgrounds
  bg: '#060b12',
  bgDawn: '#0a1628',
  card: '#0f1823',

  // Accent
  gold: '#D4AF37',
  goldDim: 'rgba(212, 175, 55, 0.15)',
  borderGold: 'rgba(212, 175, 55, 0.2)',

  // Text
  text: '#f4f7fb',
  textDim: '#6b7f99',
  textMuted: '#4a5d75',

  // Borders
  border: '#1a2636',

  // Status
  green: '#3D8B37',
  greenBg: '#12301a',

  // Kp Index colors
  kpGreen: '#3D8B37',
  kpYellow: '#C49A2A',
  kpRed: '#c44d2a',
  kpCritical: '#ff2222',

  // Elements
  wood: '#3D8B37',
  fire: '#D63B0F',
  earth: '#C49A2A',
  metal: '#8A8A8A',
  water: '#2E6BB5',
};
```

**Step 2: Commit**

```bash
git add apps/mobile/src/theme.ts
git commit -m "feat(mobile): expand theme.ts with full Bazodiac night/dawn palette"
```

---

### Task 2: Create CosmicTriade component

**Files:**
- Create: `apps/mobile/src/components/CosmicTriade.tsx`

**Context:** Three large symbols side by side showing the user's cosmic identity. No card background — sits directly on the scroll view.

**Step 1: Create the component**

```typescript
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

// ── Zodiac sign → symbol mapping ─────────────────────────────────────
const ZODIAC_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

// ── BaZi animal → chinese character ──────────────────────────────────
const ANIMAL_CHINESE: Record<string, string> = {
  Rat: '鼠', Ox: '牛', Tiger: '虎', Rabbit: '兔',
  Dragon: '龍', Snake: '蛇', Horse: '馬', Goat: '羊',
  Monkey: '猴', Rooster: '雞', Dog: '狗', Pig: '豬',
};

// ── WuXing element → chinese character + color ───────────────────────
const ELEMENT_MAP: Record<string, { chinese: string; color: string }> = {
  Wood:  { chinese: '木', color: COLORS.wood },
  Fire:  { chinese: '火', color: COLORS.fire },
  Earth: { chinese: '土', color: COLORS.earth },
  Metal: { chinese: '金', color: COLORS.metal },
  Water: { chinese: '水', color: COLORS.water },
  // German fallbacks
  Holz:   { chinese: '木', color: COLORS.wood },
  Feuer:  { chinese: '火', color: COLORS.fire },
  Erde:   { chinese: '土', color: COLORS.earth },
  Metall: { chinese: '金', color: COLORS.metal },
  Wasser: { chinese: '水', color: COLORS.water },
};

interface CosmicTriadeProps {
  sunSign: string;
  baziAnimal: string;
  dominantElement: string;
}

export function CosmicTriade({ sunSign, baziAnimal, dominantElement }: CosmicTriadeProps) {
  const zodiacSymbol = ZODIAC_SYMBOLS[sunSign] || '✦';
  const animalChinese = ANIMAL_CHINESE[baziAnimal] || '?';
  const element = ELEMENT_MAP[dominantElement] || { chinese: '?', color: COLORS.gold };

  return (
    <View style={styles.container}>
      <View style={styles.symbolGroup}>
        <Text style={[styles.symbol, { color: COLORS.gold }]}>{zodiacSymbol}</Text>
        <Text style={styles.label}>{sunSign || '—'}</Text>
      </View>
      <View style={styles.symbolGroup}>
        <Text style={[styles.symbol, { color: COLORS.text }]}>{animalChinese}</Text>
        <Text style={styles.label}>{baziAnimal || '—'}</Text>
      </View>
      <View style={styles.symbolGroup}>
        <Text style={[styles.symbol, { color: element.color }]}>{element.chinese}</Text>
        <Text style={styles.label}>{dominantElement || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  symbolGroup: {
    alignItems: 'center',
    gap: 6,
  },
  symbol: {
    fontSize: 40,
    lineHeight: 48,
  },
  label: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
```

**Step 2: Commit**

```bash
git add apps/mobile/src/components/CosmicTriade.tsx
git commit -m "feat(mobile): add CosmicTriade component (sun sign, BaZi animal, WuXing element)"
```

---

### Task 3: Create CosmicEventCard component (mock data)

**Files:**
- Create: `apps/mobile/src/components/CosmicEventCard.tsx`

**Context:** Shows either a probability percentage (event > 3h) or a countdown timer (event < 3h). Uses mock data for now — real backend comes in Task 5 spec.

**Step 1: Create the component**

```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

interface CosmicEvent {
  id: string;
  type: 'transit' | 'storm' | 'resonance';
  label: string;
  description: string;
  startsAt: string; // ISO timestamp
  durationMinutes: number;
  intensity: number; // 0-1
}

interface CosmicEventCardProps {
  probability6h: number; // 0-100
  nextEvent: CosmicEvent | null;
  onRequestPush?: (eventId: string) => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CosmicEventCard({ probability6h, nextEvent, onRequestPush }: CosmicEventCardProps) {
  const [now, setNow] = useState(Date.now());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const msUntilEvent = nextEvent ? new Date(nextEvent.startsAt).getTime() - now : Infinity;
  const isCountdownMode = nextEvent && msUntilEvent < 3 * 3_600_000 && msUntilEvent > 0;
  const isActive = nextEvent && msUntilEvent <= 0;
  const isUrgent = nextEvent && msUntilEvent < 30 * 60_000 && msUntilEvent > 0;

  // Pulse animation for urgent events
  useEffect(() => {
    if (!isUrgent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isUrgent, pulseAnim]);

  // ── Active event ───────────────────────────────────────────────────
  if (isActive && nextEvent) {
    return (
      <View style={[styles.card, styles.cardActive]}>
        <Text style={styles.kicker}>✦ JETZT AKTIV</Text>
        <Text style={styles.eventLabel}>{nextEvent.label}</Text>
        <Text style={styles.eventDesc}>{nextEvent.description}</Text>
      </View>
    );
  }

  // ── Countdown mode (< 3h) ─────────────────────────────────────────
  if (isCountdownMode && nextEvent) {
    return (
      <View style={[styles.card, styles.cardCountdown]}>
        <Text style={styles.kicker}>NÄCHSTES KOSMISCHES EVENT</Text>
        <View style={styles.countdownRow}>
          <Animated.View style={[styles.urgentDot, isUrgent && { opacity: pulseAnim }]} />
          <Text style={styles.countdown}>{formatCountdown(msUntilEvent)}</Text>
        </View>
        <Text style={styles.eventLabel}>{nextEvent.label}</Text>
        <Text style={styles.eventDesc}>{nextEvent.description}</Text>
        {onRequestPush && (
          <Pressable style={styles.pushButton} onPress={() => onRequestPush(nextEvent.id)}>
            <Text style={styles.pushButtonText}>🔔 Push 1 Min vorher</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ── Probability mode (default) ─────────────────────────────────────
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>KOSMISCHES EVENT</Text>
      <View style={styles.probRow}>
        <Text style={[styles.probValue, probability6h > 50 && styles.probHigh]}>
          {probability6h}%
        </Text>
        <View style={styles.probMeta}>
          <Text style={styles.probLabel}>Resonanz-Event</Text>
          <Text style={styles.probSubLabel}>Wahrscheinlichkeit nächste 6h</Text>
        </View>
      </View>
      {/* Progress ring placeholder — a horizontal bar for simplicity */}
      <View style={styles.probTrack}>
        <View style={[styles.probFill, { width: `${probability6h}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardCountdown: {
    borderColor: COLORS.gold,
    borderWidth: 1,
  },
  cardActive: {
    borderColor: COLORS.gold,
    borderWidth: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urgentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.kpRed,
  },
  countdown: {
    color: COLORS.gold,
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  eventLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  eventDesc: {
    color: COLORS.textDim,
    fontSize: 13,
    lineHeight: 20,
  },
  pushButton: {
    marginTop: 4,
    minHeight: 40,
    borderRadius: 10,
    borderColor: COLORS.borderGold,
    borderWidth: 1,
    backgroundColor: COLORS.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pushButtonText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  probValue: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  probHigh: {
    color: COLORS.gold,
  },
  probMeta: {
    gap: 2,
  },
  probLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  probSubLabel: {
    color: COLORS.textDim,
    fontSize: 12,
  },
  probTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  probFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
  },
});
```

**Step 2: Commit**

```bash
git add apps/mobile/src/components/CosmicEventCard.tsx
git commit -m "feat(mobile): add CosmicEventCard with probability and countdown modes"
```

---

### Task 4: Rewrite DashboardScreen with new layout

**Files:**
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Step 1: Replace the entire DashboardScreen**

The new layout follows the design spec:

1. Remove the "Kosmisches Profil" card → replaced by CosmicTriade
2. Remove the WuXing card → dominant element is in the triade; full WuXing bars stay on Signatur screen
3. Redesign Weltraumwetter card with Kp color coding
4. Keep Tagesimpuls card but add theme tags from `daily.western.themes`
5. Add CosmicEventCard with mock data (probability 42%, no event yet)
6. Keep Signatur button + action row

**Key changes in the rewrite:**

- Import `CosmicTriade` and `CosmicEventCard`
- Import `LinearGradient` from `expo-linear-gradient` for background (if available), or use a View with backgroundColor
- Extract `sunSign`, `baziAnimal`, `dominantElement` from profile
- Add Kp color logic: `kpIndex < 3 → green, 3-5 → yellow, 5+ → red, 7+ → critical`
- Add theme tags row under tagesimpuls
- Add `CosmicEventCard` with `probability6h={42}` and `nextEvent={null}` (mock)

**Data extraction from profile:**

```typescript
const sunSign = profile?.sun_sign || '';
const baziAnimal = profile?.astro_json?.bazi?.zodiac_sign || '';
const dominantElement = profile?.astro_json?.wuxing?.dominant_element || '';

const kpColor = useMemo(() => {
  if (kpIndex >= 7) return COLORS.kpCritical;
  if (kpIndex >= 5) return COLORS.kpRed;
  if (kpIndex >= 3) return COLORS.kpYellow;
  return COLORS.kpGreen;
}, [kpIndex]);

const kpLabel = useMemo(() => {
  if (kpIndex >= 7) return 'Starker Sturm';
  if (kpIndex >= 5) return 'Sturm';
  if (kpIndex >= 3) return 'Moderat';
  return 'Ruhig';
}, [kpIndex]);
```

**Complete new JSX structure:**

```tsx
<ScrollView contentContainerStyle={styles.container}>
  {/* Kosmische Triade */}
  <CosmicTriade
    sunSign={sunSign}
    baziAnimal={baziAnimal}
    dominantElement={dominantElement}
  />

  {/* Weltraumwetter */}
  <View style={styles.card}>
    <Text style={styles.kicker}>⚡ KOSMISCHES WETTER</Text>
    <View style={styles.kpRow}>
      <Text style={[styles.kpValue, { color: kpColor }]}>
        {weatherLoading ? '...' : `Kp ${kpIndex.toFixed(1)}`}
      </Text>
      <Text style={[styles.kpLabel, { color: kpColor }]}>{kpLabel}</Text>
    </View>
    <View style={styles.kpTrack}>
      <View style={[styles.kpFill, { backgroundColor: kpColor, width: `${Math.min(kpIndex / 9 * 100, 100)}%` }]} />
    </View>
  </View>

  {/* Tagesimpuls */}
  <View style={styles.card}>
    <Text style={styles.kicker}>☀️ TAGESIMPULS</Text>
    {dailyLoading ? (
      <Text style={styles.body}>Dein Tageshoroskop wird geladen...</Text>
    ) : daily ? (
      <>
        <Text style={styles.dailySummary}>{daily.fusion.summary}</Text>
        <Text style={styles.body}>{daily.fusion.action}</Text>
        {daily.western?.themes?.length > 0 && (
          <View style={styles.themeTags}>
            {daily.western.themes.map((t, i) => (
              <View key={i} style={styles.themeTag}>
                <Text style={styles.themeTagText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    ) : (
      <Text style={styles.body}>Tagesimpuls nicht verfügbar.</Text>
    )}
  </View>

  {/* Kosmisches Event */}
  <CosmicEventCard
    probability6h={42}
    nextEvent={null}
  />

  {/* Signatur + Actions */}
  <Pressable style={styles.signaturButton} onPress={() => navigation.navigate("Signatur")}>
    <Text style={styles.signaturText}>✦ Signatur öffnen</Text>
  </Pressable>

  <View style={styles.actionRow}>
    <Pressable style={[styles.actionButton, styles.secondary]} onPress={openShare} disabled={busyShare}>
      <Text style={styles.secondaryText}>{busyShare ? "..." : "Teilen"}</Text>
    </Pressable>
    {tier !== "premium" ? (
      <Pressable style={[styles.actionButton, styles.premium]} onPress={openUpgrade} disabled={busyCheckout}>
        <Text style={styles.premiumText}>{busyCheckout ? "..." : "Upgrade"}</Text>
      </Pressable>
    ) : (
      <Pressable style={[styles.actionButton, styles.secondary]} onPress={() => void refreshProfile()}>
        <Text style={styles.secondaryText}>Aktualisieren</Text>
      </Pressable>
    )}
  </View>
</ScrollView>
```

**New/updated styles to add:**

```typescript
kpRow: {
  flexDirection: 'row',
  alignItems: 'baseline',
  gap: 10,
},
kpValue: {
  fontSize: 22,
  fontWeight: '800',
  fontVariant: ['tabular-nums'],
},
kpLabel: {
  fontSize: 13,
  fontWeight: '600',
},
kpTrack: {
  height: 4,
  backgroundColor: '#1a2636',
  borderRadius: 2,
  overflow: 'hidden',
},
kpFill: {
  height: 4,
  borderRadius: 2,
},
dailySummary: {
  color: '#f4f7fb',
  fontSize: 17,
  fontWeight: '700',
  lineHeight: 24,
},
themeTags: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 6,
},
themeTag: {
  backgroundColor: 'rgba(212, 175, 55, 0.1)',
  borderRadius: 12,
  paddingHorizontal: 10,
  paddingVertical: 4,
},
themeTagText: {
  color: '#D4AF37',
  fontSize: 11,
  fontWeight: '600',
},
```

**Remove** the `wuxingRow`, `wuxingLabel`, `wuxingName`, `wuxingTrack`, `wuxingFill`, `wuxingPct` styles and the `wuxingElements`/`wuxingTotal`/`wuxingMax` memos (WuXing bars are now only on the Signatur screen).

**Remove** the `summary` memo and the `title` style (replaced by CosmicTriade).

**Step 2: Verify Metro starts**

```bash
cd apps/mobile && npx expo start --clear 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "feat(mobile): redesign Home Screen with cosmic triade, Kp colors, event card"
```

---

### Task 5: EAS Build + Simulator Test

**Step 1:** Push and build:
```bash
git push -u origin feature/mobile-home-redesign
cd apps/mobile && eas build --platform ios --profile simulator --non-interactive
```

**Step 2:** Install and verify on simulator:
- [ ] CosmicTriade shows 3 symbols (zodiac, animal, element)
- [ ] Weltraumwetter has Kp color coding (green/yellow/red)
- [ ] Tagesimpuls shows daily fusion summary + theme tags
- [ ] CosmicEventCard shows "42%" probability
- [ ] Signatur button + action row intact
- [ ] No crashes, no white screen

**Step 3:** Merge to main.

---

## Backend Specification: Tasks 5-6

### Spec 5: Cosmic Events API

**Endpoint:** `GET /api/cosmic-events/:userId`

**Authentication:** `requireUserAuth` middleware (Supabase JWT)

**Response schema:**

```typescript
interface CosmicEventsResponse {
  /** Event probability for next 6 hours (0-100) */
  probability_6h: number;

  /** Next upcoming event, or null if none within 6h */
  next_event: {
    id: string;                    // e.g., "venus-transit-h7-20260318"
    type: 'transit' | 'storm' | 'resonance';
    label: string;                 // e.g., "Venus-Transit durch dein 7. Haus"
    description: string;           // 2-3 sentences, Gemini-generated
    starts_at: string;             // ISO 8601 timestamp
    duration_minutes: number;
    intensity: number;             // 0-1
  } | null;

  /** Currently active event, or null */
  active_event: {
    id: string;
    type: 'transit' | 'storm' | 'resonance';
    label: string;
    description: string;
    started_at: string;
    ends_at: string;
    intensity: number;
  } | null;
}
```

**Probability calculation logic:**

```
probability_6h = weighted_sum(
  transit_intensity:     weight 0.4  — from FuFirE /transit/state
  kp_forecast:           weight 0.2  — from NOAA/NASA space weather
  exact_aspect_count:    weight 0.3  — planets forming exact aspects (±1°) within 6h
  user_sensitivity:      weight 0.1  — how many natal points are being aspected
)
```

**Event identification:**
1. Check for upcoming **exact planetary aspects** (±1° orb) that aspect the user's natal chart
2. Check for **Kp index forecast** peaks (NOAA 3-day forecast data)
3. Pick the most intense upcoming event within 6h
4. Generate `label` and `description` via Gemini Flash with the event context

**Implementation location:** Add to `server.mjs` as a new route, using existing BAFE/FuFirE transit data + NOAA space weather data.

**Dependencies:**
- FuFirE `/transit/state` (already proxied)
- NOAA Space Weather API (already used in `/api/space-weather`)
- User's natal chart from `astro_profiles.astro_json`
- Gemini Flash for description generation (already configured)

**Caching:** Cache per user per hour in memory (same pattern as BAFE cache). Event descriptions cached in Supabase `daily_horoscope_cache` table.

---

### Spec 6: Event Push Notification

**When:** 1 minute before a cosmic event `starts_at`, if the user opted in.

**Flow:**

1. **User taps "🔔 Push 1 Min vorher"** in CosmicEventCard
2. App calls `Notifications.scheduleNotificationAsync()` with:
   - `trigger: { date: new Date(event.starts_at - 60_000) }`
   - `content: { title: "Bazodiac — Kosmisches Event", body: event.label, data: { eventId: event.id } }`
3. This is a **local notification** — no server involvement needed
4. The notification is scheduled on-device and fires even if the app is closed

**Implementation:**

```typescript
// In CosmicEventCard or a parent handler:
import * as Notifications from 'expo-notifications';

async function scheduleEventPush(event: CosmicEvent) {
  const triggerDate = new Date(new Date(event.startsAt).getTime() - 60_000);

  // Don't schedule if already in the past
  if (triggerDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Bazodiac — Kosmisches Event',
      body: event.label,
      data: { eventId: event.id, type: event.type },
      sound: 'default',
    },
    trigger: { date: triggerDate },
  });
}
```

**Prerequisites:**
- `expo-notifications` installed (done in Phase 1)
- Push permission requested on app launch (Task from Phase 3 plan)
- `UIBackgroundModes: ["remote-notification"]` in app.json (for background delivery)

**Note:** This is a LOCAL notification, not a server-sent push. The server-sent daily push (from Phase 3 `scripts/daily-push.mjs`) is a separate system for the morning daily horoscope.

---

## Summary

| Task | Type | What |
|------|------|------|
| 1 | Frontend | Expanded theme palette |
| 2 | Frontend | CosmicTriade component |
| 3 | Frontend | CosmicEventCard component (mock data) |
| 4 | Frontend | DashboardScreen rewrite |
| 5 | **Spec** | `/api/cosmic-events/:userId` endpoint |
| 6 | **Spec** | Local push notification scheduling |

**Tasks 1-4:** Implementierbar sofort, ~1-2 Stunden
**Tasks 5-6:** Backend-Spezifikation für separaten Sprint
