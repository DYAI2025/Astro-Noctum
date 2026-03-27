import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BlueprintReveal } from '../components/dashboard/BlueprintReveal';

// Mock BlueprintCard
vi.mock('../components/dashboard/BlueprintCard', () => ({
  default: ({ content }: { content: string }) => <div data-testid="blueprint-card">{content}</div>,
}));

// Mock framer motion — simplified
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.blueprintReveal.cosmicAnalysis': 'Kosmische Analyse',
        'dashboard.blueprintReveal.title': 'Dein Bazodiac Blueprint',
        'dashboard.blueprintReveal.teaser': 'Deine einzigartige kosmische Signatur. Bereit zur Enthüllung.',
        'dashboard.blueprintReveal.revealBtn': 'Entdecken',
      };
      return map[key] || key;
    },
  }),
}));

const defaultProps = {
  content: 'Blueprint test content',
  onCtaClick: vi.fn(),
};

describe('BlueprintReveal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows teaser on first visit (no localStorage flag)', () => {
    render(<BlueprintReveal {...defaultProps} />);
    expect(screen.getByTestId('blueprint-teaser')).toBeInTheDocument();
    expect(screen.queryByTestId('blueprint-card')).not.toBeInTheDocument();
  });

  it('shows blueprint directly on return visit (localStorage flag set)', () => {
    localStorage.setItem('bazodiac_blueprint_seen', '1');
    render(<BlueprintReveal {...defaultProps} />);
    expect(screen.queryByTestId('blueprint-teaser')).not.toBeInTheDocument();
    expect(screen.getByTestId('blueprint-card')).toBeInTheDocument();
  });

  it('clicking Entdecken reveals blueprint and sets localStorage flag', async () => {
    render(<BlueprintReveal {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Entdecken/i });
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByTestId('blueprint-card')).toBeInTheDocument();
    expect(localStorage.getItem('bazodiac_blueprint_seen')).toBe('1');
  });

  it('passes content and onCtaClick to BlueprintCard after reveal', async () => {
    render(<BlueprintReveal {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Entdecken/i });
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByText('Blueprint test content')).toBeInTheDocument();
  });

  it('teaser shows the section title in German', () => {
    render(<BlueprintReveal {...defaultProps} />);
    expect(screen.getByText('Dein Bazodiac Blueprint')).toBeInTheDocument();
  });
});
