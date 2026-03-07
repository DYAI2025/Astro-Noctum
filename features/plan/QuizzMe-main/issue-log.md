# Issue Log

## 2026-01-01 Authentication & Astro Onboarding Review

### Findings
- **Repeated auth checks & profile fetch loops**: Both the character gate (`src/app/(astro)/character/page.tsx`) and the astro profile hook (`src/hooks/useAstroProfile.ts`) created a new Supabase client on every render. Because those fresh instances were part of effect dependencies, the auth/profile checks re-ran indefinitely and could cause visible loading flicker or redundant Supabase traffic.
- **Onboarding without a session**: The astro onboarding page (`src/app/onboarding/astro/page.tsx`) allowed unauthenticated access. Submissions in that state failed with "User not authenticated" errors, leaving users without guidance or a redirect. The expected flow requires a valid session before collecting birth data.

### Resolutions
- **Memoized Supabase clients** in both the character page and the profile hook to stabilize dependencies and eliminate render-triggered auth/profile re-queries.
- **Session gate on onboarding** that checks `supabase.auth.getSession()` and redirects to `/login` when missing, showing a spinner while verifying. This prevents unauthenticated submissions and keeps the flow aligned with the magic-link login.
