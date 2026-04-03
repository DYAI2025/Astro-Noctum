# Changelog

## [Unreleased] - 2026-04-03

### Features

- **Z-axis depth navigation** — `useNavigationDepth()` hook tracks Surface (Dashboard) / Mid (Signatur) / Core (Wu-Xing, Weekly, Sky, Wissen, FAQ) depth layers. `AnimatePresence` + `motion.div` in `AppRoutes` applies inward (scale 1.04→1) / outward (scale 0.97→1) / lateral (fade) transitions at 400ms ease. `prefers-reduced-motion` falls back to opacity-only. 14 new tests in `depth-navigation.test.tsx`. Wireframe spec at `docs/wireframes/depth-navigation-v1.md`.
- **S-DASH-LIVE: Live influence gauges** — `InfluenceGauges` now accepts `weights?: Record<string, number>` from transit state; renders LIVE / KEINE DATEN badge (i18n: `dashboard.influences.liveLabel / noDataLabel`), dims grid when no data available.
- **S-DASH-LIVE: Cosmic weather card** — `CosmicWeatherCard` and `CosmicInfluenceSection` wired to live space weather data.
- **S-DASH-LIVE: Inline form validation** — `BirthForm` validates all fields inline (date, coordinates, timezone) without `alert()`. Future-date error navigates back to step 1 automatically.
- **Signatur DevUI** — `src/debug/` module: `DebugPanel`, `debug-injection.ts`, `presets.ts`, `useDebugPanel` hook. Enables in-browser manipulation of bipolar engine state for development/QA. Gated — does not ship to users.
- **SettingsMenu** — extracted to `src/components/navigation/SettingsMenu.tsx` with close-on-navigate, escape key, accessible aria-labels.

### Bug Fixes

- **React #310 production crash** (PR #245) — hook-order violation causing `useState` in invalid context. App was down on `bazodiac.space`. Fixed via `codex/investigate-and-resolve-loading-errors` branch.
- **CSP: FundingChoices blocked** — `worklet-src` + Google FundingChoices script now allowed in `server.mjs` Content-Security-Policy.
- **BirthForm: stale `formErrors` refs** — `formErrors.coords`, `setFormErrors({})` (×2) were `ReferenceError` at runtime. Renamed to `errors.coordinates` / `setErrors({})` throughout. 10 tests were failing; all now pass.
- **InfluenceGauges: static TRANSIT label** — replaced hardcoded "TRANSIT" with i18n-driven LIVE / KEINE DATEN badge.
- **Router: scale exit animations no-op** — `display: contents` on `motion.div` prevented Framer Motion from applying `transform: scale()` on exit. Replaced with `className="w-full"`.
- **CSS: duplicate `:root`/`.planetarium` blocks** — `--color-text-bright-dim` was declared in a stray second `:root` block; merged into canonical declarations.
- **Dashboard bright mode** — `text-white`, `bg-black/*`, `text-zinc-*`, `font-mono` violations across `DashboardTagesEnergie`, `InfluenceGauges`, `CosmicWeatherCard`, `DashboardAstroSection` replaced with CSS variable tokens (`--tile-text-primary`, `--tile-accent`, `font-sans`).
- **HeroNav group hover** — inline `style={{ opacity }}` was defeating `group-hover:opacity-*` Tailwind utilities; moved to Tailwind classes.
- **Tailwind v4: `@apply cosmic-tile` build failure** — replaced with explicit selector grouping (`.cosmic-tile, .morning-card, .bright-card`).

### Code Quality

- `LATERAL_VARIANTS` + `REDUCED_VARIANTS` merged into single `FADE_VARIANTS` constant in `router.tsx` (were byte-for-byte duplicates).
- ISO date string comparison in `BirthForm.handleSubmit` documented with inline comment.

### Tests

- **1155 passing / 1 server-only skip** (was 1041 at last CHANGELOG entry; +114)
- New: `depth-navigation.test.tsx` (14), `influence-gauges-live.test.tsx` (7), `birthform-inline-validation.test.tsx` (8), `birthform-double-submit.test.tsx` (1), `daily-cache-key.test.ts`, `cosmic-influence-section.test.tsx`, `bipolar-engine-debug.test.ts`, `debug-injection.test.ts`, `debug-panel.test.ts`, `fusion-ring-canvas-v2-debug.test.ts`

### SDLC

- **TASK-bloom-solar-coupling** → Done (already implemented in V2 bloom + V3 solarFadeMod)
- **TASK-depth-navigation** → Done (wireframe `docs/wireframes/depth-navigation-v1.md`)
- **TASK-depth-nav-implement** → Done (router.tsx + useNavigationDepth.ts)
- New decisions: `DEC-navigation-shell.md` — depth layer map, AnimatePresence pattern, ROUTE_DEPTH as single source of truth
- New requirements: `REQ-F-depth-navigation`, `REQ-F-dashboard-identity-cards`, `REQ-F-dashboard-live-daily-signals`, `REQ-F-navigation-shell`
- Fix handoffs documented: `docs/fix-handoffs/` (birthform-inline-validation, dashboard-daily-widgets-static, dashboard-signatur-status-stuck, dashboard-theme-parity-defects, mobile-nav-utility-parity, planetarium-current-sky-toggle)

## [Unreleased] - 2026-03-31

### Design System

- **Design System V2** — unified token system for dark/bright mode: typography (Sora+Cormorant), spacing scale (4-80px), Wu-Xing element colors (#4CAF50/#F44336/#FF9800/#9E9E9E/#2196F3), card system, touch targets (44px min), WCAG contrast enforcement
- **Spiritual Tech Interactions** — 300ms+ transitions, skeleton loading, cosmic comedy error messages, 5-item nav max, mobile drawer pattern
- **Bright mode accent: #2563EB** (Blue) — tech-oriented, distinct from dark-mode Gold
- Tokens in `src/index.css` @theme: card-dark, card-bright, accent-blue, element-*, spacing-section, radius-card, touch-min
- New CSS classes: `.bright-card` (hover lift+shadow), `.card-element` (data-element left stripe), `.skeleton-pulse`, `.focus-ring`

### S09 Design-Fitting Sprint

- **Nav:** FAQ replaced by Weekly in primary nav, 44px touch targets on all nav items, `transition-all duration-300`
- **Spacing:** `gap-20` (80px) standardized section gaps, `p-6`/`p-4` card padding
- **Mobile:** DashboardBigFour `md:grid-cols-4`, `min-h-11` on all buttons/links
- **Colors:** Centralized `element-colors.ts`, Wu-Xing CSS variable references replace hardcoded hex
- **Typography:** Inter removed, Sora-only body font (`font-sans`), landing-hero font fixed
- **WCAG:** Bright-mode text minimum `#71717A` on white (4.5:1 ratio) — bumped 7 components

### Bug Fixes

- **L2 cooldown persistence** — `generated_at` column on vibes_cache for cooldown survival across Railway redeploys
- **formatCooldown** extracted to `src/lib/format-cooldown.ts` with 5 unit tests
- **Dashboard ghost-ui test** — added react-router-dom mock for useNavigate
- **Duplicate import** — removed double DashboardBigFour import from merge conflict

### Tests

- **1041/1041 pass** (0 failures, +42 from previous session)
- 5 formatCooldown tests, cooldown response shape validation
- ghost-ui test fixed (useNavigate mock)

### Decisions

- `DEC-design-system-v2` — dark/bright tokens, Wu-Xing colors, spacing, radii, touch targets
- `DEC-spiritual-tech-interactions` — animation timing, cosmic errors, skeleton loading, nav rules

### Documentation

- `docs/DESIGN_SYSTEM_V2.md` — quick reference with Tailwind v4 integration
- `docs/plans/2026-03-31-s09-design-fitting.md` — sprint plan
- `docs/plans/2026-03-30-review-fixes-and-dashboard-polish.md` — review fixes plan

## [Unreleased] - 2026-03-30

### Features

- **Vibes on-demand** — `POST /api/vibes` endpoint: combines soulprint + transit + space weather via Gemini into 3-level output (Kurzsignal, Treiber, Erklaerung). L1+L2 deterministic cache (30-min slot windows). Wu-Xing element fallback when Gemini unavailable. `VibesSection` button on Dashboard + `VibesModal` with animated expand for "Warum sehe ich das?" explainability panel.
- **Quiz Generator Pipeline** — `generateQuiz()` assembler in `@bazodiac/shared`: transforms `QuizGeneratorInput` + pre-authored questions into complete `GeneratedQuiz` with 5 artifacts (QuizDefinition, AffinityMapEntries, EventConverterSpec, ResultProfiles, AggregationRules). Includes `generateAffinityEntries()` (Wu-Xing sector distribution) and `generateEventConverter()` (marker ID construction).
- **Shadow Archetype Quiz** — 24th quiz ("Was lauert hinter deinem Laecheln?"), 8 scenario questions, 4 dimensions (Destroyer/Orphan/Tyrant/Trickster), integrated end-to-end: definition, AFFINITY_MAP entries, `shadowArchetypeToEvent()`, React component, QUIZ_MAP + mystiker cluster registration.

### SDLC Artifacts

- **GOAL-vibes-weekly-insights** (Approved) — on-demand Vibes (2-3h horizon) + Weekly Insights (7 life areas) with transparent outputs
- **8 Requirements** (Approved) — vibes-core, vibes-output-structure, weekly-insights-engine, weekly-area-prioritization, transparency-rule, explainability-layer, mobile-first-readability, vibes-response-time
- **REQ-F-quiz-generator-pipeline** (Approved) — formal mapping contract for quiz-to-fusion systems
- **3 Constraints** — CON-no-unexplained-numbers, CON-resource-oriented-framing, CON-mobile-first-readability
- **3 Decisions** — DEC-vibes-not-daily, DEC-no-number-without-explanation, DEC-top-3-weekly-focus
- **5 User Stories** — vibes-on-demand, vibes-explainability, weekly-overview, weekly-prioritization, number-transparency
- **2 Assumptions** — existing-fusion-sufficient, gemini-text-quality
- **Stakeholders** — STK-product-owner (Ben), STK-end-user formally defined
- **Component steering files** updated with multi-agent + quiz-generator + signatur requirements (frontend: 12 REQ, api-server: 7 REQ, mobile: 6 REQ)

### Bug Fixes

- **Security** — Removed `VITE_SUPABASE_SERVICE_ROLE_KEY` + `VITE_SUPABASE_DB_BASE` from Railway (were exposed to browser build via VITE_ prefix)
- **Test i18n mocks** — Fixed 6 pre-existing test failures: astro-accordion (4), signatur-reveal-v2 (1), wuxing-page-detail (1) — all caused by `t()` mock returning keys instead of German text
- **Vibes cache mutation** — Deep-copy meta on cache hit to prevent L1 cache entry mutation
- **Vibes double-tap** — Added useRef guard against concurrent fetch on rapid button taps
- **VibesModal** — Removed redundant outer AnimatePresence (parent already wraps)
- **Quiz overlay** — Fixed test text mismatch ("Quiz nicht gefunden" vs actual "Dieses Quiz konnte nicht geladen werden")
- **Cluster e2e** — Updated module count 23 to 24 after shadow archetype addition

### Tests

- **976/976 tests pass (0 failures)** — first time fully green
- 54 new quiz generator tests (types, affinity entries, event converter, assembler + scoreQuiz integration)
- 3 Vibes perf tests (response time, cache hit, shape validation)
- 8 signatur perf tests (first-frame pipeline, transit API)
- BAFE determinism contract test (5 endpoints, graceful skip)

### Deploy & Operations

- 7 runbooks total: railway-deploy, supabase-migration, onboarding-test, signatur-v3-web-test, signatur-audio-test, signatur-cross-platform-test, vibes-test
- Migration: `20260330_vibes_cache.sql` (vibes_cache table for L2 persistence)
- Phase A-B complete (production hardening, onboarding verification)
- Vibes/Weekly implementation plan: 3 phases (V1-V3), 26 tasks

## [Unreleased] - 2026-03-29

### Features

- **DashboardTagesEnergie** — neue Hero-Sektion ersetzt `CosmicWeatherCard` als primären Tages-Impuls-Container. Immer vollständig sichtbar (kein Akkordeon). Zeigt: Element-Icon (aus BaZi Day-Master), Body-Narrativ (`fusion.synthesis`), Day-Trace Reibungs-Kontext, Kosmoswetter-Strip mit Event-Icons (Magnetsturm, Flare, CME, HSS, SEP, Transit), Resonanz-Indikator (persönliche Energie × Solaraktivität). `fusion.action` hinter `<PremiumGate>`.
- **Kosmoswetter Event-Icons** — `buildWeatherPills` rendert Icon-Pillen für alle Space-Weather-Ereignistypen: Geomagnetischer Sturm (Kp-basiert + Events), M/X-Flare, CME-Ankunft, Hochgeschwindigkeitsstrom, Protonenfluss, Planetentransit aus Daily-Evidence.
- **Resonanz-Indikator** — animierter Balken (`motion.div`, Gold→Cyan) mit Formel `harmony_index × 0.65 + solar_pressure × 0.35`; 4 Textstufen von "fließt unabhängig" bis "verstärkt den solaren Impuls".
- **DayModeModal on-demand** — Modal öffnet sich nicht mehr automatisch beim ersten Load. Öffnung ausschließlich via "vertiefen →" Button in `DashboardTagesEnergie`. Supabase-Tracking (`daily_modal_seen_date`) bleibt beim expliziten Schließen erhalten.

### Bug Fixes

- **R1-1** `geomagnetic_storm` Events wurden in `buildWeatherPills` als behandelt markiert ohne je eine Pill zu erzeugen (silent skip). Fehlender Branch ergänzt: Zap-Icon, Label `Magnetsturm {severity}`, Gold für G3+, Amber für G2.
- **R1-2** `handleDailyClose` (Close-Funktion) wurde fälschlicherweise als `onOpenDayModal` übergeben → "vertiefen →" Button war ein No-op. Fix: lokaler `isDayModalOpen`-State in `Dashboard.tsx`; `() => setIsDayModalOpen(true)` als Open-Handler; Modal rendert auf `isDayModalOpen` statt `showModal`.
- **R1-4** Guard `daily.fusion.day_mode &&` auf dem Themes-Kicker war immer `true` (`z.enum(['pulse','trace'])` nie null). Ersetzt durch `(daily.western?.themes?.length ?? 0) > 0` — rendert kein leeres `<p>` mehr wenn `themes: []`.
- **R2-4** `daily.fusion.synthesis` konnte als leerer String `""` vom Server kommen (KI-Generierungsfehler). Fallback hinzugefügt: `'Tagesimpuls wird gerade berechnet …'`.

### Refactoring

- **R2-1** Manueller Premium-Lock (`showPremiumHint` State + `Lock`-Button) in `DashboardTagesEnergie` durch existierende `<PremiumGate>`-Komponente ersetzt. Entfernt: `isPremium`-Prop, `showPremiumHint`-State, `Lock`-Icon-Import, `useState`. Konsistent mit Design-System.
- **R2-2** `buildWeatherPills` mit `useMemo([spaceWeather, daily])` memoized. `useSpaceWeather` pollt alle 5 Min und erzeugt neue State-Objekte → verhindert unnötiges Array-Rebuild + JSX-Element-Erstellung bei jedem Poll-Zyklus. Pattern konsistent mit `InfluenceGauges.tsx`.

### Accessibility

- **R2-3** `role="progressbar"` + `aria-valuenow` / `aria-valuemin` / `aria-valuemax` / `aria-label` auf dem Resonanz-Balken ergänzt. Konsistent mit `DissonanceValues.tsx`, `ClusterSidebar.tsx`, `ClusterCard.tsx`.

### Tests

- 17 neue Tests in 2 neuen Test-Dateien (`dashboard-tages-energie.test.tsx`, `dashboard-modal-open.test.tsx`)
- Abdeckung: PremiumGate-Integration (5), Kosmoswetter-Pills (3), Themes-Kicker (2), Resonanz-Bar ARIA (2), Body-Fallback (2), vertiefen-Button (3)

### Documentation

- `docs/wireframes/dashboard-v2.md` — F3 (Tages-Energie) vollständig neu geschrieben: Hero-Sektion-Spec, Kosmoswetter-Icon-Tabelle, Resonanz-Formel
- `1-objectives/requirements/REQ-F-signatur-day-night-pulse.md` — UI-Acceptance-Criteria für Dashboard Tages-Impuls Hero-Sektion ergänzt (6 prüfbare Criteria)
- `3-code/tasks.md` — `TASK-tagesenergie-hero` hinzugefügt

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
