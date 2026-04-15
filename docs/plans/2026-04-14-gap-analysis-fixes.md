# Gap Analysis Fixes (I-1 through I-3, m-1 through m-3) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all 6 findings from the Daily Chart coherence-first gap analysis — 3 Important, 3 Minor.

**Architecture:** Pure SDLC artifact edits (markdown files in `1-objectives/`). No source code changes. Each task is one file write + index sync.

**Tech Stack:** Markdown, SDLC scaffold conventions (`1-objectives/CLAUDE.objectives.md` index, `CLAUDE.md` Current State).

---

### Task 1: I-1 — Update CON-dark-luxury-aesthetic to acknowledge Bright Mode

**Why:** The constraint says "No light mode is provided" but Bright Mode ("Solar System") has been live for weeks with an official toggle. DEC-design-system-v2 defines bright-mode tokens. Multiple new requirements (REQ-F-daily-chart-coherence-hero AC 5–6, REQ-USA-daily-chart-responsive-readability AC 4) depend on Bright + Dark. The constraint is factually stale.

**Files:**
- Modify: `1-objectives/constraints/CON-dark-luxury-aesthetic.md`
- Modify: `1-objectives/CLAUDE.objectives.md` (constraints index row — update summary)

**Step 1: Edit CON-dark-luxury-aesthetic.md**

Replace the Impact section. Key changes:
- Line 19: "No light mode is provided" → "Dark/Planetarium is the primary mode; Bright/Solar System is a supported secondary mode"
- Add: Bright mode tokens must maintain the luxury aesthetic (no generic "white mode")
- Add: OLED-first principle applies to the primary mode; bright mode uses warm neutrals, not pure white

New Impact section:
```markdown
## Impact

- Dark/Planetarium is the primary OLED-first mode; Bright/Solar System is a supported secondary mode
- All UI components must be themed for both modes using DEC-design-system-v2 tokens
- Dark mode: OLED black backgrounds, gold/sapphire accents, maximum contrast for bioluminescent elements
- Bright mode: warm neutral backgrounds (not pure white), muted gold accents — must still convey the luxury aesthetic
- No component may use hardcoded colors — all color values must come from mode-aware CSS custom properties
- Accessibility (WCAG contrast ratios) must be verified against both dark and bright backgrounds
- Wu-Xing element colors (Wood, Fire, Earth, Metal, Water) must be defined as design tokens for both modes
- Derived requirement: [REQ-USA-wcag-contrast](../requirements/REQ-USA-wcag-contrast.md)
- Related requirement: [REQ-F-depth-navigation](../requirements/REQ-F-depth-navigation.md) — transition animations must use obsidian/gold palette
- Related requirement: [REQ-F-progressive-ui-fluidity](../requirements/REQ-F-progressive-ui-fluidity.md) — fluid affordances must use obsidian/gold palette
```

**Step 2: Update CLAUDE.objectives.md constraints index row**

Change summary from:
`Dark OLED-first design with obsidian/gold palette, Wu-Xing element colors`
to:
`Dark OLED-first primary + Bright secondary; obsidian/gold palette, Wu-Xing element tokens, both modes themed`

**Step 3: Verify no other files hardcode "no light mode"**

Run: `grep -r "no light mode\|No light mode\|kein Light Mode" 1-objectives/ 2-design/ --include="*.md"`
Expected: Only the old CON file (now fixed). If others exist, flag for follow-up.

**Step 4: Commit**

```bash
git add 1-objectives/constraints/CON-dark-luxury-aesthetic.md 1-objectives/CLAUDE.objectives.md
git commit -m "fix(spec): CON-dark-luxury-aesthetic acknowledges Bright Mode as secondary"
```

---

### Task 2: I-2 — Update US-daily-coherence-visibility to match new coherence model

**Why:** AC 3 says "Hohe/Mittlere/Niedrige Übereinstimmung" range labels. The updated GOAL and REQ-F-daily-chart-coherence-hero AC 4 explicitly prohibit "Mittlere Übereinstimmung" as the primary explanation. The user story must align with the new baseline + delta coherence model.

**Files:**
- Modify: `1-objectives/user-stories/US-daily-coherence-visibility.md`
- Modify: `1-objectives/CLAUDE.objectives.md` (user stories index row — update summary if needed)

**Step 1: Edit US-daily-coherence-visibility.md**

Replace AC 3 (line 17):
```
OLD: - [ ] A neutral label describes the range: "Hohe Übereinstimmung" (70–100), "Mittlere Übereinstimmung" (40–69), "Niedrige Übereinstimmung" (0–39)
NEW: - [ ] The coherence visualization shows `base_coherence` (stable personal baseline) plus `positive_daily_delta` (today's activation), accompanied by a short explanatory sentence — not a qualitative range label like "Mittlere Übereinstimmung"
```

Replace AC 4 (line 18) — driver strip is now part of the hero, not a separate pill bar:
```
OLD: - [ ] A driver strip shows 4 pills (Geomagnetik, Solardruck, Transit-Resonanz, Tagesfeld) with calm/active/tense colour coding
NEW: - [ ] A compact driver strip inside the Daily Chart hero shows current values for Geomagnetik (Kp), Solardruck, Transit-Resonanz, and Tagesfeld with calm/active/tense colour coding
```

**Step 2: Commit**

```bash
git add 1-objectives/user-stories/US-daily-coherence-visibility.md
git commit -m "fix(spec): US-daily-coherence-visibility aligns with baseline+delta coherence model"
```

---

### Task 3: I-3 — Note DEC supersession on REQ-F-daily-chart-dashboard-order (no file change)

**Why:** REQ-F-daily-chart-dashboard-order (Implemented) says "Daily Chart before Planetarium." DEC-dashboard-volatile-first now defines a stricter order. The requirement is not wrong — it's a subset. No artifact change needed, just acknowledge.

**Action:** Skip — no file modification. The gap analysis records this as "noted, no action required." The decision's enforcement rules supersede.

---

### Task 4: m-1 — Restore dropped user stories to GOAL-daily-chart-coherence-first

**Why:** The FlashDoc update dropped `US-daily-resonance-badges`, `US-daily-single-api-call`, and `US-daily-impact-only-call` from the goal's Related Artifacts. These stories still exist, are still valid, and trace back to this goal.

**Files:**
- Modify: `1-objectives/goals/GOAL-daily-chart-coherence-first.md`

**Step 1: Edit GOAL-daily-chart-coherence-first.md**

In the Related Artifacts section, restore the 3 dropped user stories to the `User stories:` line:

```markdown
- User stories: [US-daily-coherence-visibility](../user-stories/US-daily-coherence-visibility.md), [US-daily-active-planets](../user-stories/US-daily-active-planets.md), [US-daily-planet-transparency](../user-stories/US-daily-planet-transparency.md), [US-daily-cosmic-weather](../user-stories/US-daily-cosmic-weather.md), [US-daily-impulse-text](../user-stories/US-daily-impulse-text.md), [US-daily-action-recommendation](../user-stories/US-daily-action-recommendation.md), [US-daily-resonance-badges](../user-stories/US-daily-resonance-badges.md), [US-daily-single-api-call](../user-stories/US-daily-single-api-call.md), [US-daily-impact-only-call](../user-stories/US-daily-impact-only-call.md)
```

**Step 2: Commit**

```bash
git add 1-objectives/goals/GOAL-daily-chart-coherence-first.md
git commit -m "fix(spec): restore 3 dropped user stories to GOAL-daily-chart-coherence-first"
```

---

### Task 5: m-2 — Self-document ASM-noaa-in-fufre invalidation in REQ-F-coherence-hero-impact-datasource

**Why:** The requirement references `ASM-noaa-in-fufre` which is Invalidated. The note already says "currently provided via server-side spaceWeatherCache" but doesn't explicitly call out the invalidation. Future agents could be confused.

**Files:**
- Modify: `1-objectives/requirements/REQ-F-coherence-hero-impact-datasource.md`

**Step 1: Edit REQ-F-coherence-hero-impact-datasource.md**

Replace:
```
- [ASM-noaa-in-fufre](../assumptions/ASM-noaa-in-fufre.md) — solar_pressure component requires NOAA data; currently provided via server-side spaceWeatherCache pass-through.
```
With:
```
- [ASM-noaa-in-fufre](../assumptions/ASM-noaa-in-fufre.md) — **Invalidated.** FuFirE does not have NOAA data. Resolved: solar_pressure is provided via server-side spaceWeatherCache pass-through (`server.mjs /api/space-weather/extended`).
```

**Step 2: Commit**

```bash
git add 1-objectives/requirements/REQ-F-coherence-hero-impact-datasource.md
git commit -m "fix(spec): document ASM-noaa-in-fufre invalidation in coherence datasource req"
```

---

### Task 6: m-3 — Skip (no action)

**Why:** A frontend TTI performance requirement for the hero is optional. The existing API perf requirements (≤2s p95 for `/experience/daily`, ≤800ms p95 for `/impact/active`) plus the skeleton-state AC in REQ-F-daily-chart-coherence-hero cover the critical path. A separate REQ-PERF-daily-chart-hero-tti can be added later if real-world measurements warrant it.

**Action:** Skip — noted in gap analysis as "optional, defer to post-launch metrics."

---

### Task 7: Update CLAUDE.md Current State + mark gap analysis fresh

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update the gap analysis line**

Replace the stale gap analysis line with:
```
**Objectives gap analysis (2026-04-14, Daily Chart focus):** 0 Critical, 3 Important (all resolved: CON-dark-luxury-aesthetic bright mode acknowledged, US-daily-coherence-visibility aligned with baseline+delta, REQ-F-daily-chart-dashboard-order noted as DEC subset), 3 Minor (2 resolved: goal user story links restored, ASM invalidation documented; 1 deferred: hero TTI perf req optional). **(fresh)**
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: gap analysis 2026-04-14 — 3 Important + 3 Minor resolved"
```
