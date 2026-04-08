Phase-specific instructions for the **Design** phase. Extends [../CLAUDE.md](../CLAUDE.md).

## Purpose

This phase defines **how** we're building the system. Focus on architecture, data models, APIs, and key technical decisions.

## Files in This Phase

| File | Purpose |
|------|---------|
| [`architecture.md`](architecture.md) | System architecture overview and diagrams |
| [`data-model.md`](data-model.md) | Data structures, schemas, and relationships |
| [`api-design.md`](api-design.md) | API specifications and contracts |
| [`decisions/`](decisions/) | Decision Records (`DEC-kebab-name`) |

---

## Decisions Relevant to This Phase

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When designing data storage, auth flows, or new tables |
| [DEC-swiss-ephemeris](decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE for all astrological calculations | When designing any feature that needs astrological data |
| [DEC-wuxing-ui-mapping](decisions/DEC-wuxing-ui-mapping.md) | Wu-Xing elements drive UI physics via centralized mapping | When designing any visualization using element data or colors |
| [DEC-master-signal-weights](decisions/DEC-master-signal-weights.md) | Master Signal formula locked: 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost | When proposing changes to signal weights, fusion formula, or adding new signal sources |
| [DEC-dissonance-model](decisions/DEC-dissonance-model.md) | Layered dissonance model (d_natal / d_accumulated / d_elemental) | When designing signature visualization, quiz-to-visual mapping, or transition animations |
| [DEC-signatur-v3-bipolar-trails](decisions/DEC-signatur-v3-bipolar-trails.md) | Bipolar trail engine (V3) replaces particle spirograph | When designing or modifying the Signatur renderer, trail parameters, or pole behavior |
| [DEC-multi-agent-voice](decisions/DEC-multi-agent-voice.md) | Config-driven multi-agent voice architecture (Levi + Eve) | When adding voice agents, modifying agent UI, or changing conversation persistence |
| [DEC-vibes-not-daily](decisions/DEC-vibes-not-daily.md) | "Vibes" on-demand (2–3h) instead of fixed daily insight | When designing Vibes UI, CTA text, or API endpoint naming |
| [DEC-no-number-without-explanation](decisions/DEC-no-number-without-explanation.md) | No numerical value in UI without explanation | When adding any numerical display, chart, or score to the UI |
| [DEC-top-3-weekly-focus](decisions/DEC-top-3-weekly-focus.md) | Weekly Insights highlights exactly 3 life areas as focus | When designing the Weekly Insights layout or prioritization algorithm |
| [DEC-design-system-v2](decisions/DEC-design-system-v2.md) | Unified design system with dark/bright mode tokens | When creating or modifying any UI component, color, spacing, or typography |
| [DEC-spiritual-tech-interactions](decisions/DEC-spiritual-tech-interactions.md) | Spiritual Tech interaction philosophy (transitions, errors, loading) | When writing error handling UI, adding animations, designing loading states |
| [DEC-dashboard-volatile-first](decisions/DEC-dashboard-volatile-first.md) | Dashboard section ordering: volatile/live content above static natal data | When modifying Dashboard.tsx render order or adding a new Dashboard section |
| [DEC-fusion-bazi-sheng-ke](decisions/DEC-fusion-bazi-sheng-ke.md) | Planet-to-Wu-Xing mapping + Sheng/Ke resonance algorithm (locked) | When implementing or modifying fusion-bazi/resonance.ts or any planet-element mapping |
| [DEC-vibes-gemini-strategy](decisions/DEC-vibes-gemini-strategy.md) | Gemini for Vibes and Weekly Insights generation with two-level caching | When modifying Vibes/Weekly generation logic, model, prompts, or cache strategy |
| [DEC-navigation-shell](decisions/DEC-navigation-shell.md) | Top bar: 3 primary items + Settings menu; horizontal bar preserved; mobile responsive | When adding nav items, implementing top bar or Settings, or making mobile layout decisions |

---

## Linking to Other Phases

- Reference requirements from `1-objectives/` to justify design choices
- Design documents guide implementation in `3-code/`
- Infrastructure design informs deployment in `4-deploy/`
