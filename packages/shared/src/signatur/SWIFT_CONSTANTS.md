# SWIFT_CONSTANTS — Signatur V3 Swift Port Reference

> **Single Source of Truth**: These constants are derived from `dimension-defs.ts`.
> Do NOT edit these values by hand. If `DIMENSION_DEFS` changes, update this file
> and run the Hz guard-test (`TASK-sbridge-hz-constants`) to verify consistency.
>
> **Last synced**: 2026-03-29 from `dimension-defs.ts`

---

## DimensionDef Swift Struct

```swift
struct DimensionDef {
    let id: String
    let poleA: String
    let poleB: String
    let baseAngle: Double      // radians; Pol B = baseAngle + .pi
    let hz: Double             // Cousto frequency — drives movement speed
    let colorA: (Double, Double, Double)  // RGB [0, 1]
    let colorB: (Double, Double, Double)  // RGB [0, 1]
}
```

---

## DIMENSION_DEFS Array

```swift
let DIMENSION_DEFS: [DimensionDef] = [
    DimensionDef(
        id:         "assertion",
        poleA:      "Durchsetzung",
        poleB:      "Hingabe",
        baseAngle:  0.0,                          // 0° — Aries/Mars
        hz:         144.72,                       // Mars — Cousto
        colorA:     (1.0,  0.15, 0.12),           // Mars red
        colorB:     (0.68, 0.55, 1.0)             // Soft violet
    ),
    DimensionDef(
        id:         "empathy",
        poleA:      "Einfühlung",
        poleB:      "Abgrenzung",
        baseAngle:  Double.pi / 3,                // 60° — Cancer-adjacent
        hz:         210.42,                       // Moon — fastest pole (highest Hz)
        colorA:     (0.68, 0.55, 1.0),            // Moon violet
        colorB:     (0.38, 0.52, 0.72)            // Saturn steel
    ),
    DimensionDef(
        id:         "creativity",
        poleA:      "Schöpfung",
        poleB:      "Struktur",
        baseAngle:  2.0 * Double.pi / 3,          // 120° — Leo
        hz:         126.22,                       // Sun — slowest pole (lowest Hz)
        colorA:     (1.0,  0.72, 0.12),           // Sun gold
        colorB:     (0.20, 0.95, 1.0)             // Mercury cyan
    ),
    DimensionDef(
        id:         "logic",
        poleA:      "Analyse",
        poleB:      "Synthese",
        baseAngle:  Double.pi,                    // 180° — Virgo–Libra axis
        hz:         141.27,                       // Mercury
        colorA:     (0.20, 0.95, 1.0),            // Mercury cyan
        colorB:     (1.0,  0.40, 0.72)            // Venus pink
    ),
    DimensionDef(
        id:         "intuition",
        poleA:      "Ahnung",
        poleB:      "Evidenz",
        baseAngle:  4.0 * Double.pi / 3,          // 240° — Sagittarius
        hz:         183.58,                       // Jupiter — 2nd fastest after Moon
        colorA:     (1.0,  0.88, 0.0),            // Jupiter gold
        colorB:     (0.38, 0.52, 0.72)            // Saturn steel
    ),
    DimensionDef(
        id:         "discipline",
        poleA:      "Ordnung",
        poleB:      "Freiheit",
        baseAngle:  5.0 * Double.pi / 3,          // 300° — Capricorn–Aquarius
        hz:         147.85,                       // Saturn
        colorA:     (0.38, 0.52, 0.72),           // Saturn steel
        colorB:     (1.0,  0.88, 0.0)             // Jupiter gold
    ),
]
```

---

## Speed Formula

```swift
/// Log-normalize Hz to [0, 1] range (same formula as TypeScript logNormHz)
func logNormHz(_ freq: Double) -> Double {
    let lo = log(100.0)
    let hi = log(300.0)
    return min(max((log(freq) - lo) / (hi - lo), 0.0), 1.0)
}

/// Base speed for a pole from its Cousto frequency
/// Matches: baseSpeed = 0.003 + logNorm(hz) * 0.008 in bipolar-engine.ts
func poleBaseSpeed(hz: Double) -> Double {
    return 0.003 + logNormHz(hz) * 0.008
}
```

---

## Expected Hz Values (for unit tests)

| Dimension | Planet | Hz |
|---|---|---|
| assertion | Mars | 144.72 |
| empathy | Moon | 210.42 |
| creativity | Sun | 126.22 |
| logic | Mercury | 141.27 |
| intuition | Jupiter | 183.58 |
| discipline | Saturn | 147.85 |

Moon (empathy) = fastest pole. Sun (creativity) = slowest pole.

---

## Determinism Note

The hash function used for Lissajous frequency ratios must be identical on both platforms:

```swift
/// Deterministic pseudo-random [0, 1] — matches hash01() in bazodiac-engine.ts
func hash01(seed: Double, k: Double) -> Double {
    let raw = sin(seed * 12.9898 + k * 78.233) * 43758.5453123
    return ((raw.truncatingRemainder(dividingBy: 1.0)) + 1.0).truncatingRemainder(dividingBy: 1.0)
}
```

Same `seed` + `k` must produce the same result on TypeScript and Swift to guarantee
cross-platform determinism (REQ-F-signatur-determinism).
