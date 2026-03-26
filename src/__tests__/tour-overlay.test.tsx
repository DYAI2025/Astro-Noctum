import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TourOverlay } from '../components/dashboard/TourOverlay';
import { LanguageProvider } from '../contexts/LanguageContext';

function renderWithDe(ui: React.ReactElement) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe('TourOverlay', () => {
  beforeEach(() => {
    localStorage.setItem('bazodiac_lang', 'de');
  });
  afterEach(() => {
    localStorage.removeItem('bazodiac_lang');
  });

  it('renders step 0 with formatted birth date and city', () => {
    renderWithDe(<TourOverlay step={0} birthDate="1980-06-24T15:20:00" birthCity="Hamburg" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/Firmament Deiner Geburt/)).toBeDefined();
    expect(screen.getByText(/24\. Juni 1980/)).toBeDefined();
    expect(screen.getByText(/Hamburg/)).toBeDefined();
  });

  it('renders step 1 with quest text and Levi mention', () => {
    renderWithDe(<TourOverlay step={1} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/Feuerpferdes/)).toBeDefined();
    expect(screen.getByText(/Suche danach Levi/)).toBeDefined();
  });

  it('does not render when step is done', () => {
    const { container } = renderWithDe(<TourOverlay step="done" birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onNext when Weiter clicked', () => {
    const onNext = vi.fn();
    renderWithDe(<TourOverlay step={0} birthDate="1980-06-24" birthCity="Berlin" onNext={onNext} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByText('Weiter'));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('formats plain date without time component', () => {
    renderWithDe(<TourOverlay step={0} birthDate="2000-12-31" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/31\. Dezember 2000/)).toBeDefined();
  });
});
