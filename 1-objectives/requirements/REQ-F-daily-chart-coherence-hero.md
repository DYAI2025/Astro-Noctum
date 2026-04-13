# REQ-F-daily-chart-coherence-hero: Daily chart coherence hero

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The coherence hero must render from a single normalized data contract and avoid mixed-source reads.

## Acceptance Criteria

- Given daily hero render, when impact data is resolved, then hero fields use only the resolved source contract.
- Given day harmonic state derivation, when computing state from `harmony_index`, then derivation operates on `[0.0, 1.0]` values.
