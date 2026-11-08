import { definePwaConfig } from '@vite-pwa/nuxt-core/config'

export default definePwaConfig({
  strategies: 'generateSW',
  registerType: 'autoUpdate',
  manifest: {
    name: 'Nuxt Vite PWA',
    short_name: 'NuxtVitePWA',
    theme_color: '#ffffff',
  },
  pwaAssets: {
    config: true,
    // config: false,
    // image: 'favicon.svg',
  },
  generateSW: {
    globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
  },
  client: {
    installPrompt: true,
  },
  devOptions: {
    enabled: true,
    type: 'module',
    suppressWarnings: true,
    navigateFallback: '/',
    navigateFallbackAllowlist: [/^\/$/],
  },
})
