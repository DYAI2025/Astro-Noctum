# Stakeholders

Everyone with a stake in the system: those who use it, fund it, maintain it, or are affected by it. Every requirement should trace back to a stakeholder need.

## Influence Levels

- **High** — can approve or veto decisions; priority conflicts resolved in their favor
- **Medium** — consulted during review; concerns addressed but may be overruled
- **Low** — informed of decisions; needs considered but not blocking

## Stakeholder Table

| ID | Role | Description | Interests | Influence |
|----|------|-------------|-----------|-----------|
| STK-ben | Product owner / developer / operator | Builds and ships Astro-Noctum; owns the dev brief; approves aphorisms before they enter the production pool ("Ben approved min. 15 Aphorismen" is a manual gate per the brief); owns deployment, monetization, and roadmap. Sole decision-maker for the project. | Shipping the active sprint; conversion-funnel hygiene (exactly one primary upgrade CTA, working Stripe checkout); content-quality control on aphorisms; engineering health (typecheck clean, no buildbreakers, reduced polling per GreenOps); preserving astrological-formula correctness (no changes to formulas, scoring, ephemeris, BaZi, Wu-Xing — explicit Non-Goal). | High |
| STK-user-free | Free-tier visitor of the web app | Lands on the dashboard without a paid subscription; primary acquisition target; sees exactly one primary upgrade CTA; may have an incomplete profile (no birth data) and follow the profile-completion path. | A stable daily orientation flow (DailyChartHero today, eventual TagespulsCard with aphorism + Council of Six); clear profile-completion path when birth data is missing; visible degraded-state markers so generic fallback content is never presented as personalized output; access to the 3D natal-signature sphere as the core value hook; not being spammed with redundant upgrade CTAs. | Medium |
| STK-user-premium | Paying subscriber | Same dashboard surface, paid tier. Has no upgrade CTAs; gets `ManageSubscription`; has access to deeper interpretation surfaces (Council of Six Phase 2 LLM-generated interpretation, premium agent unlocks). | Depth (per-figure LLM interpretation, premium agent surfaces); manageable subscription (cancellation, billing transparency); same data-truth guarantees as free users (no fallback masquerading as live data); reliable rendering of the 3D signature sphere for fully-completed profiles. | Medium |
