declare module 'virtual:nuxt-pwa-configuration' {
  export const callBeforeRegisterHook: boolean
  export function initializeDev(): void
  export function activateSWSwitcherDev(): void
  export const enabled: boolean
  export const display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  export const installPrompt: string | undefined
  export const periodicSyncForUpdates: number
}
