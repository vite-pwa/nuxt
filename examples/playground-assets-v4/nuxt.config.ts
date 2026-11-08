export default defineNuxtConfig({
  /* ssr: false, */
  // typescript,
  compatibilityDate: '2026-11-08',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  future: {
    typescriptBundlerResolution: true,
  },
  experimental: {
    payloadExtraction: true,
  },
  nitro: {
    prerender: {
      routes: ['/', '/about'],
    },
  },
  imports: {
    autoImport: true,
  },
  appConfig: {
    // you don't need to include this: only for testing purposes
    buildDate: new Date().toISOString(),
  },
  vite: {
    logLevel: 'info',
  },
  pwa: {
    path: '~~/pwa.config.ts',
  },
})
