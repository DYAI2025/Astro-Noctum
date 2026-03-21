import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { SignaturIntroPopup } from '../components/signatur/SignaturIntroPopup';
import { SignaturExplainPopup } from '../components/signatur/SignaturExplainPopup';

describe('SignaturIntroPopup', () => {
  it('renders quiz question', () => {
    render(<SignaturIntroPopup onAnswer={vi.fn()} />);
    expect(screen.getByText(/beschreibt dich am besten/i)).toBeDefined();
  });

  it('renders all 4 options', () => {
    render(<SignaturIntroPopup onAnswer={vi.fn()} />);
    expect(screen.getByText(/kreativ/i)).toBeDefined();
    expect(screen.getByText(/analysiere/i)).toBeDefined();
    expect(screen.getByText(/harmonie/i)).toBeDefined();
    expect(screen.getByText(/erfahrungen/i)).toBeDefined();
  });

  it('calls onAnswer with keyword when option clicked', () => {
    const onAnswer = vi.fn();
    render(<SignaturIntroPopup onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText(/kreativ/i));
    expect(onAnswer).toHaveBeenCalledWith('expression');
  });

  it('calls onAnswer with correct keyword for each option', () => {
    const onAnswer = vi.fn();
    const { unmount } = render(<SignaturIntroPopup onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText(/analysiere/i));
    expect(onAnswer).toHaveBeenCalledWith('analytical');

    unmount();
    onAnswer.mockClear();

    render(<SignaturIntroPopup onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText(/harmonie/i));
    expect(onAnswer).toHaveBeenCalledWith('harmony');
  });

  it('does not close on backdrop click', () => {
    const onAnswer = vi.fn();
    render(<SignaturIntroPopup onAnswer={onAnswer} />);
    const backdrop = screen.getByTestId('intro-backdrop');
    fireEvent.click(backdrop);
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

describe('SignaturExplainPopup', () => {
  it('renders explanation text', () => {
    render(<SignaturExplainPopup onDismiss={vi.fn()} />);
    expect(
      screen.getByText(/verfeinerst du deine grundlegenden Signaturenergien/i),
    ).toBeDefined();
  });

  it('renders VERSTANDEN button', () => {
    render(<SignaturExplainPopup onDismiss={vi.fn()} />);
    expect(screen.getByText('VERSTANDEN')).toBeDefined();
  });

  it('calls onDismiss when VERSTANDEN clicked', () => {
    const onDismiss = vi.fn();
    render(<SignaturExplainPopup onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('VERSTANDEN'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
