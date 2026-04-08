# REQ-F-dashboard-bazi-fusion-bridge: Western–BaZi Planet Fusion Bridge

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Dashboard must produce a fusion interpretation for every displayed transiting planet by mapping it to the Wu-Xing five-element system and evaluating its resonance with the user's BaZi Day Master via the Sheng (generating) and Ke (controlling) cycles. This is the core brand differentiator: Western ephemeris data and BaZi tradition are computed together, not shown in parallel silos. The result is a short German-language interpretation sentence that reflects the personal relationship between the planet's element and the user's natal element today.

The calculation must be:
- **Pure and deterministic** — same planet + same Day Master always produces the same resonance type and intensity
- **Fully documented** — every mapped value (planet element, Day Master element, cycle type) must be traceable to its source (traditional Chinese astronomy, Sheng/Ke rules)
- **Fully tested** — all five resonance types (gleichklang, naehrung-forward, naehrung-backward, kontrolle-forward, kontrolle-backward) covered by unit tests

Planet-to-element mappings follow traditional Chinese astronomy:
- Sonne → Feuer, Mars → Feuer
- Mond → Wasser, Merkur → Wasser
- Jupiter → Holz
- Saturn → Erde
- Venus → Metall

## Acceptance Criteria

- Given a Western planet name and a user's BaZi Day Master stem, when `calculatePlanetBaziResonance()` is called, then it returns a `ResonanceResult` with `type`, `intensity` (0–1), `planetElement`, `dayMasterElement`, and a German `quote` string without brand-voice violations ("Sie", "Horoskop", "Schicksal", "enthuellen")
- Given the planet element equals the Day Master element, when resonance is computed, then type is `gleichklang` and intensity is ≥ 0.80
- Given the planet element generates the Day Master element (Sheng-forward), when resonance is computed, then type is `naehrung` and intensity is in range 0.70–0.80
- Given the Day Master element generates the planet element (Sheng-backward), when resonance is computed, then type is `naehrung` and intensity is in range 0.60–0.70
- Given the planet element controls the Day Master element (Ke-forward), when resonance is computed, then type is `kontrolle` and intensity is in range 0.65–0.75
- Given the Day Master element controls the planet element (Ke-backward), when resonance is computed, then type is `kontrolle` and intensity is in range 0.65–0.75
- Given no Sheng or Ke relationship applies, when resonance is computed, then type is `neutral` and intensity is ≤ 0.45
- Given a planet card is rendered on the Dashboard, when the BaZi block is visible, then it displays: the planet's Wu-Xing element name in German (Feuer|Wasser|Holz|Metall|Erde), the resonance type as a badge, and the `quote` as one-line italic text
- Given the user's BaZi Day Master stem is unavailable (profile incomplete), when the planet card is rendered, then the Western block is shown without the BaZi block, and a neutral German notice "BaZi-Profil nicht verfuegbar" is displayed in its place
- Given the entire planet grid is rendered, when no planet's `is_retrograde` is true, then no retrograde indicator appears; when `is_retrograde` is true for a planet, then a typographic "R" indicator (no emoji) appears on that card
- Given a unit test suite for `fusion-bazi/resonance.ts`, when run, then all six resonance branches (gleichklang, sheng-forward, sheng-backward, ke-forward, ke-backward, neutral) have at least one passing test with a concrete planet + Day Master pair

## Related Artifacts

- [REQ-F-dashboard-live-daily-signals](REQ-F-dashboard-live-daily-signals.md) — live transit data that feeds the Western block of each planet card
- [REQ-F-transparency-rule](REQ-F-transparency-rule.md) — every rendered value must have a documented source
