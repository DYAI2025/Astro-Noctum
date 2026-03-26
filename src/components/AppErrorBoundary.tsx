import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private getTranslation(de: string, en: string): string {
    try {
      const lang = localStorage.getItem('bazodiac_lang') || 'en';
      return lang === 'de' ? de : en;
    } catch {
      return en;
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-[#FAFAF8]">
          <div className="text-center max-w-md space-y-4">
            <h1 className="font-serif text-2xl text-[#1E2A3A]">
              {this.getTranslation('Etwas ist schiefgelaufen', 'Something went wrong')}
            </h1>
            <p className="text-sm text-[#1E2A3A]/50">
              {this.getTranslation('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.', 'An unexpected error occurred. Please try again.')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-5 py-2.5 border border-[#8B6914]/20 text-sm text-[#1E2A3A] rounded-xl hover:bg-[#8B6914]/5 transition-colors"
            >
              {this.getTranslation('Erneut versuchen', 'Try again')}
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-[#8B6914] text-white text-sm font-semibold rounded-xl hover:bg-[#8B6914]/90 transition-colors"
            >
              {this.getTranslation('Zur Startseite', 'Go to homepage')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
