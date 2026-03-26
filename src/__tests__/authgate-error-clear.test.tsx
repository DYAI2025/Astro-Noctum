import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock contexts before importing component
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue('Invalid credentials'),
    signUp: vi.fn().mockResolvedValue(null),
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

describe('AuthGate error clearing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears password mismatch error when user types in confirm password field', () => {
    render(<AuthGate />);

    // Switch to register view
    const toggleBtn = screen.getByRole('button', { name: /jetzt registrieren/i });
    fireEvent.click(toggleBtn);

    const passwordInputs = screen.getAllByPlaceholderText('auth.passwordPlaceholder');
    const registerPassword = passwordInputs[0];

    const confirmPassword = screen.getByPlaceholderText('auth.confirmPasswordPlaceholder');

    // Fill mismatched passwords
    fireEvent.change(registerPassword, { target: { value: 'password1' } });
    fireEvent.change(confirmPassword, { target: { value: 'password2' } });

    // We also need an email for the form to be valid, but since password mismatch
    // is checked before submit reaches signUp, we just need to trigger submit.
    const emailInputs = screen.getAllByPlaceholderText('auth.emailPlaceholder');
    const registerEmail = emailInputs[0];
    fireEvent.change(registerEmail, { target: { value: 'test@example.com' } });

    // Submit the register form
    const registerButton = screen.getByRole('button', { name: /konto erstellen|auth\.signUpBtn/i });
    fireEvent.click(registerButton);

    // Error should appear (password mismatch)
    expect(screen.getByText('auth.passwordMismatch')).toBeDefined();

    // Type in the confirm password field to correct it
    fireEvent.change(confirmPassword, { target: { value: 'password1' } });

    // Error should be cleared
    expect(screen.queryByText('auth.passwordMismatch')).toBeNull();
  });

  it('clears password mismatch error when user types in register password field', () => {
    render(<AuthGate />);

    const toggleBtn = screen.getByRole('button', { name: /jetzt registrieren/i });
    fireEvent.click(toggleBtn);

    const passwordInputs = screen.getAllByPlaceholderText('auth.passwordPlaceholder');
    const registerPassword = passwordInputs[0];
    const confirmPassword = screen.getByPlaceholderText('Passwort wiederholen');
    const emailInputs = screen.getAllByPlaceholderText('auth.emailPlaceholder');
    const registerEmail = emailInputs[0];

    fireEvent.change(registerEmail, { target: { value: 'test@example.com' } });
    fireEvent.change(registerPassword, { target: { value: 'password1' } });
    fireEvent.change(confirmPassword, { target: { value: 'password2' } });

    // Submit to trigger mismatch error
    const registerButton = screen.getByRole('button', { name: /konto erstellen|auth\.signUpBtn/i });
    fireEvent.click(registerButton);

    expect(screen.getByText('auth.passwordMismatch')).toBeDefined();

    // Type in the register password field
    fireEvent.change(registerPassword, { target: { value: 'password3' } });

    // Error should be cleared
    expect(screen.queryByText('auth.passwordMismatch')).toBeNull();
  });

  it('clears password mismatch error when user types in register email field', () => {
    render(<AuthGate />);

    const toggleBtn = screen.getByRole('button', { name: /jetzt registrieren/i });
    fireEvent.click(toggleBtn);

    const passwordInputs = screen.getAllByPlaceholderText('auth.passwordPlaceholder');
    const registerPassword = passwordInputs[0];
    const confirmPassword = screen.getByPlaceholderText('Passwort wiederholen');
    const emailInputs = screen.getAllByPlaceholderText('auth.emailPlaceholder');
    const registerEmail = emailInputs[0];

    fireEvent.change(registerEmail, { target: { value: 'test@example.com' } });
    fireEvent.change(registerPassword, { target: { value: 'password1' } });
    fireEvent.change(confirmPassword, { target: { value: 'password2' } });

    const registerButton = screen.getByRole('button', { name: /konto erstellen|auth\.signUpBtn/i });
    fireEvent.click(registerButton);

    expect(screen.getByText('auth.passwordMismatch')).toBeDefined();

    // Type in the register email field
    fireEvent.change(registerEmail, { target: { value: 'other@example.com' } });

    // Error should be cleared
    expect(screen.queryByText('auth.passwordMismatch')).toBeNull();
  });

  it('clears error when user types in login fields', async () => {
    render(<AuthGate />);

    const emailInputs = screen.getAllByPlaceholderText('auth.emailPlaceholder');
    const loginEmail = emailInputs[0];
    const passwordInputs = screen.getAllByPlaceholderText('auth.passwordPlaceholder');
    const loginPassword = passwordInputs[0];

    fireEvent.change(loginEmail, { target: { value: 'test@example.com' } });
    fireEvent.change(loginPassword, { target: { value: 'wrongpassword' } });

    // Submit login form — wrap in act() since signIn triggers async state updates
    const loginButton = screen.getByRole('button', { name: /einloggen/i });
    await act(async () => {
      fireEvent.click(loginButton);
    });

    // Wait for async signIn to complete
    await vi.waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });

    // Type in login email to clear the error
    fireEvent.change(loginEmail, { target: { value: 'new@example.com' } });

    expect(screen.queryByText('Invalid credentials')).toBeNull();
  });
});
