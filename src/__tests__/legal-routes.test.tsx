import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import type { LegalPageKind } from '../legal/legalContent';

const mockUseLanguage = vi.fn();
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: (...args: unknown[]) => mockUseLanguage(...args),
}));

const LegalPage = lazy(() => import('../pages/legal/LegalPage'));

function renderLegal(path: string, kind: LegalPageKind) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <Suspense fallback={null}>
              <LegalPage kind={kind} />
            </Suspense>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Legal page routes — DE', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ lang: 'de' as const, setLang: vi.fn(), t: (k: string) => k });
  });

  it('renders the German privacy heading on /datenschutz', async () => {
    renderLegal('/datenschutz', 'privacy');
    expect(await screen.findByText('Datenschutzerklärung')).toBeInTheDocument();
  });

  it('renders the German imprint heading on /impressum', async () => {
    renderLegal('/impressum', 'imprint');
    expect(await screen.findByText('Impressum')).toBeInTheDocument();
  });

  it('renders the German terms heading on /agb', async () => {
    renderLegal('/agb', 'terms');
    expect(await screen.findByText('Allgemeine Geschäftsbedingungen')).toBeInTheDocument();
  });

  it('sets document.title to "Datenschutzerklärung – Bazodiac" on /datenschutz', async () => {
    renderLegal('/datenschutz', 'privacy');
    await screen.findByText('Datenschutzerklärung');
    expect(document.title).toBe('Datenschutzerklärung – Bazodiac');
  });

  it('shows language toggle buttons DE and EN', async () => {
    renderLegal('/impressum', 'imprint');
    await screen.findByText('Impressum');
    expect(await screen.findByRole('button', { name: /^DE$/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^EN$/i })).toBeInTheDocument();
  });
});

describe('Legal page routes — EN', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ lang: 'en' as const, setLang: vi.fn(), t: (k: string) => k });
  });

  it('renders the English privacy heading on /privacy', async () => {
    renderLegal('/privacy', 'privacy');
    expect(await screen.findByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders the English imprint heading on /legal-notice', async () => {
    renderLegal('/legal-notice', 'imprint');
    expect(await screen.findByText('Legal Notice')).toBeInTheDocument();
  });

  it('renders the English terms heading on /terms', async () => {
    renderLegal('/terms', 'terms');
    expect(await screen.findByText('Terms and Conditions')).toBeInTheDocument();
  });

  it('sets document.title to "Privacy Policy – Bazodiac" on /privacy', async () => {
    renderLegal('/privacy', 'privacy');
    await screen.findByText('Privacy Policy');
    expect(document.title).toBe('Privacy Policy – Bazodiac');
  });
});
