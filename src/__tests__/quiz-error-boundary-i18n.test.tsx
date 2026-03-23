import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuizErrorBoundary } from '../components/QuizErrorBoundary';

function BombComponent(): JSX.Element {
  throw new Error('Boom!');
}

describe('QuizErrorBoundary i18n', () => {
  const origError = console.error;
  const origWarn = console.warn;
  beforeEach(() => { console.error = vi.fn(); console.warn = vi.fn(); });
  afterEach(() => { console.error = origError; console.warn = origWarn; });

  it('shows German text by default (no lang prop)', () => {
    render(
      <QuizErrorBoundary onClose={vi.fn()}>
        <BombComponent />
      </QuizErrorBoundary>
    );
    expect(screen.getByText('Quiz konnte nicht geladen werden.')).toBeDefined();
    expect(screen.getByText('Schließen')).toBeDefined();
  });

  it('shows German text when lang=de', () => {
    render(
      <QuizErrorBoundary onClose={vi.fn()} lang="de">
        <BombComponent />
      </QuizErrorBoundary>
    );
    expect(screen.getByText('Quiz konnte nicht geladen werden.')).toBeDefined();
  });

  it('shows English text when lang=en', () => {
    render(
      <QuizErrorBoundary onClose={vi.fn()} lang="en">
        <BombComponent />
      </QuizErrorBoundary>
    );
    expect(screen.getByText('Quiz could not be loaded.')).toBeDefined();
    expect(screen.getByText('Close')).toBeDefined();
  });
});
