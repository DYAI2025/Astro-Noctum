import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { EncounterBirthForm } from '../components/onboarding/EncounterBirthForm';

// Mock PlaceAutocomplete — uses native DOM addEventListener to work with React 19's
// event system where fireEvent.change does not trigger React synthetic onChange.
vi.mock('../components/PlaceAutocomplete', () => ({
  PlaceAutocomplete: ({ onSelect }: any) => {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const handler = () => onSelect({ name: 'Berlin', lat: 52.52, lon: 13.405 });
      el.addEventListener('change', handler);
      return () => el.removeEventListener('change', handler);
    }, [onSelect]);
    return <input ref={ref} data-testid="place-input" />;
  },
  hasPlacesApiKey: () => false,
}));

// Mock timezone service
vi.mock('../services/timezone', () => ({
  fetchTimezone: vi.fn().mockResolvedValue('Europe/Berlin'),
}));

// Mock LanguageContext if used
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));

describe('EncounterBirthForm', () => {
  it('renders place, date, and time fields', () => {
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={false} />);
    expect(screen.getByTestId('encounter-place')).toBeDefined();
    expect(screen.getByTestId('encounter-date')).toBeDefined();
    expect(screen.getByTestId('encounter-time')).toBeDefined();
  });

  it('has glassmorphic styling', () => {
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={false} />);
    const form = screen.getByTestId('encounter-form');
    expect(form.className).toContain('backdrop-blur');
  });

  it('disables submit when loading', () => {
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={true} />);
    const btn = screen.getByTestId('encounter-submit');
    expect(btn).toHaveProperty('disabled', true);
  });

  it('reports field fill progress via onProgress', () => {
    const onProgress = vi.fn();
    render(<EncounterBirthForm onSubmit={vi.fn()} isLoading={false} onProgress={onProgress} />);
    expect(onProgress).toHaveBeenCalledWith(expect.any(Number));
  });

  it('calls onSubmit with birth data after place selection', async () => {
    const onSubmit = vi.fn();
    render(<EncounterBirthForm onSubmit={onSubmit} isLoading={false} />);

    fireEvent.change(screen.getByTestId('encounter-date'), { target: { value: '1990-06-15' } });
    fireEvent.change(screen.getByTestId('encounter-time'), { target: { value: '14:30' } });

    // Wrap place selection in act to flush all async state updates (timezone fetch).
    // The mock uses native addEventListener so fireEvent.change triggers onSelect correctly.
    await act(async () => {
      fireEvent.change(screen.getByTestId('place-input'));
    });

    const submitBtn = screen.getByTestId('encounter-submit');
    expect(submitBtn).not.toHaveProperty('disabled', true);

    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      date: expect.stringContaining('1990-06-15'),
      lat: 52.52,
      lon: 13.405,
    }));
  });
});
