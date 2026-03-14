# Fu-Ring Standalone Evolution Roadmap

## Goals
- Achieve 60 FPS on low-end mobile devices.
- Reach visual parity with the original artistic vision.
- Minimize bundle size and memory footprint.
- Find the most maintainable and performant framework for dynamic astrology visualizations.

## Current Sprint: Framework Battle
- [x] **Prototype 1: Three.js + Custom Shaders** (Completed)
  - Results: Excellent performance (GPU bound), higher complexity for "Korona" strands.
- [x] **Prototype 2: PixiJS (WebGL 2D)** (Completed)
  - Results: Superior 2D stability, lower memory overhead, winner for mobile.
- [ ] **Prototype 3: SVG + GSAP/Framer Motion** (Optional/Fallback)
  - Goal: Evaluate accessibility and DOM-based crispness for simpler UI versions.
- [x] **Performance Benchmarking** (Completed)
  - Compare memory usage and CPU/GPU load across Three.js and PixiJS.

## Next Sprint: Final Integration
- Select winning framework based on mobile performance.
- Port full "Korona" and "Tension" logic.
- Replace production `FusionRing.tsx`.

## Milestones
| Milestone | Target | Status |
|-----------|--------|--------|
| Performance Audit | March 11 | ✅ |
| WebGL Prototype | March 11 | ✅ |
| Framework Selection | March 13 | ⏳ |
| Production Release | March 15 | ⏳ |
