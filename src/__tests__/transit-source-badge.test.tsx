/**
 * TransitSourceBadge — transparency badge shown when the Signatur ring is
 * not driven by live FuFirE transit data.
 *
 * Contract (no-placeholder-fake directive):
 *   - `source === 'live'`             → renders nothing.
 *   - `source === 'fallback-profile'` → renders a visible static-natal label.
 *   - `source === 'fallback-neutral'` → renders a visible neutral-pattern label.
 *   - `reason` is appended to the tooltip hint when present.
 *   - DE + EN copy variants both cover label + hint.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransitSourceBadge } from '../components/signatur/TransitSourceBadge';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k, setLang: vi.fn() }),
}));

describe('TransitSourceBadge', () => {
  it('renders nothing when source is live', () => {
    const { container } = render(<TransitSourceBadge source="live" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the static-natal label when source is fallback-profile', () => {
    render(<TransitSourceBadge source="fallback-profile" />);
    const badge = screen.getByTestId('transit-source-badge');
    expect(badge.getAttribute('data-source')).toBe('fallback-profile');
    expect(badge.textContent).toContain('Statische Natal-Signatur');
  });

  it('renders the neutral label + amber tone when source is fallback-neutral', () => {
    render(<TransitSourceBadge source="fallback-neutral" />);
    const badge = screen.getByTestId('transit-source-badge');
    expect(badge.getAttribute('data-source')).toBe('fallback-neutral');
    expect(badge.textContent).toContain('Neutrale Signatur');
    // amber tone class applied on the neutral variant so the user perceives
    // it as more alarming than the profile-derived fallback.
    expect(badge.className).toMatch(/amber/);
  });

  it('appends reason into the tooltip hint when provided', () => {
    render(<TransitSourceBadge source="fallback-profile" reason="FuFirE 503" />);
    const badge = screen.getByTestId('transit-source-badge');
    expect(badge.getAttribute('title')).toContain('FuFirE 503');
  });

  it('uses aria-live="polite" so screen readers announce the state quietly', () => {
    render(<TransitSourceBadge source="fallback-neutral" />);
    const badge = screen.getByTestId('transit-source-badge');
    expect(badge.getAttribute('role')).toBe('status');
    expect(badge.getAttribute('aria-live')).toBe('polite');
  });
});
