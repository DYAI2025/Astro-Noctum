import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de', setLang: vi.fn() }),
}));
vi.mock('../components/signatur-v3/SignaturV3Canvas', () => ({
  default: () => <div data-testid="mock-canvas">Canvas</div>,
}));

import MiniSignature from '../components/dashboard/MiniSignature';

beforeEach(() => localStorage.clear());

describe('MiniSignature Pause Toggle', () => {
  const defaultProps = {
    natalWeights: { Sun: 0.8, Moon: 0.6, Mars: 0.4, Mercury: 0.5, Jupiter: 0.7, Saturn: 0.3, Venus: 0.6 },
    quizWeights: {},
  };

  it('rendert Pause-Toggle Button', () => {
    render(<MiniSignature {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pause/i });
    expect(btn).toBeDefined();
  });

  it('toggelt auf pausiert nach Klick + speichert in localStorage', () => {
    render(<MiniSignature {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(btn);
    expect(localStorage.getItem('bazodiac_mini_signature_paused')).toBe('true');
  });

  it('liest initial-paused-Zustand aus localStorage', () => {
    localStorage.setItem('bazodiac_mini_signature_paused', 'true');
    render(<MiniSignature {...defaultProps} />);
    expect(screen.getByText('dashboard.miniSignature.paused')).toBeDefined();
  });
});
