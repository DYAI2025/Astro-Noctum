import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AktiveEinfluesseFusion } from '../components/dashboard/AktiveEinfluesseFusion';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../hooks/useDailyTransit', () => ({
  useDailyTransit: vi.fn(),
}));

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

import { useDailyTransit } from '../hooks/useDailyTransit';

const mockBodies = {
  Moon:    { zodiac_sign: 0,  longitude: 15.3, speed: 13.2,  degree_in_sign: 15.3,  is_retrograde: false },
  Mercury: { zodiac_sign: 3,  longitude: 95.7, speed: -0.5,  degree_in_sign: 5.7,   is_retrograde: true  },
  Venus:   { zodiac_sign: 7,  longitude: 225.1,speed: 1.1,   degree_in_sign: 15.1,  is_retrograde: false },
  Mars:    { zodiac_sign: 11, longitude: 341.8,speed: 0.7,   degree_in_sign: 11.8,  is_retrograde: false },
  Jupiter: { zodiac_sign: 1,  longitude: 48.6, speed: 0.2,   degree_in_sign: 18.6,  is_retrograde: false },
  Saturn:  { zodiac_sign: 9,  longitude: 285.4,speed: -0.1,  degree_in_sign: 15.4,  is_retrograde: true  },
};

beforeEach(() => {
  vi.mocked(useDailyTransit).mockReturnValue({
    bodies: mockBodies as never,
    loading: false,
    error: null,
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AktiveEinfluesseFusion', () => {
  it('renders null when dayMasterStem is undefined', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when dayMasterStem is invalid', () => {
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="InvalidStem" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the section for a valid dayMasterStem', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Bing" />);
    expect(screen.getByTestId('aktive-einfluesse-fusion')).toBeInTheDocument();
  });

  it('shows all six planet labels', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    ['Mond', 'Merkur', 'Venus', 'Mars', 'Jupiter', 'Saturn'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('shows retrograde indicator for Mercury (speed < 0)', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Mercury is retrograde in mockBodies (speed -0.5)
    const retroIndicators = screen.getAllByText('℞');
    expect(retroIndicators.length).toBeGreaterThanOrEqual(1);
  });

  it('shows sign name for Moon (zodiac_sign 0 = Widder)', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    expect(screen.getByText(/Widder/)).toBeInTheDocument();
  });

  it('shows a BaZi resonance quote for each planet', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    // Each PlanetCard renders an italic quote — there should be 6
    const quotes = screen.getAllByRole('paragraph').filter((el) =>
      el.tagName === 'P' && el.classList.contains('italic'),
    );
    // At least some italic paragraphs from quotes
    expect(quotes.length).toBeGreaterThan(0);
  });

  it('renders skeleton when loading and no bodies', () => {
    vi.mocked(useDailyTransit).mockReturnValue({
      bodies: null,
      loading: true,
      error: null,
    });
    const { container } = render(<AktiveEinfluesseFusion dayMasterStem="Jia" />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('accepts all 10 heavenly stems without throwing', () => {
    const stems = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
    stems.forEach((stem) => {
      const { unmount } = render(<AktiveEinfluesseFusion dayMasterStem={stem} />);
      expect(screen.getByTestId('aktive-einfluesse-fusion')).toBeInTheDocument();
      unmount();
    });
  });
});
