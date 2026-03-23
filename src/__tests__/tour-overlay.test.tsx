import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TourOverlay } from '../components/dashboard/TourOverlay';

describe('TourOverlay', () => {
  it('renders step 0 with formatted birth date and city', () => {
    render(<TourOverlay step={0} birthDate="1980-06-24T15:20:00" birthCity="Hamburg" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/Firmament Deiner Geburt/)).toBeDefined();
    expect(screen.getByText(/24\. Juni 1980/)).toBeDefined();
    expect(screen.getByText(/Hamburg/)).toBeDefined();
  });

  it('renders step 1 with quest text and Levi mention', () => {
    render(<TourOverlay step={1} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/Feuerpferdes/)).toBeDefined();
    expect(screen.getByText(/Suche danach Levi/)).toBeDefined();
  });

  it('does not render when step is done', () => {
    const { container } = render(<TourOverlay step="done" birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onNext when Weiter clicked', () => {
    const onNext = vi.fn();
    render(<TourOverlay step={0} birthDate="1980-06-24" birthCity="Berlin" onNext={onNext} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByText('Weiter'));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('formats plain date without time component', () => {
    render(<TourOverlay step={0} birthDate="2000-12-31" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/31\. Dezember 2000/)).toBeDefined();
  });
});
