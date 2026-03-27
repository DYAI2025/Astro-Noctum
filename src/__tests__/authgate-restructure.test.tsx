import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
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
  it('toggles between login and register views', () => {
    render(<AuthGate />);
    // Default: login heading uses t('auth.signin')
    const loginHeading = screen.getByRole('heading', { level: 2 });
    expect(loginHeading.textContent).toMatch(/auth\.signin/i);

    // Click toggle button (uses raw German text, not i18n key)
    const toggleBtn = screen.getByRole('button', { name: /jetzt registrieren/i });
    fireEvent.click(toggleBtn);

    // Now register heading uses t('auth.register')
    const registerHeading = screen.getByRole('heading', { level: 2 });
    expect(registerHeading.textContent).toMatch(/auth\.register/i);
  });

  it('shows language selector', () => {
    render(<AuthGate />);
    const toggleBtn = screen.getByRole('button', { name: /jetzt registrieren/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByLabelText(/sprache|language/i)).toBeDefined();
  });
});
