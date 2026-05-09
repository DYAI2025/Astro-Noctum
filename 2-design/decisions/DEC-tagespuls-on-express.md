---
id: DEC-tagespuls-on-express
status: Active
date: 2026-05-09
trigger: Choosing the runtime host for the Tagespuls neu-architecture (Phase T) endpoints — Express server (server.mjs) versus Supabase Edge Functions (supabase/functions/*)
---

# DEC-tagespuls-on-express

## Decision

The Tagespuls feature endpoints — `GET /api/daily-pulse` and `POST /api/daily-interpretation` — are implemented as **Express routes on the existing `server.mjs`**, not as Supabase Edge Functions.

The OpenAPI spec at `apps/tagespuls_package/packages/api/openapi.yaml` declares the endpoints under the `/v1/users/{userId}/...` Edge-Function-style paths; the production Express paths use a flatter `/api/...` convention. The OpenAPI doc is treated as a contract reference, not as a deployment target.

## Context

Three runtime choices were considered when bringing the Tagespuls neu-architecture from `apps/tagespuls_package/` (which was authored as a stand-alone reference subsystem) into the live Bazodiac repo:

1. **Supabase Edge Functions** — Deno runtime, deployed via `supabase functions deploy`, separate auth stack, separate ENV var management, separate observability.
2. **Express routes on `server.mjs`** — Node runtime, deployed via Railway alongside Vite-built `dist/`, reuses `requireUserAuth` middleware, shares ENV vars and AI router with `/api/experience/daily`, observability via existing structured logger.
3. **Hybrid** — Edge Functions for the read-heavy `daily-pulse` (cacheable, public-shaped), Express for the write-heavy `daily-interpretation` (auth-sensitive, idempotency-critical).

The original Phase T plan (`docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md`) explicitly preferred Express:

> **Architecture decision deviation from brief**: The brief specifies Supabase Edge Functions. The existing Bazodiac architecture uses an Express server (`server.mjs`) for ALL API routes — daily, transit-state, agent, checkout. Adding Edge Functions would introduce a new deployment surface, new auth boundary, new env-var management. Use Express to match existing pattern. Document this deviation in `2-design/decisions/DEC-tagespuls-on-express.md`.

A subsequent dev brief on 2026-05-09 reverted to Edge Functions as a target. After review (PR #331 had already shipped Express, all 21 aphorisms seeded, full-suite green at 2323/2323), Ben confirmed the Express choice stands.

## Choice: Express routes on `server.mjs`

### Rationale

- **Pattern parity.** Every other authenticated API route in the project (`/api/experience/daily`, `/api/transit-state/:userId`, `/api/impact/active`, `/api/checkout`, `/api/contribute`, …) lives in `server.mjs`. Tagespuls follows the same shape.
- **Auth reuse.** The `requireUserAuth` middleware loaded from `server/middleware/auth.mjs` already produces the structured-envelope error shape used by the rest of the API (`{ error: { code, message, request_id, recoverable, retry_after } }`). Edge Functions would require porting that envelope to Deno, duplicating the JWT-verification path.
- **AI router reuse.** `server/ai-router.mjs` exports `geminiClient` (a router that does Gemini direct → OpenRouter free-chain fallback on 429). Tagespuls reuses it transparently. An Edge Function would either call the AI router via internal HTTP (extra hop) or duplicate the router in Deno.
- **Single deployment surface.** Railway already redeploys `server.mjs` + `dist/` together on every merge to main. Edge Functions would add a separate `supabase functions deploy` step that needs its own CI gating + ENV management.
- **ENV var hygiene.** `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY` are server-only secrets already plumbed into `server.mjs`. Edge Functions would need them re-injected via `supabase secrets set`.
- **Observability.** Tagespuls calls flow through the same structured logger that emits `{ provider, quotaStatus, latency_ms, user_id_hash, request_id }` per-request. Edge Functions would need their own logging pipeline.

### Trade-offs accepted

- **Edge cold-start latency advantage forfeited.** Edge Functions deploy globally and would have lower first-byte latency for distant users. Bazodiac's user base is overwhelmingly DACH-region; the Railway region (eu-west) covers that adequately.
- **Auto-scaling forfeited.** Express on Railway scales vertically (+ horizontal via replicas) but lacks the pay-per-invocation Edge model. At current volume (single-tenant beta), this is a non-issue.
- **OpenAPI spec drift.** `apps/tagespuls_package/packages/api/openapi.yaml` declares `/v1/users/{userId}/daily-pulse`. The live Express path is `/api/daily-pulse`. Future migration to Edge Functions could realign, but for now the OpenAPI doc is reference-only and the migration `supabase-migrations/20260509_tagespuls_tables.sql` carries an analogous "design reference only" banner per `INFO-1` from the 2026-05-09 code review.

## Consequences

- All Tagespuls API code lives in `server.mjs:3058–3380` (route handlers) + `server/services/tagespuls.service.mjs` (pure helpers).
- The `apps/tagespuls_package/` subsystem stays in the repo as **design reference + curator workflow**, not as a deployable subsystem. Aphorism source markdowns, the `aphorism-curator` and `day-pulse-trace` Claude Code skills, and the design docs all keep their current location.
- The Supabase migration at `supabase-migrations/20260509_tagespuls_tables.sql` is the production DDL. The reference `apps/tagespuls_package/packages/db/schema.sql` carries an 11-line banner pointing at the migration as the source of truth.
- The Python build pipeline at `apps/tagespuls_package/packages/voice/scripts/build_aphorisms.py` is reference-only. The Node port `scripts/build-aphorisms-json.mjs` is the production builder used in `npm run` workflows.
- Future migration to Edge Functions remains a viable target — this decision does not foreclose it. Re-activation trigger: (a) global latency becomes a complaint signal, OR (b) Bazodiac adopts a multi-region deployment, OR (c) the Express server's connection ceiling becomes a bottleneck. Each would warrant a fresh `DEC-tagespuls-edge-migration` decision rather than silently flipping the architecture.

## Related Artifacts

- Implementation plan: [`docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md`](../../docs/plans/2026-05-07-dashboard-flow-tagespuls-3d.md)
- Pre-merge code review: [`docs/plans/2026-05-09-tagespuls-pre-merge.md`](../../docs/plans/2026-05-09-tagespuls-pre-merge.md)
- Production migration: [`supabase-migrations/20260509_tagespuls_tables.sql`](../../supabase-migrations/20260509_tagespuls_tables.sql)
- Reference subsystem: [`apps/tagespuls_package/`](../../apps/tagespuls_package/)
- PRs that landed the work: #328 (Stability Hotfixes), #329 (3D Anchor + GreenOps), #331 (Tagespuls + KILL ALL PLACEHOLDERS)
