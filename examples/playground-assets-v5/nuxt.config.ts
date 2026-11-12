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
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
      ],
    },
  },
  pwa: {
    path: '~~/pwa.config.ts',
  },
})
