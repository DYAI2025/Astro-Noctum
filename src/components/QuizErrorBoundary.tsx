import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  onClose: () => void;
  children: ReactNode;
  lang?: 'de' | 'en';
}

interface State {
  hasError: boolean;
}

export class QuizErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Quiz failed to load:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.props.lang === 'en'
        ? 'Quiz could not be loaded.'
        : 'Quiz konnte nicht geladen werden.';
      const btnText = this.props.lang === 'en' ? 'Close' : 'Schließen';
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-gold/70">{msg}</p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
          >
            {btnText}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
