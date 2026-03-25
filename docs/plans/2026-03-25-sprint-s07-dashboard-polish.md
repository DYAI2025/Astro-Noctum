# Sprint S07 — Dashboard Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 11 dashboard bugs and wire 5 features to make Bazodiac production-ready for paying users.

**Architecture:** 11 tasks batched by file locality. P0 tasks (Week 1) are independent. P1 tasks are also independent of each other. Tasks within each phase can be executed in any order.

**Tech Stack:** TypeScript, React 19, Tailwind CSS v4, Vitest, Express (server.mjs), Supabase, ElevenLabs

---

## TASK 1 (P0): Fix Silent Failures — BUG-04, BUG-05, BUG-06

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` (~lines 158–169)
- Modify: `src/hooks/usePremium.ts` (~lines 54–57)
- Modify: `src/hooks/useDashboardTour.ts` (~lines 47–49)

**Background:** These 3 bugs cause errors to be silently swallowed. BUG-04: Three.js post-processing setup errors are only `console.warn`'d. BUG-05: usePremium has a comment about "poll fallback" but the fallback doesn't actually poll — Realtime failure just freezes premium status silently. BUG-06: Supabase write failure in `tour_completed` DB write only uses `console.warn`, caller receives no error.

### Steps

1. Read the three files to find the exact error-handling code:
   ```bash
   # Read each file in full before making any edits
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/fusion-ring-website/FusionRingCanvasV2.tsx | head -200
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/usePremium.ts
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useDashboardTour.ts
   ```

2. In `FusionRingCanvasV2.tsx`: Find the Vignette/OutputPass try-catch block (around lines 158–169). Change `console.warn` to `console.error` AND set a React state error flag so the ring renders with a visual fallback indicator. The state and JSX change should look like this:

   Add state near top of component:
   ```typescript
   const [postProcessingError, setPostProcessingError] = useState(false);
   ```

   In the try-catch:
   ```typescript
   } catch (err) {
     console.error('[FusionRingCanvasV2] Post-processing setup failed:', err);
     setPostProcessingError(true);
   }
   ```

   Add visual fallback indicator in JSX (inside the canvas container, conditionally rendered):
   ```tsx
   {postProcessingError && (
     <div className="absolute bottom-2 left-2 text-xs text-amber-400/60 pointer-events-none">
       Ring effects unavailable
     </div>
   )}
   ```

3. In `usePremium.ts`: Find the "poll fallback" comment around lines 54–57. Replace the silent failure with actual polling. The corrected code should:
   - Log with `console.error` on Realtime subscription failure
   - Start a 30-second interval that re-fetches premium status from Supabase when Realtime fails
   - Clear the interval on unmount

   ```typescript
   // Inside the Realtime subscription setup, on error/failure:
   const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

   const startPollingFallback = useCallback(() => {
     console.error('[usePremium] Realtime subscription failed — starting poll fallback (30s interval)');
     if (pollIntervalRef.current) return; // already polling
     pollIntervalRef.current = setInterval(async () => {
       const { data, error } = await supabase
         .from('profiles')
         .select('is_premium')
         .eq('id', userId)
         .single();
       if (!error && data) {
         setIsPremium(data.is_premium ?? false);
       }
     }, 30_000);
   }, [userId]);

   // In useEffect cleanup:
   return () => {
     subscription.unsubscribe();
     if (pollIntervalRef.current) {
       clearInterval(pollIntervalRef.current);
       pollIntervalRef.current = null;
     }
   };
   ```

4. In `useDashboardTour.ts`: Find the `console.warn` on DB write around lines 47–49. Expose a `persistError` state field in the hook's return value. The corrected code:

   Add state:
   ```typescript
   const [persistError, setPersistError] = useState<Error | null>(null);
   ```

   Replace the warn:
   ```typescript
   } catch (err) {
     const error = err instanceof Error ? err : new Error(String(err));
     console.error('[useDashboardTour] Failed to persist tour_completed to DB:', error);
     setPersistError(error);
   }
   ```

   Include in the return value:
   ```typescript
   return {
     // ...existing fields...
     persistError,
   };
   ```

5. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

6. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

7. Commit:
   ```bash
   git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/hooks/usePremium.ts src/hooks/useDashboardTour.ts
   git commit -m "fix(dashboard): surface silent failures in ring post-processing, premium realtime, and tour persistence"
   ```

---

## TASK 2 (P0): Remove Ghost UI — BUG-07, BUG-08, BUG-09, BUG-10, BUG-14

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/dashboard/BlueprintCard.tsx`
- Modify: `src/i18n/translations.ts` (if "Your Bazaar Blueprint" is there)

**Background:** 5 ghost UI items pollute the dashboard. BUG-07: "Tour wiederholen" + "Zahlung verwalten" menu items have no implementation. BUG-08: "Neustarten" button does nothing. BUG-09: Redundant reload button in heading. BUG-10: Placeholder text "Your Bazaar Blueprint" shown in Kosmischer Blueprint section. BUG-14: "KI-Synthese" heading was never specified.

### Steps

1. Read Dashboard.tsx fully to find each ghost element:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/Dashboard.tsx
   ```

2. In `Dashboard.tsx`: Find and remove the following ghost elements:
   - Remove "Tour wiederholen" and "Zahlung verwalten" from the top-right menu/dropdown (including their `onClick` handlers and any associated state if it was only used for those items).
   - Remove the "Neustarten" button entirely, including its unused event handler function.
   - Remove the redundant reload icon/button from the "dein Bazodiac" heading row (keep the heading text itself).
   - Remove the "KI-Synthese" heading section (the heading element and any wrapper div that becomes empty after removal).

3. In `BlueprintCard.tsx`: Find and replace "Your Bazaar Blueprint" placeholder text with the correct German: `"Kosmischer Blueprint"`. Verify the heading uses the correct label, not a hardcoded English string.
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/BlueprintCard.tsx
   ```

4. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

5. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

6. Commit:
   ```bash
   git add src/components/Dashboard.tsx src/components/dashboard/BlueprintCard.tsx
   git commit -m "fix(dashboard): remove ghost UI elements — menu items, neustarten button, KI-Synthese heading, blueprint placeholder"
   ```

---

## TASK 3 (P0): Stripe Live — S07-F1

**Files:** No code changes required. Config only.

**Background:** Stripe IS fully implemented in `server.mjs` (checkout endpoint + webhook handler). The system just needs 3 env vars set in Railway. The webhook handler verifies `STRIPE_WEBHOOK_SECRET` before processing any events.

### Steps

1. In the Railway dashboard for the Bazodiac production service, navigate to Variables and set:
   - `STRIPE_SECRET_KEY=sk_live_...` (from Stripe Dashboard → Developers → API Keys → Secret key)
   - `STRIPE_PRICE_ID=price_...` (from Stripe Dashboard → Products → your premium product → Price ID)
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (from Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret)

2. Set up the webhook endpoint in Stripe Dashboard:
   - Navigate to Developers → Webhooks → Add endpoint
   - URL: `https://[your-railway-domain]/api/webhook/stripe`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Click "Add endpoint" and copy the Signing secret to `STRIPE_WEBHOOK_SECRET`

3. Verify the integration: Open the production app, navigate to a premium-gated feature, and click the upgrade/unlock button. A Stripe-hosted checkout page should appear.

4. Test with Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiration: any future date (e.g., `12/28`)
   - CVC: any 3 digits (e.g., `123`)
   - Postal code: any 5 digits (e.g., `12345`)

5. After a successful test payment, verify in Supabase:
   - Open Table Editor → `profiles`
   - Find the test user row
   - Confirm `is_premium` column is now `true`

This task has no code commit. Document completion by noting the Stripe webhook ID in the Railway environment as a variable comment or in a team notes doc.

---

## TASK 4 (P1): Fix Levi-Layer Layout — BUG-12

**Files:**
- Modify: `src/components/dashboard/DashboardLeviSection.tsx`
- Modify: `src/components/Dashboard.tsx` (reorder layout)

**Background:** BUG-12 has 3 sub-issues: (a) text is offset/italic/too small, (b) "Call Levi" button oversized + extra "Levi Bazzi bereit" button, (c) Levi section position too low in layout. The widget uses extreme z-index (`z-[9999]`) which may cause layering issues with modals.

### Steps

1. Read `DashboardLeviSection.tsx` fully:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/DashboardLeviSection.tsx
   ```

2. Fix text styling in `DashboardLeviSection.tsx`:
   - Remove italic class if present (ensure there is no `italic` class on descriptive text — add `not-italic` if necessary to override inherited styles)
   - Set minimum `text-sm` (14px) on any text that is smaller
   - Ensure `text-center` on descriptive text, removing any `text-left` or `ml-*` offsets that cause offset appearance

3. Fix button issues in `DashboardLeviSection.tsx`:
   - Find the "Levi Bazzi bereit" extra button and remove it entirely (including its handler)
   - Scale the "Call Levi" button to standard size: `px-6 py-2 text-sm` (remove any oversized `px-10`, `py-4`, `text-lg` etc.)

4. Fix z-index in `DashboardLeviSection.tsx`:
   - Find the widget wrapper div with `z-[9999]`
   - Change to `z-50`
   - The ElevenLabs `<elevenlabs-convai>` element manages its own overlay internally and does not need an extreme z-index on the wrapper

5. In `Dashboard.tsx`: Find the `<DashboardLeviSection />` mount point. Move it to render after the Big Three cards and the Fusion Ring section, but before the detail/information sections (Blueprint, Wu-Xing detail, etc.). Adjust the surrounding `motion.div` wrapper order accordingly.

6. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

7. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

8. Commit:
   ```bash
   git add src/components/dashboard/DashboardLeviSection.tsx src/components/Dashboard.tsx
   git commit -m "fix(dashboard): fix Levi layer text alignment, button sizing, and layout position"
   ```

---

## TASK 5 (P1): Fix Blueprint i18n — BUG-10, BUG-13

**Files:**
- Modify: `src/components/dashboard/BlueprintCard.tsx`
- Modify: `src/i18n/translations.ts`
- Modify: `src/contexts/LanguageContext.tsx` (only if `t()` function needs new keys wired)

**Background:** BUG-13: Cosmic Blueprint section has mixed DE/EN — heading responds to language toggle but body text does not. BUG-10: "Your Bazaar Blueprint" placeholder may still appear in the body text (if not caught in Task 2). Both heading and body must use `t()` from LanguageContext and switch when language toggles.

### Steps

1. Read `BlueprintCard.tsx` and `LanguageContext.tsx`:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/BlueprintCard.tsx
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/contexts/LanguageContext.tsx
   ```

2. Find any hardcoded English strings in `BlueprintCard.tsx` body text. Replace each with the appropriate `t('blueprint.bodyText')` or sub-key call.

3. In `translations.ts`, add missing keys for the Blueprint section in both `en` and `de` objects:
   ```typescript
   // In 'de' object:
   blueprint: {
     heading: 'Kosmischer Blueprint',
     bodyText: 'Dein kosmischer Fingerabdruck — die einzigartige Konstellation deiner kosmischen Energien.',
     noData: 'Keine Daten verfügbar',
   },

   // In 'en' object:
   blueprint: {
     heading: 'Cosmic Blueprint',
     bodyText: 'Your cosmic fingerprint — the unique constellation of your cosmic energies.',
     noData: 'No data available',
   },
   ```

4. Verify `BlueprintCard.tsx` has the correct i18n wiring:
   - Imports `useLanguage` from LanguageContext
   - Calls `const { t } = useLanguage()` inside the component
   - Uses `t('blueprint.heading')` for the heading
   - Uses `t('blueprint.bodyText')` for the body copy

5. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

6. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

7. Commit:
   ```bash
   git add src/components/dashboard/BlueprintCard.tsx src/i18n/translations.ts
   git commit -m "fix(i18n): wire Cosmic Blueprint section to LanguageContext — heading and body both DE/EN"
   ```

---

## TASK 6 (P1): Quiz i18n EN — S07-B3

**Files:**
- Modify: `src/contexts/LanguageContext.tsx`
- Modify: `src/i18n/translations.ts`
- Modify multiple quiz files: `src/components/quizzes/LoveLanguagesQuiz.tsx`, `src/components/quizzes/PersonalityQuiz.tsx`, and up to 4 others (found via Grep for hardcoded German quiz labels)

**Background:** All 22 quizzes have hardcoded German text. They don't use `useLanguage()` at all. The sprint goal is English translation complete — meaning each quiz should render in English when `lang === 'en'`. The fastest approach: add a quiz-specific translations section to `translations.ts` and have each quiz call `t()` for its labels.

### Steps

1. Search for all quiz components and grep for hardcoded German strings:
   ```bash
   ls /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/quizzes/
   grep -r "DIMENSION_LABELS\|Qualität\|Stärke\|Tiefe\|Energie" /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/quizzes/ --include="*.tsx" -l
   ```

2. Read the 6 priority quiz components:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/quizzes/LoveLanguagesQuiz.tsx
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/quizzes/PersonalityQuiz.tsx
   # Read CareerDNA, Kinky entry, PartnerMatch entry, Mentalist similarly
   ```

3. In `translations.ts`, add a `quizzes` section for the 6 priority quiz types:
   ```typescript
   // In both 'de' and 'en' objects:
   quizzes: {
     loveLang: {
       title: { de: 'Liebessprachen', en: 'Love Languages' },
       dimensions: {
         touch: { de: 'Berührung', en: 'Touch' },
         words: { de: 'Worte', en: 'Words of Affirmation' },
         gifts: { de: 'Geschenke', en: 'Gifts' },
         time: { de: 'Zeit', en: 'Quality Time' },
         acts: { de: 'Handlungen', en: 'Acts of Service' },
       },
     },
     personality: {
       title: { de: 'Persönlichkeit', en: 'Personality' },
       dimensions: {
         // add quiz-specific dimension keys
       },
     },
     careerDna: {
       title: { de: 'Karriere-DNA', en: 'Career DNA' },
     },
     kinky: {
       title: { de: 'Kinky', en: 'Kinky' },
     },
     partnerMatch: {
       title: { de: 'Partner Match', en: 'Partner Match' },
     },
     mentalist: {
       title: { de: 'Mentalist', en: 'Mentalist' },
     },
   },
   ```

4. In each of the 6 priority quiz components, replace hardcoded German strings with i18n calls:
   - Add `import { useLanguage } from '../../contexts/LanguageContext';` at the top
   - Add `const { lang } = useLanguage();` inside the component
   - Replace hardcoded German dimension labels with `lang === 'de' ? 'Berührung' : 'Touch'` (inline ternary is acceptable for MVP; t() key is cleaner long-term)
   - Replace hardcoded quiz title strings similarly

   Example pattern for a dimension label array:
   ```typescript
   const DIMENSION_LABELS = lang === 'de'
     ? ['Berührung', 'Worte', 'Geschenke', 'Zeit', 'Handlungen']
     : ['Touch', 'Words of Affirmation', 'Gifts', 'Quality Time', 'Acts of Service'];
   ```

5. Minimum viable scope: cover the 6 main quiz types listed above (LoveLanguages, Personality, CareerDNA, KinkySeries entry, PartnerMatch entry, Mentalist). Remaining 16 quizzes follow in S08.

6. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

7. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

8. Commit:
   ```bash
   git add src/i18n/translations.ts src/components/quizzes/*.tsx
   git commit -m "feat(i18n): add English translations for quiz content — labels, options, dimensions"
   ```

---

## TASK 7 (P1): Mount InfluenceGauges — S07-F2

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Read-only: `src/components/dashboard/InfluenceGauges.tsx` (component already implemented)

**Background:** The `InfluenceGauges` component exists and renders "Heutige Einflüsse" with 4 animated gauge bars (Mars-Sektor, Jupiter-Sektor, Venus-Balance, Saturn-Fokus). It uses `DEFAULT_INFLUENCES` placeholder data (0.82, 0.65, 0.45, 0.30). The sprint explicitly states "static OK" — just mount it.

### Steps

1. Read `InfluenceGauges.tsx` to confirm its props interface and that it has no required external dependencies:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/InfluenceGauges.tsx
   ```

2. Read `Dashboard.tsx` to find the correct placement (after the space weather section, near other ring/influence data):
   ```bash
   grep -n "SpaceWeather\|InfluenceGauges\|transit" /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/Dashboard.tsx | head -30
   ```

3. Add the import at the top of `Dashboard.tsx` (with the other dashboard section imports):
   ```typescript
   import InfluenceGauges from './dashboard/InfluenceGauges';
   ```

4. Mount the component in the Dashboard JSX — add after the transit data / space weather card, wrapped in the standard error boundary pattern:
   ```tsx
   <SectionErrorBoundary>
     <InfluenceGauges />
   </SectionErrorBoundary>
   ```
   No prop wiring needed — the component has good defaults via `DEFAULT_INFLUENCES`.

5. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

6. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

7. Commit:
   ```bash
   git add src/components/Dashboard.tsx
   git commit -m "feat(dashboard): mount InfluenceGauges with static placeholder data"
   ```

---

## TASK 8 (P1): Verify Daily Insight / DayModeModal — S07-F3

**Files:**
- Read-only: `src/components/Dashboard.tsx`
- Read-only: `src/components/dashboard/DayModeModal.tsx`
- Read-only: `src/hooks/useFirstRunDaily.ts`

**Background:** S07-F3 = "Daily Insight Modal (Gemini) funktional". The `DayModeModal` was implemented (PR #160, branch `feature/fusion-ring-integration-v3`). It IS wired in `Dashboard.tsx`. This task is verification: confirm the full flow works end-to-end. The Experience API (`/api/experience/daily`) uses Gemini on the server side. The modal shows on first visit, gated by `profiles.daily_modal_seen` in Supabase.

### Steps

1. Read `Dashboard.tsx` — confirm `DayModeModal` is imported and rendered (not the older `DailyHoroscopeModal`):
   ```bash
   grep -n "DayModeModal\|DailyHoroscopeModal\|showModal\|dailyData" /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/Dashboard.tsx | head -20
   ```

2. Read `useFirstRunDaily.ts` — confirm `fetchDailyExperience()` is called and the `daily_modal_v1` feature flag is checked:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useFirstRunDaily.ts
   ```

3. Verify `server.mjs` has the `/api/experience/daily` proxy endpoint with correct timeout:
   ```bash
   grep -n "experience/daily\|daily.*timeout\|20000\|20_000" /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/server.mjs | head -10
   ```
   Expected: endpoint present with ~20s timeout.

4. If `DayModeModal` is NOT mounted in `Dashboard.tsx` (because it is on an unmerged branch), add import and mount:
   ```typescript
   import DayModeModal from './dashboard/DayModeModal';
   ```

   Add conditional render in Dashboard JSX:
   ```tsx
   {showModal && dailyData && (
     <DayModeModal data={dailyData} dayHarmonic={dayHarmonic} onClose={handleClose} />
   )}
   ```
   Wire `showModal`, `dailyData`, `dayHarmonic`, and `handleClose` from `useFirstRunDaily()` hook output.

5. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

6. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

7. If changes were made, commit:
   ```bash
   git add src/components/Dashboard.tsx
   git commit -m "fix(dashboard): ensure DayModeModal is wired — daily insight S07-F3"
   ```
   If no changes were needed, note "S07-F3 already complete" and skip the commit.

---

## TASK 9 (P1): Onboarding Route Polish — S07-F6

**Files:**
- Read-only/Modify: `src/pages/OnboardingPage.tsx`
- Read-only/Modify: `src/components/onboarding/SignatureReveal.tsx`

**Background:** The onboarding flow (`form → signature → done`) is implemented. The value moment is the Ring animation during `SignatureReveal`. S07-F6 = "Onboarding-Route: Neuer User sieht sofort Wert". Verify the flow is smooth and covers the edge case where `bootstrapExperience()` fails (a new user should still see the Ring, not a blank screen).

### Steps

1. Read `SignatureReveal.tsx` fully:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/onboarding/SignatureReveal.tsx
   ```

2. Verify error boundary handling: If `bootstrapData` is null (bootstrap failed), check what currently renders. If it renders blank or broken, add a fallback that shows the ring with a default soulprint (12 equal sectors at value `1/12 ≈ 0.0833`) and a loading message:
   ```tsx
   const DEFAULT_SOULPRINT = Array(12).fill(1 / 12);

   const sectors = bootstrapData?.soulprint_sectors ?? DEFAULT_SOULPRINT;

   // Render the ring with `sectors` regardless of whether bootstrap succeeded
   // Show a subtle message if using fallback:
   {!bootstrapData && (
     <p className="text-xs text-gold/50 text-center mt-2">
       Dein Signatur wird berechnet...
     </p>
   )}
   ```

3. Verify the "Weiter" button shows after the ring animation completes (~3s). Confirm `handleSignatureComplete()` in `App.tsx` transitions to `done` phase correctly:
   ```bash
   grep -n "handleSignatureComplete\|done.*phase\|setPhase" /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/App.tsx | head -10
   ```

4. Verify the `signature_onboarding_v1` feature flag defaults to `true` in `feature-flags.ts`:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/lib/feature-flags.ts
   ```
   Expected: `signature_onboarding_v1` defaults to `true`.

5. If any edge cases were found and fixed, write a test for the failure path:
   ```typescript
   // src/__tests__/onboarding.test.ts
   import { render, screen } from '@testing-library/react';
   import SignatureReveal from '../components/onboarding/SignatureReveal';

   describe('SignatureReveal', () => {
     it('renders with default sectors when bootstrapData is null', () => {
       render(
         <SignatureReveal
           bootstrapData={null}
           onComplete={vi.fn()}
         />
       );
       expect(screen.getByText(/Dein Signatur wird berechnet/i)).toBeInTheDocument();
     });
   });
   ```

6. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

7. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

8. If changes were made, commit:
   ```bash
   git add src/components/onboarding/SignatureReveal.tsx src/__tests__/onboarding.test.ts
   git commit -m "fix(onboarding): handle bootstrap failure gracefully in SignatureReveal"
   ```

---

## TASK 10 (P1): Signatur Bug Root Cause — S07-B7

**Files:**
- Create: `docs/plans/2026-03-25-signatur-bugs-root-cause.md`

**Background:** S07-B7 = "Signatur-Bugs identifizieren + Root-Cause (Vorbereitung S08-01)". This is an analysis task, not a fix. The Signatur (Fusion Ring) has visual bugs to be fixed in S08. The output is a document listing each bug with file + line + root cause.

### Steps

1. Read the core Signatur files to identify obvious issues:
   ```bash
   grep -n "console.warn\|console.error\|TODO\|FIXME\|HACK\|BUG" \
     /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/fusion-ring-website/FusionRingCanvasV2.tsx | head -40
   grep -n "console.warn\|console.error\|TODO\|FIXME\|HACK\|BUG" \
     /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/fusion-ring-3d/FusionRing3D.tsx | head -40
   ```

2. Check recent git log for bug-related commits on Signatur files:
   ```bash
   git log --oneline --all -- src/components/fusion-ring-website/ src/components/fusion-ring-3d/ | head -20
   ```

3. Check for known issues referenced in sprint documents or task boards:
   ```bash
   grep -r "SIG\|signatur.*bug\|ring.*bug" \
     /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/3-code/tasks.md | head -30
   ```

4. Document each bug discovered in the root cause file using this format:

   ```markdown
   ## Bug S-SIG-01: [Name]
   **File:** src/components/.../File.tsx:LINE
   **Symptom:** [What the user sees]
   **Root cause:** [Why it happens — specific code path or missing logic]
   **Proposed fix:** [How to fix it in S08 — specific change to make]
   ```

5. Save the document to `docs/plans/2026-03-25-signatur-bugs-root-cause.md`.

6. Commit:
   ```bash
   git add docs/plans/2026-03-25-signatur-bugs-root-cause.md
   git commit -m "docs(signatur): root cause analysis for S08-01 bug preparation"
   ```

---

## TASK 11 (P2): Fix Icon Mapping — BUG-11

**Files:**
- Modify: `src/components/WuXingCycleWheel.tsx` OR `src/components/WuXingPentagon.tsx` (find the Metal element definition)

**Background:** BUG-11 — Wu-Xing Metal element shows "Wind" icon + tooltip. This is a data mapping error: the Metal entry in the element definitions probably has the wrong icon key or label.

### Steps

1. Read both components to find the 5-element definitions:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/WuXingCycleWheel.tsx
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/WuXingPentagon.tsx
   ```
   Look for the array or object that defines all 5 elements with their icons and labels.

2. Find the Metal entry. It likely has `icon: 'wind'` or a Wind icon component incorrectly assigned. The correct values for Metal are:
   - Label: `'Metall'` (DE) / `'Metal'` (EN)
   - Icon: a sword, coin, or axe symbol — or the CJK character `金` (jīn). If using a Lucide/React Icons icon, use `Swords`, `Gem`, or similar. Do NOT use `Wind`.
   - Tooltip: `'Metall'`
   - Color: typically white/silver in Wu-Xing tradition

3. Fix the Metal entry. Example correction:
   ```typescript
   // Before (wrong):
   { element: 'metal', label: 'Metall', icon: Wind, tooltip: 'Wind', color: '#C0C0C0' },

   // After (correct):
   { element: 'metal', label: 'Metall', icon: Gem, tooltip: 'Metall', color: '#C0C0C0' },
   ```

4. Verify the other 4 elements have correct mappings:
   - Holz (Wood): `TreePine` or `Leaf` icon, green color
   - Feuer (Fire): `Flame` icon, red color
   - Erde (Earth): `Mountain` or `Globe` icon, yellow/brown color
   - Wasser (Water): `Droplets` or `Waves` icon, blue/black color

5. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

6. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

7. Commit:
   ```bash
   git add src/components/WuXingCycleWheel.tsx  # or WuXingPentagon.tsx, whichever had the error
   git commit -m "fix(wu-xing): correct Metal element icon and tooltip (was showing Wind)"
   ```

---

## TASK 12 (P2): Quiz-Cluster Animation — S07-F4

**Files:**
- Modify: `src/components/ClusterEnergySystem.tsx` or the relevant cluster completion component
- Modify: `src/components/QuizOverlay.tsx` (on-complete animation trigger)

**Background:** S07-F4 = "Quiz-Cluster Abschluss — Ergebnis-Layer + Energiefeld-Animation". When a quiz cluster is completed (all quizzes in the cluster are done), show an animated results layer with a brief celebration/pulse animation.

### Steps

1. Read the relevant components to understand current cluster completion state:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/ClusterEnergySystem.tsx
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/QuizOverlay.tsx
   ```

2. Find where cluster completion is detected — likely in `useQuizContribution.ts` or a cluster gate check in `ClusterEnergySystem.tsx`:
   ```bash
   grep -n "cluster.*complete\|all.*done\|gate\|clusterDone" \
     /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/hooks/useQuizContribution.ts | head -20
   ```

3. Add a completion state callback. In `useQuizContribution.ts`, when the cluster gate is passed (all quizzes in cluster complete), emit an event or set state:
   ```typescript
   const [completedCluster, setCompletedCluster] = useState<string | null>(null);

   // After cluster gate check succeeds:
   setCompletedCluster(clusterId);
   ```

4. In `QuizOverlay.tsx` (or `ClusterEnergySystem.tsx`), add a completion overlay using Framer Motion — a 2-second brief animation that pulses or radiates:
   ```tsx
   {completedCluster && (
     <motion.div
       className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
       initial={{ opacity: 0, scale: 0.8 }}
       animate={{ opacity: 1, scale: 1 }}
       exit={{ opacity: 0, scale: 1.2 }}
       transition={{ duration: 0.5 }}
       onAnimationComplete={() => setTimeout(() => setCompletedCluster(null), 1500)}
     >
       <div className="glass-card px-8 py-6 text-center border border-gold/30">
         <p className="text-gold font-semibold text-lg">
           {clusterName} abgeschlossen
         </p>
         <p className="text-ash/70 text-sm mt-1">
           Deine Energie wurde aktualisiert
         </p>
       </div>
     </motion.div>
   )}
   ```

5. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

6. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

7. Commit:
   ```bash
   git add src/components/ClusterEnergySystem.tsx src/components/QuizOverlay.tsx src/hooks/useQuizContribution.ts
   git commit -m "feat(quiz): add cluster completion animation overlay — energy field pulse on all quizzes done"
   ```

---

## TASK 13 (P2): Planetarium Hover States — S07-F5

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx`

**Background:** S07-F5 = "Planetarium Hover-States". The 3D orrery should show planet info on hover — planet name and current orbital position.

### Steps

1. Read `BirthChartOrrery.tsx` to understand current Three.js event handling and planet mesh structure:
   ```bash
   cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/BirthChartOrrery.tsx
   ```

2. Find where planet sphere meshes are created and stored. They likely use `userData` to store planet metadata. Find the animation loop and the canvas ref.

3. Add a raycaster for mouse hover detection. In the Three.js canvas, add a `pointermove` event listener on the canvas element that runs raycasting:
   ```typescript
   const raycaster = new THREE.Raycaster();
   const mouse = new THREE.Vector2();
   const [hoveredPlanet, setHoveredPlanet] = useState<{ name: string; position: string } | null>(null);

   const handleMouseMove = useCallback((event: MouseEvent) => {
     const rect = canvasRef.current!.getBoundingClientRect();
     mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
     mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

     raycaster.setFromCamera(mouse, camera);
     const intersects = raycaster.intersectObjects(planetMeshes);

     if (intersects.length > 0) {
       const mesh = intersects[0].object;
       setHoveredPlanet({
         name: mesh.userData.planetName,
         position: mesh.userData.positionLabel ?? '',
       });
     } else {
       setHoveredPlanet(null);
     }
   }, [camera, planetMeshes]);
   ```

4. Add the tooltip JSX overlay on top of the canvas:
   ```tsx
   {hoveredPlanet && (
     <div
       className="absolute top-4 left-4 glass-card px-3 py-2 text-sm pointer-events-none z-10"
       style={{ position: 'absolute' }}
     >
       <p className="text-gold font-semibold">{hoveredPlanet.name}</p>
       {hoveredPlanet.position && (
         <p className="text-ash/70 text-xs">{hoveredPlanet.position}</p>
       )}
     </div>
   )}
   ```

5. Ensure planet meshes have `userData.planetName` set when created (if not already):
   ```typescript
   planetMesh.userData = { planetName: planet.name, positionLabel: planet.signLabel };
   ```

6. Run TypeScript check:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
   ```
   Expected: no errors

7. Run test suite:
   ```bash
   cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
   ```
   Expected: 800+ passed

8. Commit:
   ```bash
   git add src/components/BirthChartOrrery.tsx
   git commit -m "feat(planetarium): add planet hover states with name and position tooltip"
   ```

---

## Final Verification

Run the full test suite:
```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run test
```
Expected: 800+ passed, 0 failed.

Run the TypeScript compiler:
```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx tsc --noEmit
```
Expected: no errors.

Run lint (optional):
```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run lint
```
Expected: no errors.

---

**IMPORTANT NOTE — Branch Strategy:**

The main branch for this sprint is `main`. Tasks 1–11 should be committed directly to a feature branch `feature/sprint-s07-dashboard-polish` and merged via PR after all P0/P1 tasks are complete.

Create the branch before starting:
```bash
git checkout -b feature/sprint-s07-dashboard-polish
```

The DayModeModal changes are on `feature/fusion-ring-integration-v3` — that PR (#160) needs to be merged first before S07 tasks that touch `Dashboard.tsx`. If PR #160 is not yet merged at execution time, check out that branch's changes for Dashboard.tsx manually before proceeding with Task 8.

After all P0/P1 tasks are complete, open a PR:
```bash
gh pr create \
  --base main \
  --head feature/sprint-s07-dashboard-polish \
  --title "feat: Sprint S07 — Dashboard polish (11 bug fixes, 5 features)" \
  --body "Fixes BUG-04 through BUG-14. Wires Stripe live, InfluenceGauges, DayModeModal, quiz i18n EN, onboarding polish."
```
