import process from 'node:process'
import { definePwaConfig } from '@vite-pwa/nuxt-core/config'

const sw = process.env.SW === 'true'

export default definePwaConfig({
  strategies: sw ? 'buildSW' : 'generateSW',
  registerType: 'autoUpdate',
  manifest: {
    name: 'Nuxt Vite PWA',
    short_name: 'NuxtVitePWA',
    theme_color: '#ffffff',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
  generateSW: {
    globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
  },
  buildSW: {
    swSrc: '~/service-worker/sw.ts',
    globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
  },
  client: {
    installPrompt: true,
    // you don't need to include this: only for testing purposes
    // if enabling periodic sync for update use 1 hour or so (periodicSyncForUpdates: 3600)
    periodicSyncForUpdates: 20,
  },
  // experimental: {
  //   includeAllowlist: true,
  // },
  devOptions: {
    enabled: true,
    suppressWarnings: true,
    navigateFallback: '/',
    navigateFallbackAllowlist: [/^\/$/],
    type: 'module',
  },
})
