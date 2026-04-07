# Fusion Daily Hero Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the existing `DashboardTagesEnergie` hero block with real-time resonance badges (transit / space weather / top soulprint sector), backed by server-side `computeResonanceBadgesServer()` and an enriched Gemini prompt — replacing the current placeholder-only daily horoscope.

**Architecture:** Client sends today's `transit_influences` (computed via `computeTodayPlanetInfluences`) + `birth_sign` to the server. Server loads `soulprint_sectors` from Supabase and reads `spaceWeatherCache` (already in-memory), computes `resonance_badges[]` deterministically, then appends them to the daily response. Client renders them via a new `ResonanzSnapshot` component inside `DashboardTagesEnergie`. Badges are premium-gated (displayed blurred for free users). Gemini prompt gains real transit + space weather context.

**Tech Stack:** TypeScript, React 19, Vitest + @testing-library/react, Express (server.mjs plain JS), Zod, Tailwind CSS v4, Lucide React

---

## Reference files (read before editing)

| File | Purpose |
|------|---------|
| `src/lib/schemas/experience.ts` | `DailyResponseSchema` — extend with `resonance_badges` |
| `src/services/experience.ts` | `fetchDailyExperience()` — add `transit_influences` + `birth_sign` params |
| `src/hooks/useFirstRunDaily.ts` | extend to accept `birthSign`, call `computeTodayPlanetInfluences` |
| `src/lib/astro-data/planetInfluences.ts` | `computeTodayPlanetInfluences(birthSign)` + `PlanetInfluence` interface |
| `src/components/dashboard/DashboardTagesEnergie.tsx` | target for `ResonanzSnapshot` integration |
| `src/components/Dashboard.tsx` | wires `useFirstRunDaily` + `DashboardTagesEnergie`; passes `birthSign` |
| `src/lib/feature-flags.ts` | add `daily_fusion_hero_v1` flag |
| `server.mjs:1661` | `/api/experience/daily` endpoint — extend with badge computation |

---

### Task 1: Extend `DailyResponseSchema` with `resonance_badges`

**Files:**
- Modify: `src/lib/schemas/experience.ts`
- Test: (schema parsing validated inline by Zod; new fields optional — no existing tests break)

**Step 1: Add `ResonanceBadgeSchema` above `DailyResponseSchema` in `experience.ts`**

Open `src/lib/schemas/experience.ts`. After line 91 (closing `DailyFusionSchema`) and before `DailyResponseSchema`, insert:

```typescript
export const ResonanceBadgeSchema = z.object({
  type: z.enum(['transit', 'space_weather', 'sektor']),
  label: z.string(),
  sublabel: z.string().optional(),
  intensity: z.enum(['hoch', 'mittel', 'niedrig']),
  color: z.string(),
});
export type ResonanceBadge = z.infer<typeof ResonanceBadgeSchema>;
```

**Step 2: Add `resonance_badges` to `DailyResponseSchema`**

Inside `DailyResponseSchema` (currently lines 93–99), add the new optional fields:

```typescript
export const DailyResponseSchema = z.object({
  date: z.string(),
  western: DailySectionSchema,
  eastern: DailySectionSchema,
  fusion: DailyFusionSchema,
  meta: MetaInfoSchema,
  // New: real-time resonance badges (server-computed, premium display)
  resonance_badges: z.array(ResonanceBadgeSchema).optional(),
  space_weather_score: z.number().optional(),
  top_sector: z.object({ sign: z.string(), value: z.number() }).optional(),
});
```

**Step 3: Verify no TypeScript errors**

```bash
npm run lint
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/lib/schemas/experience.ts
git commit -m "feat(fusion-daily-hero): extend DailyResponseSchema with resonance_badges"
```

---

### Task 2: Add `computeResonanceBadgesServer()` to `server.mjs` and enrich the daily endpoint

**Files:**
- Modify: `server.mjs`

The server already has `spaceWeatherCache` (global in-memory, populated by `/api/space-weather/extended`) and the Supabase pattern for loading `soulprint_sectors` from `astro_profiles`. This task adds a pure JS function and wires it into the daily handler.

**Step 1: Find the insertion point for the helper function**

In `server.mjs`, find the line:

```javascript
app.post('/api/experience/daily', requireUserAuth, async (req, res) => {
```

This is at approximately line 1661. Insert the following function **above** this line (leave one blank line between the function and the route):

```javascript
/**
 * Compute deterministic resonance badges from real-time inputs.
 * Pure JS — called inside /api/experience/daily after cache checks.
 *
 * @param {object} opts
 * @param {Array} opts.transitInfluences — [{planet, aspectDeg, fieldStrength, isResonant}]
 * @param {object|null} opts.spaceWeather — spaceWeatherCache?.payload
 * @param {number[]|null} opts.soulprintSectors — 12-element array from astro_profiles
 * @param {string} opts.lang — 'de' | 'en'
 * @returns {Array} badges
 */
function computeResonanceBadgesServer({ transitInfluences, spaceWeather, soulprintSectors, lang = 'de' }) {
  const badges = [];

  // ── Transit badge — strongest planet by fieldStrength ─────────────────
  if (Array.isArray(transitInfluences) && transitInfluences.length > 0) {
    const strongest = transitInfluences.reduce(
      (best, p) => ((p.fieldStrength ?? 0) > (best.fieldStrength ?? 0) ? p : best),
      transitInfluences[0],
    );
    const ASPECT_NAMES_DE = { 0: 'Konjunktion', 60: 'Sextil', 90: 'Quadrat', 120: 'Trigon', 180: 'Opposition' };
    const ASPECT_NAMES_EN = { 0: 'Conjunction', 60: 'Sextile', 90: 'Square', 120: 'Trine', 180: 'Opposition' };
    const aspectNames = lang === 'de' ? ASPECT_NAMES_DE : ASPECT_NAMES_EN;
    const aspectName = aspectNames[strongest.aspectDeg] ?? `${strongest.aspectDeg}°`;
    const resonanceLabel = lang === 'de'
      ? (strongest.isResonant ? 'Verstärkend' : 'Schärfend')
      : (strongest.isResonant ? 'Amplifying' : 'Sharpening');
    const intensity = strongest.fieldStrength >= 0.80 ? 'hoch' : strongest.fieldStrength >= 0.60 ? 'mittel' : 'niedrig';
    badges.push({
      type: 'transit',
      label: `${strongest.planet} ${aspectName} · ${resonanceLabel}`,
      sublabel: `${Math.round(strongest.fieldStrength * 100)}%`,
      intensity,
      color: strongest.isResonant ? '#D4AF37' : '#E87040',
    });
  }

  // ── Space weather badge — from Kp index ───────────────────────────────
  if (spaceWeather) {
    const kp = spaceWeather.kp_index ?? spaceWeather.kp ?? 0;
    const gScale = kp >= 8 ? 'G5' : kp >= 6 ? 'G4' : kp >= 5 ? 'G3' : kp >= 4 ? 'G2' : kp >= 3 ? 'G1' : null;
    const intensity = kp >= 5 ? 'hoch' : kp >= 3 ? 'mittel' : 'niedrig';
    const labelDe = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} Sturm` : `Kp ${kp.toFixed(1)} · Ruhig`;
    const labelEn = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} Storm` : `Kp ${kp.toFixed(1)} · Calm`;
    badges.push({
      type: 'space_weather',
      label: lang === 'de' ? labelDe : labelEn,
      sublabel: lang === 'de' ? 'Kosmisches Wetter' : 'Space Weather',
      intensity,
      color: kp >= 5 ? '#E04040' : kp >= 3 ? '#E87040' : '#4CAF50',
    });
  }

  // ── Sektor badge — top soulprint sector ───────────────────────────────
  if (Array.isArray(soulprintSectors) && soulprintSectors.length === 12) {
    const ZODIAC_DE = ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau','Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'];
    const ZODIAC_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const ZODIAC_SYM = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
    const maxIdx = soulprintSectors.reduce((best, v, i) => v > soulprintSectors[best] ? i : best, 0);
    const signs = lang === 'de' ? ZODIAC_DE : ZODIAC_EN;
    const intensity = soulprintSectors[maxIdx] >= 0.7 ? 'hoch' : soulprintSectors[maxIdx] >= 0.4 ? 'mittel' : 'niedrig';
    badges.push({
      type: 'sektor',
      label: `${ZODIAC_SYM[maxIdx]} ${signs[maxIdx]}`,
      sublabel: lang === 'de' ? 'Dein Leitsystem' : 'Your Lead System',
      intensity,
      color: '#8B6CD4',
    });
  }

  return badges;
}
```

**Step 2: Extend the `/api/experience/daily` handler to parse new fields**

Find this line in the handler (~line 1669):

```javascript
const { birth, target_date, locale } = req.body || {};
```

Change it to:

```javascript
const { birth, target_date, locale, transit_influences, birth_sign } = req.body || {};
```

**Step 3: Load soulprint sectors in the daily handler**

Find the section inside the handler where `bafeData` is fetched (~line 1760-1772):

```javascript
// Call BAFE for natal data to feed Gemini
const bafeRes = await fetch(`${BAFE_BASE_URL}/chart`, {
```

**Before** this line, add:

```javascript
// Load soulprint sectors (needed for resonance badge computation)
let soulprintSectors = null;
if (supabaseServer) {
  try {
    const { data: soulprintProfile } = await supabaseServer
      .from('astro_profiles')
      .select('soulprint_sectors')
      .eq('user_id', userId)
      .maybeSingle();
    soulprintSectors = soulprintProfile?.soulprint_sectors ?? null;
  } catch (e) {
    console.warn('[daily] soulprint load failed, skipping sektor badge:', e?.message);
  }
}
```

**Step 4: Enrich the Gemini prompt with real transit data**

Find the opening of the `prompt` template literal (~line 1774). It currently starts:

```javascript
const prompt = `
You are Bazodiac's fusion astrologer. You write in "Poetic Realism"...
Write a daily horoscope for today (${targetDate}) based on the user's birth chart:
${JSON.stringify(bafeData, null, 2)}
```

Replace the prompt variable assignment with:

```javascript
// Build transit context string for the prompt
const transitContextStr = Array.isArray(transit_influences) && transit_influences.length > 0
  ? transit_influences.map(t => {
      const ASPECT_DE = { 0: 'Konjunktion', 60: 'Sextil', 90: 'Quadrat', 120: 'Trigon', 180: 'Opposition' };
      const aspectName = ASPECT_DE[t.aspectDeg] ?? `${t.aspectDeg}°`;
      return `- ${t.planet}: ${aspectName} (${t.aspectDeg}°), Stärke ${Math.round((t.fieldStrength ?? 0) * 100)}%, ${t.isResonant ? 'verstärkend' : 'schärfend'}`;
    }).join('\n')
  : 'Keine Transit-Daten verfügbar.';

const spaceWeatherStr = (() => {
  const sw = spaceWeatherCache?.payload;
  if (!sw) return 'Keine Weltraumwetter-Daten.';
  const kp = sw.kp_index ?? sw.kp ?? 0;
  return `Kp-Index: ${kp}, Solar-Druck: ${(sw.solar_pressure_score ?? 0).toFixed(2)}`;
})();

const soulprintTopStr = (() => {
  if (!Array.isArray(soulprintSectors) || soulprintSectors.length !== 12) return '';
  const ZODIAC_DE = ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau','Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'];
  const maxIdx = soulprintSectors.reduce((best, v, i) => v > soulprintSectors[best] ? i : best, 0);
  return `Stärkster Soulprint-Sektor: ${ZODIAC_DE[maxIdx]} (Wert: ${soulprintSectors[maxIdx].toFixed(2)})`;
})();

const prompt = `
You are Bazodiac's fusion astrologer. You write in "Poetic Realism" — worldly images, not astro-lectures.
Write a daily horoscope for today (${targetDate}) based on the user's birth chart AND today's real planetary transits:

GEBURTSHOROSKOP:
${JSON.stringify(bafeData, null, 2)}

PLANETENTRANSITS HEUTE:
${transitContextStr}

KOSMISCHES WETTER:
${spaceWeatherStr}

${soulprintTopStr ? soulprintTopStr + '\n' : ''}
Respond with STRICT JSON matching this EXACT structure (No markdown code blocks, just raw JSON).
{
  "date": "${targetDate}",
  "western": {
    "summary": "1-2 sentences about Western transits.",
    "themes": ["theme1", "theme2"],
    "caution": "1 sentence caution",
    "opportunity": "1 sentence opportunity",
    "evidence": { "transit_sectors": [1, 5] }
  },
  "eastern": {
    "summary": "1-2 sentences about BaZi daily energy.",
    "themes": ["theme1", "theme2"],
    "caution": "1 sentence caution",
    "opportunity": "1 sentence opportunity",
    "evidence": { "day_master": "${bafeData?.bazi?.pillars?.day?.stem || ''}" }
  },
  "fusion": {
    "summary": "1-2 sentences synthesizing both systems for today.",
    "synthesis": "THE MAIN TEXT — see DAY-MODE VOICE below.",
    "action": "One actionable advice",
    "pushworthy": true,
    "push_text": "Short push notification string",
    "harmony_index": 0.52,
    "day_mode": "trace"
  },
  "meta": { "engine_version": "v1-gemini-daily" }
}

RULES:
- Language: ${lang === 'de' ? 'German' : 'English'}
- The output MUST be valid parsing JSON.
- DO NOT wrap the response in \`\`\`json ... \`\`\`. Start directly with {.
- harmony_index: number between 0.0 and 1.0 — real measure of today's planetary alignment. 0.45 = baseline. >= 0.50 = convergence day.
- day_mode: if harmony_index >= 0.50 set "trace" (poles converge, something happens today), else "pulse" (symmetric, calm day).

DAY-MODE VOICE — the "synthesis" field MUST follow the voice rules for the computed day_mode:

PULSE (harmony_index < 0.50):
- Tone: atmospheric, inviting, sensory, worldly imagery.
- Examples: "Erde ist Struktur und die hält dich heute. Nicht zu fest, so wie du es brauchst."
  "Die Gedanken kreisen, aber nicht hektisch. Eher wie ein Lied, das sich langsam entfaltet."
- Resonance described through everyday scenes, not astrological facts.
- Max 2–3 sentences. No explanation of why.
- The reader should feel held, not lectured. Rhythm over reason.

TRACE (harmony_index >= 0.50):
- Tone: direct, charged, concrete — something happens today.
- Examples: "Dein detektivischer Skorpion bekommt heute was zu tun."
  "Holz trifft auf Feuer. Was du still aufgebaut hast, will raus — und heute ist der Tag."
- Name the quality, not the cause. No esoteric vocabulary.
- If harmony_index > 0.65: one extra sentence — urgent, clear call to act.
- Max 2–3 sentences.

NEVER use in synthesis: "weil", "da heute", planet names (Mars, Venus etc.), "die kosmischen Energien", "die Sterne sagen".
`;
```

**Step 5: Append resonance_badges to parsedData before responding**

Find this line (~line 1879):

```javascript
appendNightHarmony(parsedData, now);
```

(There are two occurrences — find the one inside the Gemini path, after `parsedData.fusion` checks.) After the `appendNightHarmony` call in the Gemini path, add:

```javascript
    // Append resonance badges (deterministic — always fresh, not from cache)
    parsedData.resonance_badges = computeResonanceBadgesServer({
      transitInfluences: transit_influences ?? [],
      spaceWeather: spaceWeatherCache?.payload ?? null,
      soulprintSectors,
      lang,
    });
```

Also do the same for the proxy fallback path (~line 1741, after `appendNightHarmony(data, now)`):

```javascript
    // Append resonance badges for proxy path
    data.resonance_badges = computeResonanceBadgesServer({
      transitInfluences: transit_influences ?? [],
      spaceWeather: spaceWeatherCache?.payload ?? null,
      soulprintSectors,
      lang,
    });
```

Note: badges are appended AFTER the Supabase L2 cache upsert (badges are not persisted to DB — they're computed fresh each request from live inputs).

**Step 6: Verify server starts without errors**

```bash
node --input-type=module < server.mjs 2>&1 | head -5
# or just check syntax:
node --check server.mjs
```

Expected: no syntax errors.

**Step 7: Commit**

```bash
git add server.mjs
git commit -m "feat(fusion-daily-hero): add computeResonanceBadgesServer + enrich daily endpoint with badges + real transit prompt"
```

---

### Task 3: Extend `fetchDailyExperience()` to send `transit_influences`

**Files:**
- Modify: `src/services/experience.ts`

**Step 1: Add `transitInfluences` optional parameter to `fetchDailyExperience`**

The current signature (lines 35–55):

```typescript
export async function fetchDailyExperience(
  birth: { date: string; time: string; tz: string; lat: number; lon: number },
  soulprintSectors: number[],
  quizSectors: number[],
  targetDate: string,
  locale = 'de-DE',
): Promise<DailyResponse> {
```

Change to:

```typescript
export interface TransitInfluenceInput {
  planet: string;
  aspectDeg: number;
  fieldStrength: number;
  isResonant: boolean;
}

export async function fetchDailyExperience(
  birth: { date: string; time: string; tz: string; lat: number; lon: number },
  soulprintSectors: number[],
  quizSectors: number[],
  targetDate: string,
  locale = 'de-DE',
  transitInfluences: TransitInfluenceInput[] = [],
  birthSign = '',
): Promise<DailyResponse> {
```

**Step 2: Include the new params in the request body**

Find the `body: JSON.stringify(...)` call and extend it:

```typescript
    body: JSON.stringify({
      birth,
      soulprint_sectors: soulprintSectors,
      quiz_sectors: quizSectors,
      target_date: targetDate,
      locale,
      transit_influences: transitInfluences,
      birth_sign: birthSign,
    }),
```

**Step 3: Verify TypeScript**

```bash
npm run lint
```

Expected: clean.

**Step 4: Commit**

```bash
git add src/services/experience.ts
git commit -m "feat(fusion-daily-hero): extend fetchDailyExperience with transit_influences + birth_sign params"
```

---

### Task 4: Extend `useFirstRunDaily` to compute and send transit influences

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`

**Step 1: Add `birthSign` to the hook's parameter list**

Current hook signature (line 112):

```typescript
export function useFirstRunDaily(
  userId: string,
  birthData: BirthInput | null,
  soulprintSectors: number[] | null,
  quizSectors: number[],
  customDate?: string,
): UseFirstRunDailyResult {
```

Change to:

```typescript
export function useFirstRunDaily(
  userId: string,
  birthData: BirthInput | null,
  soulprintSectors: number[] | null,
  quizSectors: number[],
  birthSign: string | null,
  customDate?: string,
): UseFirstRunDailyResult {
```

**Step 2: Add import for `computeTodayPlanetInfluences`**

Add at the top of the file (after the existing imports):

```typescript
import { computeTodayPlanetInfluences } from '../lib/astro-data/planetInfluences';
import type { TransitInfluenceInput } from '../services/experience';
```

**Step 3: Compute transit influences before the fetch call**

Inside the `useEffect` async IIFE, before the `fetchDailyExperience` call (~line 169), add:

```typescript
        // Compute today's transit influences (client-side ephemeris)
        const rawInfluences = birthSign ? computeTodayPlanetInfluences(birthSign) : null;
        const transitInfluences: TransitInfluenceInput[] = rawInfluences
          ? Object.entries(rawInfluences).map(([planet, inf]) => ({
              planet,
              aspectDeg: inf.aspectDeg,
              fieldStrength: inf.fieldStrength,
              isResonant: inf.isResonant,
            }))
          : [];
```

**Step 4: Pass transit influences to `fetchDailyExperience`**

Change the existing call:

```typescript
        const data = await fetchDailyExperience(
          birthData,
          soulprintSectors ?? Array(12).fill(0.5),
          quizSectors,
          targetDate,
        );
```

To:

```typescript
        const data = await fetchDailyExperience(
          birthData,
          soulprintSectors ?? Array(12).fill(0.5),
          quizSectors,
          targetDate,
          'de-DE',
          transitInfluences,
          birthSign ?? '',
        );
```

**Step 5: Update the dependency array of the `useEffect`**

Find the existing dependency array at the end of the effect:

```typescript
  }, [userId, birthData, soulprintSectors, quizSectors, customDate]);
```

Change to:

```typescript
  }, [userId, birthData, soulprintSectors, quizSectors, birthSign, customDate]);
```

**Step 6: TypeScript check**

```bash
npm run lint
```

**Step 7: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts src/services/experience.ts
git commit -m "feat(fusion-daily-hero): useFirstRunDaily computes + sends transit_influences to daily endpoint"
```

---

### Task 5: Create `ResonanzSnapshot` component with tests

**Files:**
- Create: `src/components/dashboard/ResonanzSnapshot.tsx`
- Create: `src/__tests__/resonanz-snapshot.test.tsx`

**Step 1: Write the failing test first**

Create `src/__tests__/resonanz-snapshot.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResonanzSnapshot } from '../components/dashboard/ResonanzSnapshot';
import type { ResonanceBadge } from '../lib/schemas/experience';

const TRANSIT_BADGE: ResonanceBadge = {
  type: 'transit',
  label: 'Mars Trigon · Verstärkend',
  sublabel: '88%',
  intensity: 'hoch',
  color: '#D4AF37',
};

const SPACE_BADGE: ResonanceBadge = {
  type: 'space_weather',
  label: 'Kp 3.2 · Ruhig',
  sublabel: 'Kosmisches Wetter',
  intensity: 'niedrig',
  color: '#4CAF50',
};

const SEKTOR_BADGE: ResonanceBadge = {
  type: 'sektor',
  label: '♈ Widder',
  sublabel: 'Dein Leitsystem',
  intensity: 'hoch',
  color: '#8B6CD4',
};

describe('ResonanzSnapshot', () => {
  it('renders nothing when badges array is empty', () => {
    const { container } = render(<ResonanzSnapshot badges={[]} isPremium={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badge labels for premium user', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE, SPACE_BADGE]} isPremium={true} />);
    expect(screen.getByText('Mars Trigon · Verstärkend')).toBeInTheDocument();
    expect(screen.getByText('Kp 3.2 · Ruhig')).toBeInTheDocument();
  });

  it('renders sublabels', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={true} />);
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('renders lock icon overlay for free user', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={false} />);
    // Lock icon is rendered (Lucide — no text, but aria-hidden span present)
    const container = screen.getByText('Mars Trigon · Verstärkend').closest('[data-testid="resonanz-badge"]');
    expect(container).toHaveClass('opacity-60');
  });

  it('renders all 3 badge types', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE, SPACE_BADGE, SEKTOR_BADGE]} isPremium={true} />);
    expect(screen.getByText('Mars Trigon · Verstärkend')).toBeInTheDocument();
    expect(screen.getByText('Kp 3.2 · Ruhig')).toBeInTheDocument();
    expect(screen.getByText('♈ Widder')).toBeInTheDocument();
  });

  it('does not apply opacity-60 for premium user', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={true} />);
    const badge = screen.getByTestId('resonanz-badge-transit');
    expect(badge).not.toHaveClass('opacity-60');
  });
});
```

**Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/__tests__/resonanz-snapshot.test.tsx
```

Expected: FAIL — `ResonanzSnapshot` not found.

**Step 3: Create the component**

Create `src/components/dashboard/ResonanzSnapshot.tsx`:

```typescript
import type { ResonanceBadge } from '../../lib/schemas/experience';
import { Lock } from 'lucide-react';

interface ResonanzSnapshotProps {
  badges: ResonanceBadge[];
  isPremium: boolean;
}

export function ResonanzSnapshot({ badges, isPremium }: ResonanzSnapshotProps) {
  if (badges.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap mt-2" aria-label="Resonanz-Übersicht">
      {badges.map((badge) => (
        <div
          key={badge.type}
          data-testid={`resonanz-badge-${badge.type}`}
          className={`relative flex flex-col gap-0.5 px-3 py-2 rounded-xl border text-xs transition-all select-none ${
            !isPremium ? 'opacity-60' : ''
          }`}
          style={{
            borderColor: `${badge.color}33`,
            background: `${badge.color}0D`,
          }}
        >
          {!isPremium && (
            <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <Lock className="w-3 h-3 text-white/60" aria-hidden="true" />
            </div>
          )}
          <span className="font-medium text-white/80 leading-tight">{badge.label}</span>
          {badge.sublabel && (
            <span className="text-[10px] text-white/40">{badge.sublabel}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/resonanz-snapshot.test.tsx
```

Expected: all pass.

**Step 5: Commit**

```bash
git add src/components/dashboard/ResonanzSnapshot.tsx src/__tests__/resonanz-snapshot.test.tsx
git commit -m "feat(fusion-daily-hero): add ResonanzSnapshot badge-pill component with tests"
```

---

### Task 6: Integrate `ResonanzSnapshot` into `DashboardTagesEnergie`

**Files:**
- Modify: `src/components/dashboard/DashboardTagesEnergie.tsx`
- Modify: `src/lib/feature-flags.ts`

**Step 1: Add `daily_fusion_hero_v1` feature flag (default off)**

Open `src/lib/feature-flags.ts`. In the `FLAGS` object (lines 6–19), add after `cosmic_encounter_v1: false`:

```typescript
  daily_fusion_hero_v1: false,
```

The FLAGS object now ends:
```typescript
  cosmic_encounter_v1: false,
  daily_fusion_hero_v1: false,
} as const;
```

**Step 2: Add `resonanceBadges` and `isPremium` to `DashboardTagesEnergieProps`**

Open `src/components/dashboard/DashboardTagesEnergie.tsx`. Find the `DashboardTagesEnergieProps` interface (around line 44):

```typescript
export interface DashboardTagesEnergieProps {
  daily: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  spaceWeather: SpaceWeatherState;
  loading?: boolean;
  onOpenDayModal?: () => void;
}
```

Change to:

```typescript
export interface DashboardTagesEnergieProps {
  daily: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  spaceWeather: SpaceWeatherState;
  loading?: boolean;
  onOpenDayModal?: () => void;
  isPremium?: boolean;
}
```

**Step 3: Import `ResonanzSnapshot` and `isFeatureEnabled`**

At the top of `DashboardTagesEnergie.tsx`, after the existing imports, add:

```typescript
import { ResonanzSnapshot } from './ResonanzSnapshot';
import { isFeatureEnabled } from '../../lib/feature-flags';
```

**Step 4: Add `isPremium` destructuring to component**

Find the component function signature:

```typescript
export function DashboardTagesEnergie({
  daily,
  dayHarmonic,
  spaceWeather,
  loading,
  onOpenDayModal,
}: DashboardTagesEnergieProps) {
```

Change to:

```typescript
export function DashboardTagesEnergie({
  daily,
  dayHarmonic,
  spaceWeather,
  loading,
  onOpenDayModal,
  isPremium = false,
}: DashboardTagesEnergieProps) {
```

**Step 5: Render `ResonanzSnapshot` inside the component**

Read `DashboardTagesEnergie.tsx` to find a good insertion point — after the `fusion.synthesis` text block and before the kosmoswetter strip. Find where `fusion.synthesis` or the body text renders. Add after the main body text (before the `onOpenDayModal` CTA or Kosmoswetter strip):

```tsx
          {/* Resonanz-Snapshot badges — gated by daily_fusion_hero_v1 flag */}
          {isFeatureEnabled('daily_fusion_hero_v1') &&
            daily?.resonance_badges &&
            daily.resonance_badges.length > 0 && (
              <ResonanzSnapshot
                badges={daily.resonance_badges}
                isPremium={isPremium}
              />
            )}
```

**Step 6: Run all tests**

```bash
npm run test
```

Expected: all pass (no regressions).

**Step 7: Commit**

```bash
git add src/components/dashboard/DashboardTagesEnergie.tsx src/lib/feature-flags.ts
git commit -m "feat(fusion-daily-hero): integrate ResonanzSnapshot into DashboardTagesEnergie, gated by daily_fusion_hero_v1 flag"
```

---

### Task 7: Wire `birthSign` + `isPremium` into `Dashboard.tsx` and update `useFirstRunDaily` call

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Find the `useFirstRunDaily` call in Dashboard.tsx**

Currently (~line 284):

```typescript
  const { dailyData, dayHarmonic, nightHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
    userId,
    profileMeta.birthInput,
    effectiveSoulprint,
    quizSectors,
  );
```

The Dashboard has access to `apiData?.western?.zodiac_sign` as the birth sign. Find where `apiData` is available and add `birthSign`:

```typescript
  const birthSign = apiData?.western?.zodiac_sign ?? null;

  const { dailyData, dayHarmonic, nightHarmonic, handleClose: handleDailyClose } = useFirstRunDaily(
    userId,
    profileMeta.birthInput,
    effectiveSoulprint,
    quizSectors,
    birthSign,
  );
```

Note: `birthSign` must be declared before `useFirstRunDaily` — ensure it's not inside a conditional. Place it before line 284 in the hooks section.

**Step 2: Find the `DashboardTagesEnergie` usage and add `isPremium`**

Currently (~line 439):

```tsx
            <DashboardTagesEnergie
              daily={dailyData}
              dayHarmonic={activeDayHarmonic}
              spaceWeather={spaceWeather}
              onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}
            />
```

Change to:

```tsx
            <DashboardTagesEnergie
              daily={dailyData}
              dayHarmonic={activeDayHarmonic}
              spaceWeather={spaceWeather}
              onOpenDayModal={dailyEnabled ? () => setIsDayModalOpen(true) : undefined}
              isPremium={isPremium}
            />
```

(`isPremium` is already available in Dashboard.tsx as a prop passed from App.tsx.)

**Step 3: Typecheck**

```bash
npm run lint
```

Expected: clean.

**Step 4: Run all tests**

```bash
npm run test
```

Expected: all pass.

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(fusion-daily-hero): pass birthSign to useFirstRunDaily + isPremium to DashboardTagesEnergie"
```

---

### Task 8: Write integration test for `DashboardTagesEnergie` with badges

**Files:**
- Create: `src/__tests__/fusion-daily-hero.test.tsx`

**Step 1: Write the test**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardTagesEnergie } from '../components/dashboard/DashboardTagesEnergie';
import type { DailyResponse } from '../lib/schemas/experience';
import type { DayHarmonicState } from '../lib/fusion-ring/day-harmonic';

// ── Mock feature flag so badge row renders ───────────────────────────────────
vi.mock('../lib/feature-flags', () => ({
  isFeatureEnabled: vi.fn((flag: string) => flag === 'daily_fusion_hero_v1'),
  validateCriticalFlags: vi.fn(),
}));

const MOCK_DAILY: DailyResponse = {
  date: '2026-04-07',
  western: { summary: 'West', themes: [], caution: '', opportunity: '', evidence: {} },
  eastern: { summary: 'East', themes: [], caution: '', opportunity: '', evidence: {} },
  fusion: {
    summary: 'Fusion',
    synthesis: 'Heute fließt Energie ruhig.',
    action: 'Innehalten.',
    pushworthy: false,
    push_text: '',
    harmony_index: 0.42,
    day_mode: 'pulse',
  },
  meta: { engine_version: 'v1-test' },
  resonance_badges: [
    { type: 'transit', label: 'Mars Trigon · Verstärkend', sublabel: '88%', intensity: 'hoch', color: '#D4AF37' },
    { type: 'space_weather', label: 'Kp 3.2 · Ruhig', sublabel: 'Kosmisches Wetter', intensity: 'niedrig', color: '#4CAF50' },
    { type: 'sektor', label: '♈ Widder', sublabel: 'Dein Leitsystem', intensity: 'hoch', color: '#8B6CD4' },
  ],
};

const MOCK_HARMONIC: DayHarmonicState = {
  mode: 'pulse',
  intensity: 0.42,
  label: 'Puls',
  elementKey: 'wasser',
  color: '#4A90D9',
  ringModulation: 1.0,
  quizWeight: 0.5,
};

const NULL_SPACE_WEATHER = {
  loading: false,
  error: null,
  data: null,
};

describe('DashboardTagesEnergie with resonance badges', () => {
  it('renders badge labels when daily_fusion_hero_v1 is on and badges present', () => {
    render(
      <DashboardTagesEnergie
        daily={MOCK_DAILY}
        dayHarmonic={MOCK_HARMONIC}
        spaceWeather={NULL_SPACE_WEATHER as any}
        isPremium={true}
      />,
    );
    expect(screen.getByText('Mars Trigon · Verstärkend')).toBeInTheDocument();
    expect(screen.getByText('Kp 3.2 · Ruhig')).toBeInTheDocument();
    expect(screen.getByText('♈ Widder')).toBeInTheDocument();
  });

  it('renders badges in blurred/locked state for free user', () => {
    render(
      <DashboardTagesEnergie
        daily={MOCK_DAILY}
        dayHarmonic={MOCK_HARMONIC}
        spaceWeather={NULL_SPACE_WEATHER as any}
        isPremium={false}
      />,
    );
    // Badge text still visible in DOM (accessibility), but wrapped in opacity-60
    expect(screen.getByTestId('resonanz-badge-transit')).toHaveClass('opacity-60');
  });

  it('renders no badge row when resonance_badges is absent', () => {
    const nobadges = { ...MOCK_DAILY, resonance_badges: undefined };
    render(
      <DashboardTagesEnergie
        daily={nobadges}
        dayHarmonic={MOCK_HARMONIC}
        spaceWeather={NULL_SPACE_WEATHER as any}
        isPremium={true}
      />,
    );
    expect(screen.queryByTestId('resonanz-badge-transit')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/fusion-daily-hero.test.tsx
```

Expected: FAIL — (DashboardTagesEnergie not yet wired with badges in Task 6).

If Task 6 is already done, the test may pass immediately — that's fine.

**Step 3: Run all tests**

```bash
npm run test
```

Expected: all pass.

**Step 4: Commit**

```bash
git add src/__tests__/fusion-daily-hero.test.tsx
git commit -m "test(fusion-daily-hero): integration tests for DashboardTagesEnergie badge rendering"
```

---

## Verification

After all tasks:

1. Enable the flag: `localStorage.setItem('ff_daily_fusion_hero_v1', 'true')` in browser console
2. Open Dashboard — `DashboardTagesEnergie` (top section) should show 3 badge-pills below the main daily text
3. As premium user: badges are full-color, readable
4. As free user: badges are visible but blurred with lock icon
5. Check DevTools Network → `/api/experience/daily` response body should include `resonance_badges: [...]`
6. Check console — no TS errors, no hook warnings

```bash
npm run test        # all pass
npm run lint        # clean
```

To enable permanently in dev: add `daily_fusion_hero_v1: true` to `src/lib/feature-flags.ts` FLAGS object.
