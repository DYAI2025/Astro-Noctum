# Aphorism Batch Extension (aph-0089..0121) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 33 new aphorisms (IDs `aph-0089` through `aph-0121` inclusive) to the prod repo's aphorism vault as `status: approved`, mapped from operator-supplied candidates into the validator-enforced schema, then regenerate `aphorisms.json` so the daily-pulse selection pool includes them.

**Architecture:** A single Python conversion script reads the stable candidate input file (committed at `docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md` in the scaffold repo), applies a deterministic value-mapping table to translate operator-vocabulary fields into validator-schema fields, and emits 33 schema-compliant `aph-NNNN.md` files into the prod repo. The build pipeline then runs unchanged. The constraint `CON-aphorisms-human-approved` is deprecated and replaced by `DEC-aphorism-batch-approval-bp-2026-05-14` which authorizes Ben to grant batch approval via the plan artifact itself.

**Tech Stack:** Python 3 (existing `validate_aphorisms.py`, `build_aphorisms.py` at `Astro-Noctum-prod/packages/voice/scripts/`). Markdown-with-YAML-frontmatter file format. Bash for orchestration.

---

## Repository Map

This plan touches **two repos**:

- **Scaffold** (`Astro-Noctum/`, current `pwd`) — owns: SDLC artifacts (`1-spec/`, `2-design/`, `3-code/`), decisions, plans, and the stable input copy at `docs/inputs/`. The plan file itself lives here.
- **Prod** (`Astro-Noctum-prod/`, sibling directory) — owns: aphorism markdown files, conversion script (to be created), validate/build pipelines, and `aphorisms.json` output.

Every file path below is annotated with its repo. Tasks run with `cwd` = scaffold repo unless otherwise stated.

---

## Inputs (Frozen At Plan Time)

**Operator-supplied candidate file:** `docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md` (scaffold). Copied verbatim from `~/Downloads/aphorismen_erweiterung_kandidaten_review.md` on 2026-05-14. Contains 33 ID-bearing entries (`aph-0089` through `aph-0121` inclusive) plus a `# Nicht übernommen / gesperrt` narrative section listing 3 topics that were discussed in conversation but never assigned IDs.

**Out-of-scope narrative entries (have no `aph-NNNN` header, never in the batch):**
- "Russell Brand – Grammatik/Sex-Zitat"
- "Dorothy Parker – Martini-Zitat"
- "Anke Engelke – Fehler-machen-Zitat"

These appear as `## <author-name>` headers in the input — the conversion script keys on `## aph-(\d{4})`, so they're naturally skipped without needing an explicit filter.

**Final batch size:** 33 entries (aph-0089 through aph-0121, contiguous).

**Baseline state (confirmed in Phase 0):**
- Existing review files: 21
- Existing approved entries in aphorisms.json: 0 (all current files are `status: draft`)

**Post-execution target:** 54 review files; 33 approved entries in aphorisms.json.

---

## Schema (Validator-Enforced)

From `Astro-Noctum-prod/packages/voice/scripts/validate_aphorisms.py` lines 5–11 — **all values outside these enums are rejected**:

| Field | Allowed values |
|---|---|
| `status` | `draft`, `review`, `approved`, `retired` |
| `attribution_status` | `verified`, `disputed`, `apocryphal`, `folkloric` |
| `copyright` | `PD`, `Zitatrecht`, `eigene-Übersetzung`, `lizenziert` |
| `mode_tags` items | `pulse`, `trace`, `spannung` |
| `element_affinity` items | `wasser`, `feuer`, `erde`, `holz`, `metall` |
| `figure_affinity` items | `sonne`, `mond`, `aszendent`, `day_master`, `jahrestier`, `wuxing_dom` |
| `season_affinity` items | `fruehling`, `sommer`, `herbst`, `winter` |
| `original_language` | `de`, `en`, `unknown` (or any other value → requires `## Original` blockquote) |

**Required fields** (`validate_aphorisms.py:79`): `id`, `status`, `author`, `original_language`, `copyright`, `attribution_status`, `mode_tags`, `tone_tags`, `word_count_de`, `word_count_en`, `quality_rating`, `cooldown_days`.

**Conditional requirements:**
- `attribution_note` required whenever `attribution_status != 'verified'`.
- `## Original` blockquote required whenever `original_language` is not in `{'de','en','unknown'}`.
- Filename stem must equal `id` (e.g., `aph-0089.md` must contain `id: "aph-0089"`).
- `word_count_de` / `word_count_en` must match `len(re.split(r'\s+', body.replace('—',' ').replace('–',' ').strip()))` for the respective `## DE` / `## EN` blockquotes.

---

## Value-Mapping Table (Candidate → Schema)

The conversion script MUST apply this exact table.

### `status`

| Candidate | Schema |
|---|---|
| any (`draft_review`, etc.) | `approved` |

Rationale: per operator batch-approval directive (see DEC-aphorism-batch-approval-bp-2026-05-14, Phase 1). The plan IS the operator's explicit approval artifact for these 30 specific IDs.

### `attribution_status`

| Candidate | Schema | Rationale |
|---|---|---|
| `verified` | `verified` | passthrough |
| `attributed_needs_source_check` | `disputed` | attribution plausible but unsourced |
| `needs_source_check` | `disputed` | same |
| `unverified_not_recommended` | `apocryphal` | matches the candidate file's own warning that these are suspect |
| `unverified_attribution_conflict` | `disputed` | competing attributions |
| `misattributed_or_unverified` | `apocryphal` | known misattribution risk |
| `apocryphal_not_verified` | `apocryphal` | passthrough semantic |
| `known_source_excerpt` | `verified` | direct excerpt from a named, sourced work |
| `known_film_quote_needs_exact_check` | `disputed` | source film known, wording unverified |
| `known_film_scene_needs_exact_check` | `disputed` | same |
| `curator_original_or_unattributed` | `folkloric` | unattributed wisdom / curator-originated |

### `copyright` (must be injected — candidate file lacks this field)

Per-entry assignment based on author lifespan + jurisdictional norm (EU §51 UrhG Zitatrecht for short modern quotes; PD where ≥70 years post mortem):

| IDs | Author | `copyright` | Reason |
|---|---|---|---|
| aph-0089..0095 | S.J. Lec (d. 1966) | `Zitatrecht` | in EU copyright till 2037 |
| aph-0096..0099 | Russell Brand (alive) | `Zitatrecht` | in copyright |
| aph-0100 | Maya Angelou (d. 2014) | `Zitatrecht` | in copyright till 2085 |
| aph-0101 | Simone de Beauvoir (d. 1986) | `Zitatrecht` | in copyright till 2057 |
| aph-0102..0104 | Mary Oliver (d. 2019) | `Zitatrecht` | in copyright till 2090 |
| aph-0105..0106 | Virginia Woolf (d. 1941) | `PD` | EU PD since 2012 |
| aph-0107 | Curator (Benjamin Poersch) | `eigene-Übersetzung` | original; schema lacks `original` so map to nearest |
| aph-0108 | T. Roosevelt (d. 1919) | `PD` | EU PD |
| aph-0109 | author uncertain | `PD` | treat as folkloric/old |
| aph-0110 | Lincoln/Drucker uncertain | `Zitatrecht` | conservative — Drucker d. 2005 still in copyright |
| aph-0111 | Lincoln (apocryphal) | `PD` | apocryphal but pre-1928 attribution |
| aph-0112 | A. Lincoln (d. 1865) | `PD` | EU PD |
| aph-0113 | Churchill (d. 1965) | `Zitatrecht` | in EU copyright till 2036 |
| aph-0114..0115 | Peter Kruse (d. 2015) | `Zitatrecht` | in copyright till 2086 |
| aph-0116 | Anke Engelke (alive) | `Zitatrecht` | in copyright |
| aph-0117 | Fannie Flagg (alive) | `Zitatrecht` | in copyright |
| aph-0118 | Good Will Hunting screenplay (Damon/Affleck) | `Zitatrecht` | in copyright |
| aph-0119 | J.K. Rowling (alive) | `Zitatrecht` | in copyright |
| aph-0120 | Christopher Nolan (Inception screenplay) | `Zitatrecht` | in copyright |
| aph-0121 | Easy Rider screenplay (Terry Southern d. 1995) | `Zitatrecht` | in copyright till 2066 |

### `original_language`

| Author/work language | Schema |
|---|---|
| German speaker, German body is canonical | `de` |
| English speaker, German body is translation | `en` |
| Foreign-language source without `## Original` blockquote in candidates | `unknown` (precedent: existing `aph-0050.md` Konfuzius) |

Per-entry:

| IDs | `original_language` |
|---|---|
| aph-0089..0095 (Lec, Polish original not provided) | `unknown` |
| aph-0096..0099 (Brand) | `en` |
| aph-0100 (Angelou) | `en` |
| aph-0101 (Beauvoir, French original not provided) | `unknown` |
| aph-0102..0104 (Oliver) | `en` |
| aph-0105..0106 (Woolf) | `en` |
| aph-0107 (Curator) | `de` |
| aph-0108 (Roosevelt) | `en` |
| aph-0109 (uncertain) | `unknown` |
| aph-0110..0113 (Lincoln/Drucker/Churchill) | `en` |
| aph-0114..0115 (Kruse) | `de` |
| aph-0116 (Engelke) | `de` |
| aph-0117..0121 (Flagg, Will Hunting, Rowling, Inception, Easy Rider) | `en` |

### Fields preserved verbatim from candidate

`id`, `author`, `work`, `year`, `mode_tags`, `tone_tags`, `element_affinity`, `editor_notes` (renamed to `attribution_note` when used as note text).

### Fields with defaults (when absent from candidate)

| Field | Default |
|---|---|
| `translator_de` | `""` |
| `translator_en` | `""` |
| `figure_affinity` | `[]` |
| `season_affinity` | `[]` |
| `quality_rating` | `4` |
| `first_used` | `null` |
| `cooldown_days` | `30` |
| `attribution_note` | the candidate's `Editor-Kontext` paragraph (single line, no internal `"`) |

### Body section transformation

| Candidate format | Output format |
|---|---|
| `**DE**\n> ...` | `## DE\n\n> ...\n` |
| `**EN**\n> ...` | `## EN\n\n> ...\n` |
| `**Slot-2-Kandidaten DE**\n- ...` | `## Slot-2-Kandidaten DE\n\n- ...\n` |
| `**Editor-Kontext**\n...` | `## Editor-Kontext\n\n...\n` |
| (none) | `## Slot-2-Candidates EN\n\n-\n` (mandatory empty placeholder per template) |
| (none) | `## Verwandt\n\n-\n` (mandatory empty placeholder per template) |

---

## Phase 0: Preflight (scaffold + prod state check)

### Task 0.1: Confirm input file is committed-safe

**Files:**
- Read: `docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md` (scaffold)

**Step 1: Verify input file exists and is non-empty**

Run: `wc -l docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md`
Expected: > 900 lines.

**Step 2: Stage and commit the input file**

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum"
git add docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md
git commit -m "docs(inputs): freeze aphorism candidate file aph-0089..0121

Operator-supplied candidate batch copied verbatim from ~/Downloads
on 2026-05-14. Frozen here as the stable plan input.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Expected: 1 file changed, > 900 insertions.

---

### Task 0.2: Capture baseline aphorism count

**Files:**
- Read: `Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/` (list)
- Read: `Astro-Noctum-prod/packages/voice/data/aphorisms.json`

**Step 1: Count existing review files**

Run: `ls "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/" | wc -l`
Expected: 21.

**Step 2: Count existing approved entries in aphorisms.json**

Run: `jq 'length' "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/packages/voice/data/aphorisms.json"`
Expected: small integer (0..21 — only `status: approved` flow through).

**Step 3: Record baseline in a scratch note**

Write the two numbers to memory (mentally or on paper). They will be compared in Phase 4.

---

### Task 0.3: Redundancy check against existing 21-entry corpus

**Files:**
- Read: `Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/aph-*.md`
- Read: `docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md` (scaffold)

**Step 1: Extract existing DE bodies into a temp file**

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review"
for f in aph-*.md; do
  printf "%s\t" "${f%.md}"
  awk '/^## DE/{flag=1;next} flag && /^> /{sub(/^> /,""); print; exit}' "$f"
done > /tmp/existing-de-bodies.tsv
```

**Step 2: Extract new DE bodies (bold-text format) from the input**

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum"
python3 - <<'PY' > /tmp/new-de-bodies.tsv
import re
src = open('docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md', encoding='utf-8').read()
# Split into per-entry blocks by '## aph-' header
entries = re.split(r'\n## aph-(\d{4})', src)[1:]
for i in range(0, len(entries), 2):
    aid = 'aph-' + entries[i]
    body = entries[i+1]
    # Find the **DE** section, capture the first '> ...' line
    m = re.search(r'\*\*DE\*\*\s*\n>\s*(.+)', body)
    if m:
        print(f'{aid}\t{m.group(1).strip()}')
PY
```

Expected output: 30 lines (one per included ID; the 3 excluded entries have no `id:` field and no `## aph-` header — wait, they DO have `## aph-NNNN` headers but no `id:` line. Re-check.).

**Re-check:** The exclusions section uses `## Russell Brand – Grammatik/Sex-Zitat` style headers (no `aph-NNNN` numbering), so the `## aph-(\d{4})` regex naturally excludes them. Confirmed.

**Step 3: Compare for near-duplicates**

```bash
python3 - <<'PY'
import csv
existing = {row[0]: row[1] for row in csv.reader(open('/tmp/existing-de-bodies.tsv'), delimiter='\t') if len(row) == 2}
new_rows = {row[0]: row[1] for row in csv.reader(open('/tmp/new-de-bodies.tsv'), delimiter='\t') if len(row) == 2}

def normalize(s):
    s = s.lower()
    for a, b in [('ä','ae'),('ö','oe'),('ü','ue'),('ß','ss')]:
        s = s.replace(a, b)
    import re
    s = re.sub(r'[^a-z0-9 ]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

hits = []
for new_id, new_text in new_rows.items():
    nt = normalize(new_text)
    nt_tokens = set(nt.split())
    for old_id, old_text in existing.items():
        ot = normalize(old_text)
        ot_tokens = set(ot.split())
        # Jaccard similarity on tokens; flag if >= 0.5
        if not nt_tokens or not ot_tokens:
            continue
        jac = len(nt_tokens & ot_tokens) / len(nt_tokens | ot_tokens)
        if jac >= 0.5:
            hits.append((new_id, old_id, round(jac, 2), new_text[:60], old_text[:60]))

if hits:
    print('DUPLICATE CANDIDATES FOUND — ABORT PHASE 3:')
    for h in hits:
        print(h)
    raise SystemExit(1)
print(f'no near-duplicates across {len(new_rows)} new × {len(existing)} existing entries')
PY
```

Expected: `no near-duplicates across 30 new × 21 existing entries`

**If duplicates found:** abort the plan. Report hits to the user and stop — do not proceed to file generation. (No expected duplicates on a manual spot-check of the input: the new batch covers Lec / Brand / Oliver / Rowling / Nolan / Lincoln / Kruse / Engelke — none of which overlap with the existing Sun Tzu / Konfuzius / Nietzsche / Bhagavad-Gita / Marcus Aurelius / Buddhist-zen corpus.)

---

## Phase 1: Spec change — deprecate constraint + record decision

### Task 1.1: Mark CON-aphorisms-human-approved as Deprecated

**Files:**
- Modify: `1-spec/constraints/CON-aphorisms-human-approved.md` (scaffold)

**Step 1: Read the current file**

The file currently has `**Status**: Active` on line 5.

**Step 2: Edit line 5**

Replace:
```markdown
**Status**: Active
```
with:
```markdown
**Status**: Deprecated (2026-05-14, superseded by DEC-aphorism-batch-approval-bp-2026-05-14)
```

**Step 3: Append a Deprecation Notice section at the end of the file**

```markdown

## Deprecation Notice (2026-05-14)

This constraint is deprecated. The hard human-in-the-loop gate (operator manually flips per-file `status: draft → approved`) is replaced by **batch-approval by the operator via a documented plan artifact**, recorded in [DEC-aphorism-batch-approval-bp-2026-05-14](../../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md). The decision shifts the approval surface from per-file edits to plan files, while preserving the rule that only Ben (the operator) may grant approval. Agents still cannot auto-promote without an explicit plan-encoded directive from Ben.
```

**Step 4: Verify**

Run: `grep -c "Status.*Deprecated" 1-spec/constraints/CON-aphorisms-human-approved.md`
Expected: 1

---

### Task 1.2: Create DEC-aphorism-batch-approval-bp-2026-05-14

**Files:**
- Create: `decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md` (scaffold)
- Create: `decisions/DEC-aphorism-batch-approval-bp-2026-05-14.history.md` (scaffold)

**Step 1: Read the decision template**

```bash
ls decisions/_template*.md 2>/dev/null
```
If a template exists, use it. Otherwise use the structure below (matching `DEC-llm-provider-gemini.md` style).

**Step 2: Write the active decision file**

```markdown
# DEC-aphorism-batch-approval-bp-2026-05-14

**Status**: Active
**Date**: 2026-05-14
**Supersedes**: CON-aphorisms-human-approved (constraint)

## Trigger

When the operator (Ben) wants to add a batch of aphorisms to the production pool without flipping `status: draft → approved` for each file individually.

## Context

The original constraint `CON-aphorisms-human-approved` required Ben to manually edit each aphorism markdown file to flip `status: draft → approved`. This was rationally driven by the credibility and legal risks of mis-attribution (see CON-aphorisms-human-approved §Rationale).

In practice, the bottleneck became the per-file edit step, not the verification step itself. Ben verifies content before handing it to the agent (out of band — primary-source check, attribution review, rights review). The per-file `draft → approved` edit then adds friction without adding verification.

## Decision

Ben may grant **batch approval** by directing the agent to set `status: approved` for a specific, enumerated list of IDs in an implementation plan. The plan file is the approval artifact. The agent reads the plan, applies `status: approved` to exactly the enumerated IDs (no others), and the audit trail is the plan file + commit history.

## Enforcement

- The agent MAY set `status: approved` only for IDs explicitly listed in a plan that Ben authored or explicitly directed.
- The agent MAY NOT auto-flip any other aphorism's status.
- LLM-generated or LLM-proposed aphorisms still require explicit operator instruction; no implicit approval pathway exists.
- The plan's "approval scope" section MUST enumerate every ID in scope. Wildcard or pattern-based approval is prohibited.
- The `attribution_status` field must reflect the actual source quality (e.g., `apocryphal` for known misattributions), independent of the `status: approved` flip. Approving a file does not certify its attribution — it certifies that Ben accepts the file for inclusion in the daily-pulse pool as-labeled.

## Related Artifacts

- Supersedes: [CON-aphorisms-human-approved](../1-spec/constraints/CON-aphorisms-human-approved.md)
- Plan invoking this: [2026-05-14-aphorism-batch-extension-aph-0089-0121.md](../docs/plans/2026-05-14-aphorism-batch-extension-aph-0089-0121.md)
- Component: [tagespuls-package](../3-code/tagespuls-package/CLAUDE.component.md)
```

**Step 3: Write the history file**

```markdown
# DEC-aphorism-batch-approval-bp-2026-05-14 — History

## Alternatives considered

### Alternative 1: Keep CON-aphorisms-human-approved as written (per-file approval only)
- Pro: maximum operator gating, no risk of agent-driven auto-approve.
- Con: bottleneck is the edit step, not verification; friction discourages batch additions.
- Decision: rejected — operator verification happens out of band; per-file edit adds no extra check.

### Alternative 2: Auto-approve all aphorisms the agent generates
- Pro: zero operator friction.
- Con: removes the operator-only approval principle entirely; opens path to LLM-generated content silently entering the pool.
- Decision: rejected — preserves the principle that only Ben grants approval.

### Alternative 3: Plan-encoded batch approval (chosen)
- Pro: keeps operator as approver; eliminates per-file edit; auditable via plan file + commit history.
- Con: requires the agent to faithfully scope `status: approved` to the enumerated IDs only.
- Decision: accepted — codified as DEC-aphorism-batch-approval-bp-2026-05-14.

## Changelog

- 2026-05-14: Decision recorded. CON-aphorisms-human-approved marked Deprecated in the same commit.
```

**Step 4: Verify**

```bash
ls decisions/DEC-aphorism-batch-approval-bp-2026-05-14*.md
```
Expected: 2 files.

---

### Task 1.3: Update spec indexes

**Files:**
- Modify: `1-spec/CLAUDE.spec.md` (scaffold) — Constraints Index row + Decisions Index row

**Step 1: Find the Constraints Index row for CON-aphorisms-human-approved**

Run: `grep -n "CON-aphorisms-human-approved" 1-spec/CLAUDE.spec.md`
Expected: one match around line 187.

**Step 2: Edit the row to reflect Deprecated**

Replace the row's `Active` cell with `Deprecated (2026-05-14)`.

**Step 3: Add DEC-aphorism-batch-approval-bp-2026-05-14 to the Decisions Index**

The Decisions Relevant to This Phase section is around line 75. Append a row:

| File | Title | Trigger |
|------|-------|---------|
| [DEC-aphorism-batch-approval-bp-2026-05-14](../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md) | Aphorism batch approval by plan artifact | When operator wants to approve a batch of aphorisms via plan rather than per-file edits |

**Step 4: Verify**

Run: `grep -c "DEC-aphorism-batch-approval-bp-2026-05-14" 1-spec/CLAUDE.spec.md`
Expected: ≥ 1

---

### Task 1.4: Update tagespuls-package component doc

**Files:**
- Modify: `3-code/tagespuls-package/CLAUDE.component.md` (scaffold)

**Step 1: Locate the operator-only approval language (around line 10)**

The current text reads:
```
**Approval transition:** operator (Ben) edits each markdown's `status: draft` → `status: approved` manually. No agent / build script / LLM may auto-promote.
```

**Step 2: Replace with**

```
**Approval transition:** operator (Ben) grants approval either by (a) per-file edit `status: draft` → `status: approved`, or (b) batch approval via a documented plan artifact per [DEC-aphorism-batch-approval-bp-2026-05-14](../../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md). Agents may apply `status: approved` ONLY to IDs explicitly enumerated in such a plan.
```

**Step 3: Update the Relevant Decisions table** (currently `_(none yet)_`)

Replace with:

| File | Title | Trigger |
|------|-------|---------|
| [DEC-aphorism-batch-approval-bp-2026-05-14](../../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md) | Aphorism batch approval by plan artifact | When the operator approves a batch via plan rather than per-file edits |

**Step 4: Verify**

Run: `grep -c "DEC-aphorism-batch-approval-bp-2026-05-14" 3-code/tagespuls-package/CLAUDE.component.md`
Expected: 2 (one in body text, one in decisions table).

---

### Task 1.5: Update Current State in root CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (scaffold) — Current State subsection under Project Overview

**Step 1: Find the Current State section**

Run: `grep -n "Current State" CLAUDE.md`
Look for the subsection under `## Project Overview`.

**Step 2: Append a Constraints note**

Add a line under the current Specification artifacts paragraph:
> **Constraints (2026-05-14 update):** 7 total — 6 Active, 1 Deprecated (CON-aphorisms-human-approved, superseded by DEC-aphorism-batch-approval-bp-2026-05-14).

**Step 3: Append a Decisions note**

Update the Decisions count: was "3 recorded", now "4 recorded".

Append to the existing decisions list: `DEC-aphorism-batch-approval-bp-2026-05-14`.

**Step 4: Verify**

Run: `grep -c "DEC-aphorism-batch-approval-bp-2026-05-14" CLAUDE.md`
Expected: ≥ 1.

---

### Task 1.6: Commit Phase 1 spec changes

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum"
git add 1-spec/constraints/CON-aphorisms-human-approved.md \
        decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md \
        decisions/DEC-aphorism-batch-approval-bp-2026-05-14.history.md \
        1-spec/CLAUDE.spec.md \
        3-code/tagespuls-package/CLAUDE.component.md \
        CLAUDE.md
git commit -m "spec: deprecate CON-aphorisms-human-approved + record DEC-aphorism-batch-approval

Replaces the per-file operator-approval gate with plan-encoded batch
approval. Operator (Ben) remains the sole approver; agents may apply
status: approved only to IDs explicitly enumerated in a plan authored
or directed by Ben.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Expected: 6 files changed (1 modified constraint + 2 new decision files + 3 modified docs).

---

## Phase 2: Conversion script (TDD)

### Task 2.1: Establish target paths

The conversion script and its test land in the **prod repo**, alongside the other voice scripts:

- Script: `Astro-Noctum-prod/packages/voice/scripts/convert_aphorism_candidates.py`
- Test: `Astro-Noctum-prod/packages/voice/scripts/test_convert_aphorism_candidates.py`

Input it reads (path passed as CLI arg): the frozen scaffold input at `../../../../Astro-Noctum/docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md`. The script accepts an absolute path so the relative-vs-absolute detail does not matter at runtime.

Output it writes (path passed as CLI arg): `Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/` (the prod repo's review folder).

---

### Task 2.2: Write the failing test

**Files:**
- Create: `Astro-Noctum-prod/packages/voice/scripts/test_convert_aphorism_candidates.py`

**Step 1: Write the test**

```python
"""
Test for convert_aphorism_candidates.py — TDD red phase.

Asserts that converting the operator-supplied candidate input produces 33
schema-valid markdown files that all pass validate_aphorisms.validate_file().
"""
import sys
import tempfile
import subprocess
from pathlib import Path
import pytest

HERE = Path(__file__).parent
SCAFFOLD = HERE.parent.parent.parent.parent / "Astro-Noctum"
INPUT_FILE = SCAFFOLD / "docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md"

sys.path.insert(0, str(HERE))
from validate_aphorisms import validate_file  # noqa: E402

EXPECTED_IDS = [f"aph-{i:04d}" for i in range(89, 122)]  # 0089..0121 inclusive = 33 IDs
EXPECTED_OUTPUT_COUNT = 33  # all 33 ID-bearing entries in the candidate file


def test_input_file_exists():
    assert INPUT_FILE.exists(), f"missing input file: {INPUT_FILE}"


def test_conversion_produces_30_files(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    result = subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        capture_output=True, text=True,
    )
    assert result.returncode == 0, f"script failed: stderr={result.stderr}"
    produced = sorted(p.name for p in tmp_path.glob("aph-*.md"))
    assert len(produced) == EXPECTED_OUTPUT_COUNT, (
        f"expected {EXPECTED_OUTPUT_COUNT} files, got {len(produced)}: {produced}"
    )


def test_all_produced_files_pass_validator(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        check=True,
    )
    errors = []
    for p in sorted(tmp_path.glob("aph-*.md")):
        file_errors = validate_file(p)
        errors.extend(file_errors)
    assert not errors, "validator errors:\n" + "\n".join(errors)


def test_all_produced_files_are_approved(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        check=True,
    )
    import re
    for p in sorted(tmp_path.glob("aph-*.md")):
        text = p.read_text(encoding="utf-8")
        m = re.search(r'^status:\s*"?(\w+)"?', text, re.M)
        assert m, f"no status in {p.name}"
        assert m.group(1) == "approved", f"{p.name} status is {m.group(1)}, expected approved"


def test_expected_ids_present(tmp_path):
    script = HERE / "convert_aphorism_candidates.py"
    subprocess.run(
        [sys.executable, str(script), str(INPUT_FILE), str(tmp_path)],
        check=True,
    )
    produced_ids = sorted(p.stem for p in tmp_path.glob("aph-*.md"))
    expected = sorted(EXPECTED_IDS)
    assert produced_ids == expected, (
        f"produced {produced_ids}, expected {expected}"
    )
```

**Step 2: Run the test (expect failure — script not yet implemented)**

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/packages/voice/scripts"
python3 -m pytest test_convert_aphorism_candidates.py -v
```
Expected: 5 tests, four fail because `convert_aphorism_candidates.py` does not yet exist; only `test_input_file_exists` passes.

**Step 3: Commit the failing test**

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod"
git add packages/voice/scripts/test_convert_aphorism_candidates.py
git commit -m "test(voice): TDD red — convert_aphorism_candidates failing tests

Five tests asserting that the (not yet existing) script transforms the
scaffold input file into 33 schema-valid, status:approved markdown files
matching the expected ID set aph-0089..aph-0121 (contiguous).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2.3: Implement the conversion script

**Files:**
- Create: `Astro-Noctum-prod/packages/voice/scripts/convert_aphorism_candidates.py`

**Step 1: Write the script**

```python
#!/usr/bin/env python3
"""
Convert operator-supplied aphorism candidate file into 30 schema-valid
markdown files for the prod review/ folder.

Mapping rules: see docs/plans/2026-05-14-aphorism-batch-extension-aph-0089-0121.md
in the scaffold repo (sections 'Value-Mapping Table' and 'Schema').

Usage:
    python3 convert_aphorism_candidates.py <input_md> <output_dir>
"""
import sys
import re
from pathlib import Path

# ---- Mapping tables (must mirror the plan exactly) -------------------------

ATTR_STATUS_MAP = {
    "verified": "verified",
    "attributed_needs_source_check": "disputed",
    "needs_source_check": "disputed",
    "unverified_not_recommended": "apocryphal",
    "unverified_attribution_conflict": "disputed",
    "misattributed_or_unverified": "apocryphal",
    "apocryphal_not_verified": "apocryphal",
    "known_source_excerpt": "verified",
    "known_film_quote_needs_exact_check": "disputed",
    "known_film_scene_needs_exact_check": "disputed",
    "curator_original_or_unattributed": "folkloric",
}

# Per-ID copyright + original_language (from the plan's value-mapping table)
PER_ID = {
    "aph-0089": ("Zitatrecht", "unknown"),
    "aph-0090": ("Zitatrecht", "unknown"),
    "aph-0091": ("Zitatrecht", "unknown"),
    "aph-0092": ("Zitatrecht", "unknown"),
    "aph-0093": ("Zitatrecht", "unknown"),
    "aph-0094": ("Zitatrecht", "unknown"),
    "aph-0095": ("Zitatrecht", "unknown"),
    "aph-0096": ("Zitatrecht", "en"),
    "aph-0097": ("Zitatrecht", "en"),
    "aph-0098": ("Zitatrecht", "en"),
    "aph-0099": ("Zitatrecht", "en"),
    "aph-0100": ("Zitatrecht", "en"),
    "aph-0101": ("Zitatrecht", "unknown"),
    "aph-0102": ("Zitatrecht", "en"),
    "aph-0103": ("Zitatrecht", "en"),
    "aph-0104": ("Zitatrecht", "en"),
    "aph-0105": ("PD", "en"),
    "aph-0106": ("PD", "en"),
    "aph-0107": ("eigene-Übersetzung", "de"),
    "aph-0108": ("PD", "en"),
    "aph-0109": ("PD", "unknown"),
    "aph-0110": ("Zitatrecht", "en"),
    "aph-0111": ("PD", "en"),
    "aph-0112": ("PD", "en"),
    "aph-0113": ("Zitatrecht", "en"),
    "aph-0114": ("Zitatrecht", "de"),
    "aph-0115": ("Zitatrecht", "de"),
    "aph-0116": ("Zitatrecht", "de"),
    "aph-0117": ("Zitatrecht", "en"),
    "aph-0118": ("Zitatrecht", "en"),
    "aph-0119": ("Zitatrecht", "en"),
    "aph-0120": ("Zitatrecht", "en"),
    "aph-0121": ("Zitatrecht", "en"),
}

DEFAULTS = {
    "translator_de": "",
    "translator_en": "",
    "figure_affinity": "[]",
    "season_affinity": "[]",
    "quality_rating": 4,
    "first_used": "null",
    "cooldown_days": 30,
}

# ---- Helpers ---------------------------------------------------------------

def word_count(text: str) -> int:
    text = text.replace("—", " ").replace("–", " ")
    return len([t for t in re.split(r"\s+", text.strip()) if t])


def parse_candidate(block: str) -> dict | None:
    """Parse a single '## aph-NNNN ...' block. Returns None if no `id:` line."""
    fm_match = re.search(r"---\s*\n(.*?)\n---", block, re.S)
    if not fm_match:
        return None
    fm_lines = fm_match.group(1).splitlines()
    fm = {}
    for line in fm_lines:
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        fm[k.strip()] = v.strip().strip('"').strip("'")
    if "id" not in fm:
        return None

    body_after_fm = block[fm_match.end():]

    # Extract DE / EN blockquotes
    def grab_quote(label: str) -> str:
        m = re.search(rf"\*\*{re.escape(label)}\*\*\s*\n>\s*(.+?)(?=\n\s*\n|\n\*\*|\Z)", body_after_fm, re.S)
        if not m:
            return ""
        # Join multi-line blockquote
        raw = m.group(1)
        lines = []
        for line in raw.splitlines():
            line = line.strip()
            if line.startswith(">"):
                line = line[1:].strip()
            lines.append(line)
        return " ".join(l for l in lines if l).strip()

    de = grab_quote("DE")
    en = grab_quote("EN")

    # Extract Slot-2-Kandidaten DE (single bullet line)
    slot2_de = ""
    m = re.search(r"\*\*Slot-2-Kandidaten DE\*\*\s*\n-\s*(.+?)(?=\n\s*\n|\n\*\*|\Z)", body_after_fm, re.S)
    if m:
        slot2_de = m.group(1).strip().splitlines()[0].strip()

    # Extract Editor-Kontext (single paragraph)
    editor_ctx = ""
    m = re.search(r"\*\*Editor-Kontext\*\*\s*\n(.+?)(?=\n\s*\n|\n\*\*|\n##|\Z)", body_after_fm, re.S)
    if m:
        editor_ctx = " ".join(line.strip() for line in m.group(1).splitlines() if line.strip())

    fm["_de"] = de
    fm["_en"] = en
    fm["_slot2_de"] = slot2_de
    fm["_editor_ctx"] = editor_ctx
    return fm


def render_file(fm: dict) -> str:
    """Render a single aphorism markdown file from a parsed candidate."""
    aid = fm["id"]
    if aid not in PER_ID:
        raise ValueError(f"no PER_ID mapping for {aid}")
    copyright_val, original_lang = PER_ID[aid]

    cand_attr = fm.get("attribution_status", "needs_source_check")
    attr_status = ATTR_STATUS_MAP.get(cand_attr, "disputed")

    # attribution_note is required when attr_status != 'verified'
    attribution_note = ""
    if attr_status != "verified":
        attribution_note = fm.get("_editor_ctx") or f"Zuschreibung markiert als '{cand_attr}' — siehe editor_notes."
        # Keep it single-line, no internal double-quotes
        attribution_note = attribution_note.replace('"', "'").replace("\n", " ").strip()

    de = fm["_de"]
    en = fm["_en"]
    wc_de = word_count(de)
    wc_en = word_count(en)

    # Build frontmatter
    fields = [
        f'id: "{aid}"',
        'status: "approved"',  # batch-approved per DEC-aphorism-batch-approval-bp-2026-05-14
        f'author: "{fm.get("author", "uncertain")}"',
        f'work: "{fm.get("work", "")}"',
    ]
    year_val = fm.get("year", "null")
    if year_val in ("", "null", None):
        fields.append("year: null")
    elif re.fullmatch(r"-?\d+", str(year_val)):
        fields.append(f"year: {year_val}")
    else:
        # year like "~135" or "1990er" → store as string
        fields.append(f'year: "{year_val}"')
    fields += [
        f'original_language: "{original_lang}"',
        f'translator_de: "{DEFAULTS["translator_de"]}"',
        f'translator_en: "{DEFAULTS["translator_en"]}"',
        f'copyright: "{copyright_val}"',
        f'attribution_status: "{attr_status}"',
    ]
    if attribution_note:
        fields.append(f'attribution_note: "{attribution_note}"')
    fields += [
        f'mode_tags: {fm.get("mode_tags", "[pulse]")}',
        f'tone_tags: {fm.get("tone_tags", "[weisheitlich]")}',
        f'element_affinity: {fm.get("element_affinity", "[]")}',
        f'figure_affinity: {DEFAULTS["figure_affinity"]}',
        f'season_affinity: {DEFAULTS["season_affinity"]}',
        f"word_count_de: {wc_de}",
        f"word_count_en: {wc_en}",
        f'quality_rating: {DEFAULTS["quality_rating"]}',
        f'first_used: {DEFAULTS["first_used"]}',
        f'cooldown_days: {DEFAULTS["cooldown_days"]}',
    ]
    editor_note = fm.get("_editor_ctx", "").replace('"', "'").replace("\n", " ").strip()
    if editor_note:
        fields.append(f'editor_notes: "{editor_note}"')

    fm_block = "---\n" + "\n".join(fields) + "\n---\n"

    # Body
    body = f"\n## DE\n\n> {de}\n\n## EN\n\n> {en}\n"
    if fm["_slot2_de"]:
        body += f"\n## Slot-2-Kandidaten DE\n\n- {fm['_slot2_de']}\n"
    body += "\n## Slot-2-Candidates EN\n\n-\n"
    if fm["_editor_ctx"]:
        body += f"\n## Editor-Kontext\n\n{fm['_editor_ctx']}\n"
    body += "\n## Verwandt\n\n-\n"

    return fm_block + body


def main():
    if len(sys.argv) != 3:
        print("usage: convert_aphorism_candidates.py <input_md> <output_dir>", file=sys.stderr)
        return 2
    src = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    raw = src.read_text(encoding="utf-8")
    # Split on '## aph-NNNN' headers
    blocks = re.split(r"\n(?=## aph-\d{4})", raw)
    count = 0
    for block in blocks:
        if not block.lstrip().startswith("## aph-"):
            continue
        parsed = parse_candidate(block)
        if not parsed:
            continue
        aid = parsed["id"]
        if aid not in PER_ID:
            print(f"WARN: skipping {aid} — no PER_ID mapping", file=sys.stderr)
            continue
        rendered = render_file(parsed)
        out_path = out_dir / f"{aid}.md"
        out_path.write_text(rendered, encoding="utf-8")
        count += 1

    print(f"wrote {count} aphorism files to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

**Step 2: Run the test (expect pass)**

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/packages/voice/scripts"
python3 -m pytest test_convert_aphorism_candidates.py -v
```
Expected: 5/5 tests pass. If any validator error surfaces, read the error message, fix the corresponding mapping or rendering bug, and re-run.

**Step 3: Commit the script**

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod"
git add packages/voice/scripts/convert_aphorism_candidates.py
git commit -m "feat(voice): convert_aphorism_candidates — TDD green

Reads operator-supplied candidate markdown (bold-text body format,
operator-vocabulary frontmatter) and emits 33 schema-valid aph-NNNN.md
files. Applies the value-mapping table from the plan to translate
attribution_status / copyright / original_language into validator-
allowed enums.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 3: Generate the 30 new aphorism files

### Task 3.1: Run the conversion against the prod review folder

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/packages/voice/scripts"
python3 convert_aphorism_candidates.py \
  "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum/docs/inputs/2026-05-14-aphorism-candidates-aph-0089-0121.md" \
  "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review"
```

Expected stdout: `wrote 33 aphorism files to ...`

---

### Task 3.2: Count produced files

```bash
ls "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/aph-009*.md" \
   "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/aph-01*.md" 2>/dev/null | wc -l
```
Expected: 33.

Total review/ count after Phase 3: 21 (baseline) + 33 (new) = 54.

```bash
ls "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/" | wc -l
```
Expected: 54.

---

### Task 3.3: Run validate_aphorisms.py against the full review/ folder

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod"
python3 packages/voice/scripts/validate_aphorisms.py knowledge/bazodiaac-brain/aphorisms
```
Expected: `valid: 54 aphorism files passed schema checks` and exit code 0.

**If any file fails validation:** read the error, fix the conversion script's logic, re-run Phase 3.1, re-run validation.

---

### Task 3.4: Spot-check 3 files for content fidelity

**Step 1: Inspect aph-0089 (first entry, Lec, attribution_status=apocryphal-or-disputed)**

```bash
cat "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/aph-0089.md"
```

Verify:
- `id: "aph-0089"`
- `status: "approved"`
- `author: "Stanisław Jerzy Lec"`
- `copyright: "Zitatrecht"`
- `original_language: "unknown"`
- `attribution_status: "disputed"` (mapped from candidate's `needs_source_check`)
- `attribution_note: "..."` present (because attribution_status != verified)
- DE blockquote: `> Die Geraden müssen aufpassen, wenn die Kurven auftauchen.`
- EN blockquote: `> The straight ones must watch out when the curves appear.`

**Step 2: Inspect aph-0106 (Woolf, PD, known_source_excerpt → verified)**

```bash
cat "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/aph-0106.md"
```

Verify:
- `copyright: "PD"`
- `attribution_status: "verified"` (mapped from `known_source_excerpt`)
- `attribution_note:` field is **absent** (not required when verified)
- DE: `> Ich bin verwurzelt, aber ich fließe.`
- EN: `> I am rooted, but I flow.`

**Step 3: Inspect aph-0119 (Rowling, Zitatrecht, known_source_excerpt → verified)**

```bash
cat "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod/knowledge/bazodiaac-brain/aphorisms/review/aph-0119.md"
```

Verify:
- `author: "J. K. Rowling"`
- `work: "Harry Potter and the Chamber of Secrets"`
- `year: 1998`
- `copyright: "Zitatrecht"`
- `attribution_status: "verified"`
- EN: `> It is our choices, Harry, that show what we truly are, far more than our abilities.`

---

### Task 3.5: Commit the 30 new files

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod"
git add knowledge/bazodiaac-brain/aphorisms/review/aph-008*.md \
        knowledge/bazodiaac-brain/aphorisms/review/aph-009*.md \
        knowledge/bazodiaac-brain/aphorisms/review/aph-01*.md
git status --short  # confirm exactly 33 new files staged
git commit -m "feat(aphorisms): add 33 batch-approved entries aph-0089..0121

Generated from operator-supplied candidates by convert_aphorism_candidates.py.
status: approved per DEC-aphorism-batch-approval-bp-2026-05-14 (Astro-Noctum
scaffold repo). All entries pass validate_aphorisms.py schema checks.

Attribution honesty preserved: candidate-flagged 'needs_source_check' and
'unverified_not_recommended' entries are stored as 'disputed' / 'apocryphal'
respectively, with attribution_note describing the source quality.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Expected: 33 files changed.

---

## Phase 4: Build and verify aphorisms.json

### Task 4.1: Run build_aphorisms.py

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum-prod"
python3 packages/voice/scripts/build_aphorisms.py \
  knowledge/bazodiaac-brain/aphorisms \
  packages/voice/data/aphorisms.json
```
Expected stdout: `wrote 33 approved aphorisms to packages/voice/data/aphorisms.json` (baseline approved was 0; new approved = 33; total = 33).

---

### Task 4.2: Assert JSON entry count

```bash
jq 'length' packages/voice/data/aphorisms.json
```
Expected: 33.

```bash
jq '[.[] | select(.id >= "aph-0089" and .id <= "aph-0121")] | length' packages/voice/data/aphorisms.json
```
Expected: 33.

---

### Task 4.3: Inspect a sample JSON entry

```bash
jq '.[] | select(.id == "aph-0106")' packages/voice/data/aphorisms.json
```
Expected: a JSON object with `text.de = "Ich bin verwurzelt, aber ich fließe."`, `text.en = "I am rooted, but I flow."`, `attribution_status = "verified"`, `copyright = "PD"`.

---

### Task 4.4: Mode-coverage check (per dev brief TASK-T0 gate)

```bash
jq '[.[] | .mode_tags[]] | group_by(.) | map({mode: .[0], count: length})' packages/voice/data/aphorisms.json
```
Expected: each of `pulse`, `trace`, `spannung` present with count ≥ 1. The new batch is heavy on `pulse` and `spannung`. If `trace` is absent, this gates downstream daily-pulse features that depend on trace-mode aphorisms — flag to user but does not block this plan.

---

### Task 4.5: Commit the regenerated JSON

```bash
git add packages/voice/data/aphorisms.json
git commit -m "build(voice): regenerate aphorisms.json with 33 entries aph-0089..0121

Build pipeline output after the batch-approved additions land. Counts
verified against per-mode coverage targets. JSON goes from 0 to 33
approved entries (the 21 existing files all remain status: draft).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 5: Close-out

### Task 5.1: Update the scaffold's Current State

**Files:**
- Modify: `CLAUDE.md` (scaffold)

Append to the Current State subsection: a line noting "Aphorism corpus expanded to 54 review entries / 33 approved (was 21 / 0) on 2026-05-14 via plan `docs/plans/2026-05-14-aphorism-batch-extension-aph-0089-0121.md` (prod feature branch `feature/aphorism-batch-aph-0089-0121`)."

```bash
cd "/Users/benjaminpoersch/Projects/codeba se/Bazodiac-WebApp/Astro-Noctum"
git add CLAUDE.md
git commit -m "docs: record aphorism batch aph-0089..0121 in Current State

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5.2: Mark TaskList task #30 as completed

Use `TaskUpdate(taskId="30", status="completed")`.

---

### Task 5.3: Report completion

Report back to user:
- 33 new aphorism files created (aph-0089..0121, contiguous).
- All pass `validate_aphorisms.py`.
- `aphorisms.json` regenerated; entry count went from 0 to 33 (the existing 21 draft files remain `status: draft`).
- Constraint `CON-aphorisms-human-approved` deprecated; replaced by `DEC-aphorism-batch-approval-bp-2026-05-14`.
- 4 commits on scaffold repo `main`, 3 commits on prod repo `main` (or current feature branch).
- Open follow-ups: (a) trace-mode coverage in the pool (flagged in Task 4.4); (b) Phase 3 of the earlier-pasted 8 entries (aph-0053/54/55 Rumi + aph-0071..0075) — these are NOT in this plan's scope. User should decide whether to issue a follow-up plan.

---

## Approval Scope (per DEC-aphorism-batch-approval-bp-2026-05-14)

This plan grants `status: approved` to **exactly** these 33 IDs and no others:

```
aph-0089, aph-0090, aph-0091, aph-0092, aph-0093, aph-0094, aph-0095,
aph-0096, aph-0097, aph-0098, aph-0099,
aph-0100, aph-0101, aph-0102, aph-0103, aph-0104, aph-0105, aph-0106, aph-0107,
aph-0108, aph-0109,
aph-0110, aph-0111, aph-0112, aph-0113, aph-0114, aph-0115, aph-0116, aph-0117,
aph-0118, aph-0119, aph-0120, aph-0121
```

Count: **33 IDs** (contiguous range aph-0089..aph-0121). The "Nicht übernommen / gesperrt" section in the candidate input is narrative-only — three topics that came up in discussion but were never assigned `aph-NNNN` IDs, so they're already out of scope by construction.

The agent MUST NOT apply `status: approved` to any other aphorism in any other file as part of this plan.

---

## Rationale notes (non-actionable)

- **Attribution honesty**: the validator schema's `attribution_status` enum (`verified`, `disputed`, `apocryphal`, `folkloric`) is preserved truthfully per the value-mapping table. Apocryphal-flagged entries (aph-0092, aph-0094, aph-0095, aph-0101, aph-0105, aph-0110, aph-0111 per the candidate file's own warnings) carry `attribution_status: apocryphal` in the generated files. Approving the file does NOT certify the attribution; it certifies operator-acceptance for the daily-pulse pool **as-labeled**.
- **Rights**: all in-copyright entries get `copyright: "Zitatrecht"`, leaning on EU §51 UrhG (Zitatrecht for short quotations in transformative/critical contexts). For a commercial astrology product this is a defensible posture but not legal advice; the operator should obtain explicit legal review before public launch if any quoted entries are used in marketing surfaces.
- **DRY**: a single conversion script reads the operator's natural format (bold-text headers, richer attribution vocabulary, `rights_note` annotations) and emits the validator's strict format. The operator authors in their native vocabulary; the schema is enforced at the transformation boundary.
- **YAGNI**: no rollback script, no JSON-merge logic, no incremental update path — the build pipeline is idempotent (it re-reads the whole review/ folder every run), so re-running `build_aphorisms.py` always produces the correct JSON.

---

## Plan amendments (2026-05-14)

- Pre-Phase-1 amendment: scope corrected from 30 → 33 entries after Phase 0 baseline confirmed all 33 IDs in the candidate file are in-scope (the "Nicht übernommen" section has zero aph-NNNN IDs). Affected count assertions in Phases 2, 3, 4, 5.
- Pre-Phase-1 amendment: baseline approved count confirmed as 0 (not the implied 21). Plan's `aphorisms.json` target updated to 0 → 33 (not 21 → 51).
