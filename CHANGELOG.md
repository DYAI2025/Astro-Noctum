# Changelog

## [Unreleased] - 2026-03-21

### Features
- **First-Time Experience overhaul** — complete redesign of the new-user journey from landing to first dashboard interaction
- **Splash redesign** — "BAZODIAC" in gold Cormorant Garamond + "TOUCH THE SURFACE" with starfield background, replacing multi-stage hero animation
- **AuthGate restructure** — Login (top) and Register (bottom) on single page with language selector that persists to profiles
- **SignatureReveal V2** — live V2 spirograph canvas morph (neutral -> personal) replaces static screenshot; device-gated fallback to V1
- **Dashboard tour** — 4-step state machine (Geburtshimmel -> Zeichen -> Levi -> Navigation) with glass-card overlays, scroll-triggered transitions, and Supabase persistence (`profiles.tour_completed`)
- **Accordion astro tiles** — 3 collapsible main tiles (Sonnenzeichen/BaZi/WuXing) with nested sub-tiles (Mond, Aszendent, Tagesmeister etc.), gold pulse animation on first reveal, "Fundament deiner Signatur" hint in every expanded section
- **Signatur first-visit quiz** — mandatory quiz popup on first `/signatur` visit with ring burst effect, followed by explanation popup; persisted via `profiles.signatur_intro_seen`
- **Returning users skip Splash** — logged-in users go directly to Dashboard, no Splash or video

### Removed
- **MiniSignature** ("Die Form") card — confusing label, non-functional click
- **LeviOrb** card — non-functional click, replaced by tour step 2 Levi intro
- **InfluenceGauges** — removed from Dashboard daily zones

### Fixes
- **Onboarding race condition** — BAFE completing before SignatureReveal could redirect users past onboarding; fixed with `hasStartedOnboarding` state gate
- **Quiz ResultScreen not showing** — `handleQuizComplete` was closing overlay before result could render; now stays open until user closes
- **Signatur nav link** — always active (gold), never grayed out

### Database
- **Supabase migration** — adds `tour_completed`, `signatur_intro_seen`, `language` columns to `profiles` table

---

## [Previous] - 2026-03-14

### Features
- **Upgrade banner above fold** — non-premium users see a visible CTA between the header and Astro section; extracted reusable `UpgradeButton` component from `PremiumGate` (`af25283`)
- **Planetarium as arrival moment** — tightened Dashboard header spacing, orrery bleeds to container edges for immersive first viewport (`e5b94b0`)

### Fixes
- **Post-login redirect to Dashboard** — users now always land on `/` after login instead of restoring a bookmarked route like `/fu-ring` (`46aa558`)
- **FuRing canvas sizing** — ring uses container dimensions instead of window, camera zoomed out 35% (8.5→11.5), `ResizeObserver` replaces window resize listener (`c950d11`, `d975c54`)
- **Responsive FuRing container** — mobile gets shorter proportional container (`h-[55vh]`) scaling up to desktop (`sm:h-[62vh]`) (`d975c54`)

### Content
- **Wù 戊 expanded** — dayMaster and monthStem now follow 5-part structure (identity, daily life, gifts, shadow, growth) in DE+EN (`88a7176`)
- **Rén 壬 expanded** — same structured depth for ocean archetype in DE+EN (`2efd149`)

## [Previous] - 2026-03-10

### Performance
- **Remove FusionRing canvas from ClusterEnergySystem** — eliminated 340px animated canvas with rAF loop that caused severe Dashboard stuttering (`1657adc`)
- **Remove all ring visuals and SVG WuXing from Dashboard** — replaced FusionRing teasers and Framer Motion WuXing components with static CSS bars (`4c7e9db`)
- **Remove 3 `repeat: Infinity` Framer Motion animations** from Sun/Moon/Ascendant cards — eliminated continuous GPU compositing (`d385a04`)
- **Convert coin/icon PNGs to WebP** — 14 images converted, ~4.1MB → ~400KB (92% reduction)

### Features
- **WuXing detail page** at `/wu-xing` with element bars, dominant element highlight, and bilingual descriptions (`1c5cfeb`)
- **Kinky quiz series** (4 quizzes) with JSON-driven renderer, scoring engine, and ContributionEvent integration (`bd697f9`)
- **Volume slider** for ambiente audio with localStorage persistence and mute/resume support (`bc627c9`)
- **Complete ambiente playlist** with all 25 tracked songs (`626eeaf`)
- **404 catch-all route** — unknown URLs now show a proper "not found" page with dashboard link
- **WuXing empty state** — shows clear message when BAFE data is unavailable instead of empty bars

### Fixes
- **Missing icon/coin assets** — copied `sun-sign.png`, `moon-sign.png`, and 12 zodiac coin PNGs from `media/` to `public/` so they actually load in production (`d385a04`)
- **Sun/Moon illustrations** integrated as larger decorative images in their respective Dashboard cards
- **BaZi element localized** — Year Animal footer now shows "Metall" (DE) instead of raw "Metal" key
- **Gemini env var relaxed** — server no longer refuses to start without `GEMINI_API_KEY` (`af47eea`)
- **CSP header updated** for ElevenLabs widget script (`3cc4a30`)
- **Quiz overlay no longer closes prematurely** — `onComplete` saves data only, overlay stays open for result screen (`ba8c756`)
- **Duplicate close button removed** from KinkySeriesQuiz (QuizOverlay already provides one)
- **KinkySeriesQuiz bilingual** — all hardcoded DE strings now use JSON i18n keys, EN fully supported

### Refactoring
- **`apiData` typed as `ApiData`** — removed `any` from `AppLayoutContext`, `App.tsx`, `FusionRingContext`, `useFusionRing`; new composite `ApiData` interface in `src/types/bafe.ts`

### Infrastructure
- **GitHub Actions CI pipeline** with TypeScript type check, build verification, and bundle size tracking (`c2a3064`)
- **`features/` excluded from tsc** — eliminates ~390 stale lint errors from spec/plan files; `npm run lint` now shows 0 errors

### Resolved Known Issues
- `ClusterCard.tsx` infinity animation — confirmed fixed (no `repeat: Infinity` remaining)
- 404 page i18n — now uses `useLanguage()` for DE/EN
