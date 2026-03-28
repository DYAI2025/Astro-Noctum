# Signatur Performance — All-Platform Test Matrix

**Sprint:** S-SIG Phase 4
**Scope:** Cross-platform performance validation for REQ-PERF-signatur-performance

---

## Automated Benchmarks (Vitest)

Run: `npx vitest run src/__tests__/signatur-v3-performance.test.ts`

| Benchmark | Target | Metric |
|-----------|--------|--------|
| Desktop frame (60fps) | <16.6ms/frame | Engine math only |
| Mobile frame (30fps) | <33.3ms/frame | Reduced trail config |
| First frame readiness | <50ms from data ready | Init + dissonance + first update |
| 100 cold starts | avg <10ms, p95 <20ms | Full init pipeline |
| Trail memory bound | maxTrailLength respected | No unbounded growth |
| Dissonance compute | <0.5ms | Natal + quiz + external |

## Transit State API Benchmark

Run: `node scripts/benchmark-transit-state.mjs`

| Metric | Target | Notes |
|--------|--------|-------|
| p95 latency | <500ms | Under 5 concurrent requests |
| Fallback rate | <10% | FuFirE timeouts trigger profile-derived fallback |
| Success rate | >95% | 4xx/5xx counted as failures |

Requires: `BENCHMARK_USER_ID`, `BENCHMARK_TOKEN`, optionally `BENCHMARK_URL`.

## Manual Performance Checklist

### Desktop (Chrome/Safari, 2020+ hardware)

| # | Check | Target | How to verify |
|---|-------|--------|---------------|
| 1 | V3 frame rate | >=60fps | Chrome DevTools → Performance tab → record 10s on `/signatur` |
| 2 | First visible frame | <2s from page load | Network tab: time from last data response to first paint |
| 3 | Trail rendering | No jank | Visually smooth, no dropped frames during 30s observation |
| 4 | Adaptive tier | High (2000 trails) | Console: check config logged at mount |
| 5 | Memory stable | No growth over 60s | Performance tab → Memory, observe heap over 1 minute |

### Mobile Web (Safari iOS / Chrome Android)

| # | Check | Target | How to verify |
|---|-------|--------|---------------|
| 1 | Frame rate | >=30fps | Safari Web Inspector → Timeline |
| 2 | Adaptive tier | Medium/Low | Console: trail config matches viewport |
| 3 | No thermal throttle | Device stays cool | Hold device for 60s while Signatur renders |
| 4 | Audio gesture | Plays after tap | Tap page, audio starts on Safari |
| 5 | Tab switch | No leak | Switch tabs 5x, check JS heap |

### API Server (Railway production)

| # | Check | Target | How to verify |
|---|-------|--------|---------------|
| 1 | Transit-state p95 | <500ms | Run benchmark script against production URL |
| 2 | Fallback behavior | Graceful | Block FuFirE (bad URL), verify X-Transit-Fallback header |
| 3 | Space weather cache | 5-min TTL | Two requests within 5 min, second should be instant |

## Results Log

Record benchmark results here after each run:

```
Date: ____
Environment: ____
Desktop fps: ____
Mobile fps: ____
Transit p95: ____ms
Notes: ____
```
