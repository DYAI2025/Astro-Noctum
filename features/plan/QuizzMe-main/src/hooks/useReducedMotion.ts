/**
 * useReducedMotion Hook
 *
 * Detects user's motion preference from system settings
 * Returns true if user prefers reduced motion
 *
 * Based on WCAG accessibility guidelines and spec requirements
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return;
        }

        // Query the media query
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Listen for changes
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        }
        // Legacy browsers
        else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
        }

        // Cleanup
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);

    return prefersReducedMotion;
}
