/**
 * Delta-Driven Animation Utilities
 *
 * Provides duration calculation and motion configuration for delta-driven animations
 * according to the character sheet specification.
 *
 * Formula: duration_ms = clamp(450, 1400, 450 + 1200 * delta_magnitude)
 */

/**
 * Calculates animation duration based on delta magnitude
 *
 * @param deltaMagnitude - Absolute value of the change (0..1)
 * @returns Duration in milliseconds (450-1400ms)
 *
 * Examples:
 * - Small delta (0.01): 462ms
 * - Medium delta (0.1): 570ms
 * - Large delta (0.3): 810ms
 * - Very large delta (0.5+): 1050-1400ms
 */
export function calcDeltaDuration(deltaMagnitude: number): number {
    const raw = 450 + 1200 * deltaMagnitude;
    return Math.max(450, Math.min(1400, raw));
}

/**
 * Creates a Framer Motion transition config for delta-driven animations
 *
 * @param deltaMagnitude - Absolute value of the change
 * @param delay - Optional delay in seconds
 * @param reducedMotion - Whether user prefers reduced motion
 * @returns Framer Motion transition object
 */
export function createDeltaTransition(
    deltaMagnitude: number,
    delay = 0,
    reducedMotion = false
) {
    const durationMs = reducedMotion ? 250 : calcDeltaDuration(deltaMagnitude);
    const durationSec = durationMs / 1000;

    return {
        duration: durationSec,
        delay: reducedMotion ? 0 : delay, // Remove delays in reduced motion
        ease: 'easeOut' as const,
    };
}

/**
 * Calculates animation duration in seconds (for use with Framer Motion)
 *
 * @param deltaMagnitude - Absolute value of the change
 * @param reducedMotion - Whether user prefers reduced motion
 * @returns Duration in seconds
 */
export function calcAnimationDuration(
    deltaMagnitude: number,
    reducedMotion = false
): number {
    if (reducedMotion) return 0.25; // 250ms for reduced motion
    const durationMs = calcDeltaDuration(deltaMagnitude);
    return durationMs / 1000;
}

/**
 * Determines if a dimension should be highlighted as a "mover"
 *
 * @param movers - List of top movers from delta
 * @param dimensionName - Name of the dimension to check
 * @returns True if this dimension is in the top movers list
 */
export function isTopMover(
    movers: Array<{ dimension: string; magnitude: number }>,
    dimensionName: string
): boolean {
    return movers.some(m => m.dimension === dimensionName);
}

/**
 * Generates highlight glow keyframes for top movers
 *
 * @returns Framer Motion animation config for glow effect
 */
export function createMoverGlowAnimation() {
    return {
        initial: { boxShadow: '0 0 0 0 rgba(210, 169, 90, 0)' },
        animate: {
            boxShadow: [
                '0 0 0 0 rgba(210, 169, 90, 0)',
                '0 0 0 2px rgba(210, 169, 90, 0.4)',
                '0 0 0 2px rgba(210, 169, 90, 0.4)',
                '0 0 0 0 rgba(210, 169, 90, 0)',
            ],
        },
        transition: {
            duration: 2.5,
            times: [0, 0.3, 0.7, 1],
            ease: 'easeInOut',
        },
    };
}
