# REQ-F-daily-chart-dashboard-order: Daily chart dashboard order

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Dashboard ordering for daily chart modules must be specified independently from implementation state until rollout completes.

## Acceptance Criteria

- Given spec-only changes without merged runtime behavior, when requirement statuses are reviewed, then status remains `Draft` or `Approved` and not `Implemented`.
- Given phase-gate traceability checks, when they evaluate status fields, then the requirement state reflects actual shipped code.
