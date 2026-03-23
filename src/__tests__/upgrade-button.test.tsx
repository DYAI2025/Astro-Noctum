import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpgradeButton } from '../components/UpgradeButton';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'en', setLang: vi.fn() }),
}));
vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));

const mockFetch = vi.fn();
vi.mock('../lib/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => mockFetch(...args),
}));

describe('UpgradeButton', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows error message when checkout returns non-ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });

    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('dashboard.premium.checkoutError')).toBeDefined();
    });
  });

  it('shows error message when checkout returns no URL', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('dashboard.premium.checkoutError')).toBeDefined();
    });
  });

  it('shows error message on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<UpgradeButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('dashboard.premium.checkoutError')).toBeDefined();
    });
  });

  it('clears error on next click attempt', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ url: 'https://stripe.com/checkout' }) });

    render(<UpgradeButton />);

    // First click — error
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('dashboard.premium.checkoutError')).toBeDefined();
    });

    // Second click — error should clear immediately
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.queryByText('dashboard.premium.checkoutError')).toBeNull();
    });
  });
});
