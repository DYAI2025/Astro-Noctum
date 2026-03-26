import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    loading: false,
  }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    setLang: vi.fn(),
    t: (key: string) => key,
  }),
}));

import { AuthGate } from '../components/AuthGate';

describe('AuthGate restructure', () => {
  it('shows login section above register section', () => {
    render(<AuthGate />);
    const allHeadings = screen.getAllByRole('heading');
    const loginIdx = allHeadings.findIndex(h => /einloggen|login|auth\.signin/i.test(h.textContent || ''));
    const registerIdx = allHeadings.findIndex(h => /registrieren|register|auth\.register/i.test(h.textContent || ''));
    expect(loginIdx).toBeGreaterThanOrEqual(0);
    expect(registerIdx).toBeGreaterThanOrEqual(0);
    expect(loginIdx).toBeLessThan(registerIdx);
  });

  it('shows language selector in register section', () => {
    render(<AuthGate />);
    expect(screen.getByLabelText(/sprache|language/i)).toBeDefined();
  });
});
