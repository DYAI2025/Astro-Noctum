# Sprint Plan 1-4: Hybrid Engine, Symbol System & Astrosheet Dashboard

**Status**: Draft
**Owner**: Antigravity
**Goal**: Launch a production-ready ("Live-Ready") Astrosheet Dashboard with a robust Hybrid Engine (Cloud + Local Ba Zi/Fusion) and instant "Identity Symbol" generation.

---

## 🏗 Modular Architecture Strategy

To ensure maintainability and testability ("Clean & Smart"), we will adopt a **Service-Layer Architecture**:

1.  **Strict Contracts (`packages/types` or `src/types`)**:
    -   **`AstroProfileV1`**: The canonical data structure. All UI components consume this. No loose `any`.
    -   **`SymbolSpecV1`**: The canonical structure for the generative symbol (SVG paths, weights, prompt).

2.  **Cosmic Engine as a Composition Root**:
    -   The `CosmicEngine` orchestrates: `CloudService` (Western) -> `LocalBaZi` (Eastern) -> `FusionService` (Synthesis) -> `SymbolService` (Visual Identity).
    -   It returns a strictly validated `AstroProfileV1`.

3.  **Decoupled Services**:
    -   `SymbolService`: Pure function `(profile: AstroProfile) => SymbolSpec`. Does not know about database or request context.
    -   `BaZiService`: Pure function. 100% testable with "Golden Data" fixtures.

---

## 🗓 Sprint 1: Unified Hybrid Engine & Strict Core
**Goal**: The "Engine" is reliable, typed, and testable. It produces the `AstroProfileV1` including Ba Zi and Fusion data.

### Objectives
-   [ ] **Strict Schemas**: Define `AstroProfileV1` using Zod.
-   [ ] **Refactor Ba Zi**: Convert `bazi.ts` to strict TS. Remove all `any`. Implement correct "Li Chun" logic.
-   [ ] **Refactor Fusion**: Convert `fusion.ts` to strict TS. Ensure normalizing logic is robust.
-   [ ] **Unit Testing**: Add `vitest` suite for Ba Zi and Fusion. Verify against "Golden Cases" (e.g. 1980-06-24).

### Key Deliverables
-   `src/server/cosmicEngine/schemas.ts`: Zod definitions.
-   `src/server/cosmicEngine/bazi.ts`: Refactored.
-   `src/server/cosmicEngine/fusion.ts`: Refactored.
-   `tests/unit/engine/`: Test suite.

---

## 🗓 Sprint 2: Identity & Symbol Service (Onboarding)
**Goal**: The Onboarding flow generates an "Instant Symbol" based on the user's chart.

### Objectives
-   [ ] **Symbol Service**: Implement `src/server/services/symbol/generator.ts`.
    -   Logic: Map `FusionVector` -> `Shapes/Colors` (as defined in research).
    -   Output: SVG String + Midjourney/NanoBanana Prompt.
-   [ ] **Orchestration**: Hook `SymbolService` into `engine.ts` (post-Fusion step).
-   [ ] **Onboarding API**: Update `/api/astro-compute` to return the Symbol immediately.
-   [ ] **Web-App Visualization**: Verify the SVG renders correctly in a test view.

### Key Deliverables
-   `src/server/services/symbol/`: The Generator logic.
-   `SymbolSpecV1` schema.
-   Updated `engine.ts` returning `profile.symbol`.
-   Verified "Instant Preview" in Onboarding flow.

---

## 🗓 Sprint 3: Astrosheet Dashboard Experience
**Goal**: A beautiful, responsive Dashboard that visualizes the `AstroProfile`.

### Objectives
-   [ ] **Dashboard Scaffolding**: Implement `src/app/astrosheet/page.tsx` with real data fetching.
-   [ ] **Core Components**:
    -   `SymbolCard`: Displays the SVG + "Identity Guide" (bullets).
    -   `FusionCard`: Visualizes the 5-Element Vector (Radar Chart or Bar).
    -   `BaZiCard`: Displays the Four Pillars.
-   [ ] **DST/Fold Handling**: Upgrade Onboarding to handle `AMBIGUOUS_LOCAL_TIME` (User selects Time A/B).

### Key Deliverables
-   `src/components/astrosheet/`: UI Components.
-   Functional Dashboard reading from Supabase/Auth.

---

## 🗓 Sprint 4: Hardening, Security & Release
**Goal**: Production readiness. Secure the Cloud API, stabilize costs, and ensure performance.

### Objectives
-   [ ] **Security**: secure Cloud Engine calls (API Key rotation, Env Vars).
-   [ ] **Error Handling**: Graceful degradation if Cloud fails (Local Fallback for Western?).
-   [ ] **Performance**: Cache `Symbol` generation? (Ideally deterministic, so cheap to re-compute or store once).
-   [ ] **Documentation**: `README` for Engine usage and Schema versions.

### Key Deliverables
-   Release Candidate.
-   Documentation.
