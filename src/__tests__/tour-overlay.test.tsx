import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TourOverlay } from '../components/dashboard/TourOverlay';

describe('TourOverlay', () => {
  it('renders step 0 welcome message', () => {
    render(<TourOverlay step={0} birthDate="21.03.2026" birthCity="Berlin" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/willkommen zum himmel/i)).toBeDefined();
    expect(screen.getByText(/21.03.2026/)).toBeDefined();
    expect(screen.getByText(/Berlin/)).toBeDefined();
  });

  it('renders step 1 astro message', () => {
    render(<TourOverlay step={1} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/schau dir deine zeichen/i)).toBeDefined();
  });

  it('renders step 2 levi message with two buttons', () => {
    render(<TourOverlay step={2} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} onLeviStart={vi.fn()} />);
    expect(screen.getByText(/levi/i)).toBeDefined();
    expect(screen.getByText(/jetzt sprechen/i)).toBeDefined();
    expect(screen.getByText(/später/i)).toBeDefined();
  });

  it('renders step 3 navigation hints', () => {
    render(<TourOverlay step={3} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/signatur/i)).toBeDefined();
    expect(screen.getByText(/verstanden/i)).toBeDefined();
  });

  it('does not render when step is done', () => {
    const { container } = render(<TourOverlay step="done" birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onNext when OK clicked', () => {
    const onNext = vi.fn();
    render(<TourOverlay step={0} birthDate="21.03.2026" birthCity="Berlin" onNext={onNext} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByText('OK'));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
