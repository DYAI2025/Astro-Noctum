# Railway Deployment Guide

This project is configured to be deployed on [Railway](https://railway.app/) using Nixpacks.

## Prerequisites

1.  A Railway account.
2.  A GitHub repository with this code.

## Configuration

The project already contains the necessary configuration files:
- `railway.json`: Specifies the build and deploy commands.
- `nixpacks.toml`: Defines the environment (Node.js 20) and installation steps.
- `server.mjs`: Production server that serves the Vite build and proxies API requests.

## Environment Variables

You **must** set the following environment variables in the Railway dashboard for the application to start and function correctly:

### Required (Server-side)
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for server-side operations).
- `STRIPE_SECRET_KEY`: Your Stripe secret key.
- `STRIPE_PRICE_ID`: The Stripe Price ID for the premium upgrade.
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret.

### Required (Build-time for Frontend)
- `VITE_SUPABASE_URL`: Same as `SUPABASE_URL`.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
- `VITE_BAFE_BASE_URL`: The URL of your BAFE API instance (e.g., `https://bafe-production.up.railway.app`).
- `VITE_ELEVENLABS_AGENT_ID`: Your ElevenLabs voice agent ID.

### Optional
- `GEMINI_API_KEY`: Required for AI horoscope interpretations.
- `ELEVENLABS_TOOL_SECRET`: Protects server-side tool endpoints.
- `APP_URL`: The public URL of your application (e.g., `https://your-app.up.railway.app`). If not set, some links may default to `bazodiac.com`.
- `VITE_GOOGLE_PLACES_API_KEY`: Enables city autocomplete in the birth form.

## Deployment Steps

1.  Connect your GitHub repository to a new project on Railway.
2.  Add the environment variables listed above in the **Variables** tab.
3.  Railway will automatically detect the `railway.json` and start the build process.
4.  Once the build is complete, your application will be live.

## Troubleshooting

- **Build Failures:** Check the build logs. Ensure `npm run build` succeeds locally.
- **Server Won't Start:** Check the deployment logs. Usually, this is due to missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`.
- **API Errors:** Ensure `VITE_BAFE_BASE_URL` is correctly set and reachable.
