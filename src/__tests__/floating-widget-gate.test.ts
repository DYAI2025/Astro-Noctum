// src/__tests__/floating-widget-gate.test.ts
//
// Phase D2 unit test for the AgentFloatingWidget mount gate.
//
// Asserts the three branches of the single-CTA invariant:
//   AFW-D2-001 — free user on /            → widget HIDDEN
//   AFW-D2-002 — free user on /signatur    → widget VISIBLE (PremiumUpgradeModal owns upsell)
//   AFW-D2-003 — premium user on / (any)   → widget VISIBLE
//
// References:
//   docs/plans/2026-05-07-dashboard-cta-consolidation.md  Phase D2
//   src/lib/floating-widget-gate.ts
//   src/App.tsx <FloatingWidgetGate/>
//
import { describe, it, expect } from 'vitest';
import { shouldShowFloatingWidget } from '@/src/lib/floating-widget-gate';

describe('shouldShowFloatingWidget — Phase D2 gate', () => {
  it('AFW-D2-001: free user on / does NOT see AgentFloatingWidget', () => {
    expect(shouldShowFloatingWidget(false, '/')).toBe(false);
  });

  it('AFW-D2-002: free user on /signatur DOES see AgentFloatingWidget', () => {
    expect(shouldShowFloatingWidget(false, '/signatur')).toBe(true);
  });

  it('AFW-D2-003: premium user on / DOES see AgentFloatingWidget', () => {
    expect(shouldShowFloatingWidget(true, '/')).toBe(true);
  });

  // Defensive: premium users see the widget on every route, including
  // routes that don't exist yet. This is the "voice-agent shortcut on
  // every page" guarantee for paying users.
  it('premium user on /any-route DOES see AgentFloatingWidget', () => {
    expect(shouldShowFloatingWidget(true, '/wu-xing')).toBe(true);
    expect(shouldShowFloatingWidget(true, '/wissen')).toBe(true);
    expect(shouldShowFloatingWidget(true, '/onboarding')).toBe(true);
  });

  // Defensive: free users on any non-/signatur route are hidden.
  // Confirms /signatur is a strict allow-list match (not a prefix).
  it('free user on routes other than /signatur are hidden', () => {
    expect(shouldShowFloatingWidget(false, '/wu-xing')).toBe(false);
    expect(shouldShowFloatingWidget(false, '/wissen')).toBe(false);
    expect(shouldShowFloatingWidget(false, '/signatur/quizzes')).toBe(false);
  });
});
