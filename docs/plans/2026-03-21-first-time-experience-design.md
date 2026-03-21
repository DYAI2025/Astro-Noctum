# First-Time Experience — Design Document

**Date:** 2026-03-21
**Status:** Approved

## Overview

Complete redesign of the new-user journey from landing to first dashboard interaction. Replaces the current Splash → AuthGate → BirthForm → Dashboard flow with a guided, layered experience that introduces each feature incrementally.

## Flow Summary

```
Landing ("BAZODIAC" gold Cormorant, "TOUCH THE SURFACE")
  ↓ tap
Auth Page (Login oben, Registrierung darunter mit Sprachauswahl)
  ↓ Registrierung
Intro-Video (überspringbar)
  ↓
BirthForm
  ↓
Signatur-Reveal (V2-Canvas Morph: neutral → persönlich, kommentarlos)
  ↓ "WEITER"
Dashboard — First-Time Tour (State Machine):
  Step 0: Planetarium + "Willkommen zum Himmel deiner Geburt"
  Step 1: Scroll → "Schau dir deine Zeichen an" + 3 Akkordeon-Kacheln
  Step 2: Scroll → Levi-Intro (10min gratis)
  Step 3: Navigation Hints → Signatur + Tageshoroskop + Blueprint
  → done (profiles.tour_completed = true)

Returning Users: Login → sofort Dashboard (kein Splash, kein Video)

Erster Besuch /signatur:
  Popup 1: Quiz-Frage (modal, pflicht) → Ring-Effekt
  Popup 2: Quiz-Erklärung → normale Seite
```

---

## Section 1: Landing + Auth Restructure

### Changes

- Remove marketing placeholder page entirely
- Splash becomes "BAZODIAC / TOUCH THE SURFACE" — gold Cormorant Garamond, dark background with subtle star particles
- After tap: single Auth page with Login (top) and Register (bottom)
- Register includes language selector (DE/EN) → persisted to `profiles.language`
- After registration: optional intro video (always skippable) → BirthForm
- Returning users: Login → direct to Dashboard, no Splash, no intermediaries

### Files Affected

- `src/components/Splash.tsx` — redesign to gold Cormorant typography
- `src/components/AuthGate.tsx` — restructure: Login top, Register bottom, add language selector
- `src/App.tsx` — returning users skip Splash entirely

---

## Section 2: Signatur-Reveal (Onboarding Magic Moment)

### Changes

- Replace static screenshot with live V2-Canvas (~200px, round-clipped)
- Morph sequence: starts with `DEFAULT_SOUL_PROFILE`, after 500ms feeds real `natalWeights` from bootstrap → particles reorganize visually
- No profile data text, no quiz question — purely visual, commentless
- "WEITER" button appears after animation completes (~3s)

### Device Gating

- `navigator.hardwareConcurrency <= 2` or `navigator.deviceMemory < 4` → fall back to V1 canvas
- Feature flag `signature_engine_v2` already handles this

### Files Affected

- `src/components/onboarding/SignatureReveal.tsx` — replace screenshot with mini V2/V1 canvas, remove quiz question, remove profile summary
- `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` — ensure it works at 200px scale

---

## Section 3: First-Time Dashboard Tour

### State Machine

```typescript
type TourStep = 0 | 1 | 2 | 3 | 'done';

// Step 0: Planetarium + welcome overlay
// Step 1: Astro tiles overlay (scroll-triggered)
// Step 2: Levi intro overlay (scroll-triggered)
// Step 3: Navigation hints overlay
// done: persisted, never shown again
```

### Step Details

**Step 0 — Geburtshimmel:**
- Planetarium mode activated, animation PAUSED
- Overlay (glass-card, centered, ~40% screen): "Willkommen zum Himmel deiner Geburt am {DD.MM.YYYY} in {CITY}"
- "OK" click → starts planetarium animation + advances to step 1
- User sees shooting stars, can scroll down

**Step 1 — Deine Zeichen (scroll-triggered):**
- IntersectionObserver on astro-tiles sentinel (50% visible threshold)
- Overlay: "Schau dir deine Zeichen an. Klicke auf die Kacheln, um mehr zu erfahren."
- "OK" → step 2, user explores accordion tiles freely

**Step 2 — Levi Intro (scroll-triggered):**
- Overlay: "Das ist Levi, dein persönlicher kosmischer Berater. Deine erste Sitzung — 10 Minuten gratis."
- Two buttons: "JETZT SPRECHEN" (→ Levi intro agent) | "SPÄTER" (→ step 3)
- Levi intro agent: separate ElevenLabs agent ID (`VITE_ELEVENLABS_INTRO_AGENT_ID`), 10min limit, explains horoscope, points to Signatur
- After conversation or skip → step 3

**Step 3 — Navigation Hints:**
- Overlay: points to Signatur nav button, mentions Tageshoroskop + Soul Blueprint below
- "VERSTANDEN" → `tourStep = 'done'`, persists `profiles.tour_completed = true`

### Dashboard Layout Changes

- **Remove** MiniSignature ("Die Form") and LeviOrb cards — confusing, non-functional
- **New layout order:** Planetarium → Astro Accordion Tiles → Levi Section → Tageshoroskop → Soul Blueprint → Fusions-Horoskop (day 1 free) → Interpretation
- **Signatur nav link:** always active (gold), never grayed out
- Fusions-Horoskop: visible for all users on their first day, Premium-gated afterwards

### Persistence

- `profiles.tour_completed` (boolean, default false) — Supabase migration needed
- Returning users (tour_completed = true) see normal dashboard, no overlays

### Files Affected

- New: `src/components/dashboard/TourOverlay.tsx` — single component, renders overlay per step
- `src/components/Dashboard.tsx` — integrate tour state machine, remove MiniSignature/LeviOrb, new layout
- `src/components/dashboard/DashboardAstroSection.tsx` — replace current tile layout with accordion
- `src/hooks/useDashboardTour.ts` — new hook: manages tourStep, scroll observers, persistence
- `supabase-migrations/` — add `tour_completed` to profiles, `signatur_intro_seen` to profiles

---

## Section 4: Akkordeon-Kacheln

### Structure

| Main Tile | Sub-Tiles |
|-----------|-----------|
| Sonnenzeichen (+ sign name) | Mondzeichen, Aszendent |
| BaZi (+ zodiac animal) | Tagesmeister, Monatsstamm, Jahresstamm, Stundenstamm |
| WuXing (+ dominant element) | Dominantes Element, Sekundäres Element, Mangel-Element |

### Behavior

- Only one main tile open at a time (accordion pattern)
- Framer Motion `AnimatePresence` + `layout` for smooth height transitions
- Sub-tiles have gold border-pulse animation (2x) on first reveal as attention cue
- Each opened tile/sub-tile shows hint box: "Diese Energien bilden das Fundament deiner Signatur."
- Data from `apiData.western`, `apiData.bazi`, `apiData.wuxing`
- Description texts from `tileTexts` (Gemini AI) and `heavenlyStems.ts` (BaZi stems)
- Houses section NOT in accordion — stays on Premium detail page

### Styling

- Main tiles: `glass-card` style, gold icon, sign name right-aligned, chevron indicator
- Sub-tiles: slightly inset, border `border-gold/20`, smaller text
- Hint box: `bg-gold/10 border border-gold/20 rounded-xl p-3 text-xs text-gold`

### Files Affected

- New: `src/components/dashboard/AstroAccordion.tsx` — main accordion component
- New: `src/components/dashboard/AstroAccordionTile.tsx` — individual tile with sub-tiles
- `src/components/dashboard/DashboardAstroSection.tsx` — replace current tile grid with accordion

---

## Section 5: Signatur Page — First Quiz + Explanation

### Flow

1. User navigates to `/signatur` for the first time
2. **Popup 1 (modal, no escape):** "Was beschreibt dich am besten?" — 4 answer options
3. User selects answer → `signatureDelta()` API call → ring burst effect (~2s)
4. **Popup 2 (after 2s):** "Hier verfeinerst du deine grundlegenden Signaturenergien..."
5. "VERSTANDEN" → normal Signatur page with ClusterSidebar

### Persistence

- `profiles.signatur_intro_seen` (boolean) — checked on mount, set after popup 2 dismissed

### Quiz Question

- Same question currently in SignatureReveal — moved here
- No escape, no backdrop click on popup 1 (CSS `pointer-events: none` on backdrop)
- After answer: `signatureDelta()` → new `quizWeights` → `setRingEffect({ type: 'burst' })` + natalWeights transition

### Visual Style

- Same glass-card overlay style as tour popups (consistent "interruption" pattern throughout)
- Ring dimmed during popup 1, full brightness after effect

### Files Affected

- `src/pages/FuRingPage.tsx` — add first-visit check, render quiz popup + explanation popup
- New: `src/components/signatur/SignaturIntroPopup.tsx` — quiz question modal
- New: `src/components/signatur/SignaturExplainPopup.tsx` — explanation modal

---

## Bugs to Fix (Alongside)

| Bug | Fix |
|-----|-----|
| "Die Form" label on MiniSignature | Component removed entirely |
| MiniSignature + LeviOrb not clickable | Components removed entirely |
| "Signatur" nav grayed out | Always active: `text-gold-deep` |
| Quiz in onboarding SignatureReveal | Moved to `/signatur` first visit |

---

## Future Work (Separate Tickets)

- **Achievement System:** Quizzes, tutorial completion, first Levi talk, transits — shareable via social media
- **Levi Agent Split:** Intro agent (10min, explains horoscope) vs. regular agent (30min, reads horoscope + deep insights). Same voice/persona, different configs
- **Transit Tutorial:** First transit notification triggers explanation popup
