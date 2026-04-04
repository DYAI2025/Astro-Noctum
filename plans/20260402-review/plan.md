# Codebase Review Plan — April 2026

## Overview
This plan addresses the findings from the comprehensive codebase review of Astro-Noctum (Bazodiac). The focus is on improving type safety, performance, and maintainability while ensuring a high-end "Spiritual Tech" aesthetic.

## Priority 1: High Safety & Reliability
- **Phase 1: TypeScript Strict Mode**: Enable `strict: true` in `tsconfig.json` and resolve resulting errors.
- **Phase 2: Eliminate `any`**: Replace `any` and `as any` with proper interfaces, especially for Three.js and API responses.

## Priority 2: High Performance
- **Phase 3: 3D Optimization**: Optimize `BirthChartOrrery` and `FusionRingCanvasV2` by moving CPU-heavy computations to shaders or using more efficient Three.js primitives (InstancedMesh, LineSegments).
- **Phase 4: API Batching**: Implement a bulk calculation endpoint in `server.mjs` to reduce network overhead.

## Priority 3: Maintainability
- **Phase 5: Backend Modularization**: Refactor `server.mjs` into a structured `src/server/` directory with separate routes, services, and middleware.
- **Phase 6: UI Refinement**: Continue unifying the design system via `src/index.css` and semantic variables.

## Timeline
- **Week 1**: Phases 1 & 2 (Type Safety)
- **Week 2**: Phases 3 & 4 (Performance)
- **Week 3**: Phases 5 & 6 (Architecture & UI)
