import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BirthForm } from '../components/BirthForm';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    t: (key: string) => {
      const map: Record<string, string> = {
        'form.step1Title': 'Geburtsdatum',
        'form.step2Title': 'Geburtsort',
        'form.dateLabel': 'Datum',
        'form.timeLabel': 'Uhrzeit',
        'form.timeUnknown': 'Uhrzeit unbekannt',
        'form.nextBtn': 'Weiter',
        'form.backBtn': 'Zurück',
        'form.submitBtn': 'Berechnen',
        'form.timezoneLabel': 'Zeitzone',
        'form.futureDate': 'Datum liegt in der Zukunft',
        'form.validCoords': 'Ungültige Koordinaten',
        'form.coordsRange': 'Koordinaten außerhalb des gültigen Bereichs',
        'form.invalidTz': 'Ungültige Zeitzone',
        'form.invalidDate': 'Bitte Datum eingeben',
        'form.noTime': 'Keine Uhrzeit angegeben',
        'form.loadingMsg': 'Wird berechnet...',
        'form.loadingTag': 'Moment',
        'form.dstNote': 'Sommerzeit',
        'form.placeLabel': 'Ort',
        'form.placePlaceholder': 'Stadt...',
        'form.locationLabel': 'Geburtsort',
        'form.locationPlaceholder': 'Stadt eingeben...',
        'form.manualCoords': 'Koordinaten manuell eingeben',
        'form.mapToggleOpen': 'Karte öffnen',
        'form.mapToggleClose': 'Karte schließen',
      };
      return map[key] ?? key;
    },
  }),
}));

vi.mock('../components/PlaceAutocomplete', () => ({
  PlaceAutocomplete: () => <div />,
  hasPlacesApiKey: () => false,
}));

vi.mock('../components/LocationMap', () => ({
  LocationMap: () => <div />,
}));

vi.mock('../services/nominatim', () => ({
  searchNominatim: async () => [],
}));

vi.mock('../services/timezone', () => ({
  fetchTimezone: async () => null,
}));

function renderForm(onSubmit = vi.fn()) {
  render(<BirthForm onSubmit={onSubmit} isLoading={false} />);
}

function clickNext() {
  fireEvent.click(screen.getByText('Weiter'));
}

describe('BirthForm inline validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows inline error instead of alert when date is empty', () => {
    renderForm();
    const dateInput = screen.getByDisplayValue('1990-01-01');
    fireEvent.change(dateInput, { target: { value: '' } });
    clickNext();
    // Inline error message shown — no alert() popup
    expect(screen.getByText('Bitte Datum eingeben')).toBeDefined();
  });

  it('advances to step 2 with default time — no confirm dialog needed', () => {
    renderForm();
    // time defaults to "12:00", so clicking Next should go to step 2 without any confirm
    clickNext();
    // Step 2 heading is visible; step 1 heading is gone
    expect(screen.getByRole('heading', { name: 'Geburtsort' })).toBeDefined();
    expect(screen.queryByRole('heading', { name: 'Geburtsdatum' })).toBeNull();
  });

  it('shows inline date error when date is cleared before clicking Next', () => {
    renderForm();
    const dateInput = screen.getByDisplayValue('1990-01-01');
    fireEvent.change(dateInput, { target: { value: '' } });
    clickNext();
    expect(screen.getByText('Bitte Datum eingeben')).toBeDefined();
  });

  it('clears date error when date is changed', () => {
    renderForm();
    const dateInput = screen.getByDisplayValue('1990-01-01');
    fireEvent.change(dateInput, { target: { value: '' } });
    clickNext();
    expect(screen.getByText('Bitte Datum eingeben')).toBeDefined();
    fireEvent.change(dateInput, { target: { value: '1990-06-15' } });
    expect(screen.queryByText('Bitte Datum eingeben')).toBeNull();
  });

  it('shows inline error for invalid timezone on submit (step 2)', () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    clickNext(); // advance to step 2
    const tzInput = screen.getByDisplayValue('Europe/Berlin');
    fireEvent.change(tzInput, { target: { value: 'NotATimezone/Invalid' } });
    fireEvent.click(screen.getByText('Berechnen'));
    expect(screen.getByText('Ungültige Zeitzone')).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears timezone error when timezone is edited', () => {
    renderForm();
    clickNext();
    const tzInput = screen.getByDisplayValue('Europe/Berlin');
    fireEvent.change(tzInput, { target: { value: 'NotATimezone/Invalid' } });
    fireEvent.click(screen.getByText('Berechnen'));
    expect(screen.getByText('Ungültige Zeitzone')).toBeDefined();
    fireEvent.change(tzInput, { target: { value: 'Europe/Berlin' } });
    expect(screen.queryByText('Ungültige Zeitzone')).toBeNull();
  });

  it('shows inline error for future date on submit and returns to step 1', () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    const dateInput = screen.getByDisplayValue('1990-01-01');
    fireEvent.change(dateInput, { target: { value: '2099-01-01' } });
    // Next only checks empty date — future date passes through to step 2
    clickNext();
    expect(screen.getByRole('heading', { name: 'Geburtsort' })).toBeDefined();
    // Submit triggers handleSubmit which catches future date, sets error, returns to step 1
    fireEvent.click(screen.getByText('Berechnen'));
    // Now on step 1 with inline error
    expect(screen.getByText('Datum liegt in der Zukunft')).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data (no alert shown)', () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);
    clickNext();
    fireEvent.click(screen.getByText('Berechnen'));
    // Default valid state: date=1990-01-01, time=12:00, coords=52.52, 13.405, tz=Europe/Berlin
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
