# Mobile MVP — Die 4 Säulen

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bazodiac Mobile MVP mit den 4 Features die 80% des Erfolgs ausmachen: lebendige Signatur, Daily Push, native Voice (Levi), Quiz-des-Tages → Signatur-Impact.

**Architecture:** Die Signatur ist das Zentrum. Alles andere füttert sie oder erklärt sie. Die NASA Space Weather API (bereits in `useSpaceWeather` implementiert) liefert Transit-Events die die Signatur modulieren. Quizzes verändern die Soulprint-Sektoren. Levi erklärt was der User sieht.

**Tech Stack:** React Native 0.79, Expo 53, @shopify/react-native-skia (2D Signatur), expo-notifications (Push), ElevenLabs React Native SDK oder WebView-Bridge (Levi), @bazodiac/shared (Scoring, Schemas)

---

## Säule 1: Lebendige Signatur (Default Tab)

### Ziel
Wenn der User die App öffnet, sieht er seine Signatur — ein lebendiges, interaktives Objekt das seine kosmische Identität visualisiert. Es reagiert auf Touch, verformt sich mit Quizzes, und pulsiert bei Transit-Events.

### Task 1.1: Signatur als Default-Tab

**Files:**
- Modify: `apps/mobile/src/navigation/RootNavigator.tsx`

Ändere die Tab-Reihenfolge so dass "Signatur" (FuRingScreen) der erste Tab ist:

```typescript
<Tab.Screen name="Signatur" component={FuRingScreen} ... />  // ERSTER Tab
<Tab.Screen name="Home" component={DashboardScreen} ... />
<Tab.Screen name="Quizzes" component={QuizScreen} ... />
<Tab.Screen name="Profil" component={ProfileScreen} ... />
```

Oder: 3 Tabs bleiben, aber Signatur wird zum Home-Tab (ersetzt DashboardScreen als initialer Screen).

**Commit:** `feat(mobile): make Signatur the default/first tab`

### Task 1.2: Signatur 2D-Rendering mit Skia

**Files:**
- Modify: `apps/mobile/package.json` (add @shopify/react-native-skia)
- Create: `apps/mobile/src/components/SignaturRing.tsx`
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`

**Was SignaturRing rendert:**
- 12 Sektor-Segmente als Kreisring (Radius ~120px)
- Jeder Sektor hat eine Amplitude proportional zu `soulprint_sectors[i]`
- Sektoren sind element-farbig (Feuer=rot, Wasser=blau, etc.)
- Harmonie-Index als innerer Kreis-Fill
- Signatur-Seed als subtiler Pattern im Zentrum

**Alternativ (wenn Skia zu komplex):** React Native Animated API + SVG mit 12 `<Path>` Segmenten. Weniger performant aber schneller zu implementieren.

**Commit:** `feat(mobile): add SignaturRing 2D visualization component`

### Task 1.3: Touch-Interaktion

**Files:**
- Modify: `apps/mobile/src/components/SignaturRing.tsx`

Touch-Gesten:
- **Tap auf Sektor** → zeigt Sektor-Name + Wert als Overlay
- **Long Press** → Haptic Feedback + Detail-Info
- **Pan** → rotiert den Ring leicht
- Verwende `react-native-gesture-handler` (bereits installiert)

**Commit:** `feat(mobile): add touch interaction to SignaturRing`

### Task 1.4: Transit-Modulation (NASA API)

**Files:**
- Modify: `apps/mobile/src/components/SignaturRing.tsx`
- Use: `apps/mobile/src/hooks/useSpaceWeather.ts` (bereits vorhanden)

Wenn Kp-Index ≥ 3:
- Ring pulsiert subtil (scale 1.0 → 1.02 → 1.0, 3s cycle)
- Sektor-Farben werden leicht intensiver (saturation +10%)

Wenn Kp-Index ≥ 5:
- Ring pulsiert stärker (scale 1.0 → 1.05)
- Subtiler Gold-Glow um den Ring
- "Kosmischer Sturm" Badge erscheint

**Commit:** `feat(mobile): modulate SignaturRing with NASA space weather data`

---

## Säule 2: Daily Push Notification

### Task 2.1: Push-Registrierung bei App-Start

**Files:**
- Modify: `apps/mobile/package.json` (add expo-notifications, expo-device)
- Create: `apps/mobile/src/lib/pushNotifications.ts`
- Modify: `apps/mobile/App.tsx`

```typescript
// pushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '3dc5ff64-329b-4fcf-bb89-34eb0132cfec',
  });

  // Register token on server
  await authedFetch('/api/push/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token.data, platform: 'ios' }),
  });

  return token.data;
}
```

In `App.tsx` nach dem Queue-Worker:
```typescript
void registerForPush();
```

**Commit:** `feat(mobile): add push notification registration`

### Task 2.2: Server-Endpunkt für Push-Token

**Files:**
- Modify: `server.mjs`
- Create: `supabase-migrations/20260318_push_tokens.sql`

```sql
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text DEFAULT 'ios',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
```

Server-Endpunkt:
```javascript
app.post('/api/push/register', requireUserAuth, express.json(), async (req, res) => {
  const { token, platform } = req.body;
  await supabaseServer.from('push_tokens').upsert(
    { user_id: req.userId, token, platform },
    { onConflict: 'user_id,token' }
  );
  res.json({ ok: true });
});
```

**Commit:** `feat: add push token registration endpoint`

### Task 2.3: Daily Push Cron

**Files:**
- Create: `scripts/daily-push.mjs`

Morgens 06:00 CET:
1. Alle Push-Tokens laden
2. Pro User: Fusion-Tagesimpuls generieren (1 Satz, Gemini)
3. Via Expo Push API senden

Der Push-Text nutzt die Bazodiac-Fusion:
```
"Dein Holz-Drache trifft auf Mars im Quadrat —
emotionale Impulse kanalisieren, nicht unterdrücken."
```

**Commit:** `feat: add daily push notification cron script`

---

## Säule 3: Levi Voice Agent (Nativ)

### Task 3.1: ElevenLabs SDK Research

**Keine Code-Änderung** — Research:
1. Prüfe ob `@11labs/react-native` oder `elevenlabs-react-native` existiert
2. Wenn ja: Installieren und testen
3. Wenn nein: WebView-Bridge mit nativem Audio-Session-Management

**Output:** Entscheidung welcher Pfad

### Task 3.2: Levi Integration (abhängig von 3.1)

**Pfad A (Native SDK):**
- Install SDK
- Create `apps/mobile/src/lib/elevenlabs.ts` wrapper
- Rewrite `VoiceScreen.tsx` mit nativem UI

**Pfad B (Optimierter WebView):**
- WebView auf `https://bazodiac.space` Levi-Widget zeigen
- Native Audio-Session: pausiere Ambient-Audio wenn Levi aktiv
- Vollbild-Modal statt Tab

**In beiden Fällen:**
- Premium-Gate (nur für Premium-User)
- Chart-Kontext wird an Levi übergeben (Sun Sign, BaZi Tier, WuXing Element)
- Call/Hangup UI mit Haptic Feedback

**Commit:** `feat(mobile): integrate Levi voice agent`

---

## Säule 4: Quiz des Tages → Signatur-Impact

### Task 4.1: Quiz-Vorschlag auf Signatur-Screen

**Files:**
- Create: `apps/mobile/src/hooks/useQuizOfTheDay.ts`
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`

Hook-Logik:
```typescript
export function useQuizOfTheDay(completedQuizIds: string[]): QuizDefinition | null {
  // Filter completed quizzes out
  // From remaining: pick one based on day-of-year (stable per day)
  // Return null if all completed
}
```

Auf dem Signatur-Screen (unter dem Ring):
```
┌─────────────────────────────┐
│ ✨ Quiz des Tages            │
│ Krafttier-Quiz               │
│ "Entdecke deinen inneren     │
│  Begleiter"                  │
│        [Starten]             │
└─────────────────────────────┘
```

**Commit:** `feat(mobile): add Quiz des Tages on Signatur screen`

### Task 4.2: Signatur-Update nach Quiz

**Files:**
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`

Nach Quiz-Abschluss:
1. Contribution-Event wird via Offline-Queue gesendet (bereits implementiert)
2. Bootstrap-Cache wird invalidiert
3. Soulprint-Sektoren werden neu geladen
4. SignaturRing animiert die Veränderung (Sektoren morphen zu neuen Werten)
5. Kurze Celebration-Animation (Gold-Pulse)

**Commit:** `feat(mobile): animate Signatur change after quiz completion`

---

## Implementierungs-Reihenfolge

| Woche | Tasks | Ergebnis |
|-------|-------|----------|
| 1 | 1.1 + 1.2 + 1.3 + 4.1 | Signatur als Startscreen mit Ring + Quiz des Tages |
| 2 | 2.1 + 2.2 + 2.3 + 1.4 | Daily Push + Transit-Modulation |
| 3 | 3.1 + 3.2 + 4.2 | Levi Voice + Quiz-Impact-Animation |
| 4 | Polish + TestFlight | App Store Submission |

## Was NICHT im MVP ist

- Partner-Kompatibilität (Phase 2 — braucht Invite-Flow)
- Volle Quiz-Liste (Quiz des Tages reicht)
- Cosmic Event Countdown (Phase 2 — braucht neuen Endpunkt)
- Wissen/Artikel (Web-Feature)
- WuXing-Detailseite (inline in Signatur reicht)
