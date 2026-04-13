# US-daily-planet-transparency: Each Planet Influence is Fully Explained

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want to understand why each planet is active today (aspect, strength, Wu-Xing resonance), so that I can trust the information shown rather than treating it as black-box output.

## Acceptance Criteria

- [ ] Each active planet card shows: BaZi element, resonance type (Gleichklang/Nährung/Kontrolle/Neutral), resonance intensity (gering/mittel/stark)
- [ ] Card styling (colour, border) reflects `bazi_resonance.type` and `intensity` via `RESONANCE_CARD_STYLE` mapping
- [ ] No free-text "feeling" labels on planet cards — only structured labels derived from data fields
- [ ] The `evidence.resonance_formula` string is accessible (either shown inline or via tap) so users can see the calculation

## Related Artifacts

- Requirements: [REQ-F-active-planets-frontend](../requirements/REQ-F-active-planets-frontend.md), [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md)
- Constraints: [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md)
