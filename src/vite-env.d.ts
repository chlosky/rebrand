/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_SHA: string;
  readonly VITE_SITE_LOCK_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
