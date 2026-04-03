import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../components/signatur-v3/SignaturV3Canvas', () => ({
  default: () => <div data-testid="mock-canvas">Canvas</div>,
}));

import MiniSignature from '../components/dashboard/MiniSignature';

beforeEach(() => localStorage.clear());

describe('MiniSignature fallback states', () => {
  it('shows "calculating" when loading=true and no data', () => {
    render(<MiniSignature loading={true} quizWeights={{}} />);
    expect(screen.getByText('dashboard.miniSignature.calculating')).toBeDefined();
  });

  it('shows "unavailable" when loading=false and no data', () => {
    render(<MiniSignature loading={false} quizWeights={{}} />);
    expect(screen.getByText('dashboard.miniSignature.unavailable')).toBeDefined();
  });

  it('shows "unavailable" when loading is undefined and no data', () => {
    render(<MiniSignature quizWeights={{}} />);
    expect(screen.getByText('dashboard.miniSignature.unavailable')).toBeDefined();
  });

  it('renders canvas when natalWeights has data', () => {
    const weights = { Sun: 0.8, Moon: 0.6, Mars: 0.4, Mercury: 0.5, Jupiter: 0.7, Saturn: 0.3, Venus: 0.6 };
    render(<MiniSignature natalWeights={weights} quizWeights={{}} />);
    expect(screen.queryByText('dashboard.miniSignature.calculating')).toBeNull();
    expect(screen.queryByText('dashboard.miniSignature.unavailable')).toBeNull();
  });

  it('does not show "calculating" forever when loading completes without data', () => {
    const { rerender } = render(<MiniSignature loading={true} quizWeights={{}} />);
    expect(screen.getByText('dashboard.miniSignature.calculating')).toBeDefined();

    rerender(<MiniSignature loading={false} quizWeights={{}} />);
    expect(screen.queryByText('dashboard.miniSignature.calculating')).toBeNull();
    expect(screen.getByText('dashboard.miniSignature.unavailable')).toBeDefined();
  });
});
