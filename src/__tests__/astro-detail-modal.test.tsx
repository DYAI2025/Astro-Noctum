import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AstroDetailModal } from '../components/dashboard/AstroDetailModal';
import type { ApiData } from '../types/bafe';
import React from 'react';

// Mock motion/react to disable animations in tests
vi.mock('motion/react', () => {
  const MockAnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  const mockMotion = new Proxy(
    {},
    {
      get: (_target, _prop) => {
        // Return a simple passthrough component for any motion.* element
        return ({ children, ...rest }: React.HTMLAttributes<HTMLElement>) => (
          <div {...rest}>{children}</div>
        );
      },
    }
  );

  return {
    __esModule: true,
    AnimatePresence: MockAnimatePresence,
    motion: mockMotion,
  };
});
// Mock LanguageContext
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de' as const,
    t: (key: string) => {
      const map: Record<string, string> = {
        'astroAccordion.sunSign': 'Sonnenzeichen',
        'astroAccordion.moonSign': 'Mondzeichen',
        'astroAccordion.ascendant': 'Aszendent',
        'astroAccordion.yearAnimal': 'Jahrestier',
        'astroAccordion.dayMaster': 'Tagesmeister',
        'astroAccordion.monthStem': 'Monatssäule',
        'astroAccordion.hourStem': 'Stundensäule',
        'astroAccordion.dominantElement': 'Dominantes Element',
      };
      return map[key] || key;
    },
  }),
}));

const mockApiData: ApiData = {
  western: {
    zodiac_sign: 'Aries',
    moon_sign: 'Cancer',
    ascendant_sign: 'Leo',
    houses: {},
  },
  bazi: {
    day_master: '甲',
    zodiac_sign: 'Dragon',
    pillars: {
      year:  { stem: '壬', branch: '辰', animal: 'Dragon', element: 'Water' },
      month: { stem: '丙', branch: '午', animal: 'Horse',  element: 'Fire' },
      day:   { stem: '甲', branch: '子', animal: 'Rat',    element: 'Wood' },
      hour:  { stem: '丁', branch: '卯', animal: 'Rabbit', element: 'Fire' },
    },
  },
  wuxing: {
    dominant_element: 'Wood',
    elements: {
      Wood: 35,
      Holz: 35,
      Fire: 25,
      Feuer: 25,
      Earth: 15,
      Erde: 15,
      Metal: 15,
      Metall: 15,
      Water: 10,
      Wasser: 10,
    },
  },
};

const tileTexts = { sun: '', moon: '', dayMaster: '', yearAnimal: '', dominantWuXing: '' };

describe('AstroDetailModal', () => {
  it('renders nothing when activeId is null', () => {
    const { container } = render(
      <AstroDetailModal activeId={null} onClose={() => {}} apiData={mockApiData} tileTexts={tileTexts} />,
    );
    expect(container.children.length).toBe(0);
  });

  it('shows BaZi popup with year animal and pillar descriptions', () => {
    render(
      <AstroDetailModal activeId="bazi" onClose={() => {}} apiData={mockApiData} tileTexts={tileTexts} />,
    );
    // Title should be "Jahrestier"
    expect(screen.getByText('Jahrestier')).toBeDefined();
    // Headline should contain the dragon emoji + name
    expect(screen.getAllByText(/Drache/).length).toBeGreaterThanOrEqual(1);
    // Sub-rows should show pillar labels
    expect(screen.getByText('Tagesmeister')).toBeDefined();
    expect(screen.getByText('Monatssäule')).toBeDefined();
    expect(screen.getByText('Stundensäule')).toBeDefined();
    // Day stem should resolve to a named stem with description
    expect(screen.getByText(/Jiǎ Holz/)).toBeDefined();
    // Month stem should show Bǐng name + interpretation
    expect(screen.getAllByText(/Bǐng/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows WuXing popup with element percentages and descriptions', () => {
    render(
      <AstroDetailModal activeId="wuxing" onClose={() => {}} apiData={mockApiData} tileTexts={tileTexts} />,
    );
    // Headline should show dominant element in German
    expect(screen.getAllByText('Holz').length).toBeGreaterThanOrEqual(1);
    // Element percentages should be visible
    expect(screen.getByText('35%')).toBeDefined();
    expect(screen.getByText('25%')).toBeDefined();
    expect(screen.getByText('10%')).toBeDefined();
    // Each element percentage row has a description paragraph
    const descriptions = document.querySelectorAll('.text-xs.text-white\\/50');
    expect(descriptions.length).toBeGreaterThanOrEqual(5);
  });

  it('closes modal on backdrop click', () => {
    const onClose = vi.fn();
    render(
      <AstroDetailModal activeId="bazi" onClose={onClose} apiData={mockApiData} tileTexts={tileTexts} />,
    );
    // Click backdrop (the first motion.div with the backdrop class)
    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows western popup with sun, moon, ascendant descriptions', () => {
    render(
      <AstroDetailModal activeId="western" onClose={() => {}} apiData={mockApiData} tileTexts={tileTexts} />,
    );
    expect(screen.getByText('Sonnenzeichen')).toBeDefined();
    expect(screen.getByText('Mondzeichen')).toBeDefined();
    expect(screen.getByText('Aszendent')).toBeDefined();
  });
});
