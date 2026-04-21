---
description: Verify a feature or endpoint is actually live on Railway (FuFirE + Astro-Noctum). Not "should be live" — curl proof.
allowed-tools: Bash, Read, Grep
---

## Context

Bazodiac deploys to Railway across two services:
- **FuFirE** — astrology engine at `bafe-production.up.railway.app` (repo: `Projects/SaaS/FuFirE/BAFE`, also mirrored in `.env` as `VITE_BAFE_BASE_URL`)
- **Astro-Noctum** — web app at `astro-noctum-production.up.railway.app` (this repo)

The pattern this skill handles: user has shipped a fix/feature/endpoint and wants to confirm it's actually reachable in production — not just merged to main, but actually running on Railway with the expected behavior.

Evidence from past sessions this skill solves:
- "ich suche den fix für local_datetime, ist der schon deployed oder noch nicht?"
- "Der Endpoint /api/profile/:userId ist entweder noch nicht auf Railway deployed oder die Route heißt anders in der aktuellen server.mjs Version"
- "FuFire API hasnt been updated yet"
- "sind diese sachen live?"

## Your Task

Verify that a named feature, endpoint, or fix is live on the production deploy. Arguments can be:
- Endpoint path: `/api/profile/:userId`, `/api/experience/bootstrap`
- Feature marker: field name, response shape, behavior (e.g. "local_datetime field accepted", "transit-state returns planet_weights")
- Commit SHA or PR number to verify it landed
- Just a feature name: "cymatics sphere", "3D toggle", "i18n signatur namespace"

If no argument given: ask the user what to verify.

### Steps

1. **Clarify scope** (only if args ambiguous)
   Which service: FuFirE (`bafe-production.up.railway.app`) or Astro-Noctum (`astro-noctum-production.up.railway.app`)? If unclear, default to Astro-Noctum since this is the Astro-Noctum repo.

2. **Check what's on main vs. what's on the branch**
   ```bash
   git log -1 --format="%H %s" main
   git log -1 --format="%H %s" origin/main
   git log -1 --format="%H %s" HEAD
   ```
   If the feature only lives on a non-main branch → Railway (auto-deploying from main) has NOT deployed it yet. Stop here with that finding.

3. **Verify the feature is actually on main**
   ```bash
   git log origin/main --oneline --grep="<feature-keyword>" | head -3
   ```
   Or use file-based check: `git show origin/main:path/to/file | grep <expected-new-code>`. If the feature isn't on main, user likely forgot to push/merge — surface that.

4. **Curl the endpoint directly (primary proof)**
   For Astro-Noctum endpoints:
   ```bash
   curl -s -o /tmp/verify-response.json -w "HTTP %{http_code}\n" \
     https://astro-noctum-production.up.railway.app/<path>
   cat /tmp/verify-response.json | head -40
   ```
   For FuFirE endpoints (check `.env` for exact URL):
   ```bash
   curl -s https://bafe-production.up.railway.app/<path> | head -40
   ```
   For POST endpoints that need a body: build a minimal test payload. If auth is required (e.g. user-scoped routes), flag it — most endpoints need a session-bound userId.

5. **Parse the response for the expected marker**
   - New field present? `jq '.<new_field>' /tmp/verify-response.json`
   - Response shape matches the branch's expectation?
   - Error message specific enough to confirm feature-reached (e.g. "missing userId" is better than a generic 500)?

6. **If NOT live, diagnose the failure mode**
   Common cases:
   - **Deploy still running** — check Railway project page or `railway status` (if CLI available)
   - **Deploy failed** — `railway logs --deployment <latest>` shows build errors
   - **Wrong service** — user's feature is in FuFirE but they checked Astro-Noctum (or vice versa)
   - **Route not registered** — file exists on main but `server.mjs` doesn't `app.use()` it
   - **Branch not merged** — feature is on `refactor/*` branch, never merged to main
   - **Env-var missing** — endpoint works but returns 500 due to missing prod env (e.g. `ELEVENLABS_TOOL_SECRET`)

7. **Report clearly**
   - ✅ **LIVE**: endpoint returns 200, expected field/behavior present
   - ⚠️ **PARTIAL**: endpoint reachable but feature-marker missing (likely older deploy)
   - ❌ **NOT LIVE**: endpoint 404 or feature absent — with diagnosis of WHY from step 6
   - ⏳ **DEPLOY IN PROGRESS**: Railway is building the latest commit — tell user to retry in N minutes

### Guardrails

- **Never claim "should be live" without curl proof.** User has seen that mistake before. Always show the actual HTTP response.
- **Never curl user-scoped endpoints with fake userIds and call it verified.** Those will 404 even when the code is live. Check for signed-in scenarios separately.
- **Watch for Railway IPv6 issues in Bazodiac** — if you're running this from a local dev machine and get `ENETUNREACH`, that's network-level, not deployment-level. Report as "could not verify from this environment" rather than "not deployed".
- **FuFirE and Astro-Noctum deploy independently.** A fix landing on Astro-Noctum main doesn't mean FuFirE redeployed. Check both services if the feature spans them.
- **Sensitive endpoints** (auth, payment, admin) — show the HTTP code and headers, not the body, to avoid leaking in logs.

---

*Generated by /claude-reflect:reflect-skills from 7 evidence instances across 3 sessions (8e707ed7, 4cdaedd9, 128f1856).*
