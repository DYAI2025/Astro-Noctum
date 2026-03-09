# Test Debt Registry

This file tracks skipped or flaky tests that need attention.

## Active Debt

| Test File | Test Name | Reason | Fix Idea | Owner | Date Logged |
|-----------|-----------|--------|----------|-------|-------------|
| `src/components/quizzes/SocialRoleQuiz.test.tsx` | `submits valid registry markers to new ingestion pipeline` | Fake timers conflict with dynamic imports causing 15s timeout | 1. Replace fake timers with `waitFor` polling. 2. Mock dynamic import at module level. 3. Reduce click-through loop to 3 questions. | @unassigned | 2025-12-22 |

## Resolved Debt

_None yet._

---

## Policy

- Tests may be skipped with `it.skip()` only if logged here.
- Each entry must have a fix idea and owner within 2 sprints.
- Skipped tests count against test coverage metrics.
