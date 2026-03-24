# Changelog

## [Unreleased] - 2026-03-24

### Features
- **Dissonance model** — three-layer dissonance engine (`d_natal`, `d_accumulated`, `d_elemental`) quantifies how far a user's current signal has drifted from their natal baseline; Wu-Xing Sheng/Ke cycle classification for elemental tension
- **Dissonance visual modulation** — dissonance intensity drives V2 spirograph: geometry skew, fractal depth, particle vibration, color temperature shift (Ke = crystalline/cool, Sheng = organic/warm)
- **Dissonance morph transitions** — smooth lerp between modulation states with style-aware easing (angular for Ke, S-curve for Sheng); duration 800ms–2500ms based on intensity
- **DissonanceValues panel** — premium-only toggle panel on Signatur page showing d_natal / d_accumulated / d_elemental / Gesamtintensität as gold gauge bars
- **Dissonance persistence** — `upsertDissonanceState` / `fetchDissonanceState` in Supabase; Supabase migration `20260324_dissonance_state.sql` adds `natal_weights`, `accumulated_weights`, `dissonance_snapshot`, `quiz_count` columns to `astro_profiles`
- **Planetarium enhancements** — birth date in `text-xl font-serif` gold; today's date below in cyan; current live planet positions shown alongside birth positions (color-differentiated); "Planetenposition am [date]" bottom banner in both Planetarium and Solar System views
- **Navigation Variant A** — left sidebar, 64px collapsed / 240px expanded on hover, dark glass styling, hover submenus (tooltip flyout when collapsed, full-height panel when expanded), gold active-route highlight, animated icons, ARIA-labelled
- **Dashboard header redesign** — distinct header zone with `border-b border-gold/15`; "Dein Bazodiac" in `font-serif text-5xl/6xl`; eyebrow label; birth date subtitle; motion entrance animation
- **WuXing detail page** — extended analysis section behind `PremiumGate`: element balance bar chart, dominant element insights, balance assessment (strong/weak), Western Houses grid
- **Cluster resonance animation** — `ClusterPipeline` now accepts `significance` (0–1) from cluster data; scales particle sizes, glow spread, burst intensity, and adds comet trail for significance > 0.8
- **Share button** — `SharePopup` component on Signatur page replaces quiz restart button; Web Share API with clipboard fallback
- **Stripe subscriptions** — checkout mode switched from `payment` to `subscription`; lifecycle webhook handlers for `customer.subscription.updated/deleted` and `invoice.payment_failed`; `stripe_subscription_id` and `subscription_end` columns added to `profiles`
- **Silent failure fixes (BUG-04/05/06)** — FusionRingCanvasV2 shows "REDUZIERTER MODUS" badge when postprocessing fails; `usePremium` falls back to 30s polling when Realtime subscription drops; `useDashboardTour` exposes `persistError` to callers

### Fixes
- **Ghost UI removal** — "Tour wiederholen", "Zahlung verwalten", "Neustarten", "KI-Synthese" removed from Dashboard menu/header (S-DP-01–04)
- **BlueprintCard i18n** — replaced hardcoded EN/DE mix with `useLanguage()` / `translations.ts`; "Westlich" / "Östlich" labels now follow language toggle (S-DP-05–06)
- **Wu-Xing Metal icon** — `WuXingIcon` Metal entry now uses correct icon and German aria-label; tooltip no longer shows "diamond" (S-DP-07)
- **Levi section** — text size `text-base` (was `text-[11px] italic`); duplicate "Levi Bazzi bereit" button removed; section reordered above detail sections (S-DP-11–13)
- **Western houses removed from Dashboard** — moved to WuXingPage detail section (S-DP-10); orphaned `houseInterpretations` pipeline and `HouseTexts` type removed
- **AnimatedIcon TypeScript** — all icon exports cast to `AnimatedIcon` (`ForwardRefExoticComponent<SVGProps<SVGSVGElement>>`) in barrel index; `types.d.ts` adds `Diamond` declaration

### Code Quality
- `ZODIAC_NAMES_DE` and `getEclipticLongitude` hoisted to module scope in `BirthChartOrrery.tsx` (were re-created on every render)
- `onRegenerate` dead prop removed from `Dashboard` (button was removed in header redesign)
- `animate-in` plugin classes replaced with native Tailwind v4 `transition-[opacity,transform]` utilities in `NavSidebarA`
- 31 new tests added (ghost UI, WuXing, Levi, navigation variants, BlueprintCard i18n, share popup, dissonance morph, cluster completion, postprocessing degraded)

---

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
