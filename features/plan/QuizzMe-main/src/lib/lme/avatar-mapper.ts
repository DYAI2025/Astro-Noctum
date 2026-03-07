
// LME/DUBA - Slice 1: Avatar Mapper
// Translates PsycheState into visual parameters for the DynamicAvatar component.

import { PsycheState } from './psyche-state';

export interface AvatarParams {
    baseHue: number;        // 0-360: Primary color
    secondaryHue: number;   // 0-360: Secondary gradient color
    complexity: number;     // 0-1: Number of shapes/layers
    spikiness: number;      // 0-1: Smooth vs Sharp edges
    glowIntensity: number;  // 0-1: Blur radius / bloom
    noiseOpacity: number;   // 0-1: Grit/Texture
    rotationSpeed: number;  // 0-1: Animation speed
    symmetry: number;       // 0-1: How symmetrical the layout is (1=perfect, 0=chaotic)
    seed: number;           // Derived from state to keep it consistent
}

/**
 * Maps the multidimensional psyche state to visual parameters.
 */
export function mapPsycheToAvatar(state: PsycheState): AvatarParams {
    const { shadow, connection, structure, emergence, depth } = state;

    // 1. Color (Hue)
    // Connection -> Warmth (Red/Orange/Pink)
    // Depth -> Coolness (Purple/Blue)
    // Structure -> Stability (Blue/Teal)
    // Shadow -> Dark/Mystery (Desaturated or specific hues handled in component logic, but here we set base hue)

    // High Connection = closer to 0 (Red) or 340 (Pink)
    // High Depth = closer to 260 (Purple)
    // High Structure = closer to 200 (Blue)

    // Weighted Hue Calculation:
    // We use a vector addition approach roughly
    let x = 0;
    let y = 0;

    // Connection pulls to 0° (Red)
    x += connection.value * Math.cos(0);
    y += connection.value * Math.sin(0);

    // Structure pulls to 200° (Blue) -> 3.49 rad
    x += structure.value * Math.cos(3.49);
    y += structure.value * Math.sin(3.49);

    // Depth pulls to 270° (Purple) -> 4.71 rad
    x += depth.value * Math.cos(4.71);
    y += depth.value * Math.sin(4.71);

    // Emergence pulls to 60° (Yellow) -> 1.04 rad
    x += emergence.value * Math.cos(1.04);
    y += emergence.value * Math.sin(1.04);

    let baseHue = (Math.atan2(y, x) * 180) / Math.PI;
    if (baseHue < 0) baseHue += 360;

    // 2. Secondary Hue: Shifted by Emergence (Variation)
    const secondaryHue = (baseHue + 30 + (emergence.value * 60)) % 360;

    // 3. Complexity: Derived from Shadow + Emergence
    // More shadow/emergence = more complex, layered forms
    const complexity = (shadow.value * 0.5 + emergence.value * 0.5);

    // 4. Spikiness: Structure vs Shadow
    // Structure = smooth, geometric
    // Shadow = sharp, jagged, or undefined
    // Emergence also adds some unpredictability
    const spikiness = (shadow.value * 0.7) - (structure.value * 0.3);

    // 5. Glow: Depth
    const glowIntensity = Math.max(0.2, depth.value);

    // 6. Symmetry: Structure
    const symmetry = structure.value;

    // 7. Seed: Constant based on current values (so it doesn't jitter on re-render unless values change)
    const seed = connection.value + structure.value + shadow.value;

    return {
        baseHue,
        secondaryHue,
        complexity,
        spikiness: Math.max(0, Math.min(1, spikiness + 0.3)), // Normalize
        glowIntensity,
        noiseOpacity: shadow.value * 0.5,
        rotationSpeed: 0.1 + (emergence.value * 0.2),
        symmetry,
        seed
    };
}
