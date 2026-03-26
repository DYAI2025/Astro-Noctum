import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppErrorBoundary } from '../components/AppErrorBoundary';

function BombComponent(): JSX.Element {
  throw new Error('Boom!');
}

function SafeComponent() {
  return <div>Safe content</div>;
}

describe('AppErrorBoundary', () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
    localStorage.setItem('bazodiac_lang', 'de');
  });
  afterEach(() => {
    console.error = originalError;
    localStorage.removeItem('bazodiac_lang');
  });

  it('renders children when no error', () => {
    render(
      <AppErrorBoundary>
        <SafeComponent />
      </AppErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('shows error UI when child throws', () => {
    render(
      <AppErrorBoundary>
        <BombComponent />
      </AppErrorBoundary>
    );
    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeDefined();
    expect(screen.getByText('Erneut versuchen')).toBeDefined();
    expect(screen.getByText('Zur Startseite')).toBeDefined();
  });

  it('retry button resets error state and re-renders children', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('Boom');
      return <div>Recovered</div>;
    }

    render(
      <AppErrorBoundary>
        <MaybeThrow />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Erneut versuchen'));
    expect(screen.getByText('Recovered')).toBeDefined();
  });
});
