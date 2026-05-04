Phase-specific instructions for the **Code** phase. Extends [../CLAUDE.md](../CLAUDE.md).

## Purpose

This phase contains the **implementation**. Focus on clean, tested, maintainable code.

---

## Components

| Component | Steering files | Code location | Stack |
|-----------|---------------|---------------|-------|
| **frontend** | [`3-code/frontend/`](frontend/) | `../src/` | React 19 SPA, Tailwind v4, Framer Motion, Three.js, Zod |
| **api-server** | [`3-code/api-server/`](api-server/) | `../server.mjs` | Express.js, Stripe, Supabase service role, Gemini, ElevenLabs |
| **mobile** | [`3-code/mobile/`](mobile/) | `../apps/mobile/` | Expo 53 iOS, React Native 0.79, @bazodiac/shared |
| **shared** | [`3-code/shared/`](shared/) | `../packages/shared/` | TypeScript (ESM), Zod, Vitest — `@bazodiac/shared` workspace package |

### Frontend

- **Directory**: [`frontend/`](frontend/)
- **Technology**: React 19, TypeScript, Vite, Tailwind CSS v4, Three.js
- **Responsibility**: Web SPA — Dashboard, Signatur ring (V2/V3), Orrery, quiz system, premium gating, space weather visualization

### API Server

- **Directory**: [`api-server/`](api-server/)
- **Technology**: Express.js (Node 20), single-file `server.mjs`
- **Responsibility**: Proxy/orchestration layer — BAFE proxy, Gemini interpretation, Stripe payments, space weather aggregation, Experience API proxy

### Mobile App

- **Directory**: [`mobile/`](mobile/)
- **Technology**: Expo 53, React Native 0.79, @react-navigation
- **Responsibility**: iOS app — Dashboard, Signatur view, quiz renderer, voice agent, offline contribution queue

### Shared Library

- **Directory**: [`shared/`](shared/)
- **Technology**: TypeScript (ESM), Zod 4.3, Vitest
- **Responsibility**: Cross-component logic — signal math, quiz definitions/scoring, fusion-ring/signatur engine math, agent configs, experience/transit/weekly schemas, i18n keys. Consumed by `frontend` and `mobile` via workspace import. No DOM, no React, no native APIs.

---

## Component Isolation

The `3-code/<component>/` directories contain **only steering files** (e.g., `CLAUDE.<component>.md`), **not source code**. All source code, configuration, and assets for a component reside in the code location listed in the Components table above.

Isolation rules:

- **No code in steering directories** -- never place source files, configuration files, or build artifacts inside `3-code/frontend/`, `3-code/api-server/`, `3-code/mobile/`, or `3-code/shared/`. These directories hold only `CLAUDE.<component>.md` and similar steering documents.
- **No cross-component configuration** -- configuration that spans multiple components should never be necessary. If such a situation arises, treat it as a potential design flaw or incorrect component separation. Stop work, notify the user with a clear description of the conflict, and propose alternative actions (e.g., refactoring responsibilities, introducing a new component, or adjusting the design).
- **Do not rename or move component directories** -- the directory names and code paths listed above are fixed; renaming or relocating them breaks cross-phase references and tooling assumptions.

---

## Build Commands

Build scripts, dev servers, and test commands are documented in the project root's [`../CLAUDE.md`](../CLAUDE.md) (covering `npm run dev`, `npm run build`, `npm run test`, etc.) and in each component's own codebase (`package.json`, configuration files, or equivalent). Check there first.

When invoking any command, apply active decisions from the component's `CLAUDE.<component>.md` whose trigger conditions match.

---

## Task Tracking

All development tasks are tracked in [`tasks.md`](tasks.md).

To create the initial implementation plan (phased tasks from design artifacts), run `/SDLC-implementation-plan`. This should be done after `/SDLC-decompose` and before starting any coding work.

---

## Linking to Other Phases

- Implementation follows designs in `2-design/`
- Tests verify requirements from `1-objectives/`
- Infrastructure code goes in `4-deploy/`; when a coding task modifies IaC, the deploy phase instructions ([`CLAUDE.deploy.md`](../4-deploy/CLAUDE.deploy.md)) apply as well
