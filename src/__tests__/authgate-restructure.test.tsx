import { render, screen, fireEvent } from '@testing-library/react';
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
  it('toggles between login and register views', () => {
    render(<AuthGate />);
    // By default, only login should be visible
    expect(screen.queryByText(/registrieren|register/i, { selector: 'h2' })).toBeNull();
    const loginHeading = screen.getByRole('heading', { level: 2 });
    expect(loginHeading.textContent).toMatch(/einloggen|login/i);

    // Click toggle button
    const toggleBtn = screen.getByRole('button', { name: /jetzt registrieren/i });
    fireEvent.click(toggleBtn);

    // Now register should be visible
    const registerHeading = screen.getByRole('heading', { level: 2 });
    expect(registerHeading.textContent).toMatch(/registrieren|register/i);
  });

  it('shows language selector', () => {
    render(<AuthGate />);
    // Switch to register view first
    const toggleBtn = screen.getByRole('button', { name: /jetzt registrieren/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByLabelText(/sprache|language/i)).toBeDefined();
  });
});
