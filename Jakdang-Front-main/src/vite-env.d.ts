/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BASE_API_URL: string
    readonly VITE_API_URL: string

    readonly VITE_GOOGLE_API_KEY: string
    readonly VITE_GOOGLE_AUTH_DOMAIN: string
    readonly VITE_GOOGLE_PROJECT_ID: string
    readonly VITE_GOOGLE_STORAGE_BUCKET: string
    readonly VITE_GOOGLE_MESSAGING_SENDER_ID: string
    readonly VITE_GOOGLE_APP_ID: string
    readonly VITE_GOOGLE_MEASURE_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
