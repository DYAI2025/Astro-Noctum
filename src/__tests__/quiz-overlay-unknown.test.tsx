import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: 'de', setLang: vi.fn() }),
}));

// Must import AFTER mock setup
const { default: QuizOverlay } = await import('../components/QuizOverlay');

describe('QuizOverlay — unknown quiz ID', () => {
  it('renders fallback message for non-existent quiz ID', () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <QuizOverlay
        quizId="totally_fake_quiz_999"
        onComplete={onComplete}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Quiz nicht gefunden.')).toBeTruthy();
    expect(screen.getByText('Schließen')).toBeTruthy();
  });

  it('calls onClose when Schließen button is clicked', () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <QuizOverlay
        quizId="nonexistent_quiz"
        onComplete={onComplete}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('Schließen'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render fallback when quizId is null', () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <QuizOverlay
        quizId={null}
        onComplete={onComplete}
        onClose={onClose}
      />,
    );

    expect(screen.queryByText('Quiz nicht gefunden.')).toBeNull();
    expect(container.innerHTML).toBe('');
  });
});
