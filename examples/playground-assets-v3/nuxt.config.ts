export default defineNuxtConfig({
  /* ssr: false, */
  // typescript,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@vite-pwa/nuxt'],
  future: {
    typescriptBundlerResolution: true,
  },
  experimental: {
    payloadExtraction: true,
    watcher: 'parcel',
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
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
    path: '~/pwa.config.ts',
  },
})
