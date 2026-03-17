# Mobile Phase 3: Push Notifications + Transit Cards + Polish

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add daily push notifications with personalized transit alerts, active transit cards on the Home screen, and UI polish for TestFlight readiness — making Bazodiac the app users open every morning because it pushes them relevant cosmic updates.

**Architecture:** `expo-notifications` handles push registration and local display. The server stores push tokens in Supabase (`push_tokens` table) and a daily cron job (Railway or Supabase Edge Function) generates personalized push text via Gemini from each user's transit data. Transit cards on Home use the existing `/api/transit-state/:userId` endpoint. Polish covers haptic feedback, skeleton loading, error boundaries, and App Store metadata.

**Tech Stack:** expo-notifications, Supabase (push_tokens table), Gemini (push text generation), React Native Animated (transit cards), expo-haptics, EAS Submit

---

## Phase 3A — Push Notifications

### Task 1: Install expo-notifications + expo-device

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`

**Step 1:** Install packages:
```bash
cd apps/mobile && npx expo install expo-notifications expo-device expo-haptics
```

**Step 2:** Add notification config to `app.json`:
```json
"plugins": [
  "expo-secure-store",
  "expo-web-browser",
  [
    "expo-notifications",
    {
      "icon": "./assets/notification-icon.png",
      "color": "#D4AF37"
    }
  ]
]
```

Note: Create `assets/notification-icon.png` (96x96 white-on-transparent PNG for Android — iOS uses app icon automatically). For now, skip the custom icon and just add the plugin without the icon config.

**Step 3:** Commit:
```bash
git add apps/mobile/package.json apps/mobile/package-lock.json apps/mobile/app.json
git commit -m "chore(mobile): install expo-notifications, expo-device, expo-haptics"
```

---

### Task 2: Create push registration flow

**Files:**
- Create: `apps/mobile/src/lib/pushNotifications.ts`

**Step 1:** Create the push registration module:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { authedFetch } from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Push only works on physical devices
  if (!Device.isDevice) {
    console.log('[Push] Skipping — not a physical device');
    return null;
  }

  // Check existing permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  // Ask for permission if not granted
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '3dc5ff64-329b-4fcf-bb89-34eb0132cfec',
  });
  const token = tokenData.data;

  // Register token on server
  try {
    await authedFetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });
    console.log('[Push] Token registered:', token.slice(0, 20) + '...');
  } catch (err) {
    console.warn('[Push] Token registration failed:', err);
  }

  return token;
}
```

**Step 2:** Commit:
```bash
git add apps/mobile/src/lib/pushNotifications.ts
git commit -m "feat(mobile): add push notification registration with Expo push tokens"
```

---

### Task 3: Add server endpoint for push token storage

**Files:**
- Modify: `server.mjs`
- Create: `supabase-migrations/20260317_push_tokens.sql`

**Step 1:** Create the Supabase migration:

```sql
-- supabase-migrations/20260317_push_tokens.sql
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'ios',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);
```

**Step 2:** Add the endpoint to `server.mjs`:

```javascript
// ── Push token registration ──────────────────────────────────────────
app.post('/api/push/register', requireUserAuth, express.json(), async (req, res) => {
  const { token, platform } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const { error } = await supabaseServer.from('push_tokens').upsert(
      { user_id: req.userId, token, platform: platform || 'ios', updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' }
    );
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('[push/register]', err);
    res.status(500).json({ error: 'Failed to register token' });
  }
});
```

**Step 3:** Commit:
```bash
git add server.mjs supabase-migrations/20260317_push_tokens.sql
git commit -m "feat: add push token registration endpoint and Supabase table"
```

---

### Task 4: Register push on app launch

**Files:**
- Modify: `apps/mobile/App.tsx`

**Step 1:** Import and call registration in `MobileRoot`:

```typescript
import { registerForPushNotifications } from './src/lib/pushNotifications';
```

In the existing `useEffect` in `MobileRoot` (after `startQueueWorker()`):

```typescript
// Register push notifications (non-blocking)
void registerForPushNotifications();
```

**Step 2:** Commit:
```bash
git add apps/mobile/App.tsx
git commit -m "feat(mobile): register push notifications on app launch"
```

---

### Task 5: Create daily push cron job

**Files:**
- Create: `scripts/daily-push.mjs`

**Context:** This script runs as a daily cron job (Railway Cron or external scheduler). It:
1. Fetches all push tokens from Supabase
2. For each user, fetches their daily horoscope from Experience API
3. If `fusion.pushworthy === true`, sends a push via Expo Push API
4. Uses the `fusion.push_text` as the notification body

**Step 1:** Create the script:

```javascript
// scripts/daily-push.mjs
// Run daily at 06:00 via: node scripts/daily-push.mjs
// Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BAFE_BASE_URL env vars

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BAFE_URL = process.env.BAFE_BASE_URL || process.env.VITE_BAFE_BASE_URL || 'https://bafe-production.up.railway.app';

async function main() {
  console.log(`[daily-push] Starting at ${new Date().toISOString()}`);

  // 1. Get all push tokens with user profiles
  const { data: tokens, error: tokenErr } = await supabase
    .from('push_tokens')
    .select('token, user_id, platform');

  if (tokenErr || !tokens?.length) {
    console.log('[daily-push] No tokens found or error:', tokenErr);
    return;
  }

  console.log(`[daily-push] ${tokens.length} tokens to process`);

  // 2. Get unique user IDs and their profiles
  const userIds = [...new Set(tokens.map(t => t.user_id))];
  const { data: profiles } = await supabase
    .from('astro_profiles')
    .select('user_id, birth_date, birth_time, iana_time_zone, birth_lat, birth_lng, astro_json')
    .in('user_id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
  const today = new Date().toISOString().slice(0, 10);
  const messages = [];

  // 3. For each user, fetch daily and check if pushworthy
  for (const userId of userIds) {
    const profile = profileMap.get(userId);
    if (!profile) continue;

    try {
      const resp = await fetch(`${BAFE_URL}/experience/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth: {
            date: profile.birth_date,
            time: profile.birth_time || '12:00',
            tz: profile.iana_time_zone || 'Europe/Berlin',
            lat: profile.birth_lat || 0,
            lon: profile.birth_lng || 0,
          },
          soulprint_sectors: profile.astro_json?.soulprint_sectors || Array(12).fill(0),
          quiz_sectors: Array(12).fill(0),
          target_date: today,
          locale: 'de-DE',
        }),
      });

      if (!resp.ok) {
        console.warn(`[daily-push] Daily fetch failed for ${userId}: ${resp.status}`);
        continue;
      }

      const daily = await resp.json();

      if (daily.fusion?.pushworthy && daily.fusion?.push_text) {
        const userTokens = tokens.filter(t => t.user_id === userId);
        for (const t of userTokens) {
          messages.push({
            to: t.token,
            title: 'Bazodiac — Tagesimpuls',
            body: daily.fusion.push_text,
            data: { type: 'daily', date: today },
            sound: 'default',
          });
        }
      }
    } catch (err) {
      console.warn(`[daily-push] Error for ${userId}:`, err);
    }
  }

  // 4. Send all pushes in batches of 100
  if (messages.length === 0) {
    console.log('[daily-push] No pushworthy messages today');
    return;
  }

  console.log(`[daily-push] Sending ${messages.length} pushes`);

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
    } catch (err) {
      console.error('[daily-push] Batch send failed:', err);
    }
  }

  console.log(`[daily-push] Done. Sent ${messages.length} pushes.`);
}

main().catch(console.error);
```

**Step 2:** Add to Railway as a cron job, or run via `node scripts/daily-push.mjs` on a scheduler. The schedule should be `0 5 * * *` (05:00 UTC = 06:00 CET).

**Step 3:** Commit:
```bash
git add scripts/daily-push.mjs
git commit -m "feat: add daily push notification cron script"
```

---

## Phase 3B — Transit Cards

### Task 6: Create useTransitState hook

**Files:**
- Create: `apps/mobile/src/hooks/useTransitState.ts`

**Context:** The web app already has `useFusionSignal` that polls `/api/transit-state/:userId`. The mobile version is simpler — fetch once on mount, no polling (battery-conscious).

**Step 1:** Create the hook. It should:
- Call `GET /api/transit-state/:userId` via `authedFetch`
- Parse the transit events from the response
- Return `{ transits: TransitEvent[], loading: boolean }`
- Each transit event has: `planet`, `aspect`, `natal_point`, `intensity`, `description`

Use the `TransitState` schema from `@bazodiac/shared` if available, or define a simple local type.

**Step 2:** Commit:
```bash
git add apps/mobile/src/hooks/useTransitState.ts
git commit -m "feat(mobile): add useTransitState hook for active transit cards"
```

---

### Task 7: Add Transit Cards to DashboardScreen

**Files:**
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Step 1:** Import `useTransitState` and render transit events as a horizontal `ScrollView` of small cards between the Weltraumwetter and Tagesimpuls sections.

Each transit card shows:
- Planet emoji/symbol (top)
- Aspect type (e.g., "□ Mond" for Mars square Moon)
- Intensity bar (colored by intensity value)
- Width: ~120px, scrollable horizontally

**Step 2:** If no transits are active, show a subtle "Keine aktiven Transite" message.

**Step 3:** Commit:
```bash
git add apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "feat(mobile): add horizontal transit cards to Home screen"
```

---

## Phase 3C — Polish

### Task 8: Add haptic feedback to interactive elements

**Files:**
- Modify: `apps/mobile/src/components/QuizRenderer.tsx`
- Modify: `apps/mobile/src/screens/QuizScreen.tsx`
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Step 1:** Import `expo-haptics`:
```typescript
import * as Haptics from 'expo-haptics';
```

**Step 2:** Add haptics to:
- Quiz answer selection: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
- Quiz result reveal: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`
- "Signatur öffnen" tap: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)`
- Tab switch: `Haptics.selectionAsync()`

**Step 3:** Commit:
```bash
git add apps/mobile/src/components/QuizRenderer.tsx apps/mobile/src/screens/QuizScreen.tsx apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "feat(mobile): add haptic feedback to quiz and navigation interactions"
```

---

### Task 9: Add skeleton loading states

**Files:**
- Create: `apps/mobile/src/components/SkeletonCard.tsx`
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Step 1:** Create a reusable skeleton component:

```typescript
// Animated shimmer effect using Animated API
// Dark theme: bg #1a2636, shimmer #243a52
// Props: width, height, borderRadius
```

**Step 2:** Replace "Loading..." text in Dashboard cards with skeleton placeholders while data loads:
- Kosmisches Profil: 2 skeleton lines
- Weltraumwetter: 1 skeleton line
- Tagesimpuls: 3 skeleton lines

**Step 3:** Commit:
```bash
git add apps/mobile/src/components/SkeletonCard.tsx apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "feat(mobile): add skeleton loading states to Dashboard cards"
```

---

### Task 10: Add error boundary for screens

**Files:**
- Create: `apps/mobile/src/components/ScreenErrorBoundary.tsx`
- Modify: `apps/mobile/src/navigation/RootNavigator.tsx`

**Step 1:** Create a React error boundary that catches screen-level crashes:
- Shows: "Etwas ist schiefgelaufen" + "Erneut versuchen" button
- Dark theme styling
- Logs error to console

**Step 2:** Wrap each tab screen in the navigator with the error boundary.

**Step 3:** Commit:
```bash
git add apps/mobile/src/components/ScreenErrorBoundary.tsx apps/mobile/src/navigation/RootNavigator.tsx
git commit -m "feat(mobile): add screen-level error boundaries"
```

---

### Task 11: App Store preparation

**Files:**
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/store/description-de.md`
- Create: `apps/mobile/store/description-en.md`
- Create: `apps/mobile/store/keywords.txt`

**Step 1:** Update `app.json` with App Store metadata:
```json
"ios": {
  "bundleIdentifier": "space.bazodiac.mobile",
  "supportsTablet": false,
  "buildNumber": "1",
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false,
    "NSUserTrackingUsageDescription": "Bazodiac verwendet keine Tracking-Daten.",
    "UIBackgroundModes": ["remote-notification"]
  }
}
```

**Step 2:** Write App Store description (German, primary):

```markdown
Bazodiac — Dein kosmischer Kompass

Bazodiac verbindet westliche Astrologie, chinesisches BaZi und die fünf Elemente (WuXing) zu einem einzigartigen kosmischen Profil — deiner Signatur.

✦ Täglicher Impuls — Jeden Morgen ein personalisierter Transit-Bericht
✦ 22 Persönlichkeits-Quizzes — Entdecke verborgene Facetten deiner Signatur
✦ WuXing-Balance — Sieh deine elementare Zusammensetzung
✦ Weltraumwetter — Echtzeit Kp-Index und geomagnetische Aktivität

Deine Signatur ist kein Horoskop. Sie ist ein lebendes Feld, das sich mit den Planeten verändert.
```

**Step 3:** Keywords:
```
Horoskop,Astrologie,BaZi,WuXing,Sternzeichen,Persönlichkeitstest,Transit,Kosmisch,Signatur,Elemente
```

**Step 4:** Commit:
```bash
git add apps/mobile/app.json apps/mobile/store/
git commit -m "chore(mobile): add App Store metadata and descriptions"
```

---

### Task 12: TestFlight build + submission

**Step 1:** Create production build:
```bash
cd apps/mobile && eas build --platform ios --profile production --non-interactive
```

**Step 2:** Submit to App Store Connect:
```bash
cd apps/mobile && eas submit --platform ios --latest
```

**Step 3:** In App Store Connect:
- Add screenshots (5 required: Home, Quiz, Result, Signatur, Profil)
- Set age rating (4+, no objectionable content)
- Set privacy URL to `https://bazodiac.space/privacy`
- Submit for review

---

## Summary

| Phase | Tasks | Focus | Aufwand |
|-------|-------|-------|---------|
| **3A Push** | 1-5 | Push registration, server endpoint, daily cron | 2-3 Tage |
| **3B Transits** | 6-7 | Transit cards auf Home Screen | 1 Tag |
| **3C Polish** | 8-10 | Haptics, Skeletons, Error Boundaries | 1-2 Tage |
| **3D Store** | 11-12 | Metadata, TestFlight, Submission | 1 Tag |
| **Gesamt** | 12 Tasks | | **5-7 Tage** |

**Nach Phase 3:** Die App ist im App Store. User bekommen morgens eine Push-Notification mit ihrem Tagesimpuls, öffnen die App und sehen Transit-Cards, Signatur-Daten, WuXing-Balance und den vollen Quiz-Katalog.
