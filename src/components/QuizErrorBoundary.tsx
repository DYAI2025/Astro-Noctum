import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  onClose: () => void;
  children: ReactNode;
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
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-gold/70">Quiz could not be loaded.</p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold/10"
          >
            Close
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
