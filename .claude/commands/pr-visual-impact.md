---
description: Given an uncommitted diff / branch / PR, produce a user-facing impact map — what WILL change visually on Bazodiac UIs, what WON'T, and which scenarios to manually test post-deploy. Separates backend-pipe changes from what the user actually sees.
allowed-tools: Bash, Read, Grep, Glob
---

## Context

Bazodiac has a deep pipeline: Backend (Supabase persistence + server.mjs endpoints + FuFirE + Superglue worker) → Frontend state (`useAstroProfile`, `useSignaturSignal`, `useFirstRunDaily`, etc.) → UI surfaces (Dashboard, Signatur-Page 2D/3D, Onboarding, Daily-Chart-Hero, Vibes, Weekly Insights).

A backend fix can have **zero visible effect** in some parts of the UI (because a prior commit already decoupled them) and **strong effect** elsewhere. Same diff, different visible symptoms. Test-green + typecheck-green don't prove user-visible differentiation.

Example 2026-04-18/19: soulprint-persist fix (upsert in `/api/experience/bootstrap`) visibly changed Dashboard gauges / Daily Pulse / Vibes — but did NOT change the 2D Cymatics (BaZi-driven, independent of soulprint_sectors) and did NOT change the 3D Sphere (already decoupled per commit `894bb63`). Skill captures this mapping so Ben's manual verification expectations match reality.

## Your Task

Given an input (uncommitted diff, current branch vs. main, or a PR number), produce:

1. A table of **UI-surface → data-path → impact → test-scenario**
2. A **"won't see any change"** section calling out surfaces that seem related but aren't
3. Optional **post-deploy query** recommendations (via `/prod-data-triage`)
4. Optional **deploy-order hint** if the diff couples multiple layers

### Steps

1. **Scope input.** Determine what to analyse:
   - No arg → uncommitted (`git diff` + `git status --short`) + current branch commits (`git log main..HEAD --oneline`)
   - `#<num>` → `gh pr view <num> --json title,body,files,headRefName` + `gh pr diff <num>`
   - Branch name → `git diff main...<branch> --stat` + `git diff main...<branch>`

2. **Read all changed source files.** For each modified `.ts`/`.tsx`/`.mjs`/`.js` touched by the diff, read the actual change with enough surrounding context to understand what it DOES. Specifically:
   - `server.mjs` → which endpoint, which column written/read, which response field
   - React components → which visible element, conditional rendering, state
   - Lib/utility → trace callers via `grep -rn "<export>"` to see where the effect lands
   - CSS / inline-style → layout, aspect-ratio, container sizes

3. **Trace data flow.** For each data change, identify which frontend hook/component consumes it. Bazodiac-specific known paths (verify with grep before citing):

   | Data write | Frontend consumer(s) | UI surface(s) |
   |------------|---------------------|---------------|
   | `astro_profiles.soulprint_sectors` | `useAstroProfile` → `effectiveSoulprint` | InfluenceGauges, DayModeModal, Vibes prompts |
   | `astro_profiles.astro_json.bazi.pillars` | `FuRingPage` → `baziToChladniParams` | 2D Cymatics (chladni m,n,α,β) |
   | BaZi + Wu-Xing weights | `signatur-3d/planets.ts` (decoupled 2026-04-18 via commit `894bb63`) | 3D Sphere pole-weights |
   | `astro_profiles.astro_json.western` | `useAstroProfile` → zodiac-sign fields | Dashboard identity cards, Daily Chart Hero header |
   | `/api/experience/daily` response | `useFirstRunDaily` | Daily Chart Hero content, Coherence percentage |
   | `/api/transit-state` response | `useSignaturSignal` | Signatur-Page live pulses, 3D Sphere trail intensities |

   If the diff touches something outside this list, trace it manually with Grep.

4. **Classify per-surface impact**:
   - ✅ **Will change**: diff touches a writer of data that feeds this surface
   - ❌ **Won't change**: diff is elsewhere OR the surface is already decoupled from this data (cite the decoupling commit)
   - ⚠️ **Indirect**: diff enables a side-effect fix (e.g. BUG-17/18/19 chain from soulprint null → non-null)

5. **Concrete test scenarios** for each ✅/⚠️ row:
   - Which page (`/dashboard`, `/signatur`, `/onboarding`, etc.)
   - Which action (fresh onboard, existing login, hover, 2D↔3D toggle, quiz complete)
   - Which visual element to check (gauges > 0, text not empty, distinct pattern between 2 test users)
   - Which DB query to run post-deploy via `/prod-data-triage` for regression confirmation

6. **Honest "won't see any change" section.** Ben will naturally expect the whole Signatur UI to react to a soulprint change — but in today's code that's not true. Call these out explicitly, with the commit SHA that decoupled them, so the absence of visual change isn't mistaken for a failed deploy.

7. **Deploy-order note** (only if relevant): e.g. "Fix must deploy BEFORE backfill, otherwise Superglue-worker re-NULLs the fixed column on its next write". Omit this section if there's no ordering concern.

### Output Format

```markdown
## Visual Impact — <PR title or branch name>

### UI-Impact-Tabelle

| UI-Ort | Datenweg | Berührt? | Manuell testen |
|--------|---------|----------|----------------|
| Dashboard InfluenceGauges | `soulprint_sectors` → `effectiveSoulprint` → Gauge-% | ✅ direkt | Login, Dashboard, Mars/Venus/Jupiter-Gauges müssen Werte > 0 zeigen (vorher 0) |
| Daily Pulse Modal | `soulprint_sectors` + Transit → Gemini-Prompt | ⚠️ indirekt | Nach Mitternacht ersten Login, DayModeModal öffnen, Text user-spezifischer |
| 3D Sphere | `signatur-3d/planets.ts` (BaZi+Wu-Xing, decoupled `894bb63`) | ❌ unverändert | — |

### Was sich NICHT ändert (wichtig — sonst falsche Abnahmeerwartung)

- **2D Cymatics Signatur**: BaZi-gesteuert via `baziToChladniParams`, kein Soulprint-Input. `(m, n)` pre/post identisch sofern BaZi-Pillars gleich bleiben.
- **3D Sphere Pole-Dominanz**: seit Commit `894bb63` decoupled von `soulprint_sectors`. Pole-Weights aus Rulership-Matrix direkt.

### Post-Deploy-Queries (via /prod-data-triage)

```sql
-- Regression-Check nach 1h prod-Traffic
SELECT COUNT(*) FROM astro_profiles WHERE soulprint_sectors IS NULL;
-- Expected: 0 (vor dem Fix: 50 = 100%)
```

### Deploy-Reihenfolge

[Nur wenn relevant. Z.B. "Fix deployen → Railway grün verifizieren → backfill --apply → Integrationstest"]
```

### Guardrails

- **Don't overstate impact.** If the diff is a pure refactor (extract helper, rename, format-only), "Was sich ändert" may be empty and that's the correct honest verdict. Don't fabricate expected effects.
- **Don't rely on test-green as proof of user-visible differentiation.** Tests verify contracts and shapes; they don't verify that user A and user B see different things on screen.
- **Flag decoupled paths explicitly.** If the diff touches `astro_profiles.X` but a prior commit already decoupled the relevant frontend consumer from `astro_profiles.X`, say so with the decoupling-commit SHA. This prevents Ben from expecting changes that can't happen.
- **"Nothing changed visually"** is first-class output, not a skill failure. Many PRs are backend/refactor/CI-only and honestly have no user-visible effect.
- **If diff is large (>20 files) or crosses backend+frontend+migration+docs**, ask user whether to summarise at file-category level first or go row-by-row.
- **Don't infer paths — verify.** Cite a data-flow path only after grep'ing for the actual consumers. The Bazodiac codebase has had several decouplings (V1→V2→V3 removed, 3D planets decoupled, soulprint fallback frontend-side) — the landscape shifts. Verify each claim.

---
*Generated by /claude-reflect:reflect-skills from 1 explicit + 3 implicit session-d6551302 instances (2026-04-18/19): "welche Aspekte sollten anders sein in dieser Version?" + follow-up clarifications when test-green didn't match user-visible reality.*
