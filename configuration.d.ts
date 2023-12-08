declare module 'virtual:nuxt-pwa-configuration' {
  export const enabled: boolean
  export const display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  export const installPrompt: string | undefined
  export const periodicSyncForUpdates: number
}
