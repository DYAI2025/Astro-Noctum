import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          'dynamic-variables'?: string;
          /** Always shows the full call UI — no collapsed pill button */
          'always-expanded'?: boolean | '';
          /** Starts expanded, user can collapse */
          'default-expanded'?: boolean | '';
          /** Widget placement: bottom-right | bottom-left | bottom-center */
          'placement'?: string;
          /** Override widget config as JSON */
          'override-config'?: string;
        },
        HTMLElement
      >;
    }
  }
}
