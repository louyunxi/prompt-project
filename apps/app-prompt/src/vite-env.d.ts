/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_SERVER: 'test' | 'prod';
  readonly VITE_OSS_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
