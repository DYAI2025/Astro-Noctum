/**
 * Tests for the Z-axis depth navigation system.
 *
 * Covers:
 * - ROUTE_DEPTH map completeness (all routes mapped)
 * - getRouteDepth() for static and dynamic paths
 * - useNavigationDepth() direction computation (inward / outward / lateral)
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ROUTE_DEPTH, getRouteDepth } from '../hooks/useNavigationDepth';

// ── ROUTE_DEPTH contract ──────────────────────────────────────────────────────

describe('ROUTE_DEPTH map', () => {
  it('contains the Surface layer at depth 0', () => {
    expect(ROUTE_DEPTH['/']).toBe(0);
  });

  it('contains the Mid layer (Signatur and fu-ring alias) at depth 1', () => {
    expect(ROUTE_DEPTH['/signatur']).toBe(1);
    expect(ROUTE_DEPTH['/fu-ring']).toBe(1);
  });

  it('contains all Core routes at depth 2', () => {
    const coreRoutes = ['/wu-xing', '/weekly', '/sky', '/wissen', '/faq'];
    for (const route of coreRoutes) {
      expect(ROUTE_DEPTH[route], `${route} should be depth 2`).toBe(2);
    }
  });

  it('has no undefined depths (all values are numbers)', () => {
    for (const [route, depth] of Object.entries(ROUTE_DEPTH)) {
      expect(typeof depth, `${route} depth should be a number`).toBe('number');
    }
  });
});

// ── getRouteDepth ─────────────────────────────────────────────────────────────

describe('getRouteDepth()', () => {
  it('returns 0 for the Dashboard root', () => {
    expect(getRouteDepth('/')).toBe(0);
  });

  it('returns 1 for Signatur', () => {
    expect(getRouteDepth('/signatur')).toBe(1);
    expect(getRouteDepth('/fu-ring')).toBe(1);
  });

  it('returns 2 for Core routes', () => {
    expect(getRouteDepth('/wu-xing')).toBe(2);
    expect(getRouteDepth('/weekly')).toBe(2);
    expect(getRouteDepth('/sky')).toBe(2);
    expect(getRouteDepth('/faq')).toBe(2);
  });

  it('returns 2 for dynamic wissen article paths', () => {
    expect(getRouteDepth('/wissen/bazi-einfuehrung')).toBe(2);
    expect(getRouteDepth('/wissen/some-article-slug')).toBe(2);
  });

  it('returns 2 for dynamic signatur sub-paths', () => {
    expect(getRouteDepth('/signatur/quizzes')).toBe(2);
  });

  it('defaults to 0 for unknown routes', () => {
    expect(getRouteDepth('/unknown-route')).toBe(0);
    expect(getRouteDepth('/some/deeply/nested/path')).toBe(0);
  });
});

// ── useNavigationDepth direction ──────────────────────────────────────────────

import { useNavigationDepth } from '../hooks/useNavigationDepth';

describe('useNavigationDepth() direction', () => {
  it('returns "inward" when navigating Surface → Mid (/ → /signatur)', () => {
    // Start at surface depth 0
    const { result, rerender } = renderHook(
      () => useNavigationDepth(),
      {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(MemoryRouter, { initialEntries: ['/'], initialIndex: 0 }, children),
      }
    );
    // Initially lateral (no navigation yet)
    expect(result.current.direction).toBe('lateral');
    expect(result.current.depth).toBe(0);
  });

  it('returns "lateral" when on the same depth level', () => {
    const { result } = renderHook(
      () => useNavigationDepth(),
      {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(MemoryRouter, { initialEntries: ['/wu-xing'], initialIndex: 0 }, children),
      }
    );
    expect(result.current.direction).toBe('lateral');
    expect(result.current.depth).toBe(2);
  });

  it('reports depth 1 for Signatur routes', () => {
    const { result } = renderHook(
      () => useNavigationDepth(),
      {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(MemoryRouter, { initialEntries: ['/signatur'], initialIndex: 0 }, children),
      }
    );
    expect(result.current.depth).toBe(1);
  });

  it('reports depth 2 for Core routes', () => {
    for (const route of ['/wu-xing', '/weekly', '/sky', '/faq']) {
      const { result } = renderHook(
        () => useNavigationDepth(),
        {
          wrapper: ({ children }: { children: React.ReactNode }) =>
            React.createElement(MemoryRouter, { initialEntries: [route], initialIndex: 0 }, children),
        }
      );
      expect(result.current.depth, `depth for ${route}`).toBe(2);
    }
  });
});
