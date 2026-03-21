import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

import { AstroAccordion } from '../components/dashboard/AstroAccordion';

const mockApiData = {
  western: { zodiac_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo' },
  bazi: {
    zodiac_sign: 'Dragon',
    day_master: 'Wood',
    pillars: {
      year: { stem: 'Yang Wood' },
      month: { stem: 'Yin Fire' },
      day: { stem: 'Yang Water' },
      hour: { stem: 'Yin Metal' },
    },
  },
  wuxing: { dominant_element: 'Wood', secondary_element: 'Fire', deficient_element: 'Metal' },
};

describe('AstroAccordion', () => {
  it('renders 3 main tiles', () => {
    render(<AstroAccordion apiData={mockApiData as any} tileTexts={{}} />);
    expect(screen.getByText(/sonnenzeichen/i)).toBeDefined();
    expect(screen.getByText(/bazi/i)).toBeDefined();
    expect(screen.getByText(/wu xing/i)).toBeDefined();
  });

  it('expands sun sign tile on click', () => {
    render(<AstroAccordion apiData={mockApiData as any} tileTexts={{}} />);
    fireEvent.click(screen.getByText(/sonnenzeichen/i));
    expect(screen.getByText(/mondzeichen/i)).toBeDefined();
    expect(screen.getByText(/aszendent/i)).toBeDefined();
  });

  it('shows signatur hint in expanded tile', () => {
    render(<AstroAccordion apiData={mockApiData as any} tileTexts={{}} />);
    fireEvent.click(screen.getByText(/sonnenzeichen/i));
    expect(screen.getByText(/fundament deiner signatur/i)).toBeDefined();
  });

  it('closes previous tile when opening another (accordion pattern)', async () => {
    render(<AstroAccordion apiData={mockApiData as any} tileTexts={{}} />);
    fireEvent.click(screen.getByText(/sonnenzeichen/i));
    expect(screen.getByText(/mondzeichen/i)).toBeDefined();
    fireEvent.click(screen.getByText(/bazi/i));
    await waitFor(() => {
      expect(screen.queryByText(/mondzeichen/i)).toBeNull();
    });
  });
});
