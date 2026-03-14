import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[${this.props.name}] Section failed:`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-400/20 bg-red-950/20 p-4 text-xs text-red-300">
          {this.props.name} konnte nicht geladen werden.
        </div>
      );
    }
    return this.props.children;
  }
}
