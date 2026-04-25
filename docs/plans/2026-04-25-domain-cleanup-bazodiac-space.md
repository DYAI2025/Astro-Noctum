# Domain Cleanup: bazodiac.com → bazodiac.space Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate references to the non-existent host `bazodiac.com` from the codebase and replace with the actual production domain `bazodiac.space` (verified via `CNAME` and live HTTP probe `HTTP 401` on `https://bazodiac.space/api/profile/{uuid}`). Replace 6 references to the Railway-internal URL `astro-noctum-production.up.railway.app` with the public custom domain `bazodiac.space`. Result: Repo, SEO assets, marketing pages, ElevenLabs tool configs, and impressum all point at the host the user actually owns.

**Architecture:** Three phases gated by risk. Phase A is bulk-replace in inert docs and runbooks (no user impact, no live path). Phase B is per-file inspection of templates, code, and integration configs. Phase C is per-file inspection of user-facing and SEO-critical assets — every file in this phase is reviewed individually because canonical URLs, Open Graph tags, sitemap entries, and impressum text are not safely sweepable. A pre-flight Task 0 verifies baseline state and surfaces one user-decision blocker (the `contact@bazodiac.com` email address in the legal footer — DSGVO-relevant).

**Tech Stack:** Bash (grep, sed), Git, Read/Edit/Write tools. No code execution required for Phase A. Phase B/C touches React TSX, HTML, YAML, JSON. Verification leans on `grep` post-edit and `npm run typecheck` for the one TSX edit in Task 12.

**Worktree:** This plan should be executed in a dedicated git worktree (created via the using-git-worktrees skill) so the cleanup is isolated and easily revertible.

---

## Pre-flight

### Task 0: Verify baseline state

**Files:** None (read-only verification).

**Step 1: Confirm CNAME is the source of truth**

Run from repo root `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum`:

```bash
cat CNAME
```

Expected output: `bazodiac.space` (single line).

If anything else → STOP, the assumed production domain is not what's deployed; re-confirm with PO before proceeding.

**Step 2: Confirm live endpoint reachability**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://bazodiac.space/api/profile/00000000-0000-0000-0000-000000000000"
curl -s -o /dev/null -w "%{http_code}\n" "https://bazodiac.com/api/profile/00000000-0000-0000-0000-000000000000"
```

Expected:
- `bazodiac.space` → `401` (route is live, auth handler engaged)
- `bazodiac.com` → `000` (no DNS / unreachable — proves it really is a ghost host)

If `bazodiac.com` returns anything other than `000` → STOP, the assumption that the host doesn't exist is wrong; investigate.

**Step 3: Confirm baseline match counts**

```bash
grep -rln "bazodiac\.com" . | wc -l
grep -rln "astro-noctum-production\.up\.railway\.app" . | wc -l
grep -rln "@bazodiac\.com" . | wc -l
```

Expected:
- 25 files with `bazodiac.com`
- 6 files with `astro-noctum-production.up.railway.app`
- 1 file (`src/components/LegalFooter.tsx`) with `@bazodiac.com`

If counts differ → STOP, re-scope the plan against the new state.

**Step 4: Confirm worktree is on a clean dedicated branch**

```bash
git status
git rev-parse --abbrev-ref HEAD
```

Expected: branch name like `cleanup/domain-bazodiac-space`, working tree clean. If on `main` or working tree dirty → create worktree first.

---

### Task 0a: BLOCKER — resolve `contact@bazodiac.com` email decision

**Files:** None (decision task, no code change yet).

**Why this blocks:** The string `contact@bazodiac.com` appears 6× in `src/components/LegalFooter.tsx` (impressum lines, DSGVO-Auskunftsrecht text, both German and English versions). Since `bazodiac.com` does not resolve, this email cannot receive mail. That is a DSGVO compliance gap (Art. 13 GDPR requires a working data-controller contact) and an impressum-required contact under §5 TMG.

**Step 1: Ask the PO which option to apply**

Three options, only one of which can proceed without external action:

- **Option 1 — Migrate to `contact@bazodiac.space`**: Requires PO to set up the inbox at the domain registrar / mail provider for `bazodiac.space`. Plan applies trivial replace once inbox is confirmed live.
- **Option 2 — Use a different working email** (e.g. existing `ben@…` or a forwarder): PO supplies the address; plan applies it.
- **Option 3 — Defer**: Skip Task 12 in this plan, file a separate ticket for the legal-text update, ship Phase A+B+rest-of-Phase-C without the LegalFooter change.

**Step 2: Record decision in the plan**

Once PO answers, append to this section:
```
DECISION (YYYY-MM-DD): Option N — <new email or "defer">
```

If Option 3 → mark Task 12 as `SKIPPED` and proceed.

If Option 1 or 2 → record the new email string and continue. Do not start Phase A until the decision is on file (Phase A doesn't touch the email but the plan-as-a-whole should not ship a half-fixed legal footer).

---

## Phase A — Inert documentation (low risk, batch-safe)

Phase-A files contain only descriptive references to the domain (URLs in markdown, runbook tables, SETUP guides). No user-visible impact, no live path. One commit at end of phase.

### Task 1: Replace `bazodiac.com` in 8 docs/plans/runbooks

**Files:**
- Modify: `3-code/tasks.md`
- Modify: `docs/plans/2026-04-09-stripe-webhook-merge-and-match-auth.md`
- Modify: `docs/plans/2026-03-24-stripe-subscription.md`
- Modify: `docs/plans/2026-03-05-bazodiac-execution-plan.md`
- Modify: `docs/plans/Bazodiac 14 Tage Execution Plan.txt`
- Modify: `docs/LEVI_SYSTEM_PROMPT_V2.md`
- Modify: `4-deploy/runbooks/railway-deploy.md`
- Modify: `RAILWAY_DEPLOYMENT.md`

**Step 1: Per file — read the matching lines first**

For each file, run:
```bash
grep -n "bazodiac\.com" <file>
```

Confirm every match is a URL like `https://bazodiac.com/…` or a plaintext domain reference. **If any match contains `@bazodiac.com`** → that file goes to Phase B/C, not here.

Expected: All matches are URL-style references, no emails.

**Step 2: Per file — apply Edit with replace_all**

For each file, use the Edit tool:
```
old_string: bazodiac.com
new_string: bazodiac.space
replace_all: true
```

**Step 3: Per file — verify zero remaining matches**

```bash
grep -c "bazodiac\.com" <file>
```

Expected: `0`.

**Step 4: After all 8 files done — global verify**

```bash
grep -rln "bazodiac\.com" 3-code/tasks.md docs/plans/ docs/LEVI_SYSTEM_PROMPT_V2.md 4-deploy/runbooks/ RAILWAY_DEPLOYMENT.md
```

Expected: empty output.

**Step 5: Commit**

```bash
git add 3-code/tasks.md docs/plans/ docs/LEVI_SYSTEM_PROMPT_V2.md 4-deploy/runbooks/railway-deploy.md RAILWAY_DEPLOYMENT.md
git commit -m "docs: replace ghost-host bazodiac.com with bazodiac.space in plans/runbooks"
```

---

### Task 2: Replace `astro-noctum-production.up.railway.app` in 3 docs/setup files

**Files:**
- Modify: `SETUP-ELEVENLABS.txt`
- Modify: `.claude/commands/verify-deployed.md`
- Modify: `.claude/commands/elevenlabs-debug.md`

**Step 1: Per file — read matching lines**

```bash
grep -n "astro-noctum-production\.up\.railway\.app" <file>
```

Expected: URLs of the form `https://astro-noctum-production.up.railway.app/api/...`

**Step 2: Per file — Edit with replace_all**

```
old_string: astro-noctum-production.up.railway.app
new_string: bazodiac.space
replace_all: true
```

**Step 3: Per file — verify zero matches**

```bash
grep -c "astro-noctum-production" <file>
```

Expected: `0`.

**Step 4: Commit**

```bash
git add SETUP-ELEVENLABS.txt .claude/commands/verify-deployed.md .claude/commands/elevenlabs-debug.md
git commit -m "docs: point ElevenLabs setup/debug docs at bazodiac.space (not Railway-internal URL)"
```

---

## Phase B — Templates, code, integration configs (medium risk, per-file)

Phase-B files affect developer onboarding, ElevenLabs reference configs, and external API headers. Each file is touched in isolation, with a separate commit, so any single one can be reverted.

### Task 3: `.env.example` — fix APP_URL default

**Files:**
- Modify: `.env.example:31`

**Step 1: Read context**

```bash
grep -n "APP_URL" .env.example
```

Expected: line 31 shows `APP_URL=https://bazodiac.com`.

**Step 2: Edit**

```
old_string: APP_URL=https://bazodiac.com
new_string: APP_URL=https://bazodiac.space
```

**Step 3: Verify**

```bash
grep "APP_URL" .env.example
```

Expected: `APP_URL=https://bazodiac.space`.

**Step 4: Commit**

```bash
git add .env.example
git commit -m "config: correct APP_URL default in .env.example to bazodiac.space"
```

---

### Task 4: `elevenlabs-tool.json` and `elevenlabs-tool-save-conversation.json`

**Files:**
- Modify: `elevenlabs-tool.json`
- Modify: `elevenlabs-tool-save-conversation.json`

**Why both at once:** They're the reference Tool-Configs for the ElevenLabs Dashboard. Source-of-truth lives in the Dashboard, but new devs configure from these JSONs. Both must point at the public domain.

**Step 1: Per file — read full content**

```bash
cat elevenlabs-tool.json
cat elevenlabs-tool-save-conversation.json
```

Note exact `url` field values — they include `astro-noctum-production.up.railway.app/api/...` paths.

**Step 2: Per file — Edit the URL**

```
old_string: https://astro-noctum-production.up.railway.app
new_string: https://bazodiac.space
replace_all: true
```

**Step 3: Per file — verify the JSON still parses**

```bash
node -e "JSON.parse(require('fs').readFileSync('elevenlabs-tool.json', 'utf-8')); console.log('OK')"
node -e "JSON.parse(require('fs').readFileSync('elevenlabs-tool-save-conversation.json', 'utf-8')); console.log('OK')"
```

Expected: `OK` for both.

**Step 4: Verify URL field**

```bash
grep '"url"' elevenlabs-tool.json elevenlabs-tool-save-conversation.json
```

Expected: every URL contains `bazodiac.space`, none contain `astro-noctum-production`.

**Step 5: Commit**

```bash
git add elevenlabs-tool.json elevenlabs-tool-save-conversation.json
git commit -m "config: point ElevenLabs reference tool configs at bazodiac.space"
```

---

### Task 5: `server/ai-router.mjs` — code change (medium risk)

**Files:**
- Modify: `server/ai-router.mjs`

**Why this is medium risk:** It's actual server code, not docs. The match could be a fallback URL, a CORS allowlist entry, or a comment.

**Step 1: Read the matching lines and surrounding context**

```bash
grep -n "astro-noctum-production" server/ai-router.mjs
```

For each match, also read 5 lines above and below:
```bash
grep -n -B 5 -A 5 "astro-noctum-production" server/ai-router.mjs
```

**Step 2: Classify each match**

For each match, decide:
- **Comment / docstring** → safe to replace
- **String literal in fallback / default** → replace with `https://bazodiac.space`, but also check whether the production runtime sets an env var that supersedes this (search for `process.env.<name>` near the match)
- **CORS allowlist** → replace, but also verify the new `bazodiac.space` origin is allowed elsewhere (avoid breaking CORS for the working domain)

If any match is in a code path that depends on Railway-internal routing (e.g. service-to-service inside Railway), DO NOT replace — flag for PO discussion.

**Step 3: Apply Edit per classification**

For safe matches:
```
old_string: <full line as read>
new_string: <same line with bazodiac.space substituted>
```

Use replace_all only if all matches in the file are safe and identical.

**Step 4: Verify no syntax break**

```bash
node --check server/ai-router.mjs
```

Expected: no output (success).

**Step 5: Verify behaviour by reading the diff**

```bash
git diff server/ai-router.mjs
```

Confirm the diff matches your intent.

**Step 6: Commit**

```bash
git add server/ai-router.mjs
git commit -m "fix(server): point ai-router fallback URL at bazodiac.space (was Railway-internal)"
```

---

### Task 6: `docs/bazodiac-zeroclaw.yaml` — HTTP-Referer

**Files:**
- Modify: `docs/bazodiac-zeroclaw.yaml:30`

**Why care:** The match is in an `HTTP-Referer` header for what looks like an OpenRouter / LLM API config. External APIs sometimes rate-limit by Referer. Wrong Referer → quota leakage or attribution bug.

**Step 1: Read context**

```bash
grep -n -B 3 -A 3 "bazodiac\.com" docs/bazodiac-zeroclaw.yaml
```

**Step 2: Edit**

```
old_string: HTTP-Referer: "https://bazodiac.com"
new_string: HTTP-Referer: "https://bazodiac.space"
```

**Step 3: Verify YAML parses**

```bash
python3 -c "import yaml; yaml.safe_load(open('docs/bazodiac-zeroclaw.yaml'))" && echo OK
```

Expected: `OK`.

**Step 4: Commit**

```bash
git add docs/bazodiac-zeroclaw.yaml
git commit -m "config: fix HTTP-Referer in zeroclaw.yaml to bazodiac.space"
```

---

### Task 7: `docs/bazodiac-clawteam-config.json` — OR_SITE_URL

**Files:**
- Modify: `docs/bazodiac-clawteam-config.json:35`

**Step 1: Read context**

```bash
grep -n -B 3 -A 3 "bazodiac\.com" docs/bazodiac-clawteam-config.json
```

Expected: a JSON entry like `"OR_SITE_URL": "https://bazodiac.com"`.

**Step 2: Edit**

```
old_string: "OR_SITE_URL": "https://bazodiac.com"
new_string: "OR_SITE_URL": "https://bazodiac.space"
```

**Step 3: Verify JSON parses**

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/bazodiac-clawteam-config.json', 'utf-8')); console.log('OK')"
```

Expected: `OK`.

**Step 4: Commit**

```bash
git add docs/bazodiac-clawteam-config.json
git commit -m "config: fix OR_SITE_URL in clawteam-config to bazodiac.space"
```

---

## Phase C — User-facing & SEO-critical (high risk, per-file with full review)

Every file in Phase C is read fully before editing. Each gets its own commit. No batch-replace across files.

### Task 8: `index.html` — Open Graph + JSON-LD

**Files:**
- Modify: `index.html` (matches at lines 23, 24, 40 per baseline grep)

**Step 1: Read full file**

```bash
cat index.html
```

Note every occurrence of `bazodiac.com`. Confirm they are:
- `<meta property="og:url" content="https://bazodiac.com" />`
- `<meta property="og:image" content="https://bazodiac.com/og-image.jpg" />`
- JSON-LD `"url": "https://bazodiac.com"`

**Step 2: Edit with replace_all**

```
old_string: bazodiac.com
new_string: bazodiac.space
replace_all: true
```

**Step 3: Verify**

```bash
grep -c "bazodiac\.com" index.html
grep "bazodiac\.space" index.html
```

Expected: `0` for `.com`, multiple matches for `.space`.

**Step 4: Verify HTML still well-formed**

Open file in editor or `head -50 index.html` and visually scan that quotes and brackets are intact.

**Step 5: Commit**

```bash
git add index.html
git commit -m "fix(seo): correct og:url, og:image, JSON-LD url to bazodiac.space in index.html"
```

---

### Task 9: `landing/index.html` — Canonical, hreflang, OG

**Files:**
- Modify: `landing/index.html` (matches at lines 9, 10, 11, 12, 18)

**Step 1: Read full file**

```bash
cat landing/index.html
```

Confirm matches are:
- `<link rel="canonical" href="https://bazodiac.com/">`
- `<link rel="alternate" hreflang="de" href="https://bazodiac.com/">`
- `<link rel="alternate" hreflang="en" href="https://bazodiac.com/en/">`
- `<link rel="alternate" hreflang="x-default" href="https://bazodiac.com/">`
- `<meta property="og:url" content="https://bazodiac.com/">`

**Step 2: Edit with replace_all**

```
old_string: bazodiac.com
new_string: bazodiac.space
replace_all: true
```

**Step 3: Verify**

```bash
grep -c "bazodiac\.com" landing/index.html
```

Expected: `0`.

**Step 4: Commit**

```bash
git add landing/index.html
git commit -m "fix(seo): correct canonical, hreflang, og:url to bazodiac.space in landing page"
```

---

### Task 10: `media/sitemap.xml`

**Files:**
- Modify: `media/sitemap.xml`

**Step 1: Read full file**

```bash
cat media/sitemap.xml
```

Note: every `<loc>` URL must be updated.

**Step 2: Edit with replace_all**

```
old_string: bazodiac.com
new_string: bazodiac.space
replace_all: true
```

**Step 3: Verify XML well-formed**

```bash
python3 -c "import xml.etree.ElementTree as ET; ET.parse('media/sitemap.xml'); print('OK')"
```

Expected: `OK`.

**Step 4: Verify all `<loc>` updated**

```bash
grep "<loc>" media/sitemap.xml
grep -c "bazodiac\.com" media/sitemap.xml
```

Expected: every loc points at `bazodiac.space`, `.com` count is `0`.

**Step 5: Commit**

```bash
git add media/sitemap.xml
git commit -m "fix(seo): update sitemap.xml to bazodiac.space"
```

---

### Task 11: `media/robots.txt`

**Files:**
- Modify: `media/robots.txt`

**Step 1: Read**

```bash
cat media/robots.txt
```

Expected: `Sitemap: https://bazodiac.com/sitemap.xml`.

**Step 2: Edit**

```
old_string: Sitemap: https://bazodiac.com/sitemap.xml
new_string: Sitemap: https://bazodiac.space/sitemap.xml
```

**Step 3: Verify**

```bash
cat media/robots.txt
```

Expected: Sitemap line points at `bazodiac.space`.

**Step 4: Commit**

```bash
git add media/robots.txt
git commit -m "fix(seo): update robots.txt sitemap pointer to bazodiac.space"
```

---

### Task 12: `src/components/LegalFooter.tsx` — DEPENDS ON Task 0a decision

**Files:**
- Modify: `src/components/LegalFooter.tsx`

**Pre-condition:** Task 0a must be resolved. If Option 3 (defer) chosen → SKIP this task.

**Step 1: Read full file**

```bash
cat src/components/LegalFooter.tsx
```

Note: 6 occurrences of `contact@bazodiac.com` across DE and EN impressum sections.

**Step 2: Edit based on Task 0a decision**

If Option 1 (`contact@bazodiac.space`):
```
old_string: contact@bazodiac.com
new_string: contact@bazodiac.space
replace_all: true
```

If Option 2 (different email, e.g. `<new-email>`):
```
old_string: contact@bazodiac.com
new_string: <new-email>
replace_all: true
```

**Step 3: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -20
```

Expected: no errors related to `LegalFooter.tsx`.

**Step 4: Run lint on the file**

```bash
npx eslint src/components/LegalFooter.tsx
```

Expected: no errors.

**Step 5: Verify**

```bash
grep -c "@bazodiac\.com" src/components/LegalFooter.tsx
```

Expected: `0`.

**Step 6: Commit**

```bash
git add src/components/LegalFooter.tsx
git commit -m "fix(legal): update impressum/DSGVO contact email to <new-email>"
```

---

### Task 13: 7 competitor-analysis Marketing pages

**Files:**
- Modify: `features/competitor-analysis/pages/vs-index.md`
- Modify: `features/competitor-analysis/pages/the-pattern-alternative.md`
- Modify: `features/competitor-analysis/pages/nebula-alternative.md`
- Modify: `features/competitor-analysis/pages/co-star-alternative.md`
- Modify: `features/competitor-analysis/pages/chani-alternative.md`
- Modify: `features/competitor-analysis/pages/bazodiac-vs-co-star.md`
- Modify: `features/competitor-analysis/pages/alternatives-index.md`

**Why per-file even though same pattern:** These are SEO-indexed marketing pages. Each is reviewed in case there's prose mentioning `bazodiac.com` that we *want* to keep (extremely unlikely, but cheap to verify). Same commit at the end.

**Step 1: Per file — read context of every match**

```bash
for f in features/competitor-analysis/pages/*.md; do
  echo "=== $f ==="
  grep -n -B 1 -A 1 "bazodiac\.com" "$f"
done
```

Confirm: every match is in a CTA link of the form `[Try Bazodiac Free →](https://bazodiac.com)`. If any match is prose ("Unlike bazodiac.com which …") → flag, do not replace blindly.

**Step 2: Per file — Edit with replace_all**

For each of the 7 files, run Edit with:
```
old_string: bazodiac.com
new_string: bazodiac.space
replace_all: true
```

**Step 3: Verify all clean**

```bash
grep -rln "bazodiac\.com" features/competitor-analysis/pages/
```

Expected: empty output.

**Step 4: Commit (single commit for all 7)**

```bash
git add features/competitor-analysis/pages/
git commit -m "fix(marketing): point all competitor-analysis CTA links at bazodiac.space"
```

---

### Task 14: `features/competitor-analysis/data/bazodiac.yaml`

**Files:**
- Modify: `features/competitor-analysis/data/bazodiac.yaml`

**Step 1: Read context**

```bash
grep -n -B 2 -A 2 "bazodiac\.com" features/competitor-analysis/data/bazodiac.yaml
```

**Step 2: Edit with replace_all**

```
old_string: bazodiac.com
new_string: bazodiac.space
replace_all: true
```

**Step 3: Verify YAML parses**

```bash
python3 -c "import yaml; yaml.safe_load(open('features/competitor-analysis/data/bazodiac.yaml'))" && echo OK
```

Expected: `OK`.

**Step 4: Commit**

```bash
git add features/competitor-analysis/data/bazodiac.yaml
git commit -m "fix(marketing): update bazodiac.yaml competitor data to bazodiac.space"
```

---

## Final verification

### Task 15: Full-repo grep — zero ghost-host references remain

**Files:** None (verification only).

**Step 1: Run global grep**

```bash
grep -rln "bazodiac\.com" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build
```

Expected: **empty output**, EXCEPT possibly:
- `3-code/mobile/.claude/homunculus/observations.jsonl` — append-only Claude Code log, do NOT modify
- This very plan document (`docs/plans/2026-04-25-domain-cleanup-bazodiac-space.md`) — historical record of the cleanup, references the old domain by design

If anything else matches → that file was missed; treat as a defect, fix it, re-run.

**Step 2: Same for Railway-internal URL**

```bash
grep -rln "astro-noctum-production\.up\.railway\.app" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build
```

Expected: empty output (or only this plan).

**Step 3: Sanity-check — bazodiac.space is widespread now**

```bash
grep -rln "bazodiac\.space" . --exclude-dir=node_modules --exclude-dir=.git | wc -l
```

Expected: ≥ 30 (the original CNAME plus all the replaced occurrences). If much lower → some replaces didn't land.

---

### Task 16: Build & typecheck

**Files:** None (verification only).

**Step 1: Run typecheck**

```bash
npm run typecheck 2>&1 | tail -20
```

Expected: no errors. If errors → likely Task 12 (`LegalFooter.tsx`) or Task 5 (`server/ai-router.mjs`); inspect the diff.

**Step 2: Run lint (if available)**

```bash
npx eslint . --quiet 2>&1 | tail -20
```

Expected: no new errors compared to pre-cleanup baseline.

**Step 3: If a build step exists**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds.

---

### Task 17: Final review and PR

**Files:** None (process step).

**Step 1: Review the full diff**

```bash
git log --oneline main..HEAD
git diff main..HEAD --stat
```

Expected: 14-15 commits, ~31 files changed, only domain-related diffs (no accidental edits).

**Step 2: Push and open PR**

```bash
git push origin <branch-name>
```

PR title: `cleanup: replace ghost-host bazodiac.com with bazodiac.space across repo`

PR description should include:
- Why: `bazodiac.com` does not resolve (verified `HTTP 000`); CNAME is `bazodiac.space`
- Scope: 31 files in 14 commits, phased low → med → high risk
- Verification: `grep` clean, typecheck pass, lint pass
- Out-of-scope follow-ups (file separately):
  - DNS / Google Search Console hygiene check on `bazodiac.com`
  - ElevenLabs Dashboard tool URLs need to be updated to `https://bazodiac.space/...` (this repo only fixes the reference JSONs, not the Dashboard which is the source of truth)
  - Stage 1 Superglue-Removal still pending separately

**Step 3: Request review from PO**

---

## Out-of-scope (do NOT attempt in this plan)

- **`3-code/mobile/.claude/homunculus/observations.jsonl`** — append-only Claude Code observation log. Not configuration. Do not edit.
- **ElevenLabs Dashboard** — the live tool configs live in the ElevenLabs UI, not in this repo. Updating them is a manual step the PO does after this PR merges. Do not try to script it.
- **DNS for `bazodiac.com`** — even if PO never owned the host, Google may have indexed it. Search Console cleanup, DNS-redirect setup if PO ever buys the .com later, etc. Separate ticket.
- **Stage 1 Superglue-Removal** — pending per memory note since 2026-04-18. Different scope, different plan.

---

## Risks & rollback

- **Rollback per file:** every task is its own commit, so `git revert <sha>` undoes one file group cleanly.
- **Phase A revert:** safe, only docs.
- **Phase B revert:** safe, but Task 5 (`server/ai-router.mjs`) deploys to Railway — revert the commit and redeploy if you discover a CORS/fallback regression.
- **Phase C revert:** Tasks 8-14 are user-visible. If SEO tooling alerts trigger after deploy (canonical mismatch warnings in Search Console), individual reverts are still cheap; SEO recovers within a crawl cycle.
- **Task 0a unresolved:** if PO never decides on the email, ship Phase A+B and the non-LegalFooter parts of Phase C; mark Task 12 as deferred and file a follow-up ticket explicitly noting DSGVO exposure.
