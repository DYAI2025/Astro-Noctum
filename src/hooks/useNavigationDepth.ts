/**
 * useNavigationDepth — Z-axis depth navigation
 *
 * Tracks the current route's depth layer (Surface → Mid → Core) and
 * computes the transition direction for AnimatePresence page transitions.
 *
 * Depth layers per docs/wireframes/depth-navigation-v1.md:
 *   0 = Surface  (Dashboard)
 *   1 = Mid      (Signatur)
 *   2 = Core     (Wu-Xing, Weekly, Sky, Wissen, FAQ)
 */

import { useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** Source of truth for route depths. Extend when new routes are added. */
export const ROUTE_DEPTH: Record<string, number> = {
  '/':                 0,  // Surface — Dashboard
  '/signatur':         1,  // Mid — Signatur
  '/fu-ring':          1,  // Mid — Signatur (alias)
  '/signatur/quizzes': 2,  // Core — Quiz selection
  '/wu-xing':          2,  // Core — Five Elements detail
  '/weekly':           2,  // Core — Weekly Insights
  '/sky':              2,  // Core — Sky / Space Weather
  '/wissen':           2,  // Core — Article index
  '/faq':              2,  // Core — FAQ
};

/** Returns depth for any pathname, including dynamic segments. */
export function getRouteDepth(pathname: string): number {
  if (ROUTE_DEPTH[pathname] !== undefined) return ROUTE_DEPTH[pathname];
  if (pathname.startsWith('/wissen/')) return 2;  // Core — individual articles
  if (pathname.startsWith('/signatur/')) return 2; // Core — Signatur sub-views
  return 0; // Default to Surface for unknown routes
}

export type TransitionDirection = 'inward' | 'outward' | 'lateral';

/**
 * Returns the transition direction based on depth delta between
 * previous and current route, plus the current depth level.
 *
 * Computes direction synchronously during render so AnimatePresence
 * can pick up the correct `initial` variant for the entering route.
 */
export function useNavigationDepth(): { direction: TransitionDirection; depth: number } {
  const location = useLocation();
  const currentDepth = getRouteDepth(location.pathname);

  const prevDepthRef = useRef(currentDepth);
  const directionRef = useRef<TransitionDirection>('lateral');

  // Synchronous ref mutation is intentional here: direction must be
  // computed in the same render cycle that creates the AnimatePresence key
  // so the entering route receives the correct `initial` variant.
  if (prevDepthRef.current !== currentDepth) {
    directionRef.current = currentDepth > prevDepthRef.current ? 'inward' : 'outward';
    prevDepthRef.current = currentDepth;
  }

  return { direction: directionRef.current, depth: currentDepth };
}
