# US-signatur-density-field: Numerical Signatur Representation for Comparison

**Status**: Draft

**Source**: [GOAL-signatur-phase2-density](../goals/GOAL-signatur-phase2-density.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

As a power user, I want my Signatur to produce a persistent 128×128 density field representing my unique geometry, so that my signature can be numerically compared to others and the bijective reconstruction principle can be verified.

## Acceptance Criteria

- [ ] A 128×128 float grid is derived from the V3 engine's trail data
- [ ] The density field can be persisted to `user_signature_state.signature_blueprint_json`
- [ ] Two density fields are comparable via cosine similarity → produces a normalized score [0, 1]
- [ ] The input vector can be approximately reconstructed from the density field (error < 5%)

## Related Artifacts

- Requirements: [REQ-F-signatur-density-field](../requirements/REQ-F-signatur-density-field.md), [REQ-F-signatur-determinism](../requirements/REQ-F-signatur-determinism.md)
