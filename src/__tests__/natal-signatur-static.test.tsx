import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NatalSignaturStatic } from '../components/dashboard/NatalSignaturStatic';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

describe('NatalSignaturStatic', () => {
  it('renders the accordion header', () => {
    render(<NatalSignaturStatic><div>Content</div></NatalSignaturStatic>);
    expect(screen.getByText('Deine Natal-Signatur (statisch)')).toBeInTheDocument();
  });

  it('is collapsed by default', () => {
    render(<NatalSignaturStatic><div>Content</div></NatalSignaturStatic>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    render(<NatalSignaturStatic><div>Content</div></NatalSignaturStatic>);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('collapses again on second click', () => {
    render(<NatalSignaturStatic><div>Content</div></NatalSignaturStatic>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('respects defaultExpanded=true', () => {
    render(<NatalSignaturStatic defaultExpanded><div>Content</div></NatalSignaturStatic>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('has aria-expanded reflecting state', () => {
    render(<NatalSignaturStatic><div>Content</div></NatalSignaturStatic>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('has testid', () => {
    render(<NatalSignaturStatic><div /></NatalSignaturStatic>);
    expect(screen.getByTestId('natal-signatur-static')).toBeInTheDocument();
  });
});
