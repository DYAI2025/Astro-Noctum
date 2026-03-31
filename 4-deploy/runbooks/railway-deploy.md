# Runbook: Railway Deployment

## Overview

Deploy the Bazodiac web app to Railway. The app is built with Nixpacks (Node 20 + npm), produces a Vite static bundle, and runs via `node server.mjs` (Express).

## Prerequisites

- Railway CLI installed (`npm i -g @railway/cli`) and authenticated (`railway login`)
- Push access to the GitHub repository connected to the Railway project
- Access to the Railway dashboard for environment variable management
- Node 20.19+ locally (pinned in `.nvmrc`) for pre-deploy verification

## Environment Variables Checklist

Set these in the Railway service settings under **Variables**.

### Required (server will exit on missing)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side, admin ops) |

### Required (browser-exposed, baked into Vite build)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (client-side) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (client-side) |
| `VITE_BAFE_BASE_URL` | BAFE API public URL (default: `https://bafe.vercel.app`) |
| `VITE_ELEVENLABS_AGENT_ID` | ElevenLabs voice agent ID (Levi Bazi) |

### Optional (features degrade gracefully if missing)

| Variable | Description | Impact if missing |
|----------|-------------|-------------------|
| `GEMINI_API_KEY` | Google Gemini API key | AI interpretations fall back to static German text |
| `ELEVENLABS_TOOL_SECRET` | ElevenLabs tool auth secret | `/api/profile/:userId` endpoint unprotected |
| `BAFE_INTERNAL_URL` | Railway-internal BAFE URL (IPv6) | Falls back to public URL; higher latency + egress cost |
| `FUFIRE_BASE_URL` | FuFirE backend URL | Falls back to `BAFE_INTERNAL_URL` then `VITE_BAFE_BASE_URL` |
| `STRIPE_SECRET_KEY` | Stripe secret key | Checkout returns 503; payment features disabled |
| `STRIPE_PRICE_ID` | Stripe price ID | Checkout returns 503 |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Webhook verification fails |
| `APP_URL` | Public app URL (e.g. `https://bazodiac.com`) | Stripe redirect URLs may be incorrect |
| `NASA_API_KEY` | NASA DONKI API key | Falls back to `DEMO_KEY` (30 req/hr limit) |
| `PORT` | Server port | Defaults to `3000`; Railway sets this automatically |

## Deploy Procedure

### Standard deploy (push to branch)

Railway auto-deploys on push to the connected branch.

```bash
git push origin main
```

### Manual deploy via CLI

```bash
railway up
```

### What happens during deploy

1. **Setup**: Nixpacks provisions `nodejs_20` and `npm-10_x` (from `nixpacks.toml`)
2. **Install**: `npm ci` (clean install from lockfile)
3. **Build**: `npm run build` (Vite production build to `dist/`)
4. **Start**: `npm run start` which runs `node server.mjs`
5. **Restart policy**: `ON_FAILURE` with max 10 retries (from `railway.json`)

## Verify Deployment

### 1. Check build logs

In the Railway dashboard, open the deployment and verify:
- `npm ci` completes without errors
- `npm run build` succeeds (Vite outputs file sizes)
- No TypeScript errors

### 2. Check runtime logs

After the service starts, look for these log lines:

```
Astro-Noctum listening on port <PORT>
BAFE public  → https://bafe.vercel.app
[stripe] initialized (TEST mode)          # only if Stripe vars are set
```

Warnings about optional env vars are expected and non-fatal:
```
[server] Optional env var not set: GEMINI_API_KEY (some features may be degraded)
```

### 3. Smoke-test endpoints

```bash
# App loads (serves index.html for SPA routes)
curl -s -o /dev/null -w "%{http_code}" https://<your-domain>/

# BAFE proxy is reachable (returns calculation or error JSON, not 502)
curl -s https://<your-domain>/api/calculate/western -X POST \
  -H "Content-Type: application/json" \
  -d '{}' | head -c 200

# Static assets are served with cache headers
curl -sI https://<your-domain>/assets/ | grep cache-control
```

### 4. Verify in browser

- Load the app URL; confirm the splash screen and auth gate render
- Open DevTools Network tab; confirm no 5xx errors on API calls
- If Stripe is configured, verify the premium gate does not show a 503

## Rollback Procedure

### Via Railway dashboard

1. Open the service in the Railway dashboard
2. Go to **Deployments**
3. Find the last known-good deployment
4. Click the three-dot menu and select **Rollback**

### Via CLI

```bash
# List recent deployments
railway status

# Redeploy a previous commit
git revert HEAD
git push origin main
```

### Emergency: remove latest deploy

If the latest deploy is crashing in a loop (respecting the 10-retry cap), rollback via the dashboard is the fastest path. Do not force-push to main.

## Troubleshooting

### Snapshot creation fails (`Failed to create snapshot`)

**Symptom**: Railway deploy stops early with `Failed to create snapshot`.

**Likely causes in this repo**:
1. Build/runtime image too large (full devDependencies + large static assets)
2. Deployment context contains duplicate ambient audio assets

**Fixes now in place**:
- `nixpacks.toml` prunes devDependencies after `npm run build` (`npm prune --omit=dev`)
- Duplicate `public/ambiente/bazodiac/*.mp3` copies were removed and playlist references were normalized

**If this happens again**:
1. Check repository payload size: `du -sh public/ambiente node_modules .git`
2. Verify only required ambient tracks are shipped in `public/ambiente/bazodiac/`
3. Redeploy after pruning oversized assets or moving rarely-used media to external object storage

### BAFE API unreachable

**Symptom**: `/api/calculate/*` returns 502 or timeout; logs show `ENETUNREACH` or `ECONNREFUSED`.

**Cause**: Railway internal networking (IPv6) to BAFE is flaky, or BAFE itself is down.

**Fix**:
1. Check if BAFE is reachable from outside: `curl https://bafe.vercel.app/health`
2. If BAFE is up but internal URL fails, remove `BAFE_INTERNAL_URL` so the server falls back to the public URL
3. The app degrades gracefully -- dashboard shows "--" for unavailable data

### Supabase connection errors

**Symptom**: Auth fails, profiles not loading, 500 errors on protected routes.

**Fix**:
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct in Railway variables
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set (these are baked into the build -- a redeploy is needed if changed)
3. Check Supabase dashboard for service status or quota limits

### Stripe not configured (503 on checkout)

**Symptom**: Premium checkout returns `{"error": "Stripe is not configured"}` with HTTP 503.

**Cause**: `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID` not set. This is expected behavior -- Stripe is optional at runtime.

**Fix**: Set all three Stripe variables (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`) in Railway and redeploy. Verify log line: `[stripe] initialized (TEST mode)` or `(LIVE mode)`.

### Build fails on `npm ci`

**Symptom**: Nixpacks install phase errors out.

**Fix**:
1. Verify `package-lock.json` is committed and in sync with `package.json`
2. Run `npm ci` locally to reproduce
3. Check for Node version mismatches -- Nixpacks uses `nodejs_20` (latest 20.x), local uses 20.19.0

### VITE_ variables not taking effect

**Symptom**: Client-side features broken despite correct variable values in Railway.

**Cause**: `VITE_` prefixed variables are embedded at build time, not runtime.

**Fix**: After changing any `VITE_*` variable, trigger a new deployment (redeploy or push). Simply restarting the service is not sufficient.

### Server crash loop (10 retries exhausted)

**Symptom**: Service shows as crashed after 10 restart attempts.

**Fix**:
1. Check deploy logs for the crash reason (usually a missing required env var or bad import)
2. Fix the root cause
3. Rollback to a known-good deployment while investigating
