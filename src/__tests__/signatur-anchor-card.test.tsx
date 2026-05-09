import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const, t: (k: string) => k, setLang: vi.fn() }),
}));

import { SignaturAnchorCard } from '../components/dashboard/SignaturAnchorCard';

describe('SignaturAnchorCard (TASK-2.2)', () => {
  it('SAC-001: renders preview + CTA', () => {
    render(<SignaturAnchorCard dominantElement="Fire" birthSign="Aries" />);
    expect(screen.getByTestId('signatur-anchor-card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signatur/i })).toBeInTheDocument();
  });

  it('SAC-002: CTA navigates to /signatur', async () => {
    const user = userEvent.setup();
    render(<SignaturAnchorCard dominantElement="Fire" birthSign="Aries" />);
    await user.click(screen.getByRole('button', { name: /signatur/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/signatur');
  });

  it('SAC-003: empty state when neither prop is provided', () => {
    render(<SignaturAnchorCard />);
    expect(screen.getByTestId('signatur-anchor-card')).toBeInTheDocument();
  });
});
