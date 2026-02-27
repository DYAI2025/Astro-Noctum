<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Astro-Noctum (Bazodiac)

## Local Run

1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and fill all required values.
3. Start development:
   `npm run dev`

## Runtime Requirements

- Node.js **20.19+** (defined in `package.json` `engines` and `.nvmrc`)
- npm 10+

This project intentionally avoids native Node build dependencies during install, so CI/deploy installs remain deterministic without `node-gyp` toolchain requirements.

## Railway Deployment

This repo is prepared for Railway with:
- `nixpacks.toml` to pin Nixpacks runtime to Node 20 and avoid engine drift
- `railway.json` build/deploy commands
- production server (`server.mjs`) to serve `dist/`
- startup command `npm run start`

### Required Railway Variables
- `VITE_GEMINI_API_KEY`
- `VITE_BAFE_BASE_URL`
- `VITE_SUPABASE_URL` (default: `https://ykoijifgweoapitabgxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ELEVENLABS_AGENT_ID` (default Levi Bazi agent)

## Supabase Database Connection

The app persists completed readings into Supabase via REST (`/rest/v1/readings`) from `src/services/supabase.ts`.

Example table schema:

```sql
create table if not exists public.readings (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  birth_input jsonb not null,
  api_data jsonb not null,
  interpretation text not null,
  api_issues jsonb not null default '[]'::jsonb
);

alter table public.readings enable row level security;

create policy "insert_readings_anon"
on public.readings
for insert
to anon
with check (true);
```

## ElevenLabs Voice Agent

The dashboard embeds Levi Bazi via:

```html
<elevenlabs-convai agent-id="agent_1801kje0zqc8e4b89swbt7wekawv"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```
