import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const, setLang: vi.fn(), t: (k: string) => k }),
}));

const LegalPage = lazy(() => import('../pages/legal/LegalPage'));

function renderLegal(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/datenschutz"
          element={
            <Suspense fallback={null}>
              <LegalPage kind="privacy" />
            </Suspense>
          }
        />
        <Route
          path="/impressum"
          element={
            <Suspense fallback={null}>
              <LegalPage kind="imprint" />
            </Suspense>
          }
        />
        <Route
          path="/agb"
          element={
            <Suspense fallback={null}>
              <LegalPage kind="terms" />
            </Suspense>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Legal page routes', () => {
  it('renders the German privacy heading on /datenschutz', async () => {
    renderLegal('/datenschutz');
    const heading = await screen.findByText('Datenschutzerklärung');
    expect(heading).toBeDefined();
  });

  it('renders the German imprint heading on /impressum', async () => {
    renderLegal('/impressum');
    const heading = await screen.findByText('Impressum');
    expect(heading).toBeDefined();
  });

  it('renders the German terms heading on /agb', async () => {
    renderLegal('/agb');
    const heading = await screen.findByText('Allgemeine Geschäftsbedingungen');
    expect(heading).toBeDefined();
  });

  it('sets document.title to "Datenschutzerklärung – Bazodiac" on /datenschutz', async () => {
    renderLegal('/datenschutz');
    await screen.findByText('Datenschutzerklärung');
    expect(document.title).toBe('Datenschutzerklärung – Bazodiac');
  });

  it('shows language toggle buttons DE and EN on a legal page', async () => {
    renderLegal('/impressum');
    await screen.findByText('Impressum');
    const deButton = await screen.findByRole('button', { name: /^DE$/i });
    const enButton = await screen.findByRole('button', { name: /^EN$/i });
    expect(deButton).toBeDefined();
    expect(enButton).toBeDefined();
  });
});
