// src/__tests__/levi-section.test.tsx
// S-DP-11 / S-DP-12 regression: text size, no italic, single CTA button
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de' as const,
    t: (k: string) => {
      const map: Record<string, string> = {
        'dashboard.levi.active': 'Aktiv',
        'dashboard.levi.ready': 'Bereit',
        'dashboard.levi.activeDesc': 'Levi ist aktiv.',
        'dashboard.levi.readyDesc': 'Levi ist bereit.',
        'dashboard.levi.callBtn': 'Levi rufen',
        'dashboard.levi.hangUpBtn': 'Auflegen',
        'dashboard.premium.cta': 'Premium freischalten',
      };
      return map[k] ?? k;
    },
  }),
}));

// Stub the authedFetch dynamic import used in handleLeviUpgrade
vi.mock('@/src/lib/authedFetch', () => ({
  authedFetch: vi.fn(),
}));

import { DashboardLeviSection } from '@/src/components/dashboard/DashboardLeviSection';

const baseProps = {
  isPremium: true,
  userId: 'test-user-id',
  onStopAudio: vi.fn(),
  onResumeAudio: vi.fn(),
  sunSign: 'Aries',
  zodiacAnimal: 'Dragon',
  dominantEl: 'Wood',
};

describe('DashboardLeviSection — S-DP-11 & S-DP-12', () => {
  it('renders exactly one action button for premium user (idle state)', () => {
    render(<DashboardLeviSection {...baseProps} />);
    const buttons = screen.getAllByRole('button');
    // Only the single call CTA should be present in idle state
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Levi rufen');
  });

  it('renders exactly one action button for non-premium user', () => {
    render(<DashboardLeviSection {...baseProps} isPremium={false} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Premium freischalten');
  });

  it('description paragraph has no italic class', () => {
    const { container } = render(<DashboardLeviSection {...baseProps} />);
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach((p) => {
      expect(p.className).not.toMatch(/\bitalic\b/);
    });
  });

  it('description paragraph does not use text-xs or text-[11px] (too small)', () => {
    const { container } = render(<DashboardLeviSection {...baseProps} />);
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach((p) => {
      expect(p.className).not.toMatch(/\btext-xs\b/);
      expect(p.className).not.toMatch(/text-\[11px\]/);
    });
  });
});
