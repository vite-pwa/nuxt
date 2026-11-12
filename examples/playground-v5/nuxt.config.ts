export default defineNuxtConfig({
  /* ssr: false, */
  // typescript,
  compatibilityDate: '2026-11-08',
  devtools: { enabled: true },
  modules: [
    '@vite-pwa/nuxt',
    (_, nuxt) => {
      nuxt.hook('pwa:beforeBuildServiceWorker', (options) => {
        console.log('pwa:beforeBuildServiceWorker: ', options.base)
      })
    },
  ],
  typescript: {
    appTsConfig: {
      exclude: ['../service-worker'],
    },
  },
  future: {
    typescriptBundlerResolution: true,
  },
  experimental: {
    payloadExtraction: true,
    appManifest: true,
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
