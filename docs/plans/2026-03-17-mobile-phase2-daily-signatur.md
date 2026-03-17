# Mobile Phase 2: Daily Horoscope + Signatur-Daten

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static KI-Deutung card with a live Daily Horoscope from the Experience API, connect the Signatur placeholder to real soulprint data, and add inline WuXing-Balken to the Home screen — making the app feel alive and different every day.

**Architecture:** Reuse the Experience API endpoints that Codex already built for the web app (`/api/experience/daily`, `/api/experience/bootstrap`). The mobile app calls these via `authedFetch()` from its existing API client. Daily data is cached in AsyncStorage by date. The Signatur screen reads `soulprint_sectors` from the bootstrap response and renders a 2D animated ring via Skia (or animated View fallback). WuXing data comes from the profile's `astro_json.wuxing`.

**Tech Stack:** React Native 0.79, Expo 53, AsyncStorage (caching), Zod (validation), Experience API (server-side Gemini), @bazodiac/shared (schemas)

---

## Prerequisites

These server endpoints already exist (built by Codex on web):
- `POST /api/experience/daily` — returns `DailyResponse` with western/eastern/fusion sections
- `POST /api/experience/bootstrap` — returns `BootstrapResponse` with soulprint_sectors + signature_blueprint
- `POST /api/experience/signature-delta` — returns quiz impact on signature

The Zod schemas are at `src/lib/schemas/experience.ts` — the mobile app can import these directly from the monorepo root or copy them.

---

### Task 1: Copy Experience schemas to shared package

**Files:**
- Create: `packages/shared/src/experience/schemas.ts`
- Create: `packages/shared/src/experience/index.ts`
- Modify: `packages/shared/src/index.ts`

**Context:** The schemas are currently in `src/lib/schemas/experience.ts` (web app). Copy them to `packages/shared/` so both web and mobile can import from the same source.

**Step 1:** Copy `src/lib/schemas/experience.ts` to `packages/shared/src/experience/schemas.ts`. The file uses `zod` which is already a dependency of the shared package.

**Step 2:** Create barrel export:
```typescript
// packages/shared/src/experience/index.ts
export * from './schemas';
```

**Step 3:** Add to `packages/shared/src/index.ts`:
```typescript
export * from "./experience";
```

**Step 4:** Verify typecheck:
```bash
cd packages/shared && npx tsc --noEmit
```

**Step 5:** Commit:
```bash
git add packages/shared/src/experience/
git commit -m "feat(shared): copy Experience API schemas to shared package"
```

---

### Task 2: Create mobile Experience API client

**Files:**
- Create: `apps/mobile/src/lib/experience.ts`

**Context:** The web app's `src/services/experience.ts` uses bare `fetch()`. The mobile app needs `authedFetch()` from `apps/mobile/src/lib/api.ts` to include the Supabase Bearer token.

**Step 1:** Create `apps/mobile/src/lib/experience.ts`:

```typescript
import { authedFetch } from './api';
import {
  BootstrapResponseSchema,
  DailyResponseSchema,
  type BootstrapResponse,
  type DailyResponse,
} from '@bazodiac/shared';

export async function fetchDailyHoroscope(
  birth: { date: string; time: string; tz: string; lat: number; lon: number },
  soulprintSectors: number[],
  quizSectors: number[],
  targetDate: string,
): Promise<DailyResponse> {
  const resp = await authedFetch('/api/experience/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth,
      soulprint_sectors: soulprintSectors,
      quiz_sectors: quizSectors,
      target_date: targetDate,
      locale: 'de-DE',
    }),
  });
  if (!resp.ok) throw new Error(`Daily horoscope failed: ${resp.status}`);
  return DailyResponseSchema.parse(await resp.json());
}

export async function fetchBootstrap(
  birth: { date: string; time: string; tz: string; lat: number; lon: number; place_label?: string },
): Promise<BootstrapResponse> {
  const resp = await authedFetch('/api/experience/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ birth, locale: 'de-DE' }),
  });
  if (!resp.ok) throw new Error(`Bootstrap failed: ${resp.status}`);
  return BootstrapResponseSchema.parse(await resp.json());
}
```

**Step 2:** Commit:
```bash
git add apps/mobile/src/lib/experience.ts
git commit -m "feat(mobile): add Experience API client (daily horoscope + bootstrap)"
```

---

### Task 3: Create useDailyHoroscope hook with AsyncStorage cache

**Files:**
- Create: `apps/mobile/src/hooks/useDailyHoroscope.ts`

**Context:** Fetches daily horoscope from Experience API, caches in AsyncStorage by date. Returns the fusion summary (the most actionable section) for the Home screen card.

**Step 1:** Create the hook:

```typescript
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDailyHoroscope } from '../lib/experience';
import type { DailyResponse } from '@bazodiac/shared';

const CACHE_KEY = 'daily_horoscope_cache';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyHoroscope(profile: any) {
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!profile || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      // 1. Check cache
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.date === todayKey() && cached?.data) {
            setDaily(cached.data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 2. Fetch from API
      try {
        const birth = {
          date: profile.birth_date || '',
          time: profile.birth_time || '12:00',
          tz: profile.iana_time_zone || 'Europe/Berlin',
          lat: profile.birth_lat || 0,
          lon: profile.birth_lng || 0,
        };

        // Use empty sectors as fallback — the API handles missing data
        const soulprintSectors = profile.astro_json?.soulprint_sectors || Array(12).fill(0);
        const quizSectors = Array(12).fill(0);

        const result = await fetchDailyHoroscope(birth, soulprintSectors, quizSectors, todayKey());
        setDaily(result);

        // Cache it
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), data: result }));
      } catch (err) {
        console.warn('[DailyHoroscope] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile]);

  return { daily, loading };
}
```

**Step 2:** Commit:
```bash
git add apps/mobile/src/hooks/useDailyHoroscope.ts
git commit -m "feat(mobile): add useDailyHoroscope hook with AsyncStorage cache"
```

---

### Task 4: Replace KI-Deutung card with Daily Horoscope in DashboardScreen

**Files:**
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Step 1:** Import and use the hook:
```typescript
import { useDailyHoroscope } from '../hooks/useDailyHoroscope';
```

In the component:
```typescript
const { daily, loading: dailyLoading } = useDailyHoroscope(profile);
```

**Step 2:** Replace the "KI-DEUTUNG" card (the one showing `interpretation`) with a "TAGESIMPULS" card:

```tsx
<View style={styles.card}>
  <Text style={styles.kicker}>TAGESIMPULS</Text>
  {dailyLoading ? (
    <Text style={styles.body}>Dein Tageshoroskop wird geladen...</Text>
  ) : daily ? (
    <>
      <Text style={styles.titleSmall}>{daily.fusion.summary}</Text>
      <Text style={styles.body}>{daily.fusion.action}</Text>
      {daily.fusion.pushworthy && daily.fusion.push_text && (
        <View style={styles.pushHighlight}>
          <Text style={styles.pushText}>⚡ {daily.fusion.push_text}</Text>
        </View>
      )}
    </>
  ) : (
    <Text style={styles.body}>Tagesimpuls nicht verfügbar.</Text>
  )}
</View>
```

**Step 3:** Add the pushHighlight style:
```typescript
pushHighlight: {
  marginTop: 8,
  backgroundColor: 'rgba(212, 175, 55, 0.1)',
  borderLeftWidth: 3,
  borderLeftColor: '#d4af37',
  borderRadius: 8,
  padding: 10,
},
pushText: {
  color: '#d4af37',
  fontSize: 13,
  fontWeight: '600',
},
```

**Step 4:** Commit:
```bash
git add apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "feat(mobile): replace KI-Deutung with live Daily Horoscope from Experience API"
```

---

### Task 5: Add inline WuXing-Balken to DashboardScreen

**Files:**
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Context:** WuXing data is already in `profile.astro_json.wuxing.elements`. Display 5 horizontal bars below the Kosmisches Profil card — same data, just visualized.

**Step 1:** Extract wuxing data from profile:
```typescript
const wuxingElements = useMemo(() => {
  const els = profile?.astro_json?.wuxing?.elements || {};
  return [
    { key: 'Wood', label: 'Holz', chinese: '木', color: '#3D8B37', value: Number(els.Wood || els.Holz || 0) },
    { key: 'Fire', label: 'Feuer', chinese: '火', color: '#D63B0F', value: Number(els.Fire || els.Feuer || 0) },
    { key: 'Earth', label: 'Erde', chinese: '土', color: '#C49A2A', value: Number(els.Earth || els.Erde || 0) },
    { key: 'Metal', label: 'Metall', chinese: '金', color: '#8A8A8A', value: Number(els.Metal || els.Metall || 0) },
    { key: 'Water', label: 'Wasser', chinese: '水', color: '#2E6BB5', value: Number(els.Water || els.Wasser || 0) },
  ];
}, [profile]);

const wuxingTotal = useMemo(() => wuxingElements.reduce((s, e) => s + e.value, 0), [wuxingElements]);
const wuxingMax = useMemo(() => Math.max(...wuxingElements.map(e => e.value), 1), [wuxingElements]);
```

**Step 2:** Add a WuXing card after the Space Weather card:
```tsx
{wuxingTotal > 0 && (
  <View style={styles.card}>
    <Text style={styles.kicker}>WUXING 五行</Text>
    {wuxingElements.map(el => {
      const pct = Math.round((el.value / wuxingTotal) * 100);
      const barWidth = `${(el.value / wuxingMax) * 100}%`;
      return (
        <View key={el.key} style={styles.wuxingRow}>
          <Text style={[styles.wuxingLabel, { color: el.color }]}>{el.chinese}</Text>
          <Text style={styles.wuxingName}>{el.label}</Text>
          <View style={styles.wuxingTrack}>
            <View style={[styles.wuxingFill, { backgroundColor: el.color, width: barWidth }]} />
          </View>
          <Text style={styles.wuxingPct}>{pct}%</Text>
        </View>
      );
    })}
  </View>
)}
```

**Step 3:** Add WuXing styles:
```typescript
wuxingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginTop: 6,
},
wuxingLabel: {
  fontSize: 20,
  width: 28,
  textAlign: 'center',
},
wuxingName: {
  color: '#95a6be',
  fontSize: 12,
  width: 48,
},
wuxingTrack: {
  flex: 1,
  height: 6,
  backgroundColor: '#1a2636',
  borderRadius: 3,
  overflow: 'hidden',
},
wuxingFill: {
  height: 6,
  borderRadius: 3,
},
wuxingPct: {
  color: '#95a6be',
  fontSize: 11,
  width: 32,
  textAlign: 'right',
  fontVariant: ['tabular-nums'],
},
```

**Step 4:** Commit:
```bash
git add apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "feat(mobile): add inline WuXing element bars to Home screen"
```

---

### Task 6: Connect Signatur screen to real soulprint data

**Files:**
- Modify: `apps/mobile/src/screens/FuRingScreen.tsx`
- Create: `apps/mobile/src/hooks/useBootstrapSignatur.ts`

**Step 1:** Create the bootstrap hook:
```typescript
// apps/mobile/src/hooks/useBootstrapSignatur.ts
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBootstrap } from '../lib/experience';
import type { BootstrapResponse } from '@bazodiac/shared';

const CACHE_KEY = 'signatur_bootstrap_cache';

export function useBootstrapSignatur(profile: any) {
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!profile || fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      // Check cache
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.userId === profile.user_id && cached?.data) {
            setBootstrap(cached.data);
            setLoading(false);
            return;
          }
        }
      } catch {}

      // Fetch
      try {
        const birth = {
          date: profile.birth_date || '',
          time: profile.birth_time || '12:00',
          tz: profile.iana_time_zone || 'Europe/Berlin',
          lat: profile.birth_lat || 0,
          lon: profile.birth_lng || 0,
        };
        const result = await fetchBootstrap(birth);
        setBootstrap(result);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ userId: profile.user_id, data: result }));
      } catch (err) {
        console.warn('[Bootstrap] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [profile]);

  return { bootstrap, loading };
}
```

**Step 2:** Update FuRingScreen to show soulprint data:

Replace the placeholder with a data-driven view:
- Show the 12 soulprint sectors as a circular arrangement of bars (or horizontal bars if simpler)
- Show `bootstrap.profile` data (sun/moon/asc/day_master/harmony_index)
- Show the `signature_blueprint.seed` as a visual seed identifier
- Keep the animated ring placeholder but drive its segments from `soulprint_sectors`

**The visual:** Each of the 12 sectors gets a bar. The bar height/width is proportional to `soulprint_sectors[i]`. Use the zodiac sector names (Aries through Pisces) as labels. Color each bar based on its element association.

**Step 3:** Commit:
```bash
git add apps/mobile/src/hooks/useBootstrapSignatur.ts apps/mobile/src/screens/FuRingScreen.tsx
git commit -m "feat(mobile): connect Signatur to real soulprint data from Experience API"
```

---

### Task 7: Update Weltraumwetter text to German

**Files:**
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`

**Step 1:** The Space Weather card still shows English text: "Current geomagnetic signal feeds your transit intensity layer." Change to:

```
Aktuelle geomagnetische Aktivität beeinflusst deine Transit-Intensität.
```

**Step 2:** Commit:
```bash
git add apps/mobile/src/screens/DashboardScreen.tsx
git commit -m "content(mobile): translate space weather description to German"
```

---

### Task 8: EAS build + simulator test

**Step 1:** Push branch and build:
```bash
git push -u origin feature/mobile-phase2
cd apps/mobile && eas build --platform ios --profile simulator --non-interactive
```

**Step 2:** Install and launch on simulator. Verify:
- [ ] Home screen shows "TAGESIMPULS" card with daily fusion summary
- [ ] Home screen shows WuXing bars with real element percentages
- [ ] "Signatur öffnen" shows 12 soulprint sector bars
- [ ] Space Weather text is German
- [ ] No jumps/crashes

**Step 3:** Merge to main.

---

## Summary

| Task | What | New files |
|------|------|-----------|
| 1 | Experience schemas in shared package | `packages/shared/src/experience/` |
| 2 | Mobile Experience API client | `apps/mobile/src/lib/experience.ts` |
| 3 | useDailyHoroscope hook + cache | `apps/mobile/src/hooks/useDailyHoroscope.ts` |
| 4 | Daily Horoscope card replaces KI-Deutung | DashboardScreen.tsx modified |
| 5 | Inline WuXing-Balken on Home | DashboardScreen.tsx modified |
| 6 | Signatur with real soulprint data | `apps/mobile/src/hooks/useBootstrapSignatur.ts` + FuRingScreen.tsx |
| 7 | German space weather text | DashboardScreen.tsx modified |
| 8 | EAS build + test | — |

**Estimated effort:** 2-3 Stunden für einen Agent, oder 1-2 Stunden mit parallelen Subagents.

**Ergebnis:** Home Screen zeigt jeden Tag neuen Content (Tagesimpuls), WuXing-Verteilung, und die Signatur ist mit echten Soulprint-Daten gefüttert. Die App fühlt sich lebendig an.

**Was danach kommt (Phase 3):**
- Push Notifications (expo-notifications + Server-Cron für täglichen Push)
- Transit-Cards im Home Screen (horizontale ScrollView mit aktiven Transiten)
- Polish + TestFlight
