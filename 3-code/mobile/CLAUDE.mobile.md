Component-specific instructions for **mobile**. Extends [../CLAUDE.code.md](../CLAUDE.code.md).

# Mobile App

**Responsibility**: iOS app — Dashboard (cosmic profile, space weather, AI interpretation), Signatur visualization (2D bootstrap view, 3D SignaturCanvas planned), universal quiz renderer, multi-agent voice (Levi + Eve via WebView), offline contribution queue with auto-flush.

**Technology**: Expo 53, React Native 0.79, `@react-navigation` (tab + stack), `@bazodiac/shared` (signal math, quiz schemas, i18n), AsyncStorage (caching), SecureStore (device identity), expo-gl + three.js (SignaturCanvas — not yet mounted)

## Code Location

All mobile source code lives in [`../../apps/mobile/`](../../apps/mobile/).
For code conventions and dev setup see [`../../CLAUDE.md`](../../CLAUDE.md).

## Interfaces

- **HTTP → api-server**: All `/api/*` calls for calculations, Experience API, contributions. Uses same endpoints as web frontend.
- **`@bazodiac/shared`**: Imports quiz definitions (`QuizDefinition`), scoring engine (`scoreQuiz`), signal math, i18n strings via `"file:../../packages/shared"` dependency.
- **Supabase SDK (client-side)**: Auth flows, profile reads — same RLS rules as web.
- **AsyncStorage**: Offline contribution queue (`offlineQueue.ts`), bootstrap cache, daily horoscope cache.
- **Deep linking**: `bazodiac://` scheme for cross-app navigation.

## Requirements Addressed

| File | Type | Priority | Summary |
|------|------|----------|---------|
| [REQ-F-natal-chart-calculation](../../1-objectives/requirements/REQ-F-natal-chart-calculation.md) | REQ-F | Must | DashboardScreen renders BAFE results via api-server |
| [REQ-F-quiz-contribution-system](../../1-objectives/requirements/REQ-F-quiz-contribution-system.md) | REQ-F | Must | QuizScreen with QuizRenderer + offline queue |
| [REQ-F-fusion-ring-visualization](../../1-objectives/requirements/REQ-F-fusion-ring-visualization.md) | REQ-F | Must | FuRingScreen (2D bootstrap view; 3D SignaturCanvas planned) |
| [REQ-F-agent-architecture-refactor](../../1-objectives/requirements/REQ-F-agent-architecture-refactor.md) | REQ-F | Must | Generic multi-agent UI (Levi + Eve agent selection tiles) |
| [REQ-F-agent-dashboard-selection](../../1-objectives/requirements/REQ-F-agent-dashboard-selection.md) | REQ-F | Must | Agent selection tiles on mobile Dashboard |
| [REQ-USA-mobile-first-readability](../../1-objectives/requirements/REQ-USA-mobile-first-readability.md) | REQ-USA | Must | Mobile-first layout, <10s comprehension |
| [REQ-PERF-signatur-performance](../../1-objectives/requirements/REQ-PERF-signatur-performance.md) | REQ-PERF | Must | 30fps iOS native, <2s first frame |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-backend](../../2-design/decisions/DEC-supabase-backend.md) | Supabase as sole backend data layer | When writing data access or auth code |
| [DEC-swiss-ephemeris](../../2-design/decisions/DEC-swiss-ephemeris.md) | Swiss Ephemeris via BAFE | When consuming chart data from api-server |
| [DEC-wuxing-ui-mapping](../../2-design/decisions/DEC-wuxing-ui-mapping.md) | Wu-Xing elements drive UI physics | When writing components with element-specific styling |
| [DEC-multi-agent-voice](../../2-design/decisions/DEC-multi-agent-voice.md) | Levi + Eve as fixed voice personas | When adding agents or modifying agent UI |

## Notes

`REQ-F-signatur-mobile-native` (expo-gl spirograph approach) is **Deprecated** — superseded by `REQ-F-signatur-ios-swift` (native Swift renderer, tracked in a separate Swift repository outside this monorepo).
