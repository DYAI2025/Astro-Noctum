import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SectionErrorBoundary } from '../components/dashboard/SectionErrorBoundary';

const ThrowingChild = () => { throw new Error('boom'); };

describe('SectionErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary name="Test">
        <p>content</p>
      </SectionErrorBoundary>
    );
    expect(screen.getByText('content')).toBeTruthy();
  });

  it('renders fallback with section name on error', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <SectionErrorBoundary name="Astro">
        <ThrowingChild />
      </SectionErrorBoundary>
    );
    expect(screen.getByText(/Astro/)).toBeTruthy();
    expect(screen.getByText(/nicht geladen/)).toBeTruthy();
  });
});
