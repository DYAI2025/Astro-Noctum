# DEC-house-system-placidus: Placidus as the House System

**Status**: Active

**Category**: Architecture

**Scope**: backend, frontend

**Source**: n/a

**Last updated**: 2026-04-10

## Context

FuFirE Natal calculations use Placidus as the house system. The question was whether to align with FuFirE or offer a choice (Placidus vs. Koch). A consistent house system is required for all chart calculations, synastry, and narrative generation.

## Decision

Use **Placidus** as the sole house system for all natal, transit, and synastry calculations — consistent with FuFirE Natal. No runtime switching between house systems in V1.

## Enforcement

### Trigger conditions

- **Code phase**: whenever a house system parameter is passed to FuFirE or displayed in UI
- **Code phase**: when implementing synastry or composite chart endpoints

### Required patterns

- Always pass `house_system: "placidus"` (or the equivalent FuFirE default) in chart requests
- UI may label houses as "Häuser (Placidus)" in tooltips/info contexts
- No house-system selector in V1

### Prohibited patterns

- Koch or any other house system in V1
- Exposing a house system toggle to users
