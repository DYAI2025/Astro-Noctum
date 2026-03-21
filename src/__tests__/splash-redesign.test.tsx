import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Splash } from '../components/Splash';

// Mock motion/react to render plain elements (avoids animation complexity in tests)
vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop: string) => {
      return ({ children, ...props }: Record<string, unknown>) => {
        const Tag = prop as keyof JSX.IntrinsicElements;
        // Forward relevant HTML props, strip motion-specific ones
        const { initial, animate, exit, transition, whileHover, whileTap, ...htmlProps } = props;
        return <Tag {...(htmlProps as Record<string, unknown>)}>{children as React.ReactNode}</Tag>;
      };
    },
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Stub Web Animations API (not available in jsdom)
Element.prototype.animate = vi.fn().mockReturnValue({ cancel: vi.fn() });

// Ensure hero phase is shown (clear localStorage)
beforeEach(() => {
  localStorage.removeItem('bazodiac_hero_seen');
  localStorage.removeItem('bazodiac_intro_seen');
});

describe('Splash redesign', () => {
  it('renders BAZODIAC in gold Cormorant Garamond', () => {
    render(<Splash onEnter={vi.fn()} />);
    const title = screen.getByText('BAZODIAC');
    expect(title).toBeDefined();
    expect(title.className).toContain('font-serif');
    expect(title.className).toContain('text-gold');
  });

  it('renders TOUCH THE SURFACE subtitle', () => {
    render(<Splash onEnter={vi.fn()} />);
    expect(screen.getByText(/touch the surface/i)).toBeDefined();
  });

  it('calls onEnter when tapped', () => {
    const onEnter = vi.fn();
    render(<Splash onEnter={onEnter} />);
    fireEvent.click(screen.getByText('BAZODIAC'));
    expect(onEnter).toHaveBeenCalledOnce();
  });
});
