# Repository Guidelines

## Project Structure & Module Organization
`src/` hosts all runtime code: `App.tsx` wires authentication, chart generation, and Supabase persistence; `components/`, `contexts/`, `hooks/`, `services/`, and `lib/` keep UI, auth, ambient audio, API helpers, and utilities separated. Global styling sits in `src/index.css`. Static assets and widget scripts stay in `public/`, brand collateral in `media/`, and builds land in `dist/`. `server.mjs` is the Express entrypoint used in Railway/preview to serve the bundle, while `supabase-schema.sql`, `nixpacks.toml`, and `railway.json` document infra expectations.

## Build, Test, and Development Commands
- `npm install` — install dependencies (Node 20.19+ is required).
- `npm run dev` — start Vite on `0.0.0.0:3000` for local UX work.
- `npm run build` — produce the optimized `dist/` bundle (also run in CI).
- `npm run preview` — serve the build locally to mimic the production server.
- `npm run start` — launch `server.mjs`; Railway uses this command.
- `npm run lint` — TypeScript `tsc --noEmit` type-check; run before commits.
- `npm run clean` — remove `dist/` to avoid stale artifacts before rebuilding.

## Coding Style & Naming Conventions
Stick to TypeScript + React functional components, 2-space indentation, and ES modules. Use `PascalCase` for components (`BirthForm`), `camelCase` for hooks/utilities (`useAmbientePlayer`), and suffix context providers with `Context`. Favor Tailwind utility classes and colocated component styles instead of global overrides. Inline comments should explain intent (e.g., `// T-001` checkpoints) rather than restating code.

## Testing Guidelines
There is no dedicated test runner yet, so lean on `npm run lint` for structural safety and manual regression passes. Before opening a PR, run through the reading flow: submit birth data, regenerate interpretations, test Supabase persistence (with the provided `supabase-schema.sql`), and verify the ElevenLabs widget loads.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit style (`feat:`, `fix:`, `chore:`). Keep commits focused and reference issue IDs when applicable. PRs should summarize UX changes, note schema or `.env` impacts, attach screenshots of UI updates, and include links to Supabase/Railway logs if a backend change was exercised. Always describe manual test coverage in the PR body.

## Security & Configuration Tips
Never commit secrets—copy `.env.example` to `.env.local` for local work and rely on Railway variables (`VITE_GEMINI_API_KEY`, `VITE_BAFE_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ELEVENLABS_AGENT_ID`). Validate that Supabase policies in `supabase-schema.sql` stay aligned with any new tables. When contributing AI or API integrations, note rate limits and sanitize any logged payloads before pushing.
