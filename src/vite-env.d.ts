/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_BAFE_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
