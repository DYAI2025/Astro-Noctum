/**
 * useElementTheme — applies the user's dominant Wu-Xing element to the UI.
 *
 * Sets three CSS custom properties on :root:
 *   --element-accent          element color (consumed by --tile-accent in bright mode)
 *   --ui-transition-duration  element-specific motion speed
 *   --ui-transition-easing    element-specific motion curve
 *
 * Also sets `data-element` on <body> so CSS can apply element-tinted card glows.
 *
 * Cleans up on unmount or when dominantElement becomes empty.
 *
 * Decision: DEC-wuxing-ui-mapping — element colors always come from
 * the centralised CSS tokens (--color-element-*), never hardcoded hex.
 */

import { useEffect } from 'react';
import { getWuxingByKey } from '../lib/astro-data/wuxing';

// Per-element motion physics — each element has a distinct energy signature.
// Water: slow + fluid spring  |  Fire: fast + sharp
// Wood: medium + organic spring  |  Metal: crisp + precise
// Earth: grounded, standard
const ELEMENT_MOTION: Record<string, { duration: string; easing: string }> = {
  Wood:  { duration: '0.38s', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  Fire:  { duration: '0.20s', easing: 'cubic-bezier(0.55, 0, 0.1, 1)' },
  Earth: { duration: '0.45s', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  Metal: { duration: '0.25s', easing: 'cubic-bezier(0.4, 0, 0, 1)' },
  Water: { duration: '0.55s', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
};

export function useElementTheme(dominantElement: string): void {
  useEffect(() => {
    const el = getWuxingByKey(dominantElement);
    if (!el) return;

    const root = document.documentElement;
    const cssKey = el.key.toLowerCase(); // 'wood' | 'fire' | 'earth' | 'metal' | 'water'
    const motion = ELEMENT_MOTION[el.key] ?? ELEMENT_MOTION.Earth;

    // Set CSS vars — referencing the authoritative design-system token avoids
    // hardcoded hex values (DEC-wuxing-ui-mapping + DEC-design-system-v2).
    root.style.setProperty('--element-accent', `var(--color-element-${cssKey})`);
    root.style.setProperty('--ui-transition-duration', motion.duration);
    root.style.setProperty('--ui-transition-easing', motion.easing);

    // Body attribute enables CSS element-tinted card glow rules in index.css
    document.body.setAttribute('data-element', el.key);

    return () => {
      root.style.removeProperty('--element-accent');
      root.style.removeProperty('--ui-transition-duration');
      root.style.removeProperty('--ui-transition-easing');
      document.body.removeAttribute('data-element');
    };
  }, [dominantElement]);
}
