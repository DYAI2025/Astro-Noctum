import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SkyModeToggle } from '../components/dashboard/SkyModeToggle';

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) =>
      <button {...props}>{children}</button>,
  },
}));

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

const mockSetSkyMode = vi.fn();
vi.mock('../contexts/PlanetariumContext', () => ({
  usePlanetarium: () => ({ skyMode: 'birth', setSkyMode: mockSetSkyMode }),
}));

describe('SkyModeToggle', () => {
  it('renders toggle button with birth label', () => {
    render(<SkyModeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/Geburtshimmel/i)).toBeInTheDocument();
  });

  it('calls setSkyMode(current) on click when in birth mode', async () => {
    render(<SkyModeToggle />);
    await act(async () => { fireEvent.click(screen.getByRole('button')); });
    expect(mockSetSkyMode).toHaveBeenCalledWith('current');
  });
});
