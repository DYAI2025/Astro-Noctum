Phase-specific instructions for the **Code** phase. Extends [../CLAUDE.md](../CLAUDE.md).

## Purpose

This phase contains the **implementation**. Focus on clean, tested, maintainable code.

---

## Components

<!-- After running `/SDLC-decompose`, each identified component lives in its own subdirectory under `3-code/` with a `CLAUDE.<component>.md` file describing its directory, technology, and responsibility. List components here as they are decomposed. -->

### Shared Types

- **Directory**: [`shared-types/`](shared-types/)
- **Technology**: TypeScript (workspace package, no runtime)
- **Responsibility**: Entity, DTO, error-envelope, and analytics-event types shared between all other components.

### Web Frontend

- **Directory**: [`web-frontend/`](web-frontend/)
- **Technology**: TypeScript + React + Vite (+ Three.js for the frozen FS-2 SignaturRenderer)
- **Responsibility**: React SPA — dashboard composition, Daily Pulse UI, Council selection, Signature anchor, Upgrade funnel UI, ManageSubscription UI, consent surfaces, polling hooks, analytics emission, privacy notice page.

### Web Server

- **Directory**: [`web-server/`](web-server/)
- **Technology**: Node + TypeScript (existing `server.mjs`)
- **Responsibility**: Legacy `/api/*` routes — Stripe Checkout entry, Stripe webhook receiver, Stripe Customer Portal session issuer, `/api/impact/active`. Hosts frozen FS-3 (Stripe stack) and the server-side portion of FS-1 (BaZi / Wu-Xing / ephemeris compute).

### Edge Functions

- **Directory**: [`edge-functions/`](edge-functions/)
- **Technology**: Deno (Supabase Edge Functions runtime) + TypeScript
- **Responsibility**: HTTP-triggered `/v1/users/:userId/*` endpoints (Daily Pulse, Daily Interpretation, Consents, Data Export, RTBF, Subscription State) plus cron-triggered scheduled jobs (RTBF scheduler, Stripe ↔ `subscription_state` reconciliation, daily cosmic-weather snapshot). Hosts the centralized LLM gateway.

### Database

- **Directory**: [`database/`](database/)
- **Technology**: SQL (PostgreSQL via Supabase) + Supabase CLI
- **Responsibility**: Supabase Postgres schema — 11 entities, RLS policies, indexes, seed scripts. Authoritative source for invariants I-DM-1 through I-DM-8.

### Tagespuls Package

- **Directory**: [`tagespuls-package/`](tagespuls-package/)
- **Technology**: Python (build pipeline) + TypeScript (selection algorithm and shared types)
- **Responsibility**: Operator-authored aphorism content vault, build pipeline producing `aphorisms.json` (only `status='approved'` entries), and the deterministic aphorism-selection algorithm. Operationally enforces [CON-aphorisms-human-approved](../1-spec/constraints/CON-aphorisms-human-approved.md).

---

## Component Isolation

All source code, configuration, and assets for a component **must reside within that component's directory**. Specifically:

- **No code outside component directories** — never place source files, configuration files, or build artifacts in `3-code/` itself or anywhere else outside the owning component's directory.
- **No cross-component configuration** — configuration that spans multiple components should never be necessary. If such a situation arises, treat it as a potential design flaw or incorrect component separation. Stop work, notify the user with a clear description of the conflict, and propose alternative actions (e.g., refactoring responsibilities, introducing a new component, or adjusting the design).
- **Do not rename or move component directories** — directory names are fixed; renaming or relocating them breaks cross-phase references and tooling assumptions.

---

## Build Commands

Scripts and commands for each component are documented in that component's own codebase (package.json, Makefile, README, or equivalent). Check there first.

When invoking any command, apply active decisions from the component's `CLAUDE.component.md` whose trigger conditions match.

---

## Task Tracking

All development tasks are tracked in [`tasks.md`](tasks.md).

To create the initial implementation plan (phased tasks from design artifacts), run `/SDLC-implementation-plan`. This should be done after `/SDLC-decompose` and before starting any coding work.

---

## Linking to Other Phases

- Implementation follows designs in `2-design/`
- Tests verify requirements from `1-spec/`
- Infrastructure code goes in `4-deploy/`; when a coding task modifies IaC, the deploy phase instructions ([`CLAUDE.deploy.md`](../4-deploy/CLAUDE.deploy.md)) apply as well
