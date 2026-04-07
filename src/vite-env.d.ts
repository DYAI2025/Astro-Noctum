/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BAFE_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ELEVENLABS_AGENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.glsl?raw' {
  const shaderSource: string;
  export default shaderSource;
}

// NOTE: React 19 will remove the global JSX namespace in favour of React.JSX.
// When upgrading @types/react to v19, move this to `declare module 'react' { namespace JSX { ... } }`.
declare namespace JSX {
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
