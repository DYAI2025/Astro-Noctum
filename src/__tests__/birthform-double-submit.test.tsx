import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BirthForm } from '../components/BirthForm';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));
vi.mock('../services/timezone', () => ({
  fetchTimezone: vi.fn().mockResolvedValue('Europe/Berlin'),
}));
vi.mock('../components/PlaceAutocomplete', () => ({
  PlaceAutocomplete: () => null,
  hasPlacesApiKey: () => false,
}));
vi.mock('../components/LocationMap', () => ({
  LocationMap: () => null,
}));

describe('BirthForm double-submit prevention', () => {
  const mockSubmit = vi.fn();

  beforeEach(() => { vi.clearAllMocks(); });

  it('only calls onSubmit once on rapid double-click', () => {
    render(<BirthForm onSubmit={mockSubmit} isLoading={false} />);

    // Go to step 2 first
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons.find(b => b.textContent?.includes('form.nextBtn') || b.textContent?.includes('Weiter'));
    if (nextBtn) fireEvent.click(nextBtn);

    // Find the form and submit twice
    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
      fireEvent.submit(form);
    }

    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});
