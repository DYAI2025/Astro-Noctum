import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          'dynamic-variables'?: string;
        },
        HTMLElement
      >;
    }
  }
}
