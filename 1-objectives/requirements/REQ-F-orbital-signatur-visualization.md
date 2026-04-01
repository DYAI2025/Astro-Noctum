# REQ-F-orbital-signatur-visualization: Orbital Signatur Visualization

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

A parametric ellipse visualization on the Dashboard that renders the user's emotional Home-Base as a living orbital chart in Valence × Arousal space. The ellipse is mathematically derived from UED (User Emotion Dynamics) metrics — center from home_base values, semi-axes from variability, and perturbation from instability/reactivity. The visualization breathes with a 5s animation cycle, creating an "orbital signature" that reflects the Fusion Ring's Keplerian metaphor.

The chart uses Chart.js scatter mode with two datasets: a reference Home-Base Ellipse (stable, gold, dashed) and a perturbed Trajectory (dynamic, with wobble derived from instability_level).

## Mathematical Specification

**Home-Base Ellipse:**
```
x(θ) = cx + a · cos(θ)
y(θ) = cy + b · sin(θ)

cx = home_base.valence       (ellipse center X)
cy = home_base.arousal        (ellipse center Y)
a  = σ_v × k_v               (semi-major axis, k_v = 0.8)
b  = σ_a × k_a               (semi-minor axis, k_a = 0.6)
θ  ∈ [0, 2π], Δθ = 0.05 rad  (~126 points for smooth curve)
```

**Perturbed Trajectory:**
```
p_i = (v_i + δ · sin(2π · t_i + φ), a_i + δ · cos(2π · t_i + φ))

δ = instability_level × 0.15  (wobble amplitude)
φ = (π/2) × rise_rate         (phase shift from reactivity)
t_i = order_index_i / max_index  (normalized time)
```

**Dynamic Parameters:**
- Rise Rate (high) → δ increases, Bezier tension rises (0.4 → 0.8)
- Recovery Rate (low) → softer easing (easeOutCubic), slower pulse
- Trigger events → local scale-flash + gold glow on nearest point

## Acceptance Criteria

- Given a user with a completed astro profile, when the Orbital Signatur chart renders, then a parametric ellipse is visible centered on the user's home_base valence/arousal coordinates
- Given the ellipse parameters, when derived from UED metrics, then the semi-major axis equals σ_v × 0.8 and the semi-minor axis equals σ_a × 0.6
- Given the Home-Base Ellipse dataset, when rendered, then it displays as a gold (#D4AF37) dashed line with ~126 points and zero point radius
- Given the perturbed trajectory, when instability_level > 0, then trajectory points visibly deviate from the reference ellipse proportional to δ = instability_level × 0.15
- Given the chart, when displayed on screen, then the ellipse breathes with a 5-second ease-in-out infinite CSS animation cycle
- Given trajectory points, when rendered, then point radius equals 4 + 6 × dominance and color is derived from the dominant discrete_emotion via HSL mapping
- Given the same user profile at the same timestamp, when the chart renders twice, then the ellipse and trajectory are identical (deterministic)
- Given a mobile viewport (< 640px), when the chart renders, then it scales responsively without clipping or overflow

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — gold (#D4AF37) on obsidian background
- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — axis labels and tooltip values must have explanations
- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — orbit metaphor emphasizes cyclical return, not linear progress

## Related Assumptions

- [ASM-ued-metrics-available](../assumptions/ASM-ued-metrics-available.md) — UED metrics derivable from existing data
