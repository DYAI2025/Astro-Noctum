# KohaerenzHero Plan (Contract Normalization)

## Purpose

Normalize coherence/impact contracts to prevent frontend/backend divergence and double fetching.

## Canonical data model

- `harmony_index`: normalized float in `[0.0, 1.0]`.
- `harmony_percent`: optional derived display value (`0` to `100`) computed from `harmony_index`.
- `day_mode`: derived client/server semantic state from `harmony_index`; represented in TypeScript by `DayHarmonicState`, and never a separate source domain.

## Source of truth policy

1. Prefer `GET /api/impact/active` when calling through the app proxy; upstream route is `GET /impact/active`, for coherence hero and related impact modules.
2. Use `POST /api/experience/daily` only as fallback when calling through the app proxy; upstream fallback route is `POST /experience/daily`.
3. When the primary source is present, disable secondary space-weather hooks for the same screen to avoid double-fetching and stale divergence.

## Traceability/status guardrail

- Requirements must only be labeled `Implemented` after merged code and verification checks exist in runtime paths.
- Planning/spec-only PRs should keep related requirements in `Draft` or `Approved`.
