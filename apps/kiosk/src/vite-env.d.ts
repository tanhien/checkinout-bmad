/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_STAFF_API_URL: string
  readonly VITE_KIOSK_API_KEY: string
  readonly VITE_KIOSK_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
