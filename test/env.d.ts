declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database
    RESEND_API_KEY: string
    EMAIL_FROM: string
    FCM_SERVICE_ACCOUNT: string
    FRONTEND_URL: string
    ONECLICK_SECRET: string
    FIREBASE_PROJECT_ID: string
  }
}
