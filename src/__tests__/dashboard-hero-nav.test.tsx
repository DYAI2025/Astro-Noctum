// src/__tests__/dashboard-hero-nav.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardHeroNav } from '../components/dashboard/DashboardHeroNav';

// Mock framer motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
  },
}));

// Mutable lang ref so individual tests can override the locale
const mockLang = { lang: 'de' };

const translations: Record<string, Record<string, string>> = {
  de: {
    'dashboard.heroNav.westernLabel': 'Sonnenzeichen',
    'dashboard.heroNav.westernAria': 'Zur Westlichen Astrologie springen',
    'dashboard.heroNav.baziLabel': 'BaZi',
    'dashboard.heroNav.baziAria': 'Zu BaZi springen',
    'dashboard.heroNav.wuxingLabel': 'Wu Xing',
    'dashboard.heroNav.wuxingAria': 'Zu Wu Xing springen',
  },
  en: {
    'dashboard.heroNav.westernLabel': 'Sun Sign',
    'dashboard.heroNav.westernAria': 'Jump to Western Astrology',
    'dashboard.heroNav.baziLabel': 'BaZi',
    'dashboard.heroNav.baziAria': 'Jump to BaZi',
    'dashboard.heroNav.wuxingLabel': 'Wu Xing',
    'dashboard.heroNav.wuxingAria': 'Jump to Wu Xing',
  },
};

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    ...mockLang,
    t: (key: string) => translations[mockLang.lang]?.[key] || key,
  }),
}));

describe('DashboardHeroNav', () => {
  afterEach(() => {
    mockLang.lang = 'de';
  });

  it('renders three tiles with correct labels in German', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    expect(screen.getByText('Sonnenzeichen')).toBeInTheDocument();
    expect(screen.getByText('BaZi')).toBeInTheDocument();
    expect(screen.getByText('Wu Xing')).toBeInTheDocument();
  });

  it('renders sign/animal/element values', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    expect(screen.getByText('Leo')).toBeInTheDocument();
    expect(screen.getByText('Drache')).toBeInTheDocument();
    expect(screen.getByText('Holz')).toBeInTheDocument();
  });

  it('renders three buttons that call onTileClick with the correct id', async () => {
    const onTileClick = vi.fn();
    const { user } = await import('@testing-library/user-event').then(m => ({ user: m.default.setup() }));
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" onTileClick={onTileClick} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    await user.click(buttons[0]);
    expect(onTileClick).toHaveBeenCalledWith('western');
    await user.click(buttons[1]);
    expect(onTileClick).toHaveBeenCalledWith('bazi');
    await user.click(buttons[2]);
    expect(onTileClick).toHaveBeenCalledWith('wuxing');
  });

  it('renders EN labels when lang is en', () => {
    mockLang.lang = 'en';
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Wood" zodiacAnimal="Dragon" />);
    expect(screen.getByText('Sun Sign')).toBeInTheDocument();
    expect(screen.getByText('Wu Xing')).toBeInTheDocument(); // Wu Xing same in EN
  });

  it('shows placeholder when values are missing', () => {
    render(<DashboardHeroNav sunSign="" dominantElement="" zodiacAnimal="" />);
    // All three values show dash placeholder
    const dashes = screen.getAllByText('—');
    expect(dashes).toHaveLength(3);
  });
});
