/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_URL: string
  readonly VITE_UPLOAD_URL: string
  readonly VITE_ENABLE_MOCK: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_OSS_BUCKET: string
  readonly VITE_OSS_REGION: string
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_ENABLE_HOT_RELOAD: string
  readonly VITE_LOG_LEVEL: string
  readonly VITE_ENABLE_CONSOLE: string
  readonly VITE_ENABLE_VCONSOLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  namespace NodeJS {
    interface Timeout {}
  }
}