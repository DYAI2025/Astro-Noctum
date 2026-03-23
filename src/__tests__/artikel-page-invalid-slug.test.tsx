import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock motion/react to skip animations
vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target: unknown, prop: string) => {
      return ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
        const El = prop as keyof JSX.IntrinsicElements;
        return <El {...props}>{children}</El>;
      };
    },
  }),
}));

// Mock the articles module to control what getArticleBySlug returns
vi.mock('../data/articles', () => ({
  getArticleBySlug: (slug: string) => {
    if (slug === 'valid-article') {
      return {
        slug: 'valid-article',
        title: 'Test Article',
        subtitle: 'Test Subtitle',
        excerpt: 'Test excerpt',
        image: '/test.jpg',
        imageAlt: 'Test image',
        imageCredit: 'Test',
        imageCreditUrl: '#',
        readingTime: 5,
        category: 'Test',
        ctaText: 'CTA',
        ctaHref: '/',
        sections: [{ type: 'p', content: 'Test content' }],
        tags: [],
        summary: 'Test',
      };
    }
    return undefined;
  },
  ARTICLES: [],
}));

import ArtikelPage from '../pages/ArtikelPage';

describe('ArtikelPage', () => {
  it('redirects to /wissen for non-existent slug', () => {
    render(
      <MemoryRouter initialEntries={['/wissen/nonexistent-slug']}>
        <Routes>
          <Route path="/wissen/:slug" element={<ArtikelPage />} />
          <Route path="/wissen" element={<div data-testid="wissen-index">Wissen Index</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('wissen-index')).toBeDefined();
  });

  it('redirects to /wissen when slug is missing', () => {
    render(
      <MemoryRouter initialEntries={['/wissen/']}>
        <Routes>
          <Route path="/wissen/:slug" element={<ArtikelPage />} />
          <Route path="/wissen" element={<div data-testid="wissen-index">Wissen Index</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('wissen-index')).toBeDefined();
  });

  it('renders article content for a valid slug', () => {
    render(
      <MemoryRouter initialEntries={['/wissen/valid-article']}>
        <Routes>
          <Route path="/wissen/:slug" element={<ArtikelPage />} />
          <Route path="/wissen" element={<div data-testid="wissen-index">Wissen Index</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Test Article')).toBeDefined();
    expect(screen.queryByTestId('wissen-index')).toBeNull();
  });
});
