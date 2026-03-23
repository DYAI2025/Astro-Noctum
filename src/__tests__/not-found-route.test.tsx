import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));

function NotFound() {
  return (
    <div>
      <h1>notFound.title</h1>
      <p>notFound.message</p>
      <Link to="/">notFound.backLink</Link>
    </div>
  );
}

describe('404 NotFound route', () => {
  it('renders NotFound for unknown paths', () => {
    render(
      <MemoryRouter initialEntries={['/this/path/does/not/exist']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('notFound.title')).toBeDefined();
    expect(screen.getByText('notFound.message')).toBeDefined();
    expect(screen.getByText('notFound.backLink')).toBeDefined();
  });

  it('renders Home for root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.queryByText('notFound.title')).toBeNull();
  });
});
