import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PremiumGate } from '../components/PremiumGate';

let mockIsPremium = false;

vi.mock('../hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: mockIsPremium, loading: false }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('../lib/authedFetch', () => ({ authedFetch: vi.fn() }));

describe('PremiumGate accessibility', () => {
  it('hides blurred content from screen readers when not premium', () => {
    mockIsPremium = false;
    const { container } = render(
      <PremiumGate>
        <p>Secret premium content</p>
      </PremiumGate>
    );
    const blurredDiv = container.querySelector('[aria-hidden="true"]');
    expect(blurredDiv).not.toBeNull();
    expect(blurredDiv?.textContent).toContain('Secret premium content');
  });

  it('does not use aria-hidden when user is premium', () => {
    mockIsPremium = true;
    const { container } = render(
      <PremiumGate>
        <p>Premium content visible</p>
      </PremiumGate>
    );
    const blurredDiv = container.querySelector('[aria-hidden="true"]');
    expect(blurredDiv).toBeNull();
    expect(screen.getByText('Premium content visible')).toBeDefined();
  });
});
