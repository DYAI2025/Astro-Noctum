import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useIsMobile — Consistent mobile detection hook
// Single source of truth for breakpoint detection across the app.
// Uses matchMedia for efficiency (no resize listener spam).
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export function useBreakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl'): boolean {
  const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 };
  const px = breakpoints[breakpoint];

  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= px;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${px}px)`);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [px]);

  return matches;
}
