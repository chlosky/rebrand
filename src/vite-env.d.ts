/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_SHA: string;
  readonly VITE_SITE_LOCK_ENABLED?: string;
  readonly VITE_MAINTENANCE_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
