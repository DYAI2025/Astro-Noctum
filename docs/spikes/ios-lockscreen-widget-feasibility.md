# iOS Lock Screen Widget — Feasibility Spike

**Date:** 2026-04-10
**Status:** Research complete — deferred, implementation not recommended before V1 Vibes
**Spike task:** TASK-ios-lockscreen-widget-spike

---

## Summary

An iOS Lock Screen widget for Bazodiac's daily Signatur display is technically feasible but requires
native Swift WidgetKit code that cannot be delivered via Expo alone. The path forward depends on
which app (Expo or Swift) the team prioritises for iOS distribution.

**Recommendation: defer until after Phase V1 Vibes ships. Implement via the Swift app (`Astro-IOs`),
not the Expo app.**

---

## Technical Constraints

### WidgetKit is Swift-only

iOS Lock Screen widgets are built with the `WidgetKit` framework (Apple SDK, Swift/SwiftUI only).
They run as a **separate app extension target** — a distinct binary bundled alongside the host app.

There is no official React Native or Expo SDK for WidgetKit. Community solutions exist
(`react-native-widgetkit`, `@bacons/apple-targets`) but they require:
- Ejecting from Expo managed workflow → **bare workflow or custom dev client**
- A native `ios/` directory checked into the repo (currently absent in `apps/mobile/`)
- Swift extension files authored and maintained separately

### Current Expo setup (`apps/mobile/`)

| Aspect | Current state |
|--------|---------------|
| Expo SDK | ~53 (managed workflow, no `ios/` dir) |
| EAS Build | Configured (`eas.json`) — can produce native builds |
| Bundle ID | `space.bazodiac.mobile` |
| Native modules | None beyond Expo SDK builtins |

Adding WidgetKit to the Expo app would require:
1. `npx expo prebuild` → generates `ios/` and `android/` directories
2. Xcode: add a new Widget Extension target
3. Write the widget in Swift/SwiftUI
4. Share data via an **App Group** container (UserDefaults/FileManager with shared group ID)
5. Keep `ios/` in source control and maintain it going forward

This is a **one-way door** for the Expo app — once prebuilt, the managed workflow is gone.
Expo Go and simple `npx expo start` development break; all dev happens via custom dev client.

### Alternative: Swift app (`Bazodiac-Mobile/Astro-IOs/`)

The Swift/SwiftUI app at `Bazodiac-Mobile/Astro-IOs/` is already a native Xcode project.
Adding a WidgetKit extension there is a **standard Xcode workflow** with no managed-workflow tradeoffs:
- File → New Target → Widget Extension
- Share data via App Group (UserDefaults with `group.space.bazodiac`)
- No impact on the Expo app

This is the lower-risk path if a widget ships before the Expo app is production-primary.

---

## What the Widget Would Display

A Bazodiac Lock Screen widget makes sense showing the **daily Signatur summary** — a snapshot that
changes once per day and does not need live transit polling.

### Widget sizes (WidgetKit)

| Size | Content recommendation |
|------|----------------------|
| `systemSmall` (Lock Screen rectangular) | Day Master element symbol + today's dominant resonance (1 line) |
| `accessoryRectangular` (Lock Screen) | Day Master + top planet resonance label + Feldstärke tier |
| `accessoryCircular` (Lock Screen) | Wu-Xing element glyph + tier dot indicator |

### Data source

The widget cannot call a live API on every render (background fetch is rate-limited to ~15 min).
The host app must write widget data into a shared App Group on foreground launch.

Proposed data contract (stored as JSON in App Group UserDefaults):

```swift
struct WidgetSnapshot: Codable {
    let dayMasterStem: String        // e.g. "Jia"
    let dayMasterElement: String     // e.g. "Wood"
    let topResonancePlanet: String   // e.g. "Jupiter"
    let topResonanceType: String     // e.g. "gleichklang"
    let feldstaerkeTier: String      // "gering" | "mittel" | "stark"
    let updatedAt: Date
}
```

The host app (Swift or Expo native module) writes this after a successful daily bootstrap/transit fetch.

---

## Effort Estimate

| Path | Effort | Risk |
|------|--------|------|
| Swift app (`Astro-IOs/`) | 1–2 days | Low — standard Xcode workflow |
| Expo app (prebuild) | 3–5 days setup + 1–2 days widget | High — breaks managed workflow, ongoing native maintenance |

---

## Recommendation

1. **Do not add WidgetKit to the Expo app** (`apps/mobile/`) — the managed workflow loss is too costly at this stage.
2. **Implement via the Swift app** (`Bazodiac-Mobile/Astro-IOs/`) once Phase V1 Vibes is shipped and the daily transit data endpoint is stable.
3. **Pre-requisite before widget implementation:** confirm App Group ID (`group.space.bazodiac`) and shared UserDefaults key contract between host app and widget extension.
4. **When ready:** create three concrete tasks:
   - `TASK-ios-widget-appgroup` — configure App Group, write WidgetSnapshot from Swift app daily bootstrap
   - `TASK-ios-widget-extension` — Xcode Widget Extension target, SwiftUI views for 3 sizes
   - `TASK-ios-widget-manual-test` — runbook: widget appears on Lock Screen, data updates on app foreground

---

## Decision Required Before Implementation

None blocking this spike. The following open question must be answered before any implementation task starts:

> **OQ-widget:** Should the widget ship with the Expo app (bare workflow) or the Swift app (`Astro-IOs/`)? This determines the technical path entirely.
