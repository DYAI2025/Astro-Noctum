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

describe('BirthForm validation', () => {
  const mockSubmit = vi.fn();
  let alertSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    alertSpy = window.alert as ReturnType<typeof vi.fn>;
  });

  it('rejects future dates on submit', () => {
    render(<BirthForm onSubmit={mockSubmit} isLoading={false} />);
    const dateInput = screen.getByDisplayValue('1990-01-01');
    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });

    // Advance to step 2 by clicking the next button
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons.find(b => b.textContent?.includes('form.nextBtn'));
    if (nextBtn) fireEvent.click(nextBtn);

    // Submit the form
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);

    expect(alertSpy).toHaveBeenCalledWith('form.futureDate');
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('date input has max attribute set to today', () => {
    render(<BirthForm onSubmit={mockSubmit} isLoading={false} />);
    const dateInput = screen.getByDisplayValue('1990-01-01');
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput.getAttribute('max')).toBe(today);
  });
});
