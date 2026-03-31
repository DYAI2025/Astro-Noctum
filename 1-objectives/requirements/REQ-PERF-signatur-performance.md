# REQ-PERF-signatur-performance: Signatur Cross-Platform Performance Targets

**Type**: Performance

**Status**: Implemented

**Priority**: Must-have

**Source**: [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

Cross-platform performance targets for the Signatur rendering engine, covering frame rate, load time, memory usage, and API latency. These targets ensure the Signatur feels fluid on every supported platform without draining device resources.

## Acceptance Criteria

- Given a desktop browser (Chrome/Safari, 2020+ hardware), when the V2 engine renders 28K particles, then the frame rate is ≥60fps
- Given a mobile browser (viewport <768px), when the engine renders, then it uses a reduced particle tier and maintains ≥30fps
- Given the iOS native app (iPhone 12+), when the engine renders ~6.8K particles, then the frame rate is ≥30fps
- Given any platform, when the Signatur loads, then the first visible frame appears within 2 seconds of data availability
- Given the iOS native app, when rendering for 60 seconds continuously, then GPU memory usage stays below 150MB
- Given the transit state poll (`/api/transit-state/:userId`), when the server responds, then the response time is <500ms at p95
