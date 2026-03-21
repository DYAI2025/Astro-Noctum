import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LeviSpeechBubble } from '../components/onboarding/LeviSpeechBubble';

describe('LeviSpeechBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when text is empty', () => {
    const { container } = render(<LeviSpeechBubble text="" />);
    expect(container.textContent).toBe('');
  });

  it('types out text character by character', () => {
    render(<LeviSpeechBubble text="Hallo" speed={50} />);
    expect(screen.getByTestId('levi-speech').textContent).toBe('');

    act(() => { vi.advanceTimersByTime(50); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('H');

    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('Hallo');
  });

  it('calls onComplete when finished typing', () => {
    const onComplete = vi.fn();
    render(<LeviSpeechBubble text="Hi" speed={50} onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(100); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('does not start typing until visible prop is true', () => {
    const { rerender } = render(
      <LeviSpeechBubble text="Test" speed={50} visible={false} />
    );

    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('');

    rerender(<LeviSpeechBubble text="Test" speed={50} visible={true} />);
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByTestId('levi-speech').textContent).toBe('Test');
  });

  it('applies glass-card styling', () => {
    render(<LeviSpeechBubble text="Hi" />);
    const bubble = screen.getByTestId('levi-speech-bubble');
    expect(bubble.className).toContain('backdrop-blur');
  });
});
